"""StackExchange.Redis (sync API) bridge for live_clients.py."""
from se_redis import VERSION, prepare_api

KEY = 'se_redis_sync'


def prepare(version, cache):
    return prepare_api('sync', version, cache)
