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
Redis Enterprise Software follows the [Redis Enterprise lifecycle]({{< relref "/operate/rs/installing-upgrading/product-lifecycle" >}}).  (For complete details, see the Redis Enterprise Software [subscription agreement](https://redis.com/software-subscription-agreement).)

The modules included in Redis Stack also follow a release lifecycle and schedule. Here, you'll find the "end-of-life" dates for each module and release.

## Module release numbering

Redis modules use a three-place numbering scheme to identify released versions.

The format is "Major1.Major2.Minor".

- Major sections of the version number represent fundamental changes to functionality and feature capabilities. The _Major1_ and _Major2_ part of the version number are incremented according to the size and scale of the changes in each release.

- The _Minor_ section of the version number represents quality improvements and fixes to existing capabilities.  The minor release number is increased when release quality improves.

## Module end-of-life schedule {#modules-endoflife-schedule}

End-of-Life for a given Major version is 18 months after the formal release of
that version or 12 months after the release of the next subsequent (following) version, whichever comes last.

### RediSearch

{{< table-csv "redisearch-lifecycle.csv" 2 >}}

### RedisJSON

{{< table-csv "redisjson-lifecycle.csv" 2 >}}

### RedisGraph

{{< table-csv "redisgraph-lifecycle.csv" 2 >}}

### RedisTimeSeries

{{< table-csv "redistimeseries-lifecycle.csv" 2 >}}

### RedisBloom

{{< table-csv "redisbloom-lifecycle.csv" 2 >}}

### RedisGears

{{< table-csv "redisgears-lifecycle.csv" 2 >}}
