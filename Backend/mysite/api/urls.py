from django.urls import path

from . import views

urlpatterns = [
    path("users/", views.UserView.as_view(), name="users_details"),
    path("users/<int:pk>/", views.UserView.as_view(), name="users"),
    path("products/<int:id>/", views.ProductView.as_view(), name="product"),
    path("products/", views.ProductView.as_view(), name="product_details"),
    path("category/", views.CategoryViewClass.as_view(), name="Category_details"),
    path("category/<int:id>/", views.CategoryViewClass.as_view(), name="Category_details"),
]
