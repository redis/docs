"""StackExchange.Redis (async API) bridge for live_clients.py."""
from se_redis import VERSION, prepare_api

KEY = 'se_redis_async'


def prepare(version, cache):
    return prepare_api('async', version, cache)
