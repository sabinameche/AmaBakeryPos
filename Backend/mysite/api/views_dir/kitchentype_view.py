from rest_framework import status
from rest_framework.views import APIView, Response
from django.shortcuts import get_object_or_404
from ..models import Kitchentype, ProductCategory
from ..serializer_dir.kitchentype_serilizer import KitchenTypeSerializer


class KitchenViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, id=None):
        my_branch = request.user.branch
        role = self.get_user_role(request.user)

        if id:
            filter_kwargs = {"id": id,"is_deleted":False}
            if role not in ["ADMIN", "SUPER_ADMIN"] and my_branch:
                filter_kwargs["branch"] = my_branch
            
            kitchentype = get_object_or_404(Kitchentype, **filter_kwargs)
            serializer = KitchenTypeSerializer(kitchentype)
            return Response({"success": True, "data": serializer.data})
        else:
            if role in ["ADMIN", "SUPER_ADMIN"]:
                kitchentypes = Kitchentype.objects.filter(is_deleted = False)
            elif my_branch:
                kitchentypes = Kitchentype.objects.filter(branch=my_branch,is_deleted = False)
            else:
                kitchentypes = Kitchentype.objects.none()
            
            serializer = KitchenTypeSerializer(kitchentypes, many=True)
            return Response({"success": True, "data": serializer.data})

    def post(self, request):
        my_branch = request.user.branch
        role = self.get_user_role(request.user)

        data = request.data.copy()
        if role not in ["ADMIN", "SUPER_ADMIN"]:
            if not my_branch:
                return Response({"success": False, "message": "Branch is required"}, status=status.HTTP_400_BAD_REQUEST)
            data["branch"] = my_branch.id

        serializer = KitchenTypeSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data, "message": "Kitchen type created"}, status=status.HTTP_201_CREATED)
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id):
        my_branch = request.user.branch
        role = self.get_user_role(request.user)

        filter_kwargs = {"id": id,"is_deleted":False}
        if role not in ["ADMIN", "SUPER_ADMIN"] and my_branch:
            filter_kwargs["branch"] = my_branch
        
        kitchentype = get_object_or_404(Kitchentype, **filter_kwargs)
        serializer = KitchenTypeSerializer(kitchentype, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data, "message": "Kitchen type updated"})
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        my_branch = request.user.branch
        role = self.get_user_role(request.user)

        filter_kwargs = {"id": id}
        if role not in ["ADMIN", "SUPER_ADMIN"] and my_branch:
            filter_kwargs["branch"] = my_branch
        
        kitchentype = get_object_or_404(Kitchentype, **filter_kwargs)
        kitchentype.is_deleted = True
        kitchentype.save()
        return Response({"success": True,
                          "message": "Kitchen type deleted"}, 
                          status=status.HTTP_200_OK,)
