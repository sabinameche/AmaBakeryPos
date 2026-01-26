from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes  # ADD THIS IMPORT
from rest_framework.response import Response

# custom
from .serializer_dir.users_serializer import ChangePasswordSerializer
from .views_dir.product_view import ProductViewClass
from .views_dir.users_view import UserViewClass

UserView = UserViewClass
ProductView = ProductViewClass


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def change_own_password(request):
    """User can change their own password"""
    serializer = ChangePasswordSerializer(
        data=request.data, context={"request": request}
    )

    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"success": True, "message": "Password updated successfully"})

    return Response(
        {"success": False, "errors": serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )
