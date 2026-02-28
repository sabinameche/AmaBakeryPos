# api/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Invoice
from .serializer_dir.invoice_serializer import InvoiceResponseSerializer
@receiver(post_save, sender=Invoice)
def send_invoice_to_kitchen(sender, instance, created, **kwargs):
    """
    Sends the newly created invoice to the kitchen dashboard.
    """
    if not created:
        return  

    try:
        channel_layer = get_channel_layer()
        serializer = InvoiceResponseSerializer(instance)
        async_to_sync(channel_layer.group_send)(
            "kitchen_dashboard",
            {
                "type": "send_order",
                "order": serializer.data,
            },
        )
        print("succesfully create vayo invoice")
    except Exception as e:
        # log the error but don't break invoice creation
        print("Failed to send invoice to kitchen dashboard:", e)