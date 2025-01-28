---
Title: RedisInsight v2.34.0, September 2023
linkTitle: v2.34.0 (September 2023)
date: 2023-09-28 00:00:00 +0000
description: RedisInsight v2.34
weight: 1
---
## 2.34 (September 2023)
This is the General Availability (GA) release of RedisInsight 2.34.

### Highlights
- UX improvements to simplify the in-app provisioning and usage of a free [Redis Cloud](https://redis.com/comparisons/oss-vs-enterprise/?utm_source=redisinsight&utm_medium=rel_notes&utm_campaign=2_34) database with RedisInsight interactive tutorials. This will allow you to learn easily, among other things, how to leverage the native JSON data structure supporting structured querying and full-text search, including vector similarity search for your AI use cases
- Ability to refresh the list of [search indexes](https://redis.io/docs/interact/search-and-query/?utm_source=redisinsight&utm_medium=main&utm_campaign=main) displayed in Browser
- Set the color theme to follow the local system preferences

### Details

**Features and improvements** 
- [#2585](https://github.com/RedisInsight/RedisInsight/pull/2585) UX improvements to simplify the in-app provisioning and usage of a free [Redis Cloud](https://redis.com/comparisons/oss-vs-enterprise/?utm_source=redisinsight&utm_medium=rel_notes&utm_campaign=2_34) database with RedisInsight interactive tutorials. To provision a new database, click the "Try Redis Cloud" banner in the list of database connections page and follow the steps
- [#2606](https://github.com/RedisInsight/RedisInsight/pull/2606) Ability to refresh the list of [search indexes](https://redis.io/docs/interact/search-and-query/?utm_source=redisinsight&utm_medium=main&utm_campaign=main) displayed in Browser
- [#2593](https://github.com/RedisInsight/RedisInsight/pull/2593) UX optimizations to improve the back navigation to the list of databases, including for small resolutions
- [#2599](https://github.com/RedisInsight/RedisInsight/pull/2599) Added an option to set the color theme to follow the local system preferences
- [#2563](https://github.com/RedisInsight/RedisInsight/pull/2563) Load a new library from the Functions tab within the [Triggers and Functions](https://redis.com/blog/introducing-triggers-and-functions/?utm_source=redisinsight&utm_medium=main&utm_campaign=main) tool
- [#2496](https://github.com/RedisInsight/RedisInsight/pull/2496) Set milliseconds as a default unit in Slow Log

**Bugs**
- [#2587](https://github.com/RedisInsight/RedisInsight/pull/2587) Display detailed [errors](https://github.com/RedisInsight/RedisInsight/issues/2562) in transactions run via CLI or Workbench
