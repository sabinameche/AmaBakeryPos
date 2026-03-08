from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Notification
from ..serializer_dir.notification_serializer import NotificationSerializer


class NotificationViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request):
        role = self.get_user_role(request.user)
        my_branch = getattr(request.user, "branch", None)

        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "WAITER", "COUNTER"]:
            return Response(
                {"success": False, "message": "Insufficient permissions"},
                status=status.HTTP_403_FORBIDDEN,
            )

        notifications = Notification.objects.all()

        if role not in ["ADMIN", "SUPER_ADMIN"] and my_branch:
            notifications = notifications.filter(branch=my_branch)

        # We can also restrict waiter to only their notifications based on created_by...
        # Waiter can see Notifications where the invoice.received_by_waiter == request.user or invoice.created_by == request.user
        if role == "WAITER":
            from django.db.models import Q
            notifications = notifications.filter(
                Q(invoice__created_by=request.user) | Q(invoice__received_by_waiter=request.user)
            )

        # Return latest 50 notifications
        notifications = notifications.order_by("-created_at")[:50]
        
        serializer = NotificationSerializer(notifications, many=True)
        return Response({"success": True, "data": serializer.data})

    def patch(self, request, id=None):
        """Mark notification as received/read"""
        try:
            notification = Notification.objects.get(id=id)
            
            # Case 1: Waiter is marking as received (ticking the notification)
            if request.data.get("mark_as_received") or request.data.get("is_read") is True:
                notification.is_read = True
                notification.received_by = request.user  # Set the current user as receiver
                notification.save()
                
                # Return the updated notification using your serializer
                serializer = NotificationSerializer(notification, context={'request': request})
                return Response({
                    "success": True, 
                    "message": "Notification marked as received",
                    "data": serializer.data
                })
            
            # Case 2: Only updating is_read (if you need this separately)
            elif request.data.get("is_read") is not None:
                notification.is_read = request.data.get("is_read")
                # Don't automatically set received_by when just toggling is_read
                notification.save()
                
                serializer = NotificationSerializer(notification, context={'request': request})
                return Response({
                    "success": True, 
                    "message": "Updated successfully",
                    "data": serializer.data
                })
            
            else:
                return Response({
                    "success": False, 
                    "message": "No valid update field provided"
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Notification.DoesNotExist:
            return Response({
                "success": False, 
                "message": "Notification not found"
            }, status=status.HTTP_404_NOT_FOUND)
