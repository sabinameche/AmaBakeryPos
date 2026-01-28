from rest_framework.views import APIView, Response

from ..models import ProductCategory
from ..serializer_dir.category_serializer import ProductCategorySerializer


class CategoryViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch
        if id:
            pass
        else:
            if role in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "WAITER", "COUNTER"]:
                category = ProductCategory.objects.filter(branch=my_branch)
                serilizer = ProductCategorySerializer(category, many=True)
                return Response({"success": True, "data": serilizer.data})
        return Response({"success": False})
