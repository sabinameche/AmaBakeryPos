from rest_framework import serializers
from ..models import User


class UsersSerializers(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    password = serializers.CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone",
            "full_name",
            "user_type",
            "branch",
            "branch_name",
            "password",
            "is_staff",
            "date_joined",
        ]
        read_only_fields = ["id", "is_staff", "date_joined", "branch_name"]
        extra_kwargs = {
            "email": {"required": True},
            "phone": {"allow_blank": True},
            "full_name": {"allow_blank": True},
            "user_type": {"default": "WAITER"},
        }

    def create(self, validated_data):
        """Create user with password"""
        # Get password or use default
        password = validated_data.pop("password", "amabakery@123")

        # Create user with all fields at once
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=password,
            phone=validated_data.get("phone", ""),
            full_name=validated_data.get("full_name", ""),
            user_type=validated_data.get("user_type", "WAITER"),
            branch=validated_data.get("branch"),
        )

        return user

    def update(self, instance, validated_data):
        """Update user - password is ignored in updates"""
        # Remove password if present (use separate endpoint for password changes)
        validated_data.pop("password", None)

        # Update allowed fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate(self, data):
        user = self.context["request"].user
        if not user.check_password(data["old_password"]):
            raise serializers.ValidationError("Old password is incorrect")
        return data
