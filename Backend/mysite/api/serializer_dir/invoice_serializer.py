from decimal import Decimal

from rest_framework import serializers

from ..models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ["product", "quantity", "unit_price", "discount_amount"]


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    paid_amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, default=0, min_value=0
    )


    class Meta:
        model = Invoice
        fields = [
            "branch",
            "customer",
            "invoice_type",
            "tax_amount",
            "discount",
            "description",
            "paid_amount",  # ✅ ADD THIS TO THE FIELDS LIST!
            "items",
            "invoice_status",
            "floor",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        paid_amount = validated_data.pop("paid_amount", 0)  # ✅ Extract paid_amount
        request = self.context.get("request")

        # Create invoice with actual paid_amount
        invoice = Invoice.objects.create(
            **validated_data,
            created_by=request.user if request else None,
            subtotal=0,
            total_amount=0,
            paid_amount=paid_amount,  # ✅ Use the actual paid_amount
            payment_status="PENDING",
        )


        # Generate invoice number
        invoice.invoice_number = f"INV-{invoice.id:06d}"

        # Create items and calculate subtotal
        subtotal = Decimal("0")
        for item_data in items_data:
            item = InvoiceItem.objects.create(invoice=invoice, **item_data)
            subtotal += item.quantity * item.unit_price - item.discount_amount

        # Update totals
        invoice.subtotal = subtotal
        invoice.total_amount = subtotal + invoice.tax_amount - invoice.discount

        # ✅ Update payment status based on paid_amount
        if invoice.paid_amount >= invoice.total_amount:
            invoice.payment_status = "PAID"
        elif invoice.paid_amount > 0:
            invoice.payment_status = "PARTIAL"

        invoice.save()

        return invoice


class InvoiceResponseSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, source="bills")
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    floor_name = serializers.CharField(source="floor.name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.username", read_only=True
    )
    due_amount = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "invoice_type",
            "customer",
            "customer_name",
            "floor",
            "floor_name",
            "branch",
            "branch_name",
            "created_by",
            "created_by_name",
            "notes",
            "subtotal",
            "tax_amount",
            "discount",
            "total_amount",
            "paid_amount",  # ✅ ADD THIS (was missing!)
            "due_amount",
            "payment_status",
            "is_active",
            "description",
            "invoice_status",
            "items",
        ]

    def get_due_amount(self, obj):
        return obj.total_amount - obj.paid_amount
