---
LinkTitle: Django
Title: Redis with Django
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Use Redis as the cache, session store, and channel layer for a Django application.
group: framework
hideListLinks: false
stack: true
summary: Use Redis as the cache backend, session store, and Channels layer for Django, with either the built-in Redis cache backend or django-redis.
type: integration
weight: 10
---

[Django](https://www.djangoproject.com/) is a Python web framework. You can use Redis
with Django as the [cache](#cache-data), the [session store](#store-sessions), and the
[channel layer](#broadcast-messages-with-channels) that connects WebSocket clients
through [Django Channels](https://channels.readthedocs.io/).

## Requirements

| Dependency | Notes |
|------------|-------|
| Django | 4.0 or later for the built-in Redis cache backend |
| [redis-py](/content/develop/clients/redis-py/_index.md) | Required by both cache backends |
| [django-redis](https://github.com/jazzband/django-redis) | Optional third-party cache backend |
| [channels](https://channels.readthedocs.io/) and [channels-redis](https://github.com/django/channels_redis) | Required for the channel layer |

The examples on this page were run with Django 6.1, django-redis 7.0, Channels 4.3, and
channels-redis 4.3 against Redis 7.2.

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Cache data

Django has a built-in Redis cache backend, and the `django-redis` package provides a
second one. Both implement Django's standard [cache API](https://docs.djangoproject.com/en/stable/topics/cache/),
so the code that uses the cache is the same with either.

### Use the built-in backend

Install redis-py, then point the `CACHES` setting at your server in `settings.py`:

```bash
pip install redis
```

```python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://<your-redis-host>:6379",
        "TIMEOUT": 300,
        "KEY_PREFIX": "myapp",
    }
}
```

### Use django-redis

`django-redis` adds methods that the standard cache API doesn't have. Install it, then
use its backend:

```bash
pip install django-redis
```

```python
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://<your-redis-host>:6379/0",
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        "KEY_PREFIX": "myapp",
    }
}
```

With `django-redis`, the cache object also provides:

| Method | Use |
|--------|-----|
| `cache.ttl(key)` | Returns the remaining time to live (TTL) of a key in seconds. |
| `cache.delete_pattern("user:*")` | Deletes every key that matches a glob pattern and returns the number deleted. |
| `cache.lock(name, timeout=5)` | Returns a lock that you use with `with`, to coordinate work across processes. |

### Read and write the cache

Use `get_or_set()` for the [cache-aside](/content/develop/use-cases/cache-aside/_index.md)
pattern. It returns the cached value, or calls your function and stores the result on
a miss:

```python
from django.core.cache import cache

book = cache.get_or_set("book:1", load_book_from_database, timeout=30)
```

Django stores each entry under a key of the form `<prefix>:<version>:<key>`. With the
`myapp` prefix and the default version, the entry above is stored as `myapp:1:book:1`.
Values are serialized with `pickle`, so Redis stores them as strings, and the `timeout`
becomes the key's TTL.

## Store sessions

Django can keep sessions in the cache, so with Redis as the cache they live in Redis.
Set the session engine in `settings.py`:

```python
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
SESSION_COOKIE_AGE = 900  # seconds
```

Django then stores each session as a cache entry such as
`myapp:1:django.contrib.sessions.cache<session-key>`, with a TTL equal to
`SESSION_COOKIE_AGE`.

> [!NOTE]
> A cache-based session lives only in Redis. If Redis evicts the key or loses its data,
> the user's session ends. See the
> [Django session documentation](https://docs.djangoproject.com/en/stable/topics/http/sessions/#using-cached-sessions)
> for the `cached_db` engine, which also writes sessions to your database.

See the [session store use case](/content/develop/use-cases/session-store/_index.md)
for more about this pattern.

## Broadcast messages with Channels

Django Channels adds WebSocket support to Django. Its Redis channel layer lets
consumers running in different processes send messages to each other and to groups of
clients. Install the packages:

```bash
pip install channels channels-redis
```

Configure the channel layer in `settings.py`:

```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [("<your-redis-host>", 6379)]},
    }
}
```

The following consumer adds each connection to a group named after the chat room, and
relays every message it receives to the whole group:

```python
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room = self.scope["url_route"]["kwargs"]["room"]
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room, self.channel_name)

    async def receive(self, text_data):
        await self.channel_layer.group_send(
            self.room, {"type": "chat.message", "text": text_data}
        )

    async def chat_message(self, event):
        await self.send(text_data=event["text"])
```

With two clients connected to the same room, a message sent by one arrives at both.
Channels keeps the group membership in Redis, under a key such as `asgi:group:<room>`.
See the [pub/sub use case](/content/develop/use-cases/pub-sub/_index.md) for other
ways to broadcast messages with Redis.

## More information

- [Django cache framework](https://docs.djangoproject.com/en/stable/topics/cache/)
- [django-redis documentation](https://github.com/jazzband/django-redis)
- [Channels documentation](https://channels.readthedocs.io/)
