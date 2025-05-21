---
Title: Redis Insight v2.70.0, May 2025
linkTitle: v2.70.0 (May 2025)
date: 2025-05-21 00:00:00 +0000
description: Redis Insight v2.70
weight: 1

---
## 2.70 (May 2025)
This is the General Availability (GA) release of Redis Insight 2.70.

### Highlights
- Added support for tagging database connections to filter and organize them more effectively.
- Introduced highly requested improvements for working with JSON, including full-value editing and the ability to search within a JSON value.

### Details

**Features and improvements**
- [#4476](https://github.com/RedisInsight/RedisInsight/pull/4476), [#4457](https://github.com/RedisInsight/RedisInsight/pull/4457) Added support for database tags using key-value pairs to help categorize and filter database connections. Tags can be created within Redis Insight or imported from [Redis Cloud](https://redis.io/cloud/) or [Redis Software](https://redis.io/software/).
- [#4457](https://github.com/RedisInsight/RedisInsight/pull/4457) Added the ability to hide columns in the database list to optimize screen space.
- [#4522](https://github.com/RedisInsight/RedisInsight/pull/4522), [#4527](https://github.com/RedisInsight/RedisInsight/pull/4527), [#4483](https://github.com/RedisInsight/RedisInsight/pull/4483) Introduced highly requested improvements ([#2128](https://github.com/RedisInsight/RedisInsight/issues/2128), [#1686](https://github.com/RedisInsight/RedisInsight/issues/1686), [#4424](https://github.com/RedisInsight/RedisInsight/issues/4424)) for working with the JSON data type, including the ability to edit the entire JSON value and search within a JSON using native `Ctrl+F`/`Cmd+F`, powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/).
- [#4483](https://github.com/RedisInsight/RedisInsight/pull/4483) Added a confirmation prompt when attempting to create a duplicate key in a JSON object, preventing silent overwrites.

**Bugs**
- [#4514](https://github.com/RedisInsight/RedisInsight/pull/4514) Fixed an issue ([#4478](https://github.com/RedisInsight/RedisInsight/issues/4478)) where accessing a JSON key could result in a “Cannot read properties of undefined (reading '0')” error.

**SHA-256 Checksums**
| Package | SHA-256 |
|--|--|
| Windows |  |
| Linux AppImage |  |
| Linux Debian|  |
| MacOS Intel |  |
| MacOS Apple silicon |  |
