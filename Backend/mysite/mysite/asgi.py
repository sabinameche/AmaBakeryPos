"""
ASGI config for mysite project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.urls import path
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')

django_asgi_app = get_asgi_application()

from api.consumers import ReportDashboardConsumer


websocket_urlpatterns = [
        path("ws/report-dashboard/", ReportDashboardConsumer.as_asgi()),
]
application = ProtocolTypeRouter({
    # Django's ASGI application to handle traditional HTTP requests
    "http": django_asgi_app,

    # WebSocket chat handler
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
