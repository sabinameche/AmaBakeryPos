# api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Branch,
    Customer,
    Invoice,
    Payment,
    Product,
    ProductCategory,
    Table,
    User,
)


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
    list_display = (
        "id",
        "name",
    )
    list_filter = ("name", "id")
    search_fields = ("name", "name")


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


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "date", "branch")
    list_filter = ("name", "address", "email")
    search_fields = ["name"]
    ordering = ["name"]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_number",
        "id",
        "customer",
        "invoice_type",
        "total_amount",
        "payment_status",
        "order_date",
    ]

    list_filter = ["invoice_type", "payment_status", "invoice_status", "branch"]

    search_fields = ["invoice_number", "customer__name"]

    readonly_fields = ["uid", "subtotal", "tax_amount", "total_amount", "paid_amount"]

    fieldsets = (
        (
            "Basic Info",
            {"fields": ("branch", "customer", "uid", "invoice_number", "invoice_type")},
        ),
        ("Dates", {"fields": ("order_date", "created_by")}),
        (
            "Financial",
            {
                "fields": (
                    "subtotal",
                    "tax_amount",
                    "discount",
                    "total_amount",
                    "paid_amount",
                )
            },
        ),
        ("Status", {"fields": ("payment_status", "invoice_status", "is_active")}),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "invoice",
        "amount",
        "payment_method",
        "notes",
        "payment_date",
        "received_by",
    )


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "branch",
        "is_free",
    )
