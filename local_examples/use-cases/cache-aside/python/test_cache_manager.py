"""Unit tests for cache manager."""

import pytest
import redis
from unittest.mock import Mock

from cache_manager import CacheAsideManager


class TestCacheAsideManager:
    """Tests for CacheAsideManager."""
    
    def test_cache_hit_returns_cached_value(self, cache_manager, redis_mock):
        """Cache hit should return cached value without calling data source."""
        redis_mock.get.return_value = '{"id": 1, "name": "Alice"}'
        data_source = Mock()
        
        result = cache_manager.get('user:1', data_source)
        
        assert result == {'id': 1, 'name': 'Alice'}
        assert cache_manager.hits == 1
        assert cache_manager.misses == 0
        data_source.assert_not_called()
    
    def test_cache_miss_fetches_from_source(self, cache_manager, redis_mock):
        """Cache miss should fetch from data source and cache result."""
        redis_mock.get.return_value = None
        data_source = Mock(return_value={'id': 1, 'name': 'Alice'})
        
        result = cache_manager.get('user:1', data_source)
        
        assert result == {'id': 1, 'name': 'Alice'}
        assert cache_manager.misses == 1
        assert cache_manager.hits == 0
        data_source.assert_called_once_with('user:1')
        redis_mock.set.assert_called_once()
    
    def test_cache_key_uses_prefix(self, cache_manager, redis_mock):
        """Cache key should include configured prefix."""
        redis_mock.get.return_value = None
        data_source = Mock(return_value={'id': 1})
        
        cache_manager.get('user:1', data_source)
        
        redis_mock.set.assert_called_once()
        call_args = redis_mock.set.call_args
        assert call_args[0][0] == 'test:user:1'
    
    def test_ttl_applied_to_cached_value(self, cache_manager, redis_mock):
        """Cached value should be stored with configured TTL."""
        redis_mock.get.return_value = None
        data_source = Mock(return_value={'id': 1})
        
        cache_manager.get('user:1', data_source, ttl=120)
        
        redis_mock.set.assert_called_once()
        call_args = redis_mock.set.call_args
        assert call_args[1]['ex'] == 120
    
    def test_null_value_from_source_not_cached(self, cache_manager, redis_mock):
        """Null values from data source should not be cached."""
        redis_mock.get.return_value = None
        data_source = Mock(return_value=None)
        
        result = cache_manager.get('user:999', data_source)
        
        assert result is None
        redis_mock.set.assert_not_called()
    
    def test_invalidate_deletes_cache_key(self, cache_manager, redis_mock):
        """Invalidation should delete cache key."""
        redis_mock.delete.return_value = 1
        
        result = cache_manager.invalidate('user:1')
        
        assert result is True
        redis_mock.delete.assert_called_once_with('test:user:1')
    
    def test_invalidate_nonexistent_key_returns_false(self, cache_manager, redis_mock):
        """Invalidating non-existent key should return False."""
        redis_mock.delete.return_value = 0
        
        result = cache_manager.invalidate('user:999')
        
        assert result is False
    
    def test_redis_error_on_get_falls_back_to_source(self, cache_manager, redis_mock):
        """Redis error on get should fall back to data source."""
        redis_mock.get.side_effect = redis.ConnectionError()
        data_source = Mock(return_value={'id': 1})
        
        result = cache_manager.get('user:1', data_source)
        
        assert result == {'id': 1}
        data_source.assert_called_once()
    
    def test_redis_error_on_set_still_returns_value(self, cache_manager, redis_mock):
        """Redis error on set should not prevent returning value."""
        redis_mock.get.return_value = None
        redis_mock.set.side_effect = redis.ConnectionError()
        data_source = Mock(return_value={'id': 1})
        
        result = cache_manager.get('user:1', data_source)
        
        assert result == {'id': 1}
    
    def test_invalid_json_in_cache_falls_back_to_source(self, cache_manager, redis_mock):
        """Invalid JSON in cache should fall back to data source."""
        redis_mock.get.return_value = 'invalid json'
        data_source = Mock(return_value={'id': 1})
        
        result = cache_manager.get('user:1', data_source)
        
        assert result == {'id': 1}
        data_source.assert_called_once()
    
    def test_empty_string_value_cached(self, cache_manager, redis_mock):
        """Empty string should be cached (not treated as null)."""
        redis_mock.get.return_value = None
        data_source = Mock(return_value='')
        
        result = cache_manager.get('key:1', data_source)
        
        assert result == ''
        redis_mock.set.assert_called_once()
    
    def test_zero_value_cached(self, cache_manager, redis_mock):
        """Zero should be cached (not treated as null)."""
        redis_mock.get.return_value = None
        data_source = Mock(return_value=0)
        
        result = cache_manager.get('key:1', data_source)
        
        assert result == 0
        redis_mock.set.assert_called_once()
    
    def test_false_value_cached(self, cache_manager, redis_mock):
        """False should be cached (not treated as null)."""
        redis_mock.get.return_value = None
        data_source = Mock(return_value=False)
        
        result = cache_manager.get('key:1', data_source)
        
        assert result is False
        redis_mock.set.assert_called_once()
    
    def test_hit_ratio_calculation(self, cache_manager):
        """Hit ratio should be calculated correctly."""
        cache_manager.hits = 80
        cache_manager.misses = 20
        
        assert cache_manager.get_hit_ratio() == 0.8
    
    def test_hit_ratio_with_no_requests(self, cache_manager):
        """Hit ratio should be 0 with no requests."""
        assert cache_manager.get_hit_ratio() == 0.0
    
    def test_hit_ratio_all_hits(self, cache_manager):
        """Hit ratio should be 1.0 with all hits."""
        cache_manager.hits = 100
        cache_manager.misses = 0
        
        assert cache_manager.get_hit_ratio() == 1.0
    
    def test_hit_ratio_all_misses(self, cache_manager):
        """Hit ratio should be 0.0 with all misses."""
        cache_manager.hits = 0
        cache_manager.misses = 100
        
        assert cache_manager.get_hit_ratio() == 0.0

