"""redis-rs (async API) bridge for live_clients.py."""
from rust_redis import VERSION, prepare_api

KEY = 'redis_rs_async'


def prepare(version, cache):
    return prepare_api('async', version, cache)
