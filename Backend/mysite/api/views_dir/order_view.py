from rest_framework.views import APIView, Response

from ..models import Order
from ..serializer_dir.order_serializer import OrderSerializer


class OrderViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if id:
            if role in ["ADMIN", "SUPER_ADMIN"]:
                orders = Order.objects.get(id=id)
                serilizers = OrderSerializer(orders)

                if serilizers.is_valid():
                    return Response({"success": True, "data": serilizers.data})
                else:
                    return Response({"success": False, "Error": "Validation Error"})
        else:
            if role in ["ADMIN", "SUPER_ADMIN"]:
                orders = Order.objects.all()
                serilizers = OrderSerializer(orders, many=True)
                return Response({"success": True, "data": serilizers.data})
