---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis leaderboard in Python with redis-py and sorted sets
linkTitle: redis-py leaderboard
title: Redis leaderboard with redis-py
weight: 1
---

This guide shows you how to implement a Redis-backed leaderboard in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}). It uses a sorted set to store rank order, Redis hashes to store per-user metadata, and a small local web server so you can explore the leaderboard interactively in your browser.

## Overview

Leaderboards are one of the classic Redis use cases. A sorted set stores each member together with a numeric score, and Redis keeps the members ordered by that score for you.

That gives you:

* Fast score updates for existing users
* Simple top-`n` leaderboard queries
* Efficient queries for entries around a specific rank position
* Straightforward trimming to a fixed leaderboard size
* A clean separation between rank data and richer user metadata

In this example, the leaderboard score data is stored in a sorted set called `leaderboard:demo`, and each user's metadata is stored in a hash such as `leaderboard:demo:user:player-17`.

## How it works

The flow looks like this:

1. Store each user ID in a sorted set with their score
2. Store per-user metadata in a separate Redis hash keyed by user ID
3. Fetch the highest-ranked users with a reverse range query
4. Fetch users around a given rank by calculating a rank window
5. Trim the leaderboard after updates so only the top configured entries remain

Separating rank data from metadata keeps the leaderboard operations efficient while still letting you render richer profiles in the application.

## The Python leaderboard

The `RedisLeaderboard` class wraps the common leaderboard operations
([source](leaderboard.py)):

```python
import redis
from leaderboard import RedisLeaderboard

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
board = RedisLeaderboard(redis_client=r, key="leaderboard:demo", max_entries=100)

board.upsert_user(
    "player-1",
    1200,
    {
        "name": "Ada",
        "description": "Solves production incidents before breakfast.",
    },
)

board.increment_score("player-1", 25)
top_players = board.get_top(5)
players_near_rank = board.get_around_rank(rank=10, count=5)
```

### Data model

The implementation uses two Redis structures:

```text
leaderboard:demo
  player-1 => 1225
  player-2 => 1180
  player-3 => 1105

leaderboard:demo:user:player-1
  name = Ada
  description = Solves production incidents before breakfast.
```

The score data lives in the sorted set, while the user details live in hashes keyed by the same user ID.

The implementation uses:

* [`ZADD`]({{< relref "/commands/zadd" >}}) to add or update leaderboard scores
* [`ZREVRANGE`]({{< relref "/commands/zrevrange" >}}) to fetch the highest-ranked members
* [`ZREVRANK`]({{< relref "/commands/zrevrank" >}}) to find a user's rank from the top
* [`ZREMRANGEBYRANK`]({{< relref "/commands/zremrangebyrank" >}}) to trim the lowest-ranked overflow entries
* [`HSET`]({{< relref "/commands/hset" >}}) and [`HGETALL`]({{< relref "/commands/hgetall" >}}) to store and load user metadata
* [`DEL`]({{< relref "/commands/del" >}}) to remove metadata for trimmed or deleted users

## Leaderboard implementation

The `upsert_user()` method writes the score, updates metadata, and then trims the board if it exceeds the configured limit:

```python
def upsert_user(
    self,
    user_id: str,
    score: float,
    metadata: Optional[dict[str, str]] = None,
) -> dict[str, object]:
    metadata_key = self._metadata_key(user_id)

    with self.redis.pipeline() as pipeline:
        pipeline.zadd(self.key, {user_id: float(score)})
        if metadata:
            pipeline.hset(
                metadata_key,
                mapping={field: str(value) for field, value in metadata.items()},
            )
        pipeline.execute()

    trimmed_user_ids = self._trim_to_max_entries()
    return self.get_user_entry(user_id) or {
        "user_id": user_id,
        "score": float(score),
        "metadata": metadata or {},
        "trimmed_user_ids": trimmed_user_ids,
    }
```

To fetch users around a rank, the implementation converts the requested rank and count into a reverse range window:

```python
def get_around_rank(self, rank: int, count: int) -> list[dict[str, object]]:
    normalized_rank = max(1, int(rank))
    normalized_count = max(1, int(count))
    half_window = normalized_count // 2
    start = max(0, normalized_rank - 1 - half_window)
    end = start + normalized_count - 1

    entries = self.redis.zrevrange(self.key, start, end, withscores=True)
    return self._hydrate_entries(entries, start_rank=start + 1)
```

If you need stronger guarantees for highly concurrent production writes, you can move the update-and-trim behavior into a Lua script or a tighter transaction flow. For a small application or demo, this Python implementation is easy to follow and works well.

## Metadata design

The leaderboard stores only user IDs and scores in the sorted set. Richer details stay in a separate per-user hash. That means the same user ID can be ranked efficiently while still exposing extra fields such as:

* Display name
* Short description
* Team or country
* Avatar URL
* Other lightweight profile fields

This is a useful pattern when the ranking view and the profile view need different data shapes.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* The `redis` Python package is installed:

```bash
pip install redis
```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

A local demo server is included to show the leaderboard in action
([source](demo_server.py)):

```bash
python demo_server.py
```

The demo server uses only Python standard library features for HTTP handling:

* [`http.server`](https://docs.python.org/3/library/http.server.html) for the web server
* [`urllib.parse`](https://docs.python.org/3/library/urllib.parse.html) for form decoding and query parsing
* [`json`](https://docs.python.org/3/library/json.html) for API responses

It exposes a small interactive page where you can:

* Add or update a player score and metadata
* Increase a player's score incrementally
* View the top `n` players on the leaderboard
* View the `n` players around a chosen rank
* Change the maximum number of entries the leaderboard keeps
* Reset the demo dataset to a known starting state

After starting the server, visit `http://localhost:8080`.

## Production usage

This guide uses a deliberately small local demo so you can focus on the Redis leaderboard pattern. In production, you will usually want to add more validation, tighter concurrency control, and application-specific lifecycle rules.

### Decide how ties should behave

Redis sorted sets order primarily by score. When two members have the same score, Redis uses the member value as a secondary ordering rule. If your application needs a different tie-breaker, you may want to encode it in the score or store additional state.

### Consider how you expire or archive old data

Some leaderboards are permanent, while others reset daily, weekly, or seasonally. Depending on your use case, you may want to:

* Namespace keys by season or event
* Snapshot historical results elsewhere
* Rebuild the current leaderboard from upstream data

### Keep metadata lightweight

Per-user hashes work best for small, frequently accessed profile details. Large profile documents or rarely used attributes are often better kept in another store, with Redis holding only the fields needed to render the leaderboard quickly.
