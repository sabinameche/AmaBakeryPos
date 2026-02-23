from django.urls import path
from . import views

urlpatterns =[
    path('dashboard-details/<str:action>/',views.DashboardView.as_view(),name="today-sales"),
    # path('top_sales/',views.TopSalesView.as_view(),name="top-sales"),
    # path('hourly_data/',views.HourlyFrom8AMView.as_view(),name="top-sales"),
    
]