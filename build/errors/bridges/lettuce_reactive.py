"""Lettuce (reactive API) bridge for live_clients.py."""
from lettuce import VERSION, prepare_api

KEY = 'lettuce_reactive'


def prepare(version, cache):
    return prepare_api('reactive', version, cache)
