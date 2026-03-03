import os
from dotenv import load_dotenv

load_dotenv()
print("=" * 50)
print("ENVIRONMENT VARIABLES (from Django's perspective)")
print("=" * 50)

redis_host = os.getenv('REDIS_HOST')
redis_port = os.getenv('REDIS_PORT')
redis_password = os.getenv('REDIS_PASSWORD')
redis_url = os.getenv('REDIS_URL')

print(f"REDIS_HOST: {redis_host}")
print(f"REDIS_PORT: {redis_port}")
print(f"REDIS_PASSWORD: {'[SET]' if redis_password else '[NOT SET]'}")
print(f"REDIS_URL: {redis_url if redis_url else '[NOT SET]'}")

if redis_host and redis_port:
    try:
        import redis
        r = redis.Redis(
            host=redis_host,
            port=int(redis_port),
            password=redis_password if redis_password else None,
            decode_responses=True,
            socket_connect_timeout=5
        )
        r.ping()
        print("\n✅ Redis connection successful!")
        print(f"Redis version: {r.info().get('redis_version')}")
    except Exception as e:
        print(f"\n❌ Redis connection failed: {e}")
else:
    print("\n❌ Redis configuration not found in environment")
