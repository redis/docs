---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis leaderboard in PHP with Predis and sorted sets
linkTitle: PHP leaderboard
title: Redis leaderboard with PHP
weight: 7
---

This guide shows you how to implement a Redis-backed leaderboard in PHP with [Predis]({{< relref "/develop/clients/php" >}}). It uses a sorted set to store rank order, Redis hashes to store per-user metadata, and a small local web server so you can explore the leaderboard interactively in your browser.

## Overview

Leaderboards are a classic Redis pattern. A sorted set stores each member together with a numeric score, and Redis maintains the ranking order automatically.

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

Separating rank data from metadata keeps leaderboard operations efficient while still letting the application render richer profile details.

## Installation

Install Predis using Composer:

```bash
composer require predis/predis
```

## The PHP class

The `RedisLeaderboard` class wraps common leaderboard operations
([source](RedisLeaderboard.php)):

```php
<?php

require __DIR__ . '/vendor/autoload.php';

use Predis\Client;

$redis = new Client([
    'scheme' => 'tcp',
    'host' => '127.0.0.1',
    'port' => 6379,
]);

$board = new RedisLeaderboard(
    redis: $redis,
    key: 'leaderboard:demo',
    maxEntries: 100
);

$entry = $board->upsertUser(
    'player-1',
    1200,
    [
        'name' => 'Ada',
        'description' => 'Solves production incidents before breakfast.',
    ]
);

$topPlayers = $board->getTop(5);
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

The `upsertUser()` method writes the score, updates metadata, and then trims the board if it exceeds the configured limit:

```php
public function upsertUser(string $userId, float $score, array $metadata = []): array
{
    $payload = $this->coerceMetadata($metadata);

    $pipeline = $this->redis->pipeline();
    $pipeline->zadd($this->key, [$userId => $score]);
    if ($payload !== []) {
        $pipeline->hmset($this->metadataKey($userId), $payload);
    }
    $pipeline->execute();

    $trimmedUserIds = $this->trimToMaxEntries();
    $entry = $this->getUserEntry($userId);

    return $entry === null
        ? [
            'rank' => 0,
            'user_id' => $userId,
            'score' => $score,
            'metadata' => $payload,
            'trimmed_user_ids' => $trimmedUserIds,
        ]
        : array_merge($entry, ['trimmed_user_ids' => $trimmedUserIds]);
}
```

To fetch users around a rank, the implementation converts the requested rank and count into a reverse range window:

```php
public function getAroundRank(int $rank, int $count): array
{
    $normalizedRank = $this->normalizePositiveInt($rank, 'rank');
    $normalizedCount = $this->normalizePositiveInt($count, 'count');
    $totalEntries = $this->getSize();

    if ($totalEntries <= $normalizedCount) {
        return $this->listAll();
    }

    $halfWindow = intdiv($normalizedCount, 2);
    $start = max(0, $normalizedRank - 1 - $halfWindow);
    $maxStart = $totalEntries - $normalizedCount;
    if ($start > $maxStart) {
        $start = $maxStart;
    }
    $end = $start + $normalizedCount - 1;

    $entries = $this->redis->zrevrange($this->key, $start, $end, 'WITHSCORES');
    return $this->hydrateEntries($entries, $start + 1);
}
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
([source](demo_server.php)):

```bash
composer require predis/predis
php -S localhost:8080 demo_server.php
```

The demo provides an interactive web interface where you can:

* Add or update a player score and metadata
* Increase a player's score incrementally
* View the top `n` players on the leaderboard
* View the `n` players around a chosen rank
* Change the maximum number of entries the leaderboard keeps
* Reset the demo dataset to a known starting state

The demo assumes Redis is running on `localhost:6379` but you can specify a different host and port using the `REDIS_HOST` and `REDIS_PORT` environment variables:

```bash
REDIS_HOST=myhost REDIS_PORT=6380 php -S localhost:8080 demo_server.php
```

Visit `http://localhost:8080` in your browser to try it out.

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
