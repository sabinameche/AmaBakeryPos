from rest_framework import serializers
from ..models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    table_number = serializers.IntegerField(source='invoice.table_no', read_only=True)
    floor_name = serializers.CharField(source='invoice.floor.name', read_only=True)
    kitchen_user_name = serializers.SerializerMethodField()
    invoice_status = serializers.CharField(source='invoice.invoice_status', read_only=True)
    kitchen_type_id = serializers.IntegerField(source='kitchen_user.kitchentype.id', read_only=True)
    kitchen_type_name = serializers.CharField(source='kitchen_user.kitchentype.name', read_only=True)
    
    received_by_name = serializers.SerializerMethodField()
    received_by_username = serializers.CharField(source='received_by.username', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 
            'invoice', 
            'kitchen_user', 
            'message', 
            'is_read', 
            'created_at', 
            'invoice_number', 
            'table_number', 
            'floor_name', 
            'kitchen_user_name', 
            'invoice_status', 
            'kitchen_type_id', 
            'kitchen_type_name',
            'received_by',        # This will store the user ID
            'received_by_name',    # This will show the waiter's full name
            'received_by_username' # This will show the waiter's username as fallback
        ]
        read_only_fields = ['received_by_name', 'received_by_username']  # Make them read-only

    def get_kitchen_user_name(self, obj):
        if obj.kitchen_user:
            return obj.kitchen_user.full_name or obj.kitchen_user.username
        return "Unknown Kitchen User"
    
    def get_received_by_name(self, obj):
        """Get the full name of the waiter who received the notification"""
        if obj.received_by:
            return obj.received_by.full_name or obj.received_by.username
        return None  # Return None if not received yet
