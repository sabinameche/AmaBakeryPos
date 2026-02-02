from rest_framework import serializers

from ..models import Order


class OrderSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "uid",
            "branch",
            "branch_name",
            "order_date",
            "customer",
            "customer_name",
            "created_by",
            "notes",
            "invoice_description",
        ]
        read_only_fields = ["uid", "order_date"]  # Auto-generated fields
