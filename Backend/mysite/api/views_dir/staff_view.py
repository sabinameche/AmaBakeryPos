from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import date

from ..models import Invoice, User
from .dashboard_view import get_date_range


class StaffReportViewClass(APIView):
    """
    Returns staff performance data for a branch based on timeframe filter.
    """

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

        if not my_branch:
            return Response(
                {"success": False, "message": "No branch associated with this user"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_date, end_date, timeframe = get_date_range(request)

        # Fetch staff belonging to this branch (exclude super_admin, pure admins)
        staff_qs = User.objects.filter(
            branch=my_branch,
            is_active=True,
        ).exclude(is_superuser=True)

        staff_data = []

        for staff in staff_qs:
            # Invoices where this staff member was involved, filtered by date
            invoices_all = (
                Invoice.objects.filter(
                    branch=my_branch,
                    created_at__date__gte=start_date,
                    created_at__date__lte=end_date
                )
                .filter(
                    Q(received_by_waiter=staff)
                    | Q(received_by_counter=staff)
                    | Q(created_by=staff)
                )
                .distinct()
            )

            total_orders = invoices_all.count()
            total_sales = (
                invoices_all.aggregate(total=Sum("total_amount"))["total"] or 0
            )
            # Cash in hand represents waiter cash collections (partial payment status means waiter hasn't handed over yet)
            total_cash_in_hand = invoices_all.filter(
                received_by_waiter__user_type="WAITER",
                payment_status="PARTIAL"
            ).aggregate(total_cash=Sum("total_amount"))["total_cash"] or 0

            staff_data.append(
                {
                    "id": staff.id,
                    "name": staff.full_name or staff.username,
                    "username": staff.username,
                    "role": staff.user_type,
                    "orders": total_orders,
                    "sales": float(total_sales),
                    "cash_in_hand": float(total_cash_in_hand),
                }
            )

        # Sort by orders descending
        staff_data.sort(key=lambda x: x["orders"], reverse=True)

        return Response(
            {
                "success": True,
                "staff_performance": staff_data,
            },
            status=status.HTTP_200_OK,
        )
