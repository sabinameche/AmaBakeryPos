import os
from pathlib import Path
from dotenv import load_dotenv

# Get the directory where this script is located
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / '.env'

print(f"Looking for .env at: {env_path}")
print(f"File exists: {env_path.exists()}")

if env_path.exists():
    print("\n✅ .env file found!")
    
    # Load the .env file
    load_dotenv(env_path)
    
    print("\nEnvironment variables after loading:")
    print(f"REDIS_HOST: {os.getenv('REDIS_HOST')}")
    print(f"REDIS_PORT: {os.getenv('REDIS_PORT')}")
    print(f"REDIS_PASSWORD: {'[SET]' if os.getenv('REDIS_PASSWORD') else '[NOT SET]'}")
    print(f"DB_NAME: {os.getenv('DB_NAME')}")
    
    # Test Redis connection
    try:
        import redis
        r = redis.Redis(
            host=os.getenv('REDIS_HOST'),
            port=int(os.getenv('REDIS_PORT')),
            password=os.getenv('REDIS_PASSWORD'),
            decode_responses=True,
            socket_connect_timeout=5
        )
        r.ping()
        print("\n✅ Redis connection successful!")
    except Exception as e:
        print(f"\n❌ Redis connection failed: {e}")
else:
    print("❌ .env file not found!")
