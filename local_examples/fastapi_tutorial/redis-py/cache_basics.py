# EXAMPLE: fastapi_tutorial
# HIDE_START
"""Verifiable fastapi-redis-sdk caching example.

Requires a running Redis server (default: localhost:6379) plus
`fastapi-redis-sdk` and `httpx` installed. The app is driven in-process with
FastAPI's TestClient, so no separate server needs to be started.
"""
from datetime import datetime, timezone

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from redis_fastapi import (
    FastAPIRedis,
    cache,
    cache_evict,
    default_key_builder,
)

app = FastAPI()
FastAPIRedis(app).lifespan().caching()


@app.get(
    "/cache-demo",
    dependencies=[Depends(cache(ttl=30, eviction_group="demo"))],
)
async def cache_demo():
    # Recomputed only on a cache MISS; the timestamp changes each time.
    return {"generated_at": datetime.now(tz=timezone.utc).isoformat()}


@app.delete(
    "/cache-demo",
    dependencies=[
        Depends(cache_evict(eviction_group="demo", key_builder=default_key_builder))
    ],
)
async def evict_cache_demo():
    return {"evicted": "demo"}


# Entering the TestClient context triggers the FastAPI lifespan, which is where
# fastapi-redis-sdk opens its Redis connection pool.
client = TestClient(app)
client.__enter__()
# HIDE_END

# STEP_START cache_hit_miss
# The first request is a MISS: the handler runs and the response is cached.
first = client.get("/cache-demo")
print(first.headers["X-Redis-Cache"])
# >>> MISS

# A second request within the TTL is a HIT, served from Redis without
# re-running the handler, so the cached body is returned unchanged.
second = client.get("/cache-demo")
print(second.headers["X-Redis-Cache"])
# >>> HIT

print(first.json() == second.json())
# >>> True
# STEP_END

# REMOVE_START
assert first.headers["X-Redis-Cache"] == "MISS"
assert second.headers["X-Redis-Cache"] == "HIT"
assert first.json() == second.json()
# REMOVE_END

# STEP_START cache_evict
# Deleting the resource evicts its cache entry, so the next read is a MISS
# again and the handler recomputes a fresh response.
client.delete("/cache-demo")

third = client.get("/cache-demo")
print(third.headers["X-Redis-Cache"])
# >>> MISS

print(third.json() == first.json())
# >>> False
# STEP_END

# REMOVE_START
assert third.headers["X-Redis-Cache"] == "MISS"
assert third.json() != first.json()
# REMOVE_END

# STEP_START http_caching
# Cached responses carry standard HTTP caching headers. Replaying the ETag with
# If-None-Match lets the server answer 304 Not Modified with no body.
cached = client.get("/cache-demo")
etag = cached.headers["ETag"]
print(cached.headers["Cache-Control"])
# >>> max-age=30

not_modified = client.get("/cache-demo", headers={"If-None-Match": etag})
print(not_modified.status_code)
# >>> 304
# STEP_END

# REMOVE_START
assert etag
assert not_modified.status_code == 304
client.__exit__(None, None, None)
# REMOVE_END
