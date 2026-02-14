from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView, Response

from ..models import Table
from ..serializer_dir.table_serializer import TableSerializer


class TableViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, table_id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if role not in [
            "SUPER_ADMIN",
            "ADMIN",
            "BRANCH_MANAGER",
            "COUNTER",
            "WAITER",
            "KITCHEN",
        ]:
            return Response(
                {"success": False, "message": "User Type not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if table_id:
            # Get single table
            table = get_object_or_404(Table, id=table_id)

            if role in ["BRANCH_MANAGER", "COUNTER", "WAITER", "KITCHEN"]:
                if not my_branch or table.branch != my_branch:
                    return Response(
                        {
                            "success": False,
                            "message": "Cannot access table from other branch",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

            serializer = TableSerializer(table)
            return Response({"success": True, "data": serializer.data})

        else:
            # Get all tables with branch filtering
            if role in ["BRANCH_MANAGER", "COUNTER", "WAITER", "KITCHEN"]:
                if not my_branch:
                    return Response(
                        {"success": False, "message": "No branch assigned"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                tables = Table.objects.filter(branch=my_branch)
                table_count = tables.count()
                print(f"Total table in {my_branch} is {table_count}")
            else:
                # SUPER_ADMIN and ADMIN can see all tables
                tables = Table.objects.all()

            serializer = TableSerializer(tables, many=True)
            return Response({"success": True, "data": serializer.data})

    def post(self, request):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch
        comming_branch = request.data.get("branch")

        # 1. Permission check - who can create tables?
        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
            return Response(
                {
                    "success": False,
                    "error": "Permission denied",
                    "message": "You don't have permission to create tables!",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Prepare data for creation
        data = request.data.copy()

        # 3. Handle branch assignment based on role
        if role == "BRANCH_MANAGER":
            # Branch managers can only create tables for their own branch
            if not my_branch:
                return Response(
                    {"success": False, "message": "No branch assigned"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Force the branch to manager's branch, ignore any provided branch
            data["branch"] = my_branch.id

        else:  # ADMIN or SUPER_ADMIN
            # For admin/super_admin, branch is required
            if not comming_branch:
                return Response(
                    {
                        "success": False,
                        "message": "Branch is required",
                        "error": "Please specify a branch for the table",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # 4. Check if table number already exists in the same branch
        table_number = data.get("table_number")
        branch_id = data.get("branch")

        if table_number and branch_id:
            existing_table = Table.objects.filter(
                table_number=table_number, branch_id=branch_id
            ).first()

            if existing_table:
                return Response(
                    {
                        "success": False,
                        "message": "Table number already exists",
                        "error": f"Table #{table_number} already exists in this branch",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # 5. Create the table using serializer
        serializer = TableSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "Table created successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        # 6. Handle validation errors
        return Response(
            {
                "success": False,
                "message": "Validation error",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, table_id):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch
        comming_branch = request.data.get("branch")

        # 1. Permission check
        if role not in ["ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER"]:
            return Response(
                {
                    "success": False,
                    "error": "Permission denied",
                    "message": "You don't have permission to update table!",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Get the table object
        try:
            table = Table.objects.get(id=table_id)
        except Table.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": "Not found",
                    "message": f"Table with id {table_id} does not exist",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 3. BRANCH_MANAGER can only update their own branch tables
        if role == "BRANCH_MANAGER":
            if not my_branch:
                return Response(
                    {"success": False, "message": "No branch assigned"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if table.branch != my_branch:
                return Response(
                    {
                        "success": False,
                        "error": "Permission denied",
                        "message": "You can only update tables in your own branch",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Prevent BRANCH_MANAGER from changing branch
            if comming_branch and int(comming_branch) != my_branch.id:
                return Response(
                    {
                        "success": False,
                        "error": "Permission denied",
                        "message": "You cannot change the branch of a table",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Force branch to manager's branch
            data = request.data.copy()
            data["branch"] = my_branch.id

        # 4. ADMIN/SUPER_ADMIN can update any table
        else:  # role in ["ADMIN", "SUPER_ADMIN"]
            data = request.data.copy()
            # If branch not specified, keep existing branch
            if "branch" not in data:
                data["branch"] = table.branch.id

        serializer = TableSerializer(table, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "Table updated successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,  # Changed from 201 to 200 for updates
            )

        # 6. Validation errors
        return Response(
            {
                "success": False,
                "message": "Validation error",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,  # Changed from 403 to 400
        )

    def delete(self, request, table_id):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        # 1. Permission check - who can delete?
        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
            return Response(
                {
                    "success": False,
                    "error": "Permission denied",
                    "message": "You don't have permission to delete tables!",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Get the table object
        try:
            table = Table.objects.get(id=table_id)
        except Table.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": "Not found",
                    "message": f"Table with id {table_id} does not exist",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 3. Check if table has active orders (optional - business logic)
        # Uncomment if you want to prevent deletion of tables with active orders

        if table.active_orders.exists():
            return Response(
                {
                    "success": False,
                    "error": "Cannot delete",
                    "message": "Table has active orders. Complete orders first.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Branch permission check
        if role == "BRANCH_MANAGER":
            if not my_branch:
                return Response(
                    {"success": False, "message": "No branch assigned"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if table.branch != my_branch:
                return Response(
                    {
                        "success": False,
                        "error": "Permission denied",
                        "message": "You can only delete tables from your own branch",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        # 5. Perform deletion
        try:
            table.delete()
            return Response(
                {
                    "success": True,
                    "message": f"Table #{table_id} deleted successfully",
                    "deleted_id": table_id,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Deletion failed",
                    "message": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
