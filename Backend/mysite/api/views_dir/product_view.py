from rest_framework.views import APIView, Response

from ..models import Product
from ..serializer_dir.product_serializer import ProductSerializer


class ProductViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, id=None):
        if id:
            # get single product
            role = self.get_user_role(request.user)
            print("this is role hahaha ",role)
            if role == "BRANCH_MANAGER":
                my_branch = request.user.branch
                branch_product = Product.objects.get(id=id)
                if branch_product.category.branch == my_branch:
                    product_details = ProductSerializer(branch_product)
                    return Response({"success": True, "data": product_details.data})
            elif role == "SUPER_ADMIN":
                product = Product.objects.get(id=id)
                serilizer = ProductSerializer(product)
                return Response({"success": True, "data": serilizer.data})

    def post(self, request):
        pass

    def put(self, request, id=None):
        pass

    def delete(self, request, id=None):
        pass
