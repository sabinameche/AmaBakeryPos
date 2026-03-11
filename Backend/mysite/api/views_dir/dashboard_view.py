from datetime import date, datetime, time, timedelta
from decimal import Decimal

from dateutil.relativedelta import relativedelta
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Max, Q, Sum, Value
from django.db.models.functions import (
    Coalesce,
    ExtractHour,
    ExtractWeek,
    ExtractWeekDay,
    ExtractYear,
    TruncHour,
)
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Branch, Invoice, InvoiceItem, User, Payment
from ..serializer_dir.invoice_serializer import InvoiceResponseSerializer


def get_date_range(request):
    """Parses timeframe and custom dates from request query params."""
    # Default to current month if no request
    today = timezone.localdate()
    if not request:
        return today.replace(day=1), today, "monthly"

    # Support both DRF request (query_params) and standard Django request (GET)
    query_params = getattr(request, "query_params", request.GET)
    timeframe = query_params.get("timeframe", "weekly")

    print("This is time frame-> ",timeframe)
    start_date_str = query_params.get("start_date")
    print("This is time startdate-> ",start_date_str)
    end_date_str = query_params.get("end_date")
    print("This is time enddate-> ",end_date_str)

    if start_date_str and end_date_str:
        try:
            # Try parsing ISO format (YYYY-MM-DD)
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
            return start_date, end_date, "custom"
        except ValueError:
            try:
                # Fallback to datetime format
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
                return start_date, end_date, "custom"
            except ValueError:
                pass

    if timeframe == "daily":
        return today, today, "daily"
    elif timeframe == "weekly":
        start_of_week = today - timedelta(days=today.weekday())
        return start_of_week, today, "weekly"
    elif timeframe == "monthly":
        
        start_of_month = today.replace(day=1)
        return start_of_month, today, "monthly"
    elif timeframe == "yearly":
        start_of_year = today.replace(month=1, day=1)
        return start_of_year, today, "yearly"

    # Default to current week
    start_of_week = today - timedelta(days=today.weekday())
    return start_of_week, today, "weekly"


class DashboardViewClass(APIView):
    todaydate = date.today()
    yesterdaydate = todaydate - timedelta(days=1)

    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def date_filter(self, branch, start_date, end_date):
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date + timedelta(days=1), time.min)

        return Invoice.objects.filter(
            branch=branch, created_at__gte=start_datetime, created_at__lt=end_datetime
        )

    def get(self, request, branch_id=None):
        role = self.get_user_role(request.user)
        # For global overview, we want no branch filter even if the user is assigned one,
        # unless a specific branch_id is requested.
        my_branch = getattr(request.user, "branch", None)

        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
            return Response(
                {"success": False, "message": "Insufficient permissions"},
                status=status.HTTP_403_FORBIDDEN,
            )

        target_branch = None
        if branch_id:
            try:
                target_branch = Branch.objects.get(id=branch_id)
            except Branch.DoesNotExist:
                return Response({"success": False, "message": "Branch not found"}, status=status.HTTP_404_NOT_FOUND)
        elif role in ["BRANCH_MANAGER"] and my_branch:
            target_branch = my_branch

        # Get base report data from the generalized function
        report_data = report_dashboard(target_branch, request)
        start_date = report_data["start_date"]
        end_date = report_data["end_date"]

        # Base filter for extra aggregations
        base_filter = {"created_at__date__gte": start_date, "created_at__date__lte": end_date}
        if target_branch:
            base_filter["branch"] = target_branch

        # Common extra dashboard data
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
            "order_percent": report_data["growth_order_percent"],
            "avg_order_percent": report_data["avg_order_percent"],
            "total_user": user_count,
            "total_user_count": user_count,
            "total_branch": Branch.objects.all().count(),
            "total_count_branch": Branch.objects.all().count(),
        }

        if not target_branch:
            # Add global-only fields
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
            # Add branch-specific fields
            response_data.update({
                "today_sales": report_data["total_month_sales"],
                "top_selling_items": report_data["top_selling_items_count"],
            })
            
            # Peak hours for single day
            if (end_date - start_date).days == 0:
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

        return Response(response_data, status=status.HTTP_200_OK)


