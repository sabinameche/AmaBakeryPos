# api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Branch, Product, ProductCategory, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + (
        "phone",
        "full_name",
        "user_type",
        "branch",
    )

    list_filter = UserAdmin.list_filter + ("user_type", "branch", "full_name")

    fieldsets = UserAdmin.fieldsets + (
        ("Custom Fields", {"fields": ("phone", "branch", "full_name", "user_type")}),
    )


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    pass


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
    )
    list_filter = ("name", "id")
    search_fields = ("name", "branch.name")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "product_quantity",
        "date_added",
    )
    list_filter = ("category", "is_available", "date_added")
    search_fields = ("name", "category__name")
    ordering = ("date_added",)
