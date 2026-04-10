---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis leaderboard in Ruby with redis-rb and sorted sets
linkTitle: Ruby leaderboard
title: Redis leaderboard with Ruby
weight: 8
---

This guide shows you how to implement a Redis-backed leaderboard in Ruby with the [`redis-rb`]({{< relref "/develop/clients/ruby" >}}) client library. It uses a sorted set to store rank order, Redis hashes to store per-user metadata, and a small local web server so you can explore the leaderboard interactively in your browser.

## Overview

Leaderboards are a natural fit for Redis. A sorted set stores each member together with a numeric score, and Redis maintains the ranking order automatically.

That gives you:

* Fast score updates for existing users
* Simple top `n` leaderboard queries
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

Separating rank data from metadata keeps leaderboard operations efficient while still letting the application render richer profile details.

## Installation

Install the `redis` gem:

```bash
gem install redis
```

Or add it to your `Gemfile`:

```ruby
gem 'redis', '~> 5.0'
```

Then run:

```bash
bundle install
```

## The Ruby module

The `RedisLeaderboard` class wraps common leaderboard operations
([source](leaderboard.rb)):

```ruby
require 'redis'
require_relative 'leaderboard'

redis = Redis.new(host: 'localhost', port: 6379)

board = RedisLeaderboard.new(
  redis: redis,
  key: 'leaderboard:demo',
  max_entries: 100
)

entry = board.upsert_user(
  'player-1',
  1200,
  {
    'name' => 'Ada',
    'description' => 'Solves production incidents before breakfast.'
  }
)

top_players = board.get_top(5)
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
* [`ZRANGE`]({{< relref "/commands/zrange" >}}) with the `REV` option to fetch the highest-ranked members
* [`ZREVRANK`]({{< relref "/commands/zrevrank" >}}) to find a user's rank from the top
* [`ZREMRANGEBYRANK`]({{< relref "/commands/zremrangebyrank" >}}) to trim the lowest-ranked overflow entries
* [`HSET`]({{< relref "/commands/hset" >}}) and [`HGETALL`]({{< relref "/commands/hgetall" >}}) to store and load user metadata
* [`DEL`]({{< relref "/commands/del" >}}) to remove metadata for trimmed or deleted users

## Leaderboard implementation

The `upsert_user()` method writes the score, updates metadata, and then trims the board if it exceeds the configured limit:

```ruby
def upsert_user(user_id, score, metadata = {})
  payload = coerce_metadata(metadata)

  @redis.pipelined do |pipeline|
    pipeline.zadd(@key, score, user_id)
    pipeline.hset(metadata_key(user_id), payload) unless payload.empty?
  end

  trimmed_user_ids = trim_to_max_entries
  entry = get_user_entry(user_id)

  if entry.nil?
    {
      rank: 0,
      user_id: user_id,
      score: score.to_f,
      metadata: payload,
      trimmed_user_ids: trimmed_user_ids
    }
  else
    entry.merge(trimmed_user_ids: trimmed_user_ids)
  end
end
```

To fetch users around a rank, the implementation converts the requested rank and count into a reverse range window:

```ruby
def get_around_rank(rank, count)
  normalized_rank = normalize_positive_int(rank, "rank")
  normalized_count = normalize_positive_int(count, "count")
  total_entries = get_size

  return list_all if total_entries <= normalized_count

  half_window = normalized_count / 2
  start = [0, normalized_rank - 1 - half_window].max
  max_start = total_entries - normalized_count
  start = max_start if start > max_start
  ending = start + normalized_count - 1

  entries = zrange_with_scores_rev(start, ending)
  hydrate_entries(entries, start + 1)
end
```

## Metadata design

The leaderboard stores only user IDs and scores in the sorted set. Richer details stay in a separate per-user hash. That means the same user ID can be ranked efficiently while still exposing extra fields such as:

* Display name
* Short description
* Team or country
* Avatar URL
* Other lightweight profile fields

This is a useful pattern when the ranking view and the profile view need different data shapes.

## Running the demo

A local demo server is included to show the leaderboard in action
([source](demo_server.rb)):

```bash
gem install redis webrick
ruby demo_server.rb
```

The demo provides an interactive web interface where you can:

* Add or update a player score and metadata
* Increase a player's score incrementally
* View the top `n` players on the leaderboard
* View the `n` players around a chosen rank
* Change the maximum number of entries the leaderboard keeps
* Reset the demo dataset to a known starting state

The demo assumes Redis is running on `localhost:6379` but you can specify a different host and port using the `--redis-host HOST` and `--redis-port PORT` command-line arguments. Visit `http://localhost:8080` in your browser to try it out.

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