def report_dashboard(my_branch=None, request=None):
    start_date, end_date, timeframe = get_date_range(request)

    base_filter = {
        "created_at__date__gte": start_date,
        "created_at__date__lte": end_date,
    }
    if my_branch:
        base_filter["branch"] = my_branch

    current_sales = (
        Invoice.objects.filter(**base_filter).aggregate(total_sales_amount=Sum("total_amount"))["total_sales_amount"]
        or 0
    )

    # total orders
    current_orders_qs = Invoice.objects.filter(**base_filter)
    current_orders_count = current_orders_qs.count()

    # average order
    avg_order = current_sales / current_orders_count if current_orders_count > 0 else 0

    # growth percent comparison (compare with previous period of same length)
    period_length = (end_date - start_date).days + 1
    prev_end_date = start_date - timedelta(days=1)
    prev_start_date = prev_end_date - timedelta(days=period_length - 1)

    prev_base_filter = {
        "created_at__date__gte": prev_start_date,
        "created_at__date__lte": prev_end_date,
    }
    if my_branch:
        prev_base_filter["branch"] = my_branch

    prev_period_sales = (
        Invoice.objects.filter(**prev_base_filter).aggregate(total_sales=Sum("total_amount"))["total_sales"]
        or 0
    )

    if prev_period_sales == 0:
        growth_percent = current_sales - prev_period_sales
    else:
        growth_percent = ((current_sales - prev_period_sales) / prev_period_sales) * 100

    # order percent on kpi
    prev_orders_count = (
        Invoice.objects.filter(**prev_base_filter).aggregate(total_orders=Count("id"))["total_orders"] or 0
    )
    

    if prev_orders_count == 0:
        growth_order_percent = current_orders_count - prev_orders_count
    else:
        growth_order_percent = ((current_orders_count - prev_orders_count) / prev_orders_count) * 100
    # avg order percent 
    prev_avg_orders = prev_period_sales / prev_orders_count if prev_orders_count > 0 else 0

    if prev_avg_orders == 0:
        avg_order_percent = (avg_order - prev_avg_orders) 
    else:
        avg_order_percent = ((avg_order - prev_avg_orders) / prev_avg_orders)*100 


    # Trend Data
    trend_data = (
        Invoice.objects.filter(**base_filter)
    )

    # Weekly Sales (Specific format for frontend bars)
    today = date.today() # Ensure 'today' is defined for this scope
    start_of_current_week = today - timedelta(days=today.weekday())
    weekly_qs = trend_data.filter(created_at__date__gte=start_of_current_week).annotate(label=ExtractWeekDay("created_at")).values("label").annotate(sales=Sum("total_amount"))
    day_names_full = {1: "sunday", 2: "monday", 3: "tuesday", 4: "wednesday", 5: "thursday", 6: "friday", 7: "saturday"}
    weekly_sales_dict = {name: 0.0 for name in day_names_full.values()}
    for item in weekly_qs:
        weekly_sales_dict[day_names_full[item["label"]]] = float(item["sales"])

    if timeframe == "daily" or period_length <= 1:
        # Show hourly trend for single day or daily view
        trend_qs = trend_data.annotate(label=ExtractHour("created_at")).values("label").annotate(sales=Sum("total_amount")).order_by("label")
        trend_chart = []
        for h in range(8, 21):
            lbl = f"{h if h <= 12 else h - 12} {'AM' if h < 12 else 'PM'}"
            val = next((item["sales"] for item in trend_qs if item["label"] == h), 0)
            trend_chart.append({"label": lbl, "sales": float(val)})
    elif timeframe == "weekly" or period_length <= 7:
        # Show daily trend for the week
        trend_qs = trend_data.annotate(label=ExtractWeekDay("created_at")).values("label").annotate(sales=Sum("total_amount")).order_by("label")
        day_names = {1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"}
        trend_chart = []
        for d_idx in [2, 3, 4, 5, 6, 7, 1]:
            val = next((item["sales"] for item in trend_qs if item["label"] == d_idx), 0)
            trend_chart.append({"label": day_names[d_idx], "sales": float(val)})
    else:
        # Show daily trend for the month/range
        trend_qs = trend_data.annotate(label=F("created_at__date")).values("label").annotate(sales=Sum("total_amount")).order_by("label")
        trend_chart = [{"label": item["label"].strftime("%d %b"), "sales": float(item["sales"])} for item in trend_qs]

    # Aggregate distribution data
    def get_distribution(model, period_filter, values_field, annotate_field="total_amount"):
        return list(model.objects.filter(**period_filter).values(values_field).annotate(**{annotate_field: Coalesce(Sum(
            ExpressionWrapper(
                F("quantity") * F("unit_price") - F("discount_amount"),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ) if model == InvoiceItem else F("amount"),
            output_field=DecimalField()
        ), Value(0.0, output_field=DecimalField()))}).order_by(f"-{annotate_field}"))

    period_filter_ii = {"invoice__created_at__date__gte": start_date, "invoice__created_at__date__lte": end_date}
    if my_branch:
        period_filter_ii["invoice__branch"] = my_branch
    
    period_filter_p = {"invoice__created_at__date__gte": start_date, "invoice__created_at__date__lte": end_date}
    if my_branch:
        period_filter_p["invoice__branch"] = my_branch

    sales_by_category_raw = get_distribution(InvoiceItem, period_filter_ii, "product__category__name", "category_total_sales")
    
    # Calculate percentages for category distribution
    sales_by_category = []
    total_sales_float = float(current_sales)
    for cat in sales_by_category_raw:
        cat_amount = float(cat.get("category_total_sales", 0))
        percent = (cat_amount / total_sales_float * 100) if total_sales_float > 0 else 0
        cat["category_percent"] = percent
        sales_by_category.append(cat)
    sales_by_kitchen = get_distribution(InvoiceItem, period_filter_ii, "product__category__kitchentype__name")
    sales_by_payment = get_distribution(Payment, period_filter_p, "payment_method")
    sales_by_status = list(Invoice.objects.filter(**base_filter).values("payment_status").annotate(total_amount=Coalesce(Sum("total_amount"), Value(0.0, output_field=DecimalField()))).order_by("-total_amount"))

    top_selling = list(InvoiceItem.objects.filter(**period_filter_ii).values("product__name").annotate(total_sold_units=Sum("quantity")).annotate(total_sales=Sum(ExpressionWrapper(F("quantity") * F("unit_price") - F("discount_amount"), output_field=DecimalField(max_digits=12, decimal_places=2)))).order_by("-total_sold_units")[:5])

    return {
        "success": True,
        "total_month_sales": float(current_sales),
        "total_month_orders": current_orders_count,
        "avg_order": float(avg_order),
        "growth_percent": float(growth_percent),
        "growth_order_percent": float(growth_order_percent),
        "avg_order_percent": float(avg_order_percent),
        "trend_chart": trend_chart,
        "Weekely_Sales": weekly_sales_dict,
        "sales_by_category": sales_by_category,
        "sales_by_kitchen_type": sales_by_kitchen,
        "sales_by_payment_method": sales_by_payment,
        "sales_by_status": sales_by_status,
        "top_selling_items_count": top_selling,
        "start_date": start_date,
        "end_date": end_date,
        "timeframe": timeframe,
    }


class ReportDashboardViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, branch_id=None):
        role = self.get_user_role(request.user)
        my_branch = getattr(request.user, "branch", None)

        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
            return Response(
                {"success": False, "message": "Insufficient permissions"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if role in ["SUPER_ADMIN", "ADMIN"]:
            if not branch_id:
                return Response(
                    {
                        "success": False,
                        "message": "branch_id is required for admin/superadmin",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            my_branch = branch_id

        data = report_dashboard(my_branch, request)
        return Response({"success": True, **data}, status=status.HTTP_200_OK)
