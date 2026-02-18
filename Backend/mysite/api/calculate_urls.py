from django.urls import path
from . import views

urlpatterns =[
    path('today_sales/',views.TodaySalesView.as_view(),name="today-sales"),
    path('top_sales/',views.TopSalesView.as_view(),name="top-sales"),
]