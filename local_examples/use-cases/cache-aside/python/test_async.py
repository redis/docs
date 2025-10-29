"""Async tests for cache-aside pattern."""

import pytest
import asyncio

from cache_manager import AsyncCacheAsideManager


@pytest.mark.asyncio
class TestAsyncCacheAsideManager:
    """Tests for AsyncCacheAsideManager."""

    async def test_async_cache_hit(self, async_cache_manager, async_redis_mock):
        """Test async cache hit using Redis JSON."""
        async_redis_mock.json().get.return_value = {'id': 1, 'name': 'Alice'}

        async def data_source(key):
            return {"id": 1, "name": "Alice"}

        result = await async_cache_manager.get('user:1', data_source)

        assert result == {'id': 1, 'name': 'Alice'}
        assert async_cache_manager.hits == 1
        assert async_cache_manager.misses == 0

    async def test_async_cache_miss(self, async_cache_manager, async_redis_mock):
        """Test async cache miss using Redis JSON."""
        async_redis_mock.json().get.return_value = None

        async def data_source(key):
            return {"id": 1, "name": "Alice"}

        result = await async_cache_manager.get('user:1', data_source)

        assert result == {'id': 1, 'name': 'Alice'}
        assert async_cache_manager.misses == 1
        assert async_cache_manager.hits == 0
        async_redis_mock.json().set.assert_called_once()

    async def test_async_invalidate(self, async_cache_manager, async_redis_mock):
        """Test async cache invalidation."""
        async_redis_mock.delete.return_value = 1

        result = await async_cache_manager.invalidate('user:1')

        assert result is True
        async_redis_mock.delete.assert_called_once_with('test:user:1')

    async def test_async_error_handling(self, async_cache_manager, async_redis_mock):
        """Test async error handling."""
        import redis
        async_redis_mock.json().get.side_effect = redis.RedisError()

        async def data_source(key):
            return {"id": 1}

        result = await async_cache_manager.get('user:1', data_source)

        assert result == {"id": 1}
    
    async def test_async_null_value(self, async_cache_manager, async_redis_mock):
        """Test async null value handling."""
        async_redis_mock.json().get.return_value = None

        async def data_source(key):
            return None

        result = await async_cache_manager.get('missing:1', data_source)

        assert result is None
        async_redis_mock.json().set.assert_not_called()

    async def test_async_ttl_override(self, async_cache_manager, async_redis_mock):
        """Test async TTL override using Redis JSON."""
        async_redis_mock.json().get.return_value = None

        async def data_source(key):
            return {"id": 1}

        await async_cache_manager.get('user:1', data_source, ttl=120)

        async_redis_mock.expire.assert_called_once_with('test:user:1', 120)


@pytest.mark.asyncio
class TestAsyncIntegration:
    """Async integration tests with real Redis."""

    async def test_async_cache_with_real_redis(self, real_async_redis):
        """Test async cache with real Redis using Redis JSON."""
        manager = AsyncCacheAsideManager(real_async_redis, ttl=60, key_prefix='test:')

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

    async def test_async_concurrent_requests(self, real_async_redis):
        """Test async concurrent requests."""
        manager = AsyncCacheAsideManager(real_async_redis, ttl=60, key_prefix='test:')
        
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

    async def test_async_invalidation(self, real_async_redis):
        """Test async cache invalidation using Redis JSON."""
        manager = AsyncCacheAsideManager(real_async_redis, ttl=60, key_prefix='test:')

        async def data_source(key):
            return {"id": 1, "name": "Alice"}

        # Cache value
        result1 = await manager.get('user:1', data_source)
        assert result1['name'] == 'Alice'

        # Invalidate
        await manager.invalidate('user:1')

        # Verify cache is cleared
        cached = await real_async_redis.json().get('test:user:1')
        assert cached is None

    async def test_async_multiple_keys(self, real_async_redis):
        """Test async operations with multiple keys using Redis JSON."""
        manager = AsyncCacheAsideManager(real_async_redis, ttl=60, key_prefix='test:')

        async def data_source(key):
            await asyncio.sleep(0.01)
            return {"key": key}

        keys = ['user:1', 'user:2', 'product:1']

        # Fetch all keys
        results = await asyncio.gather(
            *[manager.get(key, data_source) for key in keys]
        )

        assert len(results) == 3
        assert all(r is not None for r in results)

    async def test_async_error_recovery(self, real_async_redis):
        """Test async error recovery using Redis JSON."""
        manager = AsyncCacheAsideManager(real_async_redis, ttl=60, key_prefix='test:')

        call_count = 0

        async def data_source(key):
            nonlocal call_count
            call_count += 1
            return {"id": 1}

        # Should work normally
        result = await manager.get('user:1', data_source)
        assert result == {"id": 1}
        assert call_count == 1

