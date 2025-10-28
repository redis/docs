---
title: Cache-Aside Pattern Python Specification
description: Complete Python implementation and test specification for the cache-aside tutorial
categories:
  - docs
  - develop
  - use-cases
---

# Cache-Aside Pattern Python Specification

**Document Type:** Python Implementation & Test Specification  
**Target Language:** Python 3.8+  
**Primary Library:** redis-py (redis)  
**Test Framework:** pytest  
**Last Updated:** 2025-10-27

---

## Part 1: Implementation Specification

### 1. Dependencies and Setup

**Required Libraries:**
```
redis>=4.5.0          # Redis client library
```

**Optional Libraries:**
```
msgpack>=1.0.0        # Efficient serialization
python-json-logger>=2.0.0  # Structured logging
aioredis>=2.0.0       # Async Redis support
pytest>=7.0.0         # Testing framework
pytest-cov>=4.0.0     # Coverage reporting
pytest-asyncio>=0.20.0  # Async test support
```

**Installation:**
```bash
pip install redis>=4.5.0
```

**Python Version Support:**
- Minimum: Python 3.8
- Recommended: Python 3.10+
- Tested on: Python 3.8, 3.9, 3.10, 3.11, 3.12

---

### 2. Redis Connection Setup

**Basic Connection:**
```python
import redis

r = redis.Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True
)

try:
    r.ping()
    print("Connected to Redis")
except redis.ConnectionError:
    print("Failed to connect to Redis")
```

**Connection Pool (Production):**
```python
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True,
    max_connections=10
)
r = redis.Redis(connection_pool=pool)
```

**Configuration Class:**
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class CacheConfig:
    """Cache configuration."""
    host: str = 'localhost'
    port: int = 6379
    db: int = 0
    ttl: int = 60
    key_prefix: str = 'cache:'
    socket_timeout: Optional[float] = 5.0
    socket_connect_timeout: Optional[float] = 5.0
    
    def create_redis_client(self) -> redis.Redis:
        """Create Redis client from config."""
        return redis.Redis(
            host=self.host,
            port=self.port,
            db=self.db,
            decode_responses=True,
            socket_timeout=self.socket_timeout,
            socket_connect_timeout=self.socket_connect_timeout
        )
```

---

### 3. Mock Data Source

```python
import time
from typing import Any, Optional

