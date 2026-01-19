import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class Branch(models.Model):
    name = models.CharField(max_length=20, unique=True, null=True, blank=True)
    location = models.CharField(max_length=20)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"{self.name}"


class ProductCategory(models.Model):
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="product_categories"
    )
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ["branch", "name"]

    def __str__(self):
        return f"{self.name} ({self.branch})"


class User(AbstractUser):
    phone = models.CharField(max_length=15, blank=True)
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="branch_user",
    )
    USER_TYPE_CHOICES = [
        ("ADMIN", "Admin"),
        ("WAITER", "Waiter"),
        ("KITCHEN_STAFF", "Kitchen_Staff"),
    ]
    full_name = models.CharField(max_length=20, blank=True)
    user_type = models.CharField(
        max_length=20, choices=USER_TYPE_CHOICES, default="WAITER"
    )

    def __str__(self):
        return self.username


class Product(models.Model):
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="products"
    )

    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    product_quantity = models.IntegerField(default=0)
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    low_stock_bar = models.IntegerField(default=0)
    date_added = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ["branch", "name"]
