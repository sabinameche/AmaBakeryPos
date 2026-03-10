import json
import logging
import asyncio
import time
from datetime import date, datetime, timedelta
from decimal import Decimal
from json import JSONEncoder

from asgiref.sync import sync_to_async

from django.db.models import Count, F, Sum, ExpressionWrapper, Value, DecimalField, Q, Max
from django.db.models.functions import (
    ExtractHour,
    ExtractWeek,
    ExtractWeekDay,
    ExtractYear,
    TruncHour,
    Coalesce,
)
from django.http import StreamingHttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated

from ..models import Branch, Invoice, InvoiceItem, Payment, User
from ..serializer_dir.invoice_serializer import InvoiceResponseSerializer
from .dashboard_view import report_dashboard

logger = logging.getLogger(__name__)

# Store active connections for broadcasting
active_connections = set()


# Custom JSON encoder to handle Decimal and datetime objects
class CustomJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


@require_GET
@csrf_exempt
async def dashboard_sse(request):
    """
    Server-Sent Events endpoint for real-time dashboard updates (Async version)
    """
    # Manual authentication check for function view with EventSource
    user = request.user
    
    # If not authenticated via session/cookies, check for token in query param
    # Use sync_to_async for DB-related checks on user
    is_auth = await sync_to_async(lambda: user.is_authenticated)()
    if not is_auth:
        token = request.GET.get("token")
        if token:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            try:
                auth = JWTAuthentication()
                validated_token = await sync_to_async(auth.get_validated_token)(token)
                user = await sync_to_async(auth.get_user)(validated_token)
            except Exception:
                pass

    is_auth = await sync_to_async(lambda: user.is_authenticated)()
    if not is_auth:
        return StreamingHttpResponse(
            'event: error\ndata: {"message": "Unauthorized"}\n\n',
            content_type="text/event-stream",
            status=401,
        )

    branch_id = request.GET.get("branch_id")
    # Check permissions - also needs sync_to_async for potential DB field access (superuser)
    is_super = await sync_to_async(lambda: user.is_superuser)()
    role = "SUPER_ADMIN" if is_super else getattr(user, "user_type", "")

    if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
        return StreamingHttpResponse(
            'event: error\ndata: {"message": "Unauthorized"}\n\n',
            content_type="text/event-stream",
            status=403,
        )

    async def event_stream():
        # Generate unique connection ID
        connection_id = f"{user.id}_{timezone.now().timestamp()}"
        active_connections.add(connection_id)

        logger.info(
            f"SSE connection opened for user {user.username} (branch: {branch_id})"
        )

        try:
            # Send initial connection message
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'user': user.username, 'branch_id': branch_id}, cls=CustomJSONEncoder)}\n\n"

            # Set initial marker BEFORE sending initial data to avoid race condition
            last_check = timezone.now() - timedelta(seconds=1)

            # Send initial dashboard data
            initial_data = await sync_to_async(get_dashboard_data_sync)(user, branch_id, role, request)
            if initial_data:
                yield f"event: dashboard_update\ndata: {json.dumps(initial_data, cls=CustomJSONEncoder)}\n\n"

            heartbeat_count = 0

            while True:
                # Use current time as prospective next marker
                next_check = timezone.now()
                
                # Check for database changes
                changed = await sync_to_async(has_dashboard_data_changed_sync)(branch_id, last_check)
                if changed:
                    logger.debug(
                        f"Data changed for user {user.username}, sending update"
                    )
                    new_data = await sync_to_async(get_dashboard_data_sync)(user, branch_id, role, request)
                    if new_data:
                        yield f"event: dashboard_update\ndata: {json.dumps(new_data, cls=CustomJSONEncoder)}\n\n"
                    
                    # Update marker ONLY after successful processing
                    last_check = next_check

                # Send heartbeat every 15 seconds to keep connection alive
                heartbeat_count += 1
                if heartbeat_count >= 7:  # ~14 seconds with 2s sleep
                    yield ": heartbeat\n\n"
                    heartbeat_count = 0

                await asyncio.sleep(2)

        except (asyncio.CancelledError, GeneratorExit):
            # Clean up on disconnect
            active_connections.discard(connection_id)
            logger.info(f"SSE connection closed for user {user.username}")
        except Exception as e:
            logger.error(f"SSE error for user {user.username}: {e}")
            active_connections.discard(connection_id)

    response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"  # Disable nginx buffering
    response["Access-Control-Allow-Origin"] = "*"  # Add if needed for CORS
    return response


