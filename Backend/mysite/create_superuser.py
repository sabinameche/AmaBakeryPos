import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Read from environment variables with fallback values
SUPERUSER_USERNAME = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
SUPERUSER_EMAIL = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
SUPERUSER_PASSWORD = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not SUPERUSER_PASSWORD:
    print("ERROR: DJANGO_SUPERUSER_PASSWORD environment variable is not set!")
    exit(1)

# Check if user already exists by username OR email for flexibility
if not User.objects.filter(username=SUPERUSER_USERNAME).exists():
    try:
        User.objects.create_superuser(
            username=SUPERUSER_USERNAME,
            email=SUPERUSER_EMAIL,
            password=SUPERUSER_PASSWORD
        )
        print(f"Superuser '{SUPERUSER_USERNAME}' created successfully!")
    except Exception as e:
        print(f"Error creating superuser: {e}")
        exit(1)
else:
    print(f"Superuser '{SUPERUSER_USERNAME}' already exists.")
