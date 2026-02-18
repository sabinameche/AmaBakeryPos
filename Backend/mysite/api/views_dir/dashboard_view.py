from datetime import date, timedelta
from django.db.models import Sum
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Invoice,InvoiceItem
class TodaySalesView(APIView):
    todaydate = date.today()
    yesterdaydate = todaydate - timedelta(days=1)

    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self,request):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

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

class TopSalesView(APIView):
    todaydate = date.today()
    def get(self,request):
        invoice_items = InvoiceItem.objects.filter(created_at__date=self.todaydate).values('product__name').annotate(total_quantity=Sum('quantity')).order_by('-total_quantity')[:5]

        return Response({"success":True,"top_items":invoice_items})