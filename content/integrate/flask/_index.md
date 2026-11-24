---
LinkTitle: Flask
Title: Redis with Flask
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Use Redis as the cache and session store for a Flask application.
group: framework
hideListLinks: false
stack: true
summary: Use Flask-Caching to cache views and function results in Redis, and Flask-Session to store sessions in Redis.
type: integration
weight: 11
---

[Flask](https://flask.palletsprojects.com/) is a lightweight Python web framework. Two
Flask extensions use Redis: [Flask-Caching](https://flask-caching.readthedocs.io/)
for [caching](#cache-views-and-functions), and
[Flask-Session](https://flask-session.readthedocs.io/) for
[server-side sessions](#store-sessions). Both use the
[redis-py](/content/develop/clients/redis-py/_index.md) client.

## Requirements

The examples on this page were run with Flask 3.1, Flask-Caching 2.5, Flask-Session 0.8,
and redis-py against Redis 7.2.

Install the extensions:

```bash
pip install flask flask-caching flask-session redis
```

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Cache views and functions

Configure Flask-Caching to use Redis, then create the `Cache` object:

```python
from flask import Flask
from flask_caching import Cache

app = Flask(__name__)
app.config.update(
    CACHE_TYPE="RedisCache",
    CACHE_REDIS_URL="redis://<your-redis-host>:6379/0",
    CACHE_DEFAULT_TIMEOUT=300,
    CACHE_KEY_PREFIX="myapp:",
)
cache = Cache(app)
```

Use `@cache.cached` to cache the whole response of a view, and `@cache.memoize` to
cache the result of a function for each set of arguments. This is the
[cache-aside](/content/develop/use-cases/cache-aside/_index.md) pattern:

```python
@app.route("/book/<isbn>")
@cache.cached(timeout=60)
def book_view(isbn):
    return render_book(isbn)  # runs only on a cache miss

@cache.memoize(timeout=30)
def find_book(isbn):
    return load_book_from_database(isbn)
```

Flask-Caching stores a cached view under a key such as `myapp:view//book/1`, with a TTL
equal to the `timeout`. To drop a memoized result, call `cache.delete_memoized(find_book, "2")`,
and the next call runs the function again. You can also use `cache.get()` and `cache.set()`
inside an application context.

## Store sessions

Flask-Session replaces Flask's default cookie-based session with a server-side session
stored in Redis. The browser keeps only a session ID. Pass Flask-Session a redis-py
client and set the session lifetime:

```python
from datetime import timedelta

import redis
from flask import session
from flask_session import Session

app.config.update(
    SECRET_KEY="<your-secret-key>",
    SESSION_TYPE="redis",
    SESSION_REDIS=redis.from_url("redis://<your-redis-host>:6379/1"),
    SESSION_KEY_PREFIX="myapp:session:",
    SESSION_PERMANENT=True,
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=15),
)
Session(app)

@app.route("/hit")
def hit():
    session["count"] = session.get("count", 0) + 1
    return str(session["count"])
```

Two requests that share a session cookie return `1` and then `2`. Flask-Session stores
the data under `myapp:session:<session-id>` with a TTL equal to the lifetime (900
seconds in this example).

See the [session store use case](/content/develop/use-cases/session-store/_index.md)
for more about this pattern.

## More information

- [Flask-Caching documentation](https://flask-caching.readthedocs.io/)
- [Flask-Session documentation](https://flask-session.readthedocs.io/)
- [Redis OM Python with Flask](/content/integrate/redisom-for-python/_index.md) shows how to build a document API with Flask.
