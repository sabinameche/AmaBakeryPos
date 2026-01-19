from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User

class UsersSerializers(serializers.ModelSerializer):
    
    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "phone",
            "full_name",
            "user_type",
        ]
        extra_kwargs = {
            "email": {"required": True},
            "phone": {"required": False, "allow_blank": True},
            "full_name": {"required": False, "allow_blank": True},
            "user_type": {"required": False, "default": "WAITER"},
        }
    
    def create(self, validated_data):
        """Use default password 'amabakery@123'"""
        default_password = "amabakery@123"
        
        user = User.objects.create_user(
            **validated_data, 
            password=default_password  
        )
        return user