class MockDataStore:
    """Simulates a slow data source."""
    
    def __init__(self, latency_ms: int = 100):
        self.latency_ms = latency_ms
        self.data = {
            'user:1': {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'},
            'user:2': {'id': 2, 'name': 'Bob', 'email': 'bob@example.com'},
            'product:1': {'id': 1, 'name': 'Widget', 'price': 9.99},
            'product:2': {'id': 2, 'name': 'Gadget', 'price': 19.99},
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Fetch data with simulated latency."""
        time.sleep(self.latency_ms / 1000.0)
        return self.data.get(key)
    
    def update(self, key: str, value: Any) -> bool:
        """Update data."""
        time.sleep(self.latency_ms / 1000.0)
        self.data[key] = value
        return True
    
    def delete(self, key: str) -> bool:
        """Delete data."""
        time.sleep(self.latency_ms / 1000.0)
        if key in self.data:
            del self.data[key]
            return True
        return False
```

---

### 4. Core Cache-Aside Implementation

**Basic Function:**
```python
import json
from typing import Any, Optional, Callable

def get_cached_data(
    redis_client: redis.Redis,
    key: str,
    data_source: Callable,
    ttl: int = 60,
    prefix: str = 'cache:'
) -> Optional[Any]:
    """Retrieve data using cache-aside pattern."""
    cache_key = f"{prefix}{key}"
    
    try:
        cached_value = redis_client.get(cache_key)
        if cached_value is not None:
            return json.loads(cached_value)
    except redis.RedisError as e:
        print(f"Cache error: {e}")
    
    value = data_source(key)
    
    if value is not None:
        try:
            redis_client.set(cache_key, json.dumps(value), ex=ttl)
        except redis.RedisError as e:
            print(f"Failed to cache: {e}")
    
    return value
```

**Object-Oriented Implementation:**
```python
import logging

class CacheAsideManager:
    """Manages cache-aside pattern operations."""
    
    def __init__(
        self,
        redis_client: redis.Redis,
        config: CacheConfig,
        logger: Optional[logging.Logger] = None
    ):
        self.redis = redis_client
        self.config = config
        self.logger = logger or logging.getLogger(__name__)
        self.hits = 0
        self.misses = 0
    
    def get(
        self,
        key: str,
        data_source: Callable,
        ttl: Optional[int] = None
    ) -> Optional[Any]:
        """Get data using cache-aside pattern."""
        cache_key = f"{self.config.key_prefix}{key}"
        ttl = ttl or self.config.ttl
        
        try:
            cached_value = self.redis.get(cache_key)
            if cached_value is not None:
                self.hits += 1
                self.logger.debug(f"Cache hit: {key}")
                return json.loads(cached_value)
        except redis.RedisError as e:
            self.logger.error(f"Cache error: {e}")
        
        self.misses += 1
        self.logger.debug(f"Cache miss: {key}")
        value = data_source(key)
        
        if value is not None:
            try:
                self.redis.set(cache_key, json.dumps(value), ex=ttl)
            except redis.RedisError as e:
                self.logger.error(f"Failed to cache: {e}")
        
        return value
    
    def invalidate(self, key: str) -> bool:
        """Invalidate cache entry."""
        cache_key = f"{self.config.key_prefix}{key}"
        try:
            result = self.redis.delete(cache_key)
            self.logger.debug(f"Invalidated: {key}")
            return result > 0
        except redis.RedisError as e:
            self.logger.error(f"Invalidation error: {e}")
            return False
    
    def get_hit_ratio(self) -> float:
        """Calculate cache hit ratio."""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0
```

---

### 5. Cache Invalidation

**Simple Invalidation:**
```python
def invalidate_cache(
    redis_client: redis.Redis,
    key: str,
    prefix: str = 'cache:'
) -> bool:
    """Invalidate a cache entry."""
    cache_key = f"{prefix}{key}"
    return redis_client.delete(cache_key) > 0
```

**Update with Invalidation:**
```python
def update_data_with_invalidation(
    redis_client: redis.Redis,
    data_store: MockDataStore,
    key: str,
    new_value: Any,
    prefix: str = 'cache:'
) -> bool:
    """Update data and invalidate cache."""
    data_store.update(key, new_value)
    cache_key = f"{prefix}{key}"
    try:
        redis_client.delete(cache_key)
        return True
    except redis.RedisError:
        return False
```

**Batch Invalidation:**
```python
def invalidate_pattern(
    redis_client: redis.Redis,
    pattern: str
) -> int:
    """Invalidate all keys matching pattern."""
    cursor = 0
    deleted = 0
    
    while True:
        cursor, keys = redis_client.scan(cursor, match=pattern)
        if keys:
            deleted += redis_client.delete(*keys)
        if cursor == 0:
            break
    
    return deleted
```

---

### 6. TTL Management

```python
def set_ttl(
    redis_client: redis.Redis,
    key: str,
    ttl: int,
    prefix: str = 'cache:'
) -> bool:
    """Set TTL on existing cache key."""
    cache_key = f"{prefix}{key}"
    return redis_client.expire(cache_key, ttl) > 0

def get_ttl(
    redis_client: redis.Redis,
    key: str,
    prefix: str = 'cache:'
) -> int:
    """Get remaining TTL in seconds."""
    cache_key = f"{prefix}{key}"
    return redis_client.ttl(cache_key)

def refresh_ttl(
    redis_client: redis.Redis,
    key: str,
    ttl: int,
    prefix: str = 'cache:'
) -> bool:
    """Refresh TTL for a key."""
    cache_key = f"{prefix}{key}"
    return redis_client.expire(cache_key, ttl) > 0
```

---

### 7. Serialization Strategies

**JSON (Default):**
```python
def serialize_json(value: Any) -> str:
    return json.dumps(value)

def deserialize_json(data: str) -> Any:
    return json.loads(data)
```

**MessagePack (Efficient):**
```python
import msgpack

def serialize_msgpack(value: Any) -> bytes:
    return msgpack.packb(value)

def deserialize_msgpack(data: bytes) -> Any:
    return msgpack.unpackb(data)
```

**Compression:**
```python
import gzip

def serialize_compressed(value: Any) -> bytes:
    json_data = json.dumps(value).encode('utf-8')
    return gzip.compress(json_data)

def deserialize_compressed(data: bytes) -> Any:
    json_data = gzip.decompress(data).decode('utf-8')
    return json.loads(json_data)
```

---

### 8. Error Handling

**Graceful Degradation:**
```python
def get_data_with_fallback(
    redis_client: redis.Redis,
    key: str,
    data_source: Callable,
    ttl: int = 60,
    prefix: str = 'cache:'
) -> Optional[Any]:
    """Get data with fallback to data source on cache error."""
    cache_key = f"{prefix}{key}"
    
    try:
        cached_value = redis_client.get(cache_key)
        if cached_value is not None:
            return json.loads(cached_value)
    except (redis.RedisError, json.JSONDecodeError) as e:
        print(f"Cache error, falling back: {e}")
    
    value = data_source(key)
    
    try:
        redis_client.set(cache_key, json.dumps(value), ex=ttl)
    except redis.RedisError:
        pass
    
    return value
```

**Retry Logic:**
```python
import time
from typing import TypeVar, Callable

T = TypeVar('T')

def retry_operation(
    operation: Callable[[], T],
    max_retries: int = 3,
    backoff_ms: int = 100
) -> Optional[T]:
    """Retry operation with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return operation()
        except redis.RedisError as e:
            if attempt == max_retries - 1:
                raise
            wait_time = (backoff_ms * (2 ** attempt)) / 1000.0
            time.sleep(wait_time)
```

---

### 9. Monitoring and Metrics

```python
from dataclasses import dataclass

@dataclass
class CacheMetrics:
    """Cache performance metrics."""
    hits: int = 0
    misses: int = 0
    errors: int = 0
    total_fetch_time_ms: float = 0.0
    
    @property
    def hit_ratio(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0
    
    @property
    def avg_fetch_time_ms(self) -> float:
        total = self.hits + self.misses
        return self.total_fetch_time_ms / total if total > 0 else 0.0

class InstrumentedCacheManager(CacheAsideManager):
    """Cache manager with metrics collection."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.metrics = CacheMetrics()
    
    def get(self, key: str, data_source: Callable, ttl: Optional[int] = None) -> Optional[Any]:
        """Get with metrics."""
        start_time = time.time()
        
        try:
            result = super().get(key, data_source, ttl)
            self.metrics.total_fetch_time_ms += (time.time() - start_time) * 1000
            return result
        except Exception as e:
            self.metrics.errors += 1
            raise
```

---

### 10. Async/Await Patterns

**Async Redis Client:**
```python
import aioredis
import asyncio

async def create_async_redis():
    """Create async Redis client."""
    redis = await aioredis.create_redis_pool(
        'redis://localhost',
        minsize=5,
        maxsize=10
    )
    return redis
```

**AsyncCacheAsideManager:**
```python
class AsyncCacheAsideManager:
    """Async cache-aside manager for asyncio applications."""

    def __init__(
        self,
        redis_client: aioredis.Redis,
        config: CacheConfig,
        logger: Optional[logging.Logger] = None
    ):
        self.redis = redis_client
        self.config = config
        self.logger = logger or logging.getLogger(__name__)
        self.hits = 0
        self.misses = 0

    async def get(
        self,
        key: str,
        data_source_coro: Callable,
        ttl: Optional[int] = None
    ) -> Optional[Any]:
        """Get data asynchronously using cache-aside pattern."""
        cache_key = f"{self.config.key_prefix}{key}"
        ttl = ttl or self.config.ttl

        try:
            cached_value = await self.redis.get(cache_key)
            if cached_value is not None:
                self.hits += 1
                self.logger.debug(f"Cache hit: {key}")
                return json.loads(cached_value)
        except aioredis.RedisError as e:
            self.logger.error(f"Cache error: {e}")

        self.misses += 1
        self.logger.debug(f"Cache miss: {key}")
        value = await data_source_coro(key)

        if value is not None:
            try:
                await self.redis.set(
                    cache_key,
                    json.dumps(value),
                    expire=ttl
                )
            except aioredis.RedisError as e:
                self.logger.error(f"Failed to cache: {e}")

        return value

    async def invalidate(self, key: str) -> bool:
        """Invalidate cache entry asynchronously."""
        cache_key = f"{self.config.key_prefix}{key}"
        try:
            result = await self.redis.delete(cache_key)
            self.logger.debug(f"Invalidated: {key}")
            return result > 0
        except aioredis.RedisError as e:
            self.logger.error(f"Invalidation error: {e}")
            return False
```

**FastAPI Integration:**
```python
from fastapi import FastAPI

app = FastAPI()
cache_manager: Optional[AsyncCacheAsideManager] = None

@app.on_event("startup")
async def startup():
    """Initialize cache manager on startup."""
    global cache_manager
    redis = await aioredis.create_redis_pool('redis://localhost')
    config = CacheConfig()
    cache_manager = AsyncCacheAsideManager(redis, config)

@app.on_event("shutdown")
async def shutdown():
    """Close cache manager on shutdown."""
    if cache_manager:
        cache_manager.redis.close()
        await cache_manager.redis.wait_closed()

async def get_user_from_db(user_id: int):
    """Simulate async database query."""
    await asyncio.sleep(0.1)
    return {"id": user_id, "name": f"User {user_id}"}

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    """Get user with caching."""
    return await cache_manager.get(
        f"user:{user_id}",
        lambda k: get_user_from_db(user_id)
    )
```

**Async Batch Operations:**
```python
async def get_multiple_cached(
    redis_client: aioredis.Redis,
    keys: List[str],
    data_source_coro: Callable
) -> Dict[str, Any]:
    """Get multiple items efficiently."""
    cache_keys = [f"cache:{k}" for k in keys]
    cached_values = await redis_client.mget(*cache_keys)
    
    results = {}
    missing_keys = []
    
    for key, cached_value in zip(keys, cached_values):
        if cached_value:
            results[key] = json.loads(cached_value)
        else:
            missing_keys.append(key)
    
    if missing_keys:
        missing_values = await asyncio.gather(
            *[data_source_coro(k) for k in missing_keys]
        )
        
        for key, value in zip(missing_keys, missing_values):
            results[key] = value
            await redis_client.set(
                f"cache:{key}",
                json.dumps(value),
                expire=300
            )
    
    return results
```

---

### 11. Complete Example

```python
# cache_aside_example.py

import redis
import logging
from cache_config import CacheConfig
from cache_manager import CacheAsideManager
from mock_data_store import MockDataStore

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

config = CacheConfig()
redis_client = config.create_redis_client()
data_store = MockDataStore(latency_ms=100)
cache_manager = CacheAsideManager(redis_client, config, logger)

# Usage
user_data = cache_manager.get('user:1', data_store.get)
print(f"User: {user_data}")
print(f"Hit ratio: {cache_manager.get_hit_ratio():.2%}")
```

---

## Part 2: Test Specification

### 1. Test Framework Setup

**Dependencies:**
```
pytest>=7.0.0
pytest-cov>=4.0.0
pytest-mock>=3.10.0
pytest-timeout>=2.1.0
pytest-asyncio>=0.20.0
redis>=4.5.0
```

**pytest.ini Configuration:**
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --cov=cache_aside --cov-report=html --timeout=10
asyncio_mode = auto
```

**Test Fixtures (conftest.py):**
```python
import pytest
import redis
from unittest.mock import Mock, AsyncMock
import aioredis
from cache_config import CacheConfig
from cache_manager import CacheAsideManager, AsyncCacheAsideManager
from mock_data_store import MockDataStore

@pytest.fixture
def redis_mock():
    """Mock Redis client."""
    return Mock(spec=redis.Redis)

@pytest.fixture
def cache_config():
    """Cache configuration."""
    return CacheConfig(ttl=60, key_prefix='test:')

@pytest.fixture
def cache_manager(redis_mock, cache_config):
    """Cache manager instance."""
    return CacheAsideManager(redis_mock, cache_config)

@pytest.fixture
def data_store():
    """Mock data store."""
    return MockDataStore(latency_ms=10)

@pytest.fixture
def real_redis():
    """Real Redis connection for integration tests."""
    r = redis.Redis(host='localhost', port=6379, db=15)
    r.flushdb()
    yield r
    r.flushdb()

@pytest.fixture
async def async_redis_mock():
    """Mock async Redis client."""
    return AsyncMock(spec=aioredis.Redis)

@pytest.fixture
async def async_cache_manager(async_redis_mock):
    """Async cache manager instance."""
    config = CacheConfig(ttl=60, key_prefix='test:')
    return AsyncCacheAsideManager(async_redis_mock, config)

@pytest.fixture
async def real_async_redis():
    """Real async Redis connection for integration tests."""
    redis = await aioredis.create_redis_pool('redis://localhost', db=15)
    await redis.flushdb()
    yield redis
    redis.close()
    await redis.wait_closed()
```

---

### 2. Unit Tests: Basic Cache-Aside Logic

**Test Cache Hit:**
```python
def test_cache_hit_returns_cached_value(cache_manager, redis_mock):
    """Cache hit should return cached value without calling data source."""
    redis_mock.get.return_value = '{"id": 1, "name": "Alice"}'
    data_source = Mock()
    
    result = cache_manager.get('user:1', data_source)
    
    assert result == {'id': 1, 'name': 'Alice'}
    assert cache_manager.hits == 1
    assert cache_manager.misses == 0
    data_source.assert_not_called()
```

**Test Cache Miss:**
```python
def test_cache_miss_fetches_from_source(cache_manager, redis_mock):
    """Cache miss should fetch from data source and cache result."""
    redis_mock.get.return_value = None
    data_source = Mock(return_value={'id': 1, 'name': 'Alice'})
    
    result = cache_manager.get('user:1', data_source)
    
    assert result == {'id': 1, 'name': 'Alice'}
    assert cache_manager.misses == 1
    assert cache_manager.hits == 0
    data_source.assert_called_once_with('user:1')
    redis_mock.set.assert_called_once()
```

**Test Cache Key Prefix:**
```python
def test_cache_key_uses_prefix(cache_manager, redis_mock):
    """Cache key should include configured prefix."""
    redis_mock.get.return_value = None
    data_source = Mock(return_value={'id': 1})
    
    cache_manager.get('user:1', data_source)
    
    redis_mock.set.assert_called_once()
    call_args = redis_mock.set.call_args
    assert call_args[0][0] == 'test:user:1'
```

**Test TTL Configuration:**
```python
def test_ttl_applied_to_cached_value(cache_manager, redis_mock):
    """Cached value should be stored with configured TTL."""
    redis_mock.get.return_value = None
    data_source = Mock(return_value={'id': 1})
    
    cache_manager.get('user:1', data_source, ttl=120)
    
    redis_mock.set.assert_called_once()
    call_args = redis_mock.set.call_args
    assert call_args[1]['ex'] == 120
```

**Test Null Value Handling:**
```python
def test_null_value_from_source_not_cached(cache_manager, redis_mock):
    """Null values from data source should not be cached."""
    redis_mock.get.return_value = None
    data_source = Mock(return_value=None)
    
    result = cache_manager.get('user:999', data_source)
    
    assert result is None
    redis_mock.set.assert_not_called()
```

---

### 3. Unit Tests: Cache Invalidation

**Test Simple Invalidation:**
```python
def test_invalidate_deletes_cache_key(cache_manager, redis_mock):
    """Invalidation should delete cache key."""
    redis_mock.delete.return_value = 1
    
    result = cache_manager.invalidate('user:1')
    
    assert result is True
    redis_mock.delete.assert_called_once_with('test:user:1')
```

**Test Invalidation of Non-Existent Key:**
```python
def test_invalidate_nonexistent_key_returns_false(cache_manager, redis_mock):
    """Invalidating non-existent key should return False."""
    redis_mock.delete.return_value = 0
    
    result = cache_manager.invalidate('user:999')
    
    assert result is False
```

**Test Batch Invalidation:**
```python
def test_batch_invalidation_pattern(redis_mock):
    """Batch invalidation should delete all matching keys."""
    redis_mock.scan.side_effect = [(0, ['test:user:1', 'test:user:2'])]
    redis_mock.delete.return_value = 2
    
    from cache_aside import invalidate_pattern
    deleted = invalidate_pattern(redis_mock, 'test:user:*')
    
    assert deleted == 2
    redis_mock.delete.assert_called_once()
```

---

### 4. Unit Tests: Error Handling

**Test Redis Connection Error on Get:**
```python
def test_redis_error_on_get_falls_back_to_source(cache_manager, redis_mock):
    """Redis error on get should fall back to data source."""
    redis_mock.get.side_effect = redis.ConnectionError()
    data_source = Mock(return_value={'id': 1})
    
    result = cache_manager.get('user:1', data_source)
    
    assert result == {'id': 1}
    data_source.assert_called_once()
```

**Test Redis Connection Error on Set:**
```python
def test_redis_error_on_set_still_returns_value(cache_manager, redis_mock):
    """Redis error on set should not prevent returning value."""
    redis_mock.get.return_value = None
    redis_mock.set.side_effect = redis.ConnectionError()
    data_source = Mock(return_value={'id': 1})
    
    result = cache_manager.get('user:1', data_source)
    
    assert result == {'id': 1}
```

**Test JSON Deserialization Error:**
```python
def test_invalid_json_in_cache_falls_back_to_source(cache_manager, redis_mock):
    """Invalid JSON in cache should fall back to data source."""
    redis_mock.get.return_value = 'invalid json'
    data_source = Mock(return_value={'id': 1})
    
    result = cache_manager.get('user:1', data_source)
    
    assert result == {'id': 1}
    data_source.assert_called_once()
```

---

### 5. Unit Tests: TTL Management

**Test Get TTL:**
```python
def test_get_ttl_returns_remaining_seconds(redis_mock):
    """Get TTL should return remaining seconds."""
    redis_mock.ttl.return_value = 45
    
    from cache_aside import get_ttl
    ttl = get_ttl(redis_mock, 'user:1')
    
    assert ttl == 45
```

**Test Set TTL on Existing Key:**
```python
def test_set_ttl_on_existing_key(redis_mock):
    """Set TTL should update expiration on existing key."""
    redis_mock.expire.return_value = 1
    
    from cache_aside import set_ttl
    result = set_ttl(redis_mock, 'user:1', 120)
    
    assert result is True
    redis_mock.expire.assert_called_once_with('test:user:1', 120)
```

**Test Refresh TTL:**
```python
def test_refresh_ttl_extends_expiration(redis_mock):
    """Refresh TTL should extend key expiration."""
    redis_mock.expire.return_value = 1
    
    from cache_aside import refresh_ttl
    result = refresh_ttl(redis_mock, 'user:1', 300)
    
    assert result is True
```

---

### 6. Unit Tests: Serialization

**Test JSON Serialization:**
```python
def test_json_serialization_roundtrip():
    """JSON serialization should preserve data."""
    from cache_aside import serialize_json, deserialize_json
    
    original = {'id': 1, 'name': 'Alice', 'tags': ['admin', 'user']}
    serialized = serialize_json(original)
    deserialized = deserialize_json(serialized)
    
    assert deserialized == original
```

**Test Serialization of Complex Types:**
```python
def test_serialization_with_nested_objects():
    """Serialization should handle nested objects."""
    from cache_aside import serialize_json, deserialize_json
    
    original = {
        'user': {'id': 1, 'name': 'Alice'},
        'posts': [{'id': 1, 'title': 'Post 1'}]
    }
    serialized = serialize_json(original)
    deserialized = deserialize_json(serialized)
    
    assert deserialized == original
```

---

### 7. Integration Tests: Cache Stampede Prevention

**Test Cache Stampede Scenario:**
```python
def test_cache_stampede_with_lock(real_redis):
    """Multiple concurrent requests should not cause stampede."""
    import threading
    import time
    
    call_count = 0
    lock = threading.Lock()
    
    def slow_data_source(key):
        nonlocal call_count
        with lock:
            call_count += 1
        time.sleep(0.1)
        return {'id': 1}
    
    config = CacheConfig()
    manager = CacheAsideManager(real_redis, config)
    
    threads = []
    for _ in range(5):
        t = threading.Thread(
            target=manager.get,
            args=('user:1', slow_data_source)
        )
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    
    assert call_count < 5
```

---

### 8. Integration Tests: Invalidation Consistency

**Test Update and Invalidation:**
```python
def test_update_invalidates_cache(real_redis):
    """Update should invalidate cache."""
    config = CacheConfig()
    manager = CacheAsideManager(real_redis, config)
    data_store = MockDataStore()
    
    value1 = manager.get('user:1', data_store.get)
    assert value1['name'] == 'Alice'
    
    data_store.update('user:1', {'id': 1, 'name': 'Alice Updated'})
    manager.invalidate('user:1')
    
    value2 = manager.get('user:1', data_store.get)
    assert value2['name'] == 'Alice Updated'
```

---

### 9. Integration Tests: TTL Expiration

**Test TTL Expiration:**
```python
def test_ttl_expiration(real_redis):
    """Cached value should expire after TTL."""
    import time
    
    config = CacheConfig(ttl=1)
    manager = CacheAsideManager(real_redis, config)
    data_store = MockDataStore()
    
    value1 = manager.get('user:1', data_store, ttl=1)
    assert real_redis.get('test:user:1') is not None
    
    time.sleep(1.5)
    assert real_redis.get('test:user:1') is None
```

---

### 10. Edge Case Tests

**Test Empty String Value:**
```python
def test_empty_string_value_cached(cache_manager, redis_mock):
    """Empty string should be cached (not treated as null)."""
    redis_mock.get.return_value = None
    data_source = Mock(return_value='')
    
    result = cache_manager.get('key:1', data_source)
    
    assert result == ''
    redis_mock.set.assert_called_once()
```

**Test Zero Value:**
```python
def test_zero_value_cached(cache_manager, redis_mock):
    """Zero should be cached (not treated as null)."""
    redis_mock.get.return_value = None
    data_source = Mock(return_value=0)
    
    result = cache_manager.get('key:1', data_source)
    
    assert result == 0
    redis_mock.set.assert_called_once()
```

**Test False Value:**
```python
def test_false_value_cached(cache_manager, redis_mock):
    """False should be cached (not treated as null)."""
    redis_mock.get.return_value = None
    data_source = Mock(return_value=False)
    
    result = cache_manager.get('key:1', data_source)
    
    assert result is False
    redis_mock.set.assert_called_once()
```

**Test Large Value:**
```python
def test_large_value_cached(cache_manager, redis_mock):
    """Large values should be cached."""
    large_data = {'data': 'x' * 1000000}
    redis_mock.get.return_value = None
    data_source = Mock(return_value=large_data)
    
    result = cache_manager.get('key:1', data_source)
    
    assert result == large_data
    redis_mock.set.assert_called_once()
```

---

### 11. Performance Tests

**Test Cache Hit Performance:**
```python
def test_cache_hit_faster_than_miss(real_redis):
    """Cache hit should be significantly faster than miss."""
    import time
    
    config = CacheConfig()
    manager = CacheAsideManager(real_redis, config)
    data_store = MockDataStore(latency_ms=100)
    
    start = time.time()
    manager.get('user:1', data_store.get)
    miss_time = time.time() - start
    
    start = time.time()
    manager.get('user:1', data_store.get)
    hit_time = time.time() - start
    
    assert hit_time < miss_time / 10
```

**Test Hit Ratio Calculation:**
```python
def test_hit_ratio_calculation(cache_manager):
    """Hit ratio should be calculated correctly."""
    cache_manager.hits = 80
    cache_manager.misses = 20
    
    assert cache_manager.get_hit_ratio() == 0.8
```

---

### 12. Async Tests

**Async Unit Tests:**
```python
@pytest.mark.asyncio
async def test_async_cache_hit(async_cache_manager, async_redis_mock):
    """Test async cache hit."""
    async_redis_mock.get.return_value = '{"id": 1, "name": "Alice"}'
    
    async def data_source(key):
        return {"id": 1, "name": "Alice"}
    
    result = await async_cache_manager.get('user:1', data_source)
    
    assert result == {'id': 1, 'name': 'Alice'}
    assert async_cache_manager.hits == 1
    assert async_cache_manager.misses == 0

@pytest.mark.asyncio
async def test_async_cache_miss(async_cache_manager, async_redis_mock):
    """Test async cache miss."""
    async_redis_mock.get.return_value = None
    
    async def data_source(key):
        return {"id": 1, "name": "Alice"}
    
    result = await async_cache_manager.get('user:1', data_source)
    
    assert result == {'id': 1, 'name': 'Alice'}
    assert async_cache_manager.misses == 1
    assert async_cache_manager.hits == 0
    async_redis_mock.set.assert_called_once()

@pytest.mark.asyncio
async def test_async_invalidate(async_cache_manager, async_redis_mock):
    """Test async cache invalidation."""
    async_redis_mock.delete.return_value = 1
    
    result = await async_cache_manager.invalidate('user:1')
    
    assert result is True
    async_redis_mock.delete.assert_called_once_with('test:user:1')

@pytest.mark.asyncio
async def test_async_error_handling(async_cache_manager, async_redis_mock):
    """Test async error handling."""
    async_redis_mock.get.side_effect = aioredis.RedisError()
    
    async def data_source(key):
        return {"id": 1}
    
    result = await async_cache_manager.get('user:1', data_source)
    
    assert result == {"id": 1}
```

**Async Integration Tests:**
```python
@pytest.mark.asyncio
async def test_async_cache_with_real_redis(real_async_redis):
    """Test async cache with real Redis."""
    config = CacheConfig(ttl=60, key_prefix='test:')
    manager = AsyncCacheAsideManager(real_async_redis, config)
    
    call_count = 0
    
    async def data_source(key):
        nonlocal call_count
        call_count += 1
        await asyncio.sleep(0.01)
        return {"id": 1, "name": "Alice"}
    
    result1 = await manager.get('user:1', data_source)
    assert result1 == {"id": 1, "name": "Alice"}
    assert call_count == 1
    
    result2 = await manager.get('user:1', data_source)
    assert result2 == {"id": 1, "name": "Alice"}
    assert call_count == 1

@pytest.mark.asyncio
async def test_async_concurrent_requests(real_async_redis):
    """Test async concurrent requests."""
    config = CacheConfig(ttl=60, key_prefix='test:')
    manager = AsyncCacheAsideManager(real_async_redis, config)
    
    call_count = 0
    
    async def data_source(key):
        nonlocal call_count
        call_count += 1
        await asyncio.sleep(0.1)
        return {"id": 1}
    
    results = await asyncio.gather(
        manager.get('user:1', data_source),
        manager.get('user:1', data_source),
        manager.get('user:1', data_source),
    )
    
    assert all(r == {"id": 1} for r in results)
    assert 1 <= call_count <= 3
```

---

### 13. Test Coverage Requirements

- **Minimum Coverage:** 85%
- **Critical Paths:** 100%
  - Cache hit/miss logic
  - Invalidation logic
  - Error handling
  - TTL management

**Coverage Targets by Module:**
- `cache_manager.py`: 95%
- `cache_aside.py`: 90%
- `serialization.py`: 85%
- `error_handling.py`: 95%

---

### 14. Test Execution

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=cache_aside --cov-report=html

# Run specific test class
pytest tests/test_cache_manager.py::TestCacheAsideManager

# Run integration tests only
pytest -m integration

# Run with verbose output
pytest -v --tb=short
```

---

### 15. Continuous Integration

**GitHub Actions Example:**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:latest
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install -r requirements-test.txt
      - run: pytest --cov
```

---

### 16. Test Maintenance

- Review test coverage monthly
- Update tests when code changes
- Remove obsolete tests
- Add tests for new features
- Establish baseline performance metrics
- Monitor for regressions
- Update thresholds as needed