def has_dashboard_data_changed_sync(branch_id, since):
    """
    Quick check if any relevant data has changed using creation and update times
    """
    try:
        # Standardize branch_id
        if branch_id in ["null", "undefined", ""]:
            branch_id = None

        q_filter = Q(created_at__gt=since) | Q(updated_at__gt=since) if hasattr(Invoice, "updated_at") else Q(created_at__gt=since)
        
        if branch_id:
            new_invoices = Invoice.objects.filter(branch_id=branch_id).filter(q_filter).exists()
            new_payments = Payment.objects.filter(invoice__branch_id=branch_id, created_at__gt=since).exists()
            new_items = InvoiceItem.objects.filter(invoice__branch_id=branch_id, created_at__gt=since).exists()
        else:
            new_invoices = Invoice.objects.filter(q_filter).exists()
            new_payments = Payment.objects.filter(created_at__gt=since).exists()
            new_items = InvoiceItem.objects.filter(created_at__gt=since).exists()

        return new_invoices or new_payments or new_items

    except Exception as e:
        logger.error(f"Error checking data changes: {e}")
        return False


def get_dashboard_data_sync(user, branch_id, role, request):
    """
    Get dashboard data using the shared report_dashboard logic to ensure consistency.
    """
    try:
        # Standardize branch_id
        if branch_id in ["null", "undefined", ""]:
            branch_id = None

        target_branch = None
        if branch_id:
            try:
                target_branch = Branch.objects.get(id=branch_id)
            except Branch.DoesNotExist:
                pass
        elif role == "BRANCH_MANAGER":
            target_branch = getattr(user, "branch", None)

        # Use the common report logic (which handles timeframe/dates from request)
        report_data = report_dashboard(target_branch, request)
        
        start_date = report_data["start_date"]
        end_date = report_data["end_date"]

        # Replicate calculations from DashboardViewClass.get
        base_filter = {"created_at__date__gte": start_date, "created_at__date__lte": end_date}
        if target_branch:
            base_filter["branch"] = target_branch

        recent_orders_objs = (
            Invoice.objects.filter(**base_filter)
            .select_related("branch", "created_by")
            .prefetch_related("bills", "bills__product", "payments")
            .order_by("-created_at")[:5]
        )
        recent_orders = InvoiceResponseSerializer(recent_orders_objs, many=True).data

        user_count = (
            User.objects.filter(branch=target_branch).count() 
            if target_branch else User.objects.all().count() - 1
        )

        response_data = {
            **report_data,
            "recent_orders": recent_orders,
            "total_sum": report_data["total_month_sales"],
            "total_sales": report_data["total_month_sales"],
            "total_count_order": report_data["total_month_orders"],
            "total_orders": report_data["total_month_orders"],
            "average_order_value": report_data["avg_order"],
            "avg_orders": report_data["avg_order"],
            "total_sales_per_category": report_data["sales_by_category"],
            "sales_percent": report_data["growth_percent"],
            "order_percent": report_data["growth_percent"],
            "avg_order_percent": report_data["growth_percent"],
            "total_user": user_count,
            "total_user_count": user_count,
            "total_branch": Branch.objects.all().count(),
            "total_count_branch": Branch.objects.all().count(),
        }

        if not target_branch:
            # Global overview additions
            response_data.update({
                "top_perfomance_branch": list(Branch.objects.annotate(
                    total_sales_per_branch=Coalesce(
                        Sum("invoices__total_amount", filter=Q(invoices__created_at__date__gte=start_date, invoices__created_at__date__lte=end_date)),
                        Value(0.0, output_field=DecimalField())
                    )
                ).values("id", "name", "total_sales_per_branch").order_by("-total_sales_per_branch")),
                "top_selling_items": report_data["top_selling_items_count"],
            })
        else:
            # Branch specific additions
            response_data.update({
                "today_sales": report_data["total_month_sales"],
                "top_selling_items": report_data["top_selling_items_count"],
            })
            
            if (end_date - start_date).days == 0:
                # Calculate peak hours for today
                hourly_orders = (
                    Invoice.objects.filter(**base_filter)
                    .annotate(hour=TruncHour("created_at"))
                    .values("hour")
                    .annotate(total_orders=Count("id"))
                )
                max_orders = hourly_orders.aggregate(max_orders=Max("total_orders"))["max_orders"]
                if max_orders is not None:
                    peak_hours = hourly_orders.filter(total_orders=max_orders)
                    response_data["peak_hours"] = [h["hour"].strftime("%I:%M %p") for h in peak_hours]

        return response_data

    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return {"success": False, "message": str(e), "update_type": "error"}


# Function to manually trigger updates (call this from your signals)
def trigger_dashboard_update(branch_id=None):
    """
    Manually trigger dashboard update for all connected clients
    """
    logger.info(f"Dashboard update triggered for branch: {branch_id}")
    # In a more advanced implementation, you could use Django Channels
    # to push updates to connected clients. For now, clients will poll.
    return len(active_connections)
