---
Title: RedisInsight v2.20.0, February 2023
linkTitle: v2.20.0 (Feb 2023)
date: 2023-02-28 00:00:00 +0000
description: RedisInsight v2.20.0
weight: 1
---
## 2.20.0 (February 2023)
This is the General Availability (GA) release of RedisInsight 2.20.

### Highlights
- Visualizations of [search](https://redis.io/docs/stack/search/) and [graph](https://redis.io/docs/stack/graph/) execution plans in Workbench
- Guided walkthrough of RedisInsight tools and capabilities for new users
- Bulk export database connections to a file
- Upload values of [RedisJSON](https://redis.io/docs/stack/json/) from a file for new keys in Browser
- Visualizations of [CLIENT LIST](https://redis.io/commands/client-list/) in Workbench
- See filters previously used in Browser

### Details
**Features and improvements**
- [#1629](https://github.com/RedisInsight/RedisInsight/pull/1629), [#1739](https://github.com/RedisInsight/RedisInsight/pull/1739), [#1740](https://github.com/RedisInsight/RedisInsight/pull/1740), [#1781](https://github.com/RedisInsight/RedisInsight/pull/1781) Investigate and optimize your [search](https://redis.io/docs/stack/search/) and [graph](https://redis.io/docs/stack/graph/) queries with new visualizations of execution plans in Workbench. Visualizations are supported for [FT.EXPLAIN](https://redis.io/commands/ft.explain/),[FT.PROFILE](https://redis.io/commands/ft.profile/), [GRAPH.EXPLAIN](https://redis.io/commands/graph.explain/), and [GRAPH.PROFILE](https://redis.io/commands/graph.profile/).
- [#1698](https://github.com/RedisInsight/RedisInsight/pull/1698) Explore RedisInsight's tools and capabilities with a new walkthrough when you start RedisInsight for the first time.
- [#1631](https://github.com/RedisInsight/RedisInsight/pull/1631), [#1632](https://github.com/RedisInsight/RedisInsight/pull/1632) Migrate your database connections to another RedisInsight instance by performing a bulk export of database connections to a file.
- [#1741](https://github.com/RedisInsight/RedisInsight/pull/1741) Upload [RedisJSON](https://redis.io/docs/stack/json/) values from a file for new keys in Browser.
- [#1653](https://github.com/RedisInsight/RedisInsight/pull/1653) Analyze client connections using new Workbench visualizations for [CLIENT LIST](https://redis.io/commands/client-list/).
- [#1625](https://github.com/RedisInsight/RedisInsight/pull/1625) Quickly set filters previously used in Browser by selecting them from the list of recently used filters.
- [#1713](https://github.com/RedisInsight/RedisInsight/pull/1713) See your new Redis keys added in Browser without a need to refresh the list of keys.
- [#1681](https://github.com/RedisInsight/RedisInsight/pull/1681), [#1692](https://github.com/RedisInsight/RedisInsight/pull/1692), [#1693](https://github.com/RedisInsight/RedisInsight/pull/1693) Avoid the timeout connection errors by configuring the connection timeout for databases added manually via host and port.
- [#1696](https://github.com/RedisInsight/RedisInsight/pull/1696), [#1703](https://github.com/RedisInsight/RedisInsight/pull/1703) Test the database connection before adding the database.
- [#1689](https://github.com/RedisInsight/RedisInsight/pull/1689) Update the port of an existing database connection instead of adding a new one.
- [#1731](https://github.com/RedisInsight/RedisInsight/pull/1731) Use database indexes based on [INFO keyspace](https://redis.io/commands/info/).

**Bugs**
- [#1678](https://github.com/RedisInsight/RedisInsight/pull/1678) Prevent crashes when SSH is set up on Linux.
- [#1697](https://github.com/RedisInsight/RedisInsight/pull/1697) Prevent crashes when working with [Redis streams](https://redis.io/docs/data-types/streams) with large IDs.
