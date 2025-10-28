"""Complete example of cache-aside pattern implementation."""

import logging
import time

from cache_config import CacheConfig
from cache_manager import CacheAsideManager
from mock_data_store import MockDataStore


def main():
    """Run cache-aside example."""
    # Setup logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    
    # Create configuration
    config = CacheConfig(
        host='localhost',
        port=6379,
        db=0,
        ttl=60,
        key_prefix='example:'
    )
    
    # Create Redis client
    try:
        redis_client = config.create_redis_client()
        redis_client.ping()
        logger.info("Connected to Redis")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        return
    
    # Create data store and cache manager
    data_store = MockDataStore(latency_ms=100)
    cache_manager = CacheAsideManager(redis_client, config, logger)
    
    # Example 1: Basic cache-aside
    logger.info("\n=== Example 1: Basic Cache-Aside ===")
    
    start = time.time()
    user1 = cache_manager.get('user:1', data_store.get)
    miss_time = time.time() - start
    logger.info(f"First fetch (cache miss): {user1} - {miss_time*1000:.2f}ms")
    
    start = time.time()
    user1_cached = cache_manager.get('user:1', data_store.get)
    hit_time = time.time() - start
    logger.info(f"Second fetch (cache hit): {user1_cached} - {hit_time*1000:.2f}ms")
    
    logger.info(f"Hit ratio: {cache_manager.get_hit_ratio():.2%}")
    
    # Example 2: Cache invalidation
    logger.info("\n=== Example 2: Cache Invalidation ===")
    
    logger.info("Updating user:1 in data store")
    data_store.update('user:1', {'id': 1, 'name': 'Alice Updated', 'email': 'alice.updated@example.com'})
    
    logger.info("Invalidating cache")
    cache_manager.invalidate('user:1')
    
    logger.info("Fetching updated data")
    user1_updated = cache_manager.get('user:1', data_store.get)
    logger.info(f"Updated user: {user1_updated}")
    
    # Example 3: Multiple keys
    logger.info("\n=== Example 3: Multiple Keys ===")
    
    keys = ['user:1', 'user:2', 'product:1', 'product:2']
    
    logger.info("First fetch (all cache misses)")
    start = time.time()
    for key in keys:
        cache_manager.get(key, data_store.get)
    first_time = time.time() - start
    logger.info(f"Total time: {first_time*1000:.2f}ms")
    
    logger.info("Second fetch (all cache hits)")
    start = time.time()
    for key in keys:
        cache_manager.get(key, data_store.get)
    second_time = time.time() - start
    logger.info(f"Total time: {second_time*1000:.2f}ms")
    
    logger.info(f"Speedup: {first_time/second_time:.1f}x")
    logger.info(f"Hit ratio: {cache_manager.get_hit_ratio():.2%}")
    
    # Example 4: TTL management
    logger.info("\n=== Example 4: TTL Management ===")
    
    from cache_aside import get_ttl, set_ttl, refresh_ttl
    
    ttl = get_ttl(redis_client, 'user:1', prefix='example:')
    logger.info(f"Remaining TTL for user:1: {ttl} seconds")
    
    logger.info("Refreshing TTL to 120 seconds")
    refresh_ttl(redis_client, 'user:1', 120, prefix='example:')
    
    ttl = get_ttl(redis_client, 'user:1', prefix='example:')
    logger.info(f"New TTL for user:1: {ttl} seconds")
    
    # Example 5: Pattern invalidation
    logger.info("\n=== Example 5: Pattern Invalidation ===")
    
    from cache_aside import invalidate_pattern
    
    logger.info("Invalidating all user keys")
    deleted = invalidate_pattern(redis_client, 'example:user:*')
    logger.info(f"Deleted {deleted} keys")
    
    # Example 6: Error handling
    logger.info("\n=== Example 6: Error Handling ===")
    
    from cache_aside import get_data_with_fallback
    
    logger.info("Fetching with fallback (cache miss)")
    data = get_data_with_fallback(redis_client, 'user:1', data_store.get, prefix='example:')
    logger.info(f"Data: {data}")
    
    logger.info("Fetching with fallback (cache hit)")
    data = get_data_with_fallback(redis_client, 'user:1', data_store.get, prefix='example:')
    logger.info(f"Data: {data}")
    
    # Cleanup
    logger.info("\n=== Cleanup ===")
    redis_client.flushdb()
    logger.info("Flushed Redis database")


if __name__ == '__main__':
    main()

