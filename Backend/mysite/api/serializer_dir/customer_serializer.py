from rest_framework import serializers
from ..models import Customer,Invoice


class CustomerInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id','total_amount','payment_status','created_by']

class CustomerSerializer(serializers.ModelSerializer):
    # branch_name = serializers.CharField(source="branch.name", read_only=True)
    invoice = CustomerInvoiceSerializer(source = 'invoices',many = True,read_only = True)
    class Meta:
        model = Customer
        fields = ["id", "name", "phone", "email", "address", "created_at", "branch","invoice"]
        extra_kwargs = {
            "name": {"required": True},
            "branch": {"required": True},  
        }
    
