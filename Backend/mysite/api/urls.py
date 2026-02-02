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
    path("order/", views.OrderViewClass.as_view(), name="orders_details"),
    path("order/<int:id>/", views.OrderViewClass.as_view(), name="orders"),
]
