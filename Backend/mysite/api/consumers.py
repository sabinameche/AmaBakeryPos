from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework import status
from rest_framework.response import Response
import json
from .views_dir.dashboard_view import report_dashboard

class ReportDashboardConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.group_name = 'report_dashboard'
        await self.accept()
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # send initial dashboard data
        await self.send_report_dashboard()
    
    async def receive(self,text_data):
        data = json.loads(text_data)
        branch_id = data.get("branch_id")
        await self.send_report_dashboard(branch_id)

    async def send_report_dashboard(self,branch_id = None):
        user = self.scope["user"]
        role = self.get_user_role(user)
        my_branch = getattr(user, "branch", None)
        

        if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
            await self.send(text_data = json.dumps(
                {"success": False, "message": "Insufficient permissions"}))
            return

        if role in ["SUPER_ADMIN", "ADMIN"]:
            if not branch_id:
                await self.send(text_data= json.dumps({
                        "success": False,
                        "message": "branch_id is required for admin/superadmin",
                    }))
                return 
            my_branch = branch_id
        data = report_dashboard(my_branch)
        await self.send(text_data= json.dumps({"success":True,**data}))

    async def disconnect(self, close_code):
        # Called when the socket closes
        await self.channel_layer.group_discard("report_dashboard",self.channel_name)

class KitchenInvoiceDashboard(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "kitchen_dashboard"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
            )
        await self.accept()
        await self.send(text_data=json.dumps({"message": "Connected successfully!!"}))
    
    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name)
        
    # Receive message from group
    async def send_order(self, event):
        order_data = event['order']
        await self.send(text_data=json.dumps({
            'order': order_data
        }))
    