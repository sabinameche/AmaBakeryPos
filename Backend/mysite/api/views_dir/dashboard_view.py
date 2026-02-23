from datetime import date, timedelta
from django.db.models import Sum,Count,F,ExpressionWrapper,DecimalField
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models.functions import TruncHour
from django.utils import timezone
from collections import OrderedDict

from ..models import Invoice,InvoiceItem
class DashboardApiView(APIView):
    todaydate = date.today()
    yesterdaydate = todaydate - timedelta(days=1)

    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self,request,action):
        role = self.get_user_role(request.user)
        my_branch = getattr(request.user,"branch",None)

        if role not in ["SUPER_ADMIN", "ADMIN","BRANCH_MANAGER"]:
            return Response(
                {"success": False, "message": "Insufficient permissions"},
                status=status.HTTP_403_FORBIDDEN,
            )

        elif role == "BRANCH_MANAGER":
            if not my_branch:
                return Response(
                        {"success": False, "message": "User not assigned to a branch"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            
            if action == 'totalsales':
                print(" i am here ")
                today_invoices = Invoice.objects.filter(branch = my_branch,created_at__date = self.todaydate)
                yesterday_invoices = Invoice.objects.filter(branch = my_branch,created_at__date = self.yesterdaydate)

                yesterday_sales = 0
                today_sales = 0
                for invoice in today_invoices:
                    today_sales += invoice.total_amount
            

                for invoice in yesterday_invoices:
                    yesterday_sales += invoice.total_amount
            

                if yesterday_sales ==0:
                    sales_percent = 0
                else:
                    sales_percent = ((today_sales - yesterday_sales)/yesterday_sales)*100
                    return Response({"success":True,"total_sales":today_sales,"sales_percent":sales_percent})

            elif action == 'salesbycategory':
                sold_category = InvoiceItem.objects.filter(invoice__branch = my_branch).values('product__category').annotate(total_sold = Sum('quantity')).order_by('-total_sold')[:5]
                
                category_totals = InvoiceItem.objects.filter(invoice__branch = my_branch).values('product__category').annotate(product_total=Sum(ExpressionWrapper(F('quantity')*F('unit_price')-F('discount_amount'),output_field=DecimalField(max_digits=10,decimal_places=2)))).order_by('-product_total')[:5]
                
                return Response({"success":True,"sold_category":sold_category,"category_totals":category_totals})

# class TopSalesView(APIView):
#     todaydate = date.today()
#     def get(self,request):
#         invoice_items = InvoiceItem.objects.filter(created_at__date=self.todaydate).values('product__name').annotate(total_quantity=Sum('quantity')).order_by('-total_quantity')[:5]

#         return Response({"success":True,"top_items":invoice_items})
