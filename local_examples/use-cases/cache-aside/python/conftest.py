"""Pytest configuration and fixtures."""

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
    r = redis.Redis(host='localhost', port=6379, db=15, decode_responses=True)
    try:
        r.ping()
    except redis.ConnectionError:
        pytest.skip("Redis not available")
    
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
    try:
        redis_pool = await aioredis.create_redis_pool('redis://localhost', db=15)
    except (ConnectionRefusedError, OSError):
        pytest.skip("Redis not available")
    
    await redis_pool.flushdb()
    yield redis_pool
    await redis_pool.flushdb()
    redis_pool.close()
    await redis_pool.wait_closed()

