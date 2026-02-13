from rest_framework import serializers

from ..models import Product


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    branch_name = serializers.CharField(source="category.branch.name", read_only=True)
    branch_id = serializers.IntegerField(source="category.branch.id", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "cost_price",
            "selling_price",
            "product_quantity",
            "low_stock_bar",
            "category",
            "category_name",
            "branch_id",  # ← Use this (read-only through category)
            "branch_name",  # ← Use this (read-only through category)
            "created_at",
            "is_available",
        ]
        read_only_fields = [
            "id",
            "date_added",
            "branch_id",
            "branch_name",
            "category_name",
        ]
        extra_kwargs = {
            "name": {"required": True},
            "cost_price": {"required": True},
            "selling_price": {"required": True},
            "product_quantity": {"required": False, "default": 0},
            "low_stock_bar": {"required": False, "default": 0},
            "category": {"required": True},  # Changed to True - product needs category!
        }

    def create(self, validated_data):
        product_quantity = validated_data.pop("product_quantity", 0)
        low_stock_bar = validated_data.pop("low_stock_bar", 0)

        # Create product
        product = Product.objects.create(
            product_quantity=product_quantity,
            low_stock_bar=low_stock_bar,
            **validated_data,  # All other fields
        )
        return product
