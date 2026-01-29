from rest_framework import status
from rest_framework.views import APIView, Response

from ..models import ProductCategory
from ..serializer_dir.category_serializer import ProductCategorySerializer


class CategoryViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if not role:  # User has no role
            return Response({"success": False, "message": "Unauthorized"})
        if id:
            # Get single category
            try:
                if role in ["SUPER_ADMIN", "ADMIN"]:
                    category = ProductCategory.objects.get(id=id)
                else:
                    category = ProductCategory.objects.get(id=id, branch=my_branch)

                serializer = ProductCategorySerializer(category)
                return Response({"success": True, "data": serializer.data})

            except ProductCategory.DoesNotExist:
                return Response(
                    {"success": False, "message": "Category not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            # Get all categories for user's branch
            if role in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "WAITER", "COUNTER"]:
                if role == ["SUPER_ADMIN", "ADMIN"]:
                    categories = ProductCategory.objects.all()
                else:
                    categories = ProductCategory.objects.filter(branch=my_branch)

                serializer = ProductCategorySerializer(categories, many=True)
                return Response({"success": True, "data": serializer.data})

            return Response(
                {"success": False, "message": "Insufficient permissions"},
                status=status.HTTP_403_FORBIDDEN,
            )

    def put(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        # Permission check
        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
            return Response(
                {"success": False, "message": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not id:
            return Response(
                {"success": False, "message": "Category ID required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Get category - SUPER_ADMIN can access any, others only their branch
            if role in ["SUPER_ADMIN", "ADMIN"]:
                category = ProductCategory.objects.get(id=id)
            else:
                category = ProductCategory.objects.get(id=id, branch=my_branch)
        except ProductCategory.DoesNotExist:
            return Response(
                {"success": False, "message": "Category not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check for duplicate name in the same branch
        new_name = request.data.get("name", "").strip()
        if new_name and new_name.lower() != category.name.lower():
            if (
                ProductCategory.objects.filter(
                    branch=category.branch, name__iexact=new_name
                )
                .exclude(id=category.id)
                .exists()
            ):
                return Response(
                    {
                        "success": False,
                        "message": f"Category '{new_name}' already exists.",
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        # Prepare data - always include current branch for non-SUPER_ADMIN
        data = request.data.copy()
        if role != "SUPER_ADMIN" or role != "ADMIN":
            data["branch"] = my_branch.id

        # Update
        serializer = ProductCategorySerializer(
            category, data=data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "Category updated",
                    "data": serializer.data,
                }
            )

        return Response(
            {
                "success": False,
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
