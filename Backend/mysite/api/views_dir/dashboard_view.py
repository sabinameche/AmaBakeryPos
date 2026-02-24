from datetime import date, timedelta

from dateutil.relativedelta import relativedelta
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Max, Sum
from django.db.models.functions import TruncHour
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Branch, Invoice, InvoiceItem, User


class DashboardViewClass(APIView):
    todaydate = date.today()
    yesterdaydate = todaydate - timedelta(days=1)

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
                total_sum = Invoice.objects.aggregate(total=Sum("total_amount"))[
                    "total"
                ]
                total_count_branch = Branch.objects.all().count()
                total_count_order = Invoice.objects.all().count()
                total_user_count = User.objects.all().count()
                average = total_sum / total_count_order

                return Response(
                    {
                        "success": True,
                        "total_sales": total_sum,
                        "total_branch": total_count_branch,
                        "total_user": total_user_count - 1,
                        "total_count_order": total_count_order,
                        "average_order_value": average,
                    },
                    status=status.HTTP_200_OK,
                )

            my_branch = branch_id

        if my_branch:
            # 1.today's total sales amount
            today_invoices = Invoice.objects.filter(
                branch=my_branch, created_at__date=self.todaydate
            )
            yesterday_invoices = Invoice.objects.filter(
                branch=my_branch, created_at__date=self.yesterdaydate
            )

            yesterday_sales = 0
            today_sales = 0
            for invoice in today_invoices:
                today_sales += invoice.total_amount

            for invoice in yesterday_invoices:
                yesterday_sales += invoice.total_amount

            if yesterday_sales == 0:
                sales_percent = today_sales - yesterday_sales
            else:
                sales_percent = (
                    (today_sales - yesterday_sales) / yesterday_sales
                ) * 100

            # 2.today's total orders
            today_total_orders = today_invoices.count()
            yesterday_orders = yesterday_invoices.count()

            # 2.calculating order percent
            if yesterday_orders == 0:
                order_percent = today_total_orders - yesterday_orders
            else:
                order_percent = (
                    (today_total_orders - yesterday_orders) / yesterday_orders
                ) * 100

            # avg order value

            # 4.peak hours
            hourly_orders = (
                Invoice.objects.filter(
                    branch=my_branch, created_at__date=self.todaydate
                )
                .annotate(hour=TruncHour("created_at"))
                .values("hour")
                .annotate(total_orders=Count("id"))
            )

            max_orders = hourly_orders.aggregate(max_orders=Max("total_orders"))[
                "max_orders"
            ]
            peak_hours = hourly_orders.filter(total_orders=max_orders)
            formatted_peak_hours = [h["hour"].strftime("%I:%M %p") for h in peak_hours]

            # 5.sales by category piechart
            total_sales_per_category = (
                InvoiceItem.objects.filter(invoice__branch=my_branch)
                .values("product__category__name")
                .annotate(
                    category_total_sales=Sum(
                        ExpressionWrapper(
                            F("quantity") * F("unit_price") - F("discount_amount"),
                            output_field=DecimalField(max_digits=10, decimal_places=2),
                        )
                    )
                )
                .order_by("-category_total_sales")[:5]
            )

            # 6. top selling items
            top_selling_items = (
                InvoiceItem.objects.filter(invoice__branch=my_branch)
                .values("product__name")
                .annotate(total_orders=Sum("quantity"))
                .order_by("-total_orders")[:5]
            )

            return Response(
                {
                    "success": True,
                    "today_sales": today_sales,
                    "sales_percent": sales_percent,
                    "total_orders": today_total_orders,
                    "order_percent": order_percent,
                    "peak_hours": formatted_peak_hours,
                    "total_sales_per_category": total_sales_per_category,
                    "top_selling_items": top_selling_items,
                }
            )


class ReportDashboardViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, branch_id=None):
        role = self.get_user_role(request.user)
        my_branch = getattr(request.user, "branch", None)
        current_month = timezone.localdate().month
        current_year = timezone.localdate().year

        last_month = timezone.localdate() - relativedelta(months=1)

        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
            return Response(
                {"success": False, "message": "Insufficient permissions"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if role in ["SUPER_ADMIN", "ADMIN"]:
            if not branch_id:
                pass
            my_branch = branch_id

        if my_branch:
            # total sales
            current_month_sales = (
                Invoice.objects.filter(
                    branch=my_branch,
                    created_at__year=current_year,
                    created_at__month=current_month,
                ).aggregate(total_sales_amount=Sum("total_amount"))[
                    "total_sales_amount"
                ]
                or 0
            )

            # total orders
            total_orders = Invoice.objects.filter(
                branch=my_branch,
                created_at__year=current_year,
                created_at__month=current_month,
            )

            # growth percent
            last_month_sales = (
                Invoice.objects.filter(
                    branch=my_branch, created_at__month=last_month.month
                ).aggregate(total_sales=Sum("total_amount"))["total_sales"]
                or 0
            )

            print(current_month_sales)
            print(last_month_sales)

            if last_month_sales == 0:
                growth_percent = current_month_sales - last_month_sales
            else:
                growth_percent = (
                    (current_month_sales - last_month_sales) / last_month_sales
                ) * 100
            return Response(
                {
                    "success": True,
                    "total_month_sales": current_month_sales,
                    "total_month_orders": total_orders.count(),
                    "growth_percent": growth_percent,
                }
            )
