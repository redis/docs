"""Integration tests for cache-aside pattern."""

import pytest
import time
import threading

from cache_manager import CacheAsideManager
from mock_data_store import MockDataStore
import cache_aside


@pytest.mark.integration
class TestCacheAsideIntegration:
    """Integration tests using real Redis."""

    def test_basic_cache_aside_flow(self, real_redis):
        """Test basic cache-aside flow with real Redis using Redis JSON."""
        manager = CacheAsideManager(real_redis, ttl=60, key_prefix='test:')
        data_store = MockDataStore(latency_ms=10)

        # First fetch (cache miss)
        value1 = manager.get('user:1', data_store.get)
        assert value1 == {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'}
        assert manager.misses == 1
        assert manager.hits == 0

        # Second fetch (cache hit)
        value2 = manager.get('user:1', data_store.get)
        assert value2 == value1
        assert manager.misses == 1
        assert manager.hits == 1

    def test_update_and_invalidation(self, real_redis):
        """Test update with cache invalidation using Redis JSON."""
        manager = CacheAsideManager(real_redis, ttl=60, key_prefix='test:')
        data_store = MockDataStore(latency_ms=10)

        # Initial fetch
        value1 = manager.get('user:1', data_store.get)
        assert value1['name'] == 'Alice'

        # Update data store
        data_store.update('user:1', {'id': 1, 'name': 'Alice Updated', 'email': 'alice@example.com'})

        # Invalidate cache
        manager.invalidate('user:1')

        # Fetch updated data
        value2 = manager.get('user:1', data_store.get)
        assert value2['name'] == 'Alice Updated'

    def test_ttl_expiration(self, real_redis):
        """Test TTL expiration using Redis JSON."""
        manager = CacheAsideManager(real_redis, ttl=1, key_prefix='test:')
        data_store = MockDataStore(latency_ms=10)

        # Fetch and cache
        value1 = manager.get('user:1', data_store.get, ttl=1)
        assert real_redis.json().get('test:user:1') is not None

        # Wait for expiration
        time.sleep(1.5)
        assert real_redis.json().get('test:user:1') is None

    def test_cache_stampede_prevention(self, real_redis):
        """Test cache stampede scenario with sequential access."""
        manager = CacheAsideManager(real_redis, ttl=60, key_prefix='test:')

        call_count = 0
        lock = threading.Lock()

        def slow_data_source(key):
            nonlocal call_count
            with lock:
                call_count += 1
            time.sleep(0.05)
            return {'id': 1}

        # First access - cache miss
        manager.get('user:1', slow_data_source)
        assert call_count == 1

        # Subsequent accesses should hit cache
        for _ in range(4):
            manager.get('user:1', slow_data_source)

        # Should only call data source once
        assert call_count == 1

    def test_pattern_invalidation(self, real_redis):
        """Test pattern-based invalidation using Redis JSON."""
        manager = CacheAsideManager(real_redis, ttl=60, key_prefix='test:')
        data_store = MockDataStore(latency_ms=10)

        # Cache multiple keys
        manager.get('user:1', data_store.get)
        manager.get('user:2', data_store.get)
        manager.get('product:1', data_store.get)

        # Invalidate all user keys
        deleted = cache_aside.invalidate_pattern(real_redis, 'test:user:*')
        assert deleted == 2

        # Verify product key still exists
        assert real_redis.json().get('test:product:1') is not None
    
    def test_multiple_keys_performance(self, real_redis):
        """Test performance with multiple keys using Redis JSON."""
        manager = CacheAsideManager(real_redis, ttl=60, key_prefix='test:')
        data_store = MockDataStore(latency_ms=50)

        keys = ['user:1', 'user:2', 'product:1', 'product:2']

        # First fetch (all misses)
        start = time.time()
        for key in keys:
            manager.get(key, data_store.get)
        first_time = time.time() - start

        # Second fetch (all hits)
        start = time.time()
        for key in keys:
            manager.get(key, data_store.get)
        second_time = time.time() - start

        # Cache should be significantly faster
        assert second_time < first_time / 5

    def test_null_value_handling(self, real_redis):
        """Test handling of null values using Redis JSON."""
        manager = CacheAsideManager(real_redis, ttl=60, key_prefix='test:')

        def data_source(key):
            return None

        # First call
        result1 = manager.get('missing:1', data_source)
        assert result1 is None

        # Second call should also return None (not cached)
        result2 = manager.get('missing:1', data_source)
        assert result2 is None

        # Both should be misses
        assert manager.misses == 2

    def test_error_handling_with_real_redis(self, real_redis):
        """Test error handling with real Redis using Redis JSON."""
        manager = CacheAsideManager(real_redis, ttl=60, key_prefix='test:')

        def data_source(key):
            return {'id': 1, 'name': 'Test'}

        # Should work normally
        result = manager.get('test:1', data_source)
        assert result == {'id': 1, 'name': 'Test'}

    def test_serialization_with_real_redis(self, real_redis):
        """Test serialization with real Redis using Redis JSON."""
        manager = CacheAsideManager(real_redis, ttl=60, key_prefix='test:')

        complex_data = {
            'id': 1,
            'name': 'Test',
            'nested': {'key': 'value'},
            'list': [1, 2, 3],
            'bool': True,
            'null': None
        }

        def data_source(key):
            return complex_data

        result = manager.get('complex:1', data_source)
        assert result == complex_data

        # Verify it's cached
        result2 = manager.get('complex:1', data_source)
        assert result2 == complex_data
        assert manager.hits == 1

