"""Cache configuration module."""

from dataclasses import dataclass
from typing import Optional
import redis


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
        """Create Redis client from config.
        
        Returns:
            redis.Redis: Configured Redis client instance
        """
        return redis.Redis(
            host=self.host,
            port=self.port,
            db=self.db,
            decode_responses=True,
            socket_timeout=self.socket_timeout,
            socket_connect_timeout=self.socket_connect_timeout
        )

