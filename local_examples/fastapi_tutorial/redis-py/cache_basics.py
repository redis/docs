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

# REMOVE_START
# Self-reset: an entry cached by a previous run would make the first request a HIT.
import redis as _redis

_r = _redis.Redis()
for _key in _r.scan_iter("redis:fastapi:cache:*demo*"):
    _r.delete(_key)
# REMOVE_END

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
# Cached responses carry standard HTTP caching headers. Evict first so the next
# request is a fresh MISS whose Cache-Control reflects the full 30-second TTL.
client.delete("/cache-demo")
miss = client.get("/cache-demo")
print(miss.headers["Cache-Control"])
# >>> max-age=30

# The cached response also carries a weak ETag. Replaying it with If-None-Match
# lets the server answer 304 Not Modified with no body.
etag = miss.headers["ETag"]
not_modified = client.get("/cache-demo", headers={"If-None-Match": etag})
print(not_modified.status_code)
# >>> 304
# STEP_END

# REMOVE_START
assert miss.headers["Cache-Control"].startswith("max-age=")
assert etag
assert not_modified.status_code == 304
# REMOVE_END

# HIDE_START
# Close the TestClient context to run the shutdown lifespan and release the
# Redis connection pool opened by client.__enter__() above.
client.__exit__(None, None, None)
# HIDE_END

# REMOVE_START
# Self-reset: rate-limit counters last for their whole window, so a rerun within
# a minute would start with the counter already spent.
for _key in _r.scan_iter("redis:fastapi:ratelimit:*search:demo*"):
    _r.delete(_key)
# REMOVE_END

# STEP_START rate_limit
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from redis_fastapi import FastAPIRedis, rate_limit

app = FastAPI()
FastAPIRedis(app).lifespan().rate_limiting()


@app.get(
    "/search",
    dependencies=[
        Depends(rate_limit("2/minute", scope="search:demo:burst")),
        Depends(rate_limit("100/hour", scope="search:demo:sustained")),
    ],
)
async def search():
    return {"results": []}


with TestClient(app) as client:
    responses = [client.get("/search") for _ in range(3)]

print([r.status_code for r in responses])
# >>> [200, 200, 429]

# The rejected request tells the client how long to wait.
print("Retry-After" in responses[-1].headers)
# >>> True

# Every response reports the limit and what is left of it.
print(responses[0].headers["X-RateLimit-Remaining"])
# >>> 1
# STEP_END

# REMOVE_START
assert [r.status_code for r in responses] == [200, 200, 429]
assert "Retry-After" in responses[-1].headers
assert responses[0].headers["X-RateLimit-Remaining"] == "1"
# REMOVE_END

# STEP_START sessions
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from redis_fastapi import FastAPIRedis, SessionDep, valid_session

app = FastAPI()
FastAPIRedis(app).lifespan().sessions()


@app.post("/login")
async def login(session: SessionDep):
    session["user_id"] = 42  # rotates the session ID after the endpoint completes
    return {"ok": True}


@app.get("/me", dependencies=[Depends(valid_session())])
async def me(session: SessionDep):
    return {"user_id": session.get("user_id")}


# The session cookie is Secure by default, so the test client must use HTTPS.
with TestClient(app, base_url="https://testserver") as client:
    print(client.get("/me").status_code)
    # >>> 401

    client.post("/login")
    print(client.get("/me").json())
    # >>> {'user_id': 42}
# STEP_END

# REMOVE_START
with TestClient(app, base_url="https://testserver") as _c:
    assert _c.get("/me").status_code == 401
    assert _c.post("/login").status_code == 200
    assert _c.get("/me").json() == {"user_id": 42}
for _key in _r.scan_iter("redis:fastapi:session*"):
    _r.delete(_key)
# REMOVE_END

# STEP_START testing
import fakeredis.aioredis
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from redis_fastapi import FastAPIRedis, cache, get_async_redis

app = FastAPI()
FastAPIRedis(app).lifespan().caching()


@app.get("/items", dependencies=[Depends(cache(ttl=60))])
async def get_items():
    return {"items": [1, 2, 3]}


# Replace the Redis client with an in-memory fake. No server is needed.
fake = fakeredis.aioredis.FakeRedis()
app.dependency_overrides[get_async_redis] = lambda: fake

with TestClient(app) as client:
    print(client.get("/items").headers["X-Redis-Cache"])
    # >>> MISS

    print(client.get("/items").headers["X-Redis-Cache"])
    # >>> HIT
# STEP_END
