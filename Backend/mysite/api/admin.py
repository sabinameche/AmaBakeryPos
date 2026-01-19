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
    pass

#
@admin.register(Product)  
class ProductAdmin(admin.ModelAdmin):
    pass
