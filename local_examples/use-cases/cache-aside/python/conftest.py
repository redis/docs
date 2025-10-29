"""Pytest configuration and fixtures."""

import pytest
import redis
from unittest.mock import Mock, AsyncMock, MagicMock

from cache_manager import CacheAsideManager, AsyncCacheAsideManager
from mock_data_store import MockDataStore


@pytest.fixture
def redis_mock():
    """Mock Redis client with JSON support."""
    mock = Mock(spec=redis.Redis)
    # Mock the json() method to return a mock JSON interface
    mock.json.return_value = MagicMock()
    return mock


@pytest.fixture
def cache_manager(redis_mock):
    """Cache manager instance."""
    return CacheAsideManager(
        redis_mock,
        ttl=60,
        key_prefix='test:'
    )


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
    """Mock async Redis client with JSON support."""
    mock = AsyncMock(spec=redis.asyncio.Redis)
    # Mock the json() method to return a mock JSON interface with async methods
    json_mock = MagicMock()
    json_mock.get = AsyncMock()
    json_mock.set = AsyncMock()
    mock.json.return_value = json_mock
    mock.delete = AsyncMock()
    mock.expire = AsyncMock()
    return mock


@pytest.fixture
async def async_cache_manager(async_redis_mock):
    """Async cache manager instance."""
    return AsyncCacheAsideManager(
        async_redis_mock,
        ttl=60,
        key_prefix='test:'
    )


@pytest.fixture
async def real_async_redis():
    """Real async Redis connection for integration tests."""
    try:
        r = redis.asyncio.Redis(host='localhost', port=6379, db=15, decode_responses=True)
        await r.ping()
    except (ConnectionRefusedError, OSError):
        pytest.skip("Redis not available")

    await r.flushdb()
    yield r
    await r.flushdb()
    await r.close()

