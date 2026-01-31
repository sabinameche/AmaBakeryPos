from rest_framework import status
from rest_framework.views import APIView, Response

from ..models import Branch, ProductCategory, User
from ..serializer_dir.branch_serializer import BranchSerializers


class BranchViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    # --- GET (List or Retrieve) ---
    def get(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
            return Response(
                {"success": False, "message": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if id:
            # Single branch with prefetch
            try:
                branch = Branch.objects.prefetch_related(
                    "branch_user"  # Assuming User has foreign key to Branch
                ).get(id=id)

                serializer = BranchSerializers(branch)
                response_data = dict(serializer.data)

                # Get manager from prefetched users
                manager = branch.branch_user.filter(user_type="BRANCH_MANAGER").first()

                if manager:
                    response_data["branch_manager"] = {
                        "id": manager.id,
                        "username": manager.username,
                        "total_user": branch.branch_user.count(),
                    }
                else:
                    response_data["branch_manager"] = None

                return Response({"success": True, "data": response_data})

            except Branch.DoesNotExist:
                return Response(
                    {"success": False, "message": "Branch not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            # All branches with prefetch (most efficient)
            branches = Branch.objects.prefetch_related("branch_user").all()

            response_data = []
            for branch in branches:
                # Serialize each branch
                branch_data = BranchSerializers(branch).data
                branch_dict = dict(branch_data)

                # Get manager from prefetched users
                manager = branch.branch_user.filter(user_type="BRANCH_MANAGER").first()

                if manager:
                    branch_dict["branch_manager"] = {
                        "id": manager.id,
                        "username": manager.username,
                        "email": manager.email,
                        "total_user": branch.branch_user.count(),
                    }
                else:
                    branch_dict["branch_manager"] = None

                response_data.append(branch_dict)

            return Response(
                {"success": True, "count": len(response_data), "data": response_data}
            )

    # --- POST (Create) ---
    def post(self, request):
        role = self.get_user_role(request.user)

        if role not in ["SUPER_ADMIN", "ADMIN"]:
            return Response(
                {
                    "success": False,
                    "message": "You don't have permission to create branches.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate branch name
        new_name = request.data.get("name", "").strip()
        if not new_name:
            return Response(
                {
                    "success": False,
                    "message": "Branch name is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for duplicate (case-insensitive)
        if Branch.objects.filter(name__iexact=new_name).exists():
            return Response(
                {
                    "success": False,
                    "message": f"A branch named '{new_name}' already exists.",
                },
                status=status.HTTP_409_CONFLICT,
            )

        # Validate location
        location = request.data.get("location", "").strip()
        if not location:
            return Response(
                {
                    "success": False,
                    "message": "Location is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prepare data
        data = request.data.copy()
        serializer = BranchSerializers(data=data, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "Branch created successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                    "message": "Validation failed",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # --- PATCH (Update) ---
    def patch(self, request, id=None):
        role = self.get_user_role(request.user)

        # Permission check
        if role not in ["SUPER_ADMIN", "ADMIN"]:
            return Response(
                {
                    "success": False,
                    "message": "You don't have permission to update branches.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not id:
            return Response(
                {"success": False, "message": "Branch ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            branch = Branch.objects.get(id=id)
        except Branch.DoesNotExist:
            return Response(
                {"success": False, "message": "Branch not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check for duplicate name (case-insensitive)
        new_name = request.data.get("name", "").strip()
        if new_name and new_name.lower() != branch.name.lower():
            if (
                Branch.objects.filter(name__iexact=new_name)
                .exclude(id=branch.id)
                .exists()
            ):
                return Response(
                    {
                        "success": False,
                        "message": f"A branch named '{new_name}' already exists.",
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        # Update branch
        serializer = BranchSerializers(
            branch, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "Branch updated successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                    "message": "Validation failed",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # --- DELETE (Safe Delete) ---
    def delete(self, request, id=None):
        role = self.get_user_role(request.user)

        # Only SUPER_ADMIN can delete branches
        if role not in ["SUPER_ADMIN", "ADMIN"]:
            return Response(
                {
                    "success": False,
                    "message": "Only SUPER_ADMIN and ADMIN can delete branches.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not id:
            return Response(
                {"success": False, "message": "Branch ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            branch = Branch.objects.get(id=id)
        except Branch.DoesNotExist:
            return Response(
                {"success": False, "message": "Branch not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if branch has any associated data
        user_count = User.objects.filter(branch=branch).count()
        category_count = ProductCategory.objects.filter(branch=branch).count()

        if user_count > 0 or category_count > 0:
            error_parts = []
            if user_count > 0:
                error_parts.append(f"{user_count} user(s)")
            if category_count > 0:
                error_parts.append(f"{category_count} categor(ies)")

            error_message = " and ".join(error_parts)

            return Response(
                {
                    "success": False,
                    "message": f"Cannot delete branch '{branch.name}' because it has {error_message}. "
                    f"Please reassign or delete all data first.",
                    "details": {
                        "users": user_count,
                        "categories": category_count,
                        "branch_name": branch.name,
                        "branch_id": branch.id,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Safe to delete (no associated data)
        branch_name = branch.name
        branch.delete()

        return Response(
            {
                "success": True,
                "message": f"Branch '{branch_name}' deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )
