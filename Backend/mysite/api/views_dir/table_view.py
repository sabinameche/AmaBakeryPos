from rest_framework.views import APIView, Response

from ..models import Table
from ..serializer_dir.table_serializer import TableSerializer


class TableViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if id:
            pass
        else:
            if role not in [
                "SUPER_ADMIN",
                "ADMIN",
                "BRANCH_MANAGER",
                "COUNTER",
                "WAITER",
                "KITCHEN",
            ]:
                return Response(
                    {"success": False, "message": "User Type not found"}, status=400
                )

            if my_branch:
                table = Table.objects.filter(branch=my_branch)
                serilizers = TableSerializer(table, many=True)
                tablecount = Table.objects.filter(branch=my_branch)
                print(f"Total table in {my_branch} is {tablecount.count()}")

                return Response({"success": True, "data": serilizers.data})

            table = Table.objects.all()
            serilizers = TableSerializer(table, many=True)

            return Response({"success": True, "data": serilizers.data})
