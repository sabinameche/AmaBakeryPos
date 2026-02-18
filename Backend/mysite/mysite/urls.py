from api.views import CustomTokenObtainPairView
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", CustomTokenObtainPairView.as_view(), name="get_token"),
    path(
        "api/token/refresh/", TokenRefreshView.as_view(), name="refresh"
    ),  # Fixed: added closing quote
    path("api-auth/", include("rest_framework.urls")),
    path("api/", include("api.urls")),
  
]
