---
Title: View Redis slow log
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: Slow log
weight: $weight
url: '/operate/rs/7.4/clusters/logging/redis-slow-log/'
---
On the **Databases** \> **Slowlog** page, you can view Slow Log details
for Redis Enterprise Software databases.

[Redis Slow Log](http://redis.io/commands/slowlog) is one of the best
tools for debugging and tracing your Redis database, especially if you
experience high latency and high CPU usage with Redis operations.
Because Redis is based on a single threaded architecture, Redis Slow Log
can be much more useful than slow log mechanisms of multi-threaded
database systems such as MySQL Slow Query Log.

Unlike tools that introduce lock overhead (which complicates the debugging
process), Redis Slow Log is highly effective at showing the actual processing time of each command.

Redis Enterprise Software includes enhancements to the standard Redis
Slow Log capabilities that allow you to analyze the execution time
complexity of each command. This enhancement can help you better analyze
Redis operations, allowing you to compare the differences between
execution times of the same command, observe spikes in CPU usage, and
more.

This is especially useful with complex commands such as
[ZUNIONSTORE](http://redis.io/commands/zunionstore),
[ZINTERSTORE](http://redis.io/commands/zinterstore) and
[ZRANGEBYSCORE](http://redis.io/commands/zrangebyscore).

The enhanced Redis Enterprise Software Slow Log adds the **Complexity info** field to the
output data.

View the complexity info data by its respective command in the table
below:

| Command | Value of interest | Complexity |
|------------|-----------------|-----------------|
| LINSERT | N - list len | O(N) |
| LREM | N - list len | O(N) |
| LTRIM | N - number of removed elements | O(N) |
| PUBLISH | N - number of channel subscribers</br>M - number of subscribed patterns | O(N+M) |
| PSUBSCRIBE | N - number of patterns client is subscribed to</br>argc - number of arguments passed to the command | O(argc\*N) |
| PUNSUBSCRIBE | N - number of patterns client is subscribed to</br>M - total number of subscribed patterns</br>argc - number of arguments passed to the command | O(argc\*(N+M)) |
| SDIFF | N - total number of elements in all sets | O(N) |
| SDIFFSTORE | N - total number of elements in all sets | O(N) |
| SINTER                | N - number of elements in smallest set</br>argc - number of arguments passed to the command | O(argc\*N) |
| SINTERSTORE           | N - number of elements in smallest set</br>argc - number of arguments passed to the command | O(argc\*N) |
| SMEMBERS              | N - number of elements in a set | O(N) |
| SORT                  | N - number of elements in the when no sorting list/set/zset</br>M - number of elements in result | O(N+M\*log(M))O(N) |
| SUNION                | N - number of elements in all sets | O(N) |
| SUNIONSTORE           | N - number of elements in all sets | O(N) |
| UNSUBSCRIBE           | N - total number of clients subscribed to all channels | O(N) |
| ZADD                  | N - number of elements in the zset | O(log(N)) |
| ZCOUNT                | N - number of elements in the zset</br>M - number of elements between min and max | O(log(N)+M) |
| ZINCRBY               | N - number of elements in the zset | O(log(N)) |
| ZINTERSTORE           | N – number of elements in the smallest zset</br>K – number of zsets</br>M – number of elements in the results set | O(N\*K)+O(M\*log(M)) |
| ZRANGE                | N – number of elements in the zset</br>M – number of results | O(log(N)+M) |
| ZRANGEBYSCORE         | N – number of elements in the zset</br>M – number of results | O(log(N)+M) |
| ZRANK                 | N – number of elements in the zset | O(log(N)) |
| ZREM                  | N – number of elements in the zset</br>argc – number of arguments passed to the command | O(argc\*log(N)) |
| ZREMRANGEBYRANK       | N – number of elements in the zset</br>argc – number of arguments passed to the command | O(log(N)+M) |
| ZREMRANGEBYSCORE      | N – number of elements in the zset</br>M – number of elements removed | O(log(N)+M) |
| ZREVRANGE             | N – number of elements in the zset</br>M – number of results | O(log(N)+M) |
| ZREVRANK              | N – number of elements in the zset | O(log(N)) |
| ZUNIONSTORE           | N – sum of element counts of all zsets</br>M – element count of result | O(N)+O(M\*log(M)) |
