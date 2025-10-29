"""Cache configuration module."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class CacheConfig:
    """Cache configuration parameters.

    This class holds configuration values for cache-aside operations.
    Redis clients should be instantiated directly using redis.Redis().
    """

    host: str = 'localhost'
    port: int = 6379
    db: int = 0
    ttl: int = 60
    key_prefix: str = 'cache:'
    socket_timeout: Optional[float] = 5.0
    socket_connect_timeout: Optional[float] = 5.0

