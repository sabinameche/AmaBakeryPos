from rest_framework import serializers
from ..models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    # branch_name = serializers.CharField(source="branch.name", read_only=True)
    
    class Meta:
        model = Customer
        fields = ["id", "name", "phone", "email", "address", "created_at", "branch"]
        extra_kwargs = {
            "name": {"required": True},
            "branch": {"required": True},  
        }
