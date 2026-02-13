from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ItemActivity
from ..serializer_dir.item_activity_serializer import ItemActivitySerializer


class ItemActivityClassView(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, activity_id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if activity_id:
            item_activity = ItemActivity.objects.get(id=activity_id)
            serializer = ItemActivitySerializer(item_activity)
        else:
            item_activity = ItemActivity.objects.all()
            serializer = ItemActivitySerializer(item_activity, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        pass

    def patch(self, request, item_id):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
            pass

        if item_id:
            item_activity = ItemActivity.objects.get(id=item_id)

            data = request.data.copy()

            if item_activity.types == "ADD_STOCK":
                tempqty = item_activity.quantity - int(item_activity.change)
                item_activity.quantity = tempqty + data["change"]
                print(item_activity.quantity)

            elif item_activity.types == "REDUCE_STOCK":
                tempqty = item_activity.quantity + int(item_activity.change)
                item_activity.quantity = tempqty - data["change"]

            item_activity.change = data["change"]
            item_activity.save()

            prev = item_activity.quantity

            subsequent_activities = ItemActivity.objects.filter(
                product=item_activity.product, created_at__gt=item_activity.created_at
            ).order_by("created_at")

            for act in subsequent_activities:
                if act.types == "ADD_STOCK":
                    act.quantity = prev + int(act.change)
                elif act.types == "REDUCE_STOCK":
                    act.quantity = prev - int(act.change)
                prev = act.quantity
                act.save()

            item_activity.product.quantity = subsequent_activities.last().quantity
            item_activity.product.save()

            serializer = ItemActivitySerializer(item_activity)

            return Response({"status": True, "data": serializer.data})
