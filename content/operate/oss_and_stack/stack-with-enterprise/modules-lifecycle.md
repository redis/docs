---
Title: Module lifecycle
alwaysopen: false
categories:
- docs
- operate
- stack
description: null
linkTitle: Module lifecycle
weight: 7
---
Redis Software follows the [Redis Software lifecycle]({{< relref "/operate/rs/installing-upgrading/product-lifecycle" >}}).  (For complete details, see the Redis Software [subscription agreement](https://redis.com/software-subscription-agreement).)

The lifecycle model for modules changed with Redis 8.0. This page is organized into two sections accordingly:

- [Redis 8.0 and later](#redis-80-and-later): modules are built into Redis Open Source and share the Redis lifecycle.
- [Before Redis 8.0](#before-redis-80): legacy modules follow their own per-module release lifecycle and end-of-life schedule.

## Redis 8.0 and later

Starting with Redis 8.0, the capabilities that were previously distributed as separate modules—Redis Search (RediSearch), JSON (RedisJSON), Time series (RedisTimeSeries), and Probabilistic (RedisBloom)—are built into Redis Open Source. [Redis 8 in Redis Open Source replaces Redis Stack]({{< relref "/operate/oss_and_stack" >}}), so there is no separate module to install or version.

As a result:

- **Modules are versioned in lockstep with Redis.** Redis 8.0 ships all of these capabilities as version 8.0, and each Redis version requires the exact matching module version. Redis X.Y requires modules of version X.Y.

- **Modules share the Redis lifecycle.** Because the whole feature set (Redis X.Y plus its modules X.Y) ships and is supported as a single unit, the end-of-life for the modules follows the Redis lifecycle rather than a separate per-module schedule. For Redis Software, this is the [Redis Software product lifecycle]({{< relref "/operate/rs/installing-upgrading/product-lifecycle" >}}), where the end-of-life for each major release occurs 24 months after the formal release of the subsequent major version.

The module APIs continue to follow [semantic versioning](https://semver.org/).

## Before Redis 8.0

The following sections describe the release lifecycle and end-of-life schedule for module versions released before Redis 8.0, when modules were distributed and versioned separately as part of Redis Stack.

### Module release numbering

Redis modules use a three-place numbering scheme to identify released versions.

The format is "Major1.Major2.Minor".

- Major sections of the version number represent fundamental changes to functionality and feature capabilities. The _Major1_ and _Major2_ part of the version number are incremented according to the size and scale of the changes in each release.

- The _Minor_ section of the version number represents quality improvements and fixes to existing capabilities.  The minor release number is increased when release quality improves.

### Module end-of-life schedule {#modules-endoflife-schedule}

End-of-Life for a given Major version is 18 months after the formal release of
that version or 12 months after the release of the next subsequent (following) version, whichever comes last.

#### RediSearch

{{< table-csv "redisearch-lifecycle.csv" 2 >}}

#### RedisJSON

{{< table-csv "redisjson-lifecycle.csv" 2 >}}

#### RedisGraph

{{< table-csv "redisgraph-lifecycle.csv" 2 >}}

#### RedisTimeSeries

{{< table-csv "redistimeseries-lifecycle.csv" 2 >}}

#### RedisBloom

{{< table-csv "redisbloom-lifecycle.csv" 2 >}}

#### RedisGears

{{< table-csv "redisgears-lifecycle.csv" 2 >}}
