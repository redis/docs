"""Unit tests for cache-aside utility functions."""

import pytest
from unittest.mock import Mock

import cache_aside


class TestCacheAsideFunctions:
    """Tests for cache-aside utility functions."""

    def test_get_cached_data_hit(self, redis_mock):
        """Get cached data should return cached value on hit using Redis JSON."""
        redis_mock.json().get.return_value = {'id': 1, 'name': 'Alice'}
        data_source = Mock()

        result = cache_aside.get_cached_data(redis_mock, 'user:1', data_source)

        assert result == {'id': 1, 'name': 'Alice'}
        data_source.assert_not_called()

    def test_get_cached_data_miss(self, redis_mock):
        """Get cached data should fetch from source on miss using Redis JSON."""
        redis_mock.json().get.return_value = None
        data_source = Mock(return_value={'id': 1, 'name': 'Alice'})

        result = cache_aside.get_cached_data(redis_mock, 'user:1', data_source)

        assert result == {'id': 1, 'name': 'Alice'}
        redis_mock.json().set.assert_called_once()

    def test_invalidate_cache(self, redis_mock):
        """Invalidate cache should delete key."""
        redis_mock.delete.return_value = 1

        result = cache_aside.invalidate_cache(redis_mock, 'user:1')

        assert result is True
        redis_mock.delete.assert_called_once_with('cache:user:1')

    def test_invalidate_pattern(self, redis_mock):
        """Invalidate pattern should delete matching keys."""
        redis_mock.scan.side_effect = [(0, ['cache:user:1', 'cache:user:2'])]
        redis_mock.delete.return_value = 2

        deleted = cache_aside.invalidate_pattern(redis_mock, 'cache:user:*')

        assert deleted == 2
        redis_mock.delete.assert_called_once()

    def test_set_ttl(self, redis_mock):
        """Set TTL should update expiration."""
        redis_mock.expire.return_value = 1

        result = cache_aside.set_ttl(redis_mock, 'user:1', 120)

        assert result is True
        redis_mock.expire.assert_called_once_with('cache:user:1', 120)

    def test_get_ttl(self, redis_mock):
        """Get TTL should return remaining seconds."""
        redis_mock.ttl.return_value = 45

        ttl = cache_aside.get_ttl(redis_mock, 'user:1')

        assert ttl == 45

    def test_refresh_ttl(self, redis_mock):
        """Refresh TTL should extend expiration."""
        redis_mock.expire.return_value = 1

        result = cache_aside.refresh_ttl(redis_mock, 'user:1', 300)

        assert result is True

    def test_get_data_with_fallback_hit(self, redis_mock):
        """Get with fallback should return cached value on hit using Redis JSON."""
        redis_mock.json().get.return_value = {'id': 1}
        data_source = Mock()

        result = cache_aside.get_data_with_fallback(redis_mock, 'key:1', data_source)

        assert result == {'id': 1}
        data_source.assert_not_called()

    def test_get_data_with_fallback_miss(self, redis_mock):
        """Get with fallback should fetch from source on miss using Redis JSON."""
        redis_mock.json().get.return_value = None
        data_source = Mock(return_value={'id': 1})

        result = cache_aside.get_data_with_fallback(redis_mock, 'key:1', data_source)

        assert result == {'id': 1}
        redis_mock.json().set.assert_called_once()

    def test_retry_operation_success(self):
        """Retry should succeed on first attempt."""
        operation = Mock(return_value='success')

        result = cache_aside.retry_operation(operation)

        assert result == 'success'
        operation.assert_called_once()

