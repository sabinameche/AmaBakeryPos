import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

if not User.objects.filter(username="sab").exists():
    User.objects.create_superuser(
        username="sab",
        email="youremail@example.com",
        password="StrongPassword123"
    )
    print("Superuser created!")
else:
    print("Superuser already exists.")