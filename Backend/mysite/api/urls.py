from django.urls import path

from . import views

urlpatterns = [
    path("users/", views.UserView.as_view(), name="users_details"),
    path("users/<int:id>/", views.UserView.as_view(), name="users"),
    path("products/<int:id>/", views.ProductView.as_view(), name="product"),
    path("products/", views.ProductView.as_view(), name="product_details"),
    path("category/", views.CategoryViewClass.as_view(), name="Category"),
    path(
        "category/<int:id>/", views.CategoryViewClass.as_view(), name="Category_details"
    ),
    path("branch/<int:id>/", views.BranchViewClass.as_view(), name="Branch_details"),
    path("branch/", views.BranchViewClass.as_view(), name="Branch"),
    path("customer/<int:id>/", views.CustomerView.as_view(), name="customer_details"),
    path("customer/", views.CustomerView.as_view(), name="customer"),
    path("invoice/", views.InvoiceViewClass.as_view(), name="Invoice_details"),
    path("invoice/<int:id>/", views.InvoiceViewClass.as_view(), name="Invoice"),
    path("payments/", views.PaymentView.as_view(), name="payment-list"),
    path(
        "invoice/<int:invoice_id>/payments/",
        views.PaymentView.as_view(),
        name="payment-by-invoice",
    ),
    path(
        "payments/<int:payment_id>/", views.PaymentView.as_view(), name="payment-detail"
    ),
    path("table/", views.TableView.as_view(), name="table-details"),
    path("table/<int:table_id>/", views.TableView.as_view(), name="table-details"),
    path(
        "itemactivity/<int:product_id>/<str:action>/",
        views.ProductView.as_view(),
    ),  # used to add , reduce stock
    path(
        "itemactivity/<int:item_id>/",
        views.ItemActivityClassView.as_view(),
        name="activity_detail",
    ),
    path(
        "itemactivity/", views.ItemActivityClassView.as_view(), name="activity_details"
    ),
]
