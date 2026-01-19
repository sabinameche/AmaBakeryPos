from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import UsersSerializers


class UserView(APIView):
    def check_admin_or_manager(self, request):
        if request.user.is_staff:
            return True

        # Manager check (user_type field)
        if hasattr(request.user, "user_type"):
            return request.user.user_type == "MANAGER"

        return False

    def get(self, request):
        """List all users (admin or manager only)"""
        # Permission check
        if not self.check_admin_or_manager(request):
            return Response(
                {"success": False, "message": "Admin or Manager access required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Admin sees all, Manager sees only their branch users
        if request.user.is_staff and not hasattr(request.user, "user_type"):
            # Super admin - see all users
            users = User.objects.all()
        else:
            # Manager - see only users from their branch
            if hasattr(request.user, "branch") and request.user.branch:
                users = User.objects.filter(branch=request.user.branch)
            else:
                users = User.objects.none()

        serializer = UsersSerializers(users, many=True)
        return Response(
            {"success": True, "count": users.count(), "users": serializer.data}
        )

    def post(self, request):
        """Create new staff (admin or manager)"""
        # Permission check
        if not self.check_admin_or_manager(request):
            return Response(
                {"success": False, "message": "Admin or Manager access required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Role hierarchy check
        user_type = request.data.get("user_type", "WAITER")

        # Managers can only create CASHIER/WAITER
        if (
            hasattr(request.user, "user_type")
            and request.user.user_type == "MANAGER"
            and user_type in ["MANAGER", "ADMIN"]
        ):
            return Response(
                {
                    "success": False,
                    "message": "Managers can only create Cashiers or Waiters",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UsersSerializers(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            user_type = request.data.get("user_type", "WAITER")

            # Set is_staff based on role
            if user_type in ["MANAGER", "ADMIN"]:
                user.is_staff = True
            else:
                user.is_staff = False

            # If manager is creating, assign to manager's branch
            if (
                hasattr(request.user, "user_type")
                and request.user.user_type == "MANAGER"
                and hasattr(request.user, "branch")
            ):
                user.branch = request.user.branch

            user.save()

            return Response(
                {
                    "success": True,
                    "message": f"Staff account created for {user.username}",
                    "staff": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "user_type": user_type,
                        "is_staff": user.is_staff,
                        "branch": user.branch.name if user.branch else None,
                        "created_by": request.user.username,
                        "created_at": user.date_joined,
                    },
                    "instructions": "Staff should login at /api/token/ with their credentials",
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, id=None):
        """Delete staff member (admin or manager only)"""
        # Permission check
        if not self.check_admin_or_manager(request):
            return Response(
                {"success": False, "message": "Admin or Manager access required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": f"User with ID {id} not found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Prevent self-deletion
        if request.user.id == user.id:
            return Response(
                {
                    "success": False,
                    "message": "You cannot delete your own account!",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Managers can only delete from their branch
        if hasattr(request.user, "user_type") and request.user.user_type == "MANAGER":
            if not (
                hasattr(user, "branch")
                and hasattr(request.user, "branch")
                and user.branch == request.user.branch
            ):
                return Response(
                    {
                        "success": False,
                        "message": "Managers can only delete staff from their own branch",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Managers can't delete other managers
            if hasattr(user, "user_type") and user.user_type == "MANAGER":
                return Response(
                    {
                        "success": False,
                        "message": "Managers cannot delete other managers",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        username = user.username
        user.delete()

        return Response(
            {
                "success": True,
                "message": f"Staff '{username}' deleted successfully",
            },
            status=status.HTTP_200_OK,
        )
