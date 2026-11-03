"""Lettuce (sync API) bridge for live_clients.py."""
from lettuce import VERSION, prepare_api

KEY = 'lettuce_sync'


def prepare(version, cache):
    return prepare_api('sync', version, cache)
