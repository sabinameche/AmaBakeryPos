from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes  # ADD THIS IMPORT
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializer_dir.users_serializer import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
)
from .views_dir import floor_view, item_activity_view
from .views_dir.branch_view import BranchViewClass
from .views_dir.categorys_view import CategoryViewClass
from .views_dir.customer_view import CustomerViewClass
from .views_dir.invoice_view import InvoiceViewClass
from .views_dir.dashboard_view import TodaySalesView,TopSalesView
from .views_dir.payment_view import PaymentClassView

# custom
from .views_dir.product_view import ProductViewClass
from .views_dir.users_view import UserViewClass


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


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


UserView = UserViewClass
ProductView = ProductViewClass
CategoryView = CategoryViewClass
BranchView = BranchViewClass
CustomerView = CustomerViewClass
InvoiceView = InvoiceViewClass
PaymentView = PaymentClassView
FloorView = floor_view.FloorViewClass
ItemActivityView = item_activity_view.ItemActivityClassView
TodaySalesView = TodaySalesView
TopSalesView = TopSalesView
