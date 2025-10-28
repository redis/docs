"""Utility functions for cache-aside pattern."""

import json
import time
import gzip
from typing import Any, Optional, Callable, TypeVar, List, Dict

import redis
import msgpack

T = TypeVar('T')


# ============================================================================
# Basic Cache-Aside Functions
# ============================================================================

def get_cached_data(
    redis_client: redis.Redis,
    key: str,
    data_source: Callable,
    ttl: int = 60,
    prefix: str = 'cache:'
) -> Optional[Any]:
    """Retrieve data using cache-aside pattern.
    
    Args:
        redis_client: Redis client instance
        key: Data key
        data_source: Callable that fetches data from source
        ttl: Time-to-live in seconds
        prefix: Cache key prefix
        
    Returns:
        Data from cache or data source
    """
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


# ============================================================================
# Cache Invalidation Functions
# ============================================================================

def invalidate_cache(
    redis_client: redis.Redis,
    key: str,
    prefix: str = 'cache:'
) -> bool:
    """Invalidate a cache entry.
    
    Args:
        redis_client: Redis client instance
        key: Data key to invalidate
        prefix: Cache key prefix
        
    Returns:
        True if key was deleted, False otherwise
    """
    cache_key = f"{prefix}{key}"
    return redis_client.delete(cache_key) > 0


def update_data_with_invalidation(
    redis_client: redis.Redis,
    data_store: Any,
    key: str,
    new_value: Any,
    prefix: str = 'cache:'
) -> bool:
    """Update data and invalidate cache.
    
    Args:
        redis_client: Redis client instance
        data_store: Data store to update
        key: Data key
        new_value: New value
        prefix: Cache key prefix
        
    Returns:
        True if successful
    """
    data_store.update(key, new_value)
    cache_key = f"{prefix}{key}"
    try:
        redis_client.delete(cache_key)
        return True
    except redis.RedisError:
        return False


def invalidate_pattern(
    redis_client: redis.Redis,
    pattern: str
) -> int:
    """Invalidate all keys matching pattern.
    
    Args:
        redis_client: Redis client instance
        pattern: Pattern to match (e.g., 'cache:user:*')
        
    Returns:
        Number of keys deleted
    """
    cursor = 0
    deleted = 0
    
    while True:
        cursor, keys = redis_client.scan(cursor, match=pattern)
        if keys:
            deleted += redis_client.delete(*keys)
        if cursor == 0:
            break
    
    return deleted


# ============================================================================
# TTL Management Functions
# ============================================================================

def set_ttl(
    redis_client: redis.Redis,
    key: str,
    ttl: int,
    prefix: str = 'cache:'
) -> bool:
    """Set TTL on existing cache key.
    
    Args:
        redis_client: Redis client instance
        key: Data key
        ttl: Time-to-live in seconds
        prefix: Cache key prefix
        
    Returns:
        True if TTL was set, False otherwise
    """
    cache_key = f"{prefix}{key}"
    return redis_client.expire(cache_key, ttl) > 0


def get_ttl(
    redis_client: redis.Redis,
    key: str,
    prefix: str = 'cache:'
) -> int:
    """Get remaining TTL in seconds.
    
    Args:
        redis_client: Redis client instance
        key: Data key
        prefix: Cache key prefix
        
    Returns:
        Remaining TTL in seconds (-1 if no TTL, -2 if key doesn't exist)
    """
    cache_key = f"{prefix}{key}"
    return redis_client.ttl(cache_key)


def refresh_ttl(
    redis_client: redis.Redis,
    key: str,
    ttl: int,
    prefix: str = 'cache:'
) -> bool:
    """Refresh TTL for a key.
    
    Args:
        redis_client: Redis client instance
        key: Data key
        ttl: New time-to-live in seconds
        prefix: Cache key prefix
        
    Returns:
        True if TTL was refreshed, False otherwise
    """
    cache_key = f"{prefix}{key}"
    return redis_client.expire(cache_key, ttl) > 0


# ============================================================================
# Serialization Functions
# ============================================================================

def serialize_json(value: Any) -> str:
    """Serialize to JSON.
    
    Args:
        value: Value to serialize
        
    Returns:
        JSON string
    """
    return json.dumps(value)


def deserialize_json(data: str) -> Any:
    """Deserialize from JSON.
    
    Args:
        data: JSON string
        
    Returns:
        Deserialized value
    """
    return json.loads(data)


def serialize_msgpack(value: Any) -> bytes:
    """Serialize to MessagePack.
    
    Args:
        value: Value to serialize
        
    Returns:
        MessagePack bytes
    """
    return msgpack.packb(value)


def deserialize_msgpack(data: bytes) -> Any:
    """Deserialize from MessagePack.
    
    Args:
        data: MessagePack bytes
        
    Returns:
        Deserialized value
    """
    return msgpack.unpackb(data)


def serialize_compressed(value: Any) -> bytes:
    """Serialize and compress.
    
    Args:
        value: Value to serialize
        
    Returns:
        Compressed bytes
    """
    json_data = json.dumps(value).encode('utf-8')
    return gzip.compress(json_data)


def deserialize_compressed(data: bytes) -> Any:
    """Decompress and deserialize.
    
    Args:
        data: Compressed bytes
        
    Returns:
        Deserialized value
    """
    json_data = gzip.decompress(data).decode('utf-8')
    return json.loads(json_data)


# ============================================================================
# Error Handling Functions
# ============================================================================

def get_data_with_fallback(
    redis_client: redis.Redis,
    key: str,
    data_source: Callable,
    ttl: int = 60,
    prefix: str = 'cache:'
) -> Optional[Any]:
    """Get data with fallback to data source on cache error.
    
    Args:
        redis_client: Redis client instance
        key: Data key
        data_source: Callable that fetches data from source
        ttl: Time-to-live in seconds
        prefix: Cache key prefix
        
    Returns:
        Data from cache or data source
    """
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


def retry_operation(
    operation: Callable[[], T],
    max_retries: int = 3,
    backoff_ms: int = 100
) -> Optional[T]:
    """Retry operation with exponential backoff.
    
    Args:
        operation: Callable to retry
        max_retries: Maximum number of retries
        backoff_ms: Initial backoff in milliseconds
        
    Returns:
        Result of operation or None if all retries failed
        
    Raises:
        redis.RedisError: If all retries fail
    """
    for attempt in range(max_retries):
        try:
            return operation()
        except redis.RedisError as e:
            if attempt == max_retries - 1:
                raise
            wait_time = (backoff_ms * (2 ** attempt)) / 1000.0
            time.sleep(wait_time)

