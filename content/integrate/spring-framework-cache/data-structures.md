---
LinkTitle: Data structures
Title: Use Redis data structures with Spring
alwaysopen: false
categories:
- docs
- integrate
- stack
- oss
- rs
- rc
- oss
- client
description: Use RedisTemplate operations to work with Redis data structures, such as a sorted set for a leaderboard.
group: framework
summary: Spring Data Redis exposes Redis data structures through operations on RedisTemplate, so you can build features such as a leaderboard on a sorted set.
type: integration
weight: 12
---

Spring Data Redis exposes each Redis data structure through an operations object on a
template. With the [starter](/content/integrate/spring-framework-cache/_index.md#requirements),
Spring Boot creates a `StringRedisTemplate` that you can inject into any bean. This page
shows how to use the sorted set operations (`ZSetOperations`) to build a
[leaderboard](/content/develop/use-cases/leaderboard/_index.md).
See [Sorted sets](/content/develop/data-types/sorted-sets.md) for details of the
underlying data type.

## Build a leaderboard with a sorted set

Get the `ZSetOperations` object from the template and use it to update and query scores:

```java
@Service
public class Leaderboard {
    private static final String KEY = "leaderboard:global";

    private final ZSetOperations<String, String> zset;

    Leaderboard(StringRedisTemplate template) {
        this.zset = template.opsForZSet();
    }

    public void addScore(String player, double points) {
        zset.incrementScore(KEY, player, points);
    }

    public Set<TypedTuple<String>> top(int n) {
        return zset.reverseRangeWithScores(KEY, 0, n - 1);
    }

    public Long rank(String player) {
        Long rank = zset.reverseRank(KEY, player);
        return rank == null ? null : rank + 1; // convert 0-based to 1-based
    }
}
```

The `incrementScore` method adds to a player's score with
[`ZINCRBY`](/content/commands/zincrby.md), creating the player if needed.
The `reverseRank` method uses [`ZREVRANK`](/content/commands/zrevrank.md), and
`reverseRangeWithScores` reads the highest scores with a
[reverse range query](/content/commands/zrange.md).

After `addScore("alice", 10)`, `addScore("bob", 25)`, and `addScore("alice", 20)`,
`top(2)` returns alice with a score of 30.0 followed by bob with 25.0, and `rank("alice")`
returns 1. The `reverseRank` method returns `null` for a player that isn't in the
sorted set, and its ranks start at 0, so the example adds 1 to get a 1-based rank.

## Other data structures

The template provides a similar operations object for each data type, such as
`opsForValue()`, `opsForHash()`, `opsForList()`, `opsForSet()`, and `opsForStream()`.
To store objects rather than strings, define a `RedisTemplate` with the serializers
you need. See the
[Spring Data Redis template documentation](https://docs.spring.io/spring-data/redis/reference/redis/template.html)
for details.
