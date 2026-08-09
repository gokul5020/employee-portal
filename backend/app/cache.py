import time
import json
import redis
from typing import Optional, Any
from .config import settings

class InMemoryCache:
    def __init__(self):
        self._store = {}
        print("WARN: Redis server is unreachable. Falling back to in-memory cache.")

    def get(self, key: str) -> Optional[str]:
        if key in self._store:
            val, expiry = self._store[key]
            if expiry is None or expiry > time.time():
                return val
            else:
                del self._store[key]
        return None

    def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
        expiry = time.time() + ex if ex else None
        self._store[key] = (value, expiry)

    def delete(self, key: str) -> None:
        if key in self._store:
            del self._store[key]

    def clear(self) -> None:
        self._store.clear()

class CacheManager:
    def __init__(self):
        self.redis_client = None
        self.fallback_cache = None
        try:
            # Try to connect to Redis
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                socket_connect_timeout=2,
                decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
            print("✅ Successfully connected to Redis Cache Server")
        except Exception as e:
            self.redis_client = None
            self.fallback_cache = InMemoryCache()

    def get(self, key: str) -> Optional[Any]:
        try:
            if self.redis_client:
                val = self.redis_client.get(key)
                return json.loads(val) if val else None
            else:
                val = self.fallback_cache.get(key)
                return json.loads(val) if val else None
        except Exception:
            return None

    def set(self, key: str, value: Any, expire_seconds: int = 600) -> None:
        try:
            serialized = json.dumps(value)
            if self.redis_client:
                self.redis_client.set(key, serialized, ex=expire_seconds)
            else:
                self.fallback_cache.set(key, serialized, ex=expire_seconds)
        except Exception:
            pass

    def delete(self, key: str) -> None:
        try:
            if self.redis_client:
                self.redis_client.delete(key)
            else:
                self.fallback_cache.delete(key)
        except Exception:
            pass

cache_manager = CacheManager()
