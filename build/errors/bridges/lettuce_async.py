"""Lettuce (async API) bridge for live_clients.py."""
from lettuce import VERSION, prepare_api

KEY = 'lettuce_async'


def prepare(version, cache):
    return prepare_api('async', version, cache)
