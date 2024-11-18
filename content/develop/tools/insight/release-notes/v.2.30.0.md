---
Title: RedisInsight v2.30.0, July 2023
linkTitle: v2.30.0 (July 2023)
date: 2023-07-27 00:00:00 +0000
description: RedisInsight v2.30
weight: 1
---
## 2.30 (July 2023)
This is the General Availability (GA) release of RedisInsight 2.30.

### Highlights
Introducing support for [triggers and functions](https://github.com/RedisGears/RedisGears/) that bring application logic closer to your data and give Redis powerful features for event-driven data processing

### Details

**Features and improvements**

[#2247](https://github.com/RedisInsight/RedisInsight/pull/2247), [#2249](https://github.com/RedisInsight/RedisInsight/pull/2249), [#2273](https://github.com/RedisInsight/RedisInsight/pull/2273), [#2279](https://github.com/RedisInsight/RedisInsight/pull/2279) Support for [triggers and functions](https://github.com/RedisGears/RedisGears/) that add the capability to execute server-side functions triggered by events or data operations to:
 - Speed up applications by running the application logic where the data lives
 - Eliminate the need to maintain the same code across different applications by moving application functionality inside the Redis database
 - Maintain consistent data when applications react to any keyspace change
 - Improve code resiliency by backing up and replicating triggers and functions along with the database

Triggers and functions work with a JavaScript engine, which lets you take advantage of JavaScript’s vast ecosystem of libraries and frameworks and modern, expressive syntax.
