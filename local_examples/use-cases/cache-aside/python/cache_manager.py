"""Cache manager implementations for cache-aside pattern."""

import json
import logging
from typing import Any, Optional, Callable

import redis
import aioredis

from cache_config import CacheConfig


class CacheAsideManager:
    """Manages cache-aside pattern operations."""
    
    def __init__(
        self,
        redis_client: redis.Redis,
        config: CacheConfig,
        logger: Optional[logging.Logger] = None
    ):
        """Initialize cache manager.
        
        Args:
            redis_client: Redis client instance
            config: Cache configuration
            logger: Optional logger instance
        """
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
        """Get data using cache-aside pattern.
        
        Args:
            key: Data key
            data_source: Callable that fetches data from source
            ttl: Optional TTL override
            
        Returns:
            Data from cache or data source
        """
        cache_key = f"{self.config.key_prefix}{key}"
        ttl = ttl or self.config.ttl
        
        # Check cache
        try:
            cached_value = self.redis.get(cache_key)
            if cached_value is not None:
                self.hits += 1
                self.logger.debug(f"Cache hit: {key}")
                return json.loads(cached_value)
        except redis.RedisError as e:
            self.logger.error(f"Cache error: {e}")
        
        # Cache miss
        self.misses += 1
        self.logger.debug(f"Cache miss: {key}")
        value = data_source(key)
        
        # Store in cache
        if value is not None:
            try:
                self.redis.set(cache_key, json.dumps(value), ex=ttl)
            except redis.RedisError as e:
                self.logger.error(f"Failed to cache: {e}")
        
        return value
    
    def invalidate(self, key: str) -> bool:
        """Invalidate cache entry.
        
        Args:
            key: Data key to invalidate
            
        Returns:
            True if key was deleted, False otherwise
        """
        cache_key = f"{self.config.key_prefix}{key}"
        try:
            result = self.redis.delete(cache_key)
            self.logger.debug(f"Invalidated: {key}")
            return result > 0
        except redis.RedisError as e:
            self.logger.error(f"Invalidation error: {e}")
            return False
    
    def get_hit_ratio(self) -> float:
        """Calculate cache hit ratio.
        
        Returns:
            Hit ratio as float between 0 and 1
        """
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0


class AsyncCacheAsideManager:
    """Async cache-aside manager for asyncio applications."""

    def __init__(
        self,
        redis_client: aioredis.Redis,
        config: CacheConfig,
        logger: Optional[logging.Logger] = None
    ):
        """Initialize async cache manager.
        
        Args:
            redis_client: Async Redis client instance
            config: Cache configuration
            logger: Optional logger instance
        """
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
        """Get data asynchronously using cache-aside pattern.
        
        Args:
            key: Data key
            data_source_coro: Async callable that fetches data
            ttl: Optional TTL override
            
        Returns:
            Data from cache or data source
        """
        cache_key = f"{self.config.key_prefix}{key}"
        ttl = ttl or self.config.ttl

        # Check cache
        try:
            cached_value = await self.redis.get(cache_key)
            if cached_value is not None:
                self.hits += 1
                self.logger.debug(f"Cache hit: {key}")
                return json.loads(cached_value)
        except aioredis.RedisError as e:
            self.logger.error(f"Cache error: {e}")

        # Cache miss
        self.misses += 1
        self.logger.debug(f"Cache miss: {key}")
        value = await data_source_coro(key)

        # Store in cache
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
        """Invalidate cache entry asynchronously.
        
        Args:
            key: Data key to invalidate
            
        Returns:
            True if key was deleted, False otherwise
        """
        cache_key = f"{self.config.key_prefix}{key}"
        try:
            result = await self.redis.delete(cache_key)
            self.logger.debug(f"Invalidated: {key}")
            return result > 0
        except aioredis.RedisError as e:
            self.logger.error(f"Invalidation error: {e}")
            return False

