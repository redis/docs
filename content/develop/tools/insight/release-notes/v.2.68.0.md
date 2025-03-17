---
Title: Redis Insight v2.68.0, March 2025
linkTitle: v2.68.0 (March 2025)
date: 2025-03-20 00:00:00 +0000
description: Redis Insight v2.68
weight: 1

---
## 2.68 (March 2025)
This is the General Availability (GA) release of Redis Insight 2.68.

### Highlights
- Preconfigure database connections using environment variables or a JSON file, enabling centralized and efficient configuration.
- Test source database connections for your Redis Data Integration](https://redis.io/docs/latest/integrate/redis-data-integration/) (RDI) pipeline to ensure that RDI can connect to the source database and keep your Redis cache updated with changes.
- Connect to databases without requiring the `INFO` command.

### Details

**Features and improvements**
- [#308](https://github.com/redislabsdev/RedisInsight-Cloud/pull/308) Preconfigure database connections using environment variables or a JSON file, enabling centralized and efficient configuration. Details are about environment variables and a JSON file format are provided [here]().
- [#4368](https://github.com/RedisInsight/RedisInsight/pull/4368), [#4389](https://github.com/RedisInsight/RedisInsight/pull/4389) Test source database connections for your Redis Data Integration](https://redis.io/docs/latest/integrate/redis-data-integration/) (RDI) pipeline to ensure that RDI can connect to the source database and keep your Redis cache updated with changes.
- [#4377](https://github.com/RedisInsight/RedisInsight/pull/4377), [#4383](https://github.com/RedisInsight/RedisInsight/pull/4383) Connect to databases without requiring the `INFO` command. If your Redis user lacks permission for this command, database statistics will be hidden.
- []() Added the ability to download a file containing all keys deleted via bulk actions.
- [#4335](https://github.com/RedisInsight/RedisInsight/pull/4335) [Redis Data Integration](https://redis.io/docs/latest/integrate/redis-data-integration/) deployment errors are now stored in a file instead of being displayed in error messages to optimize space usage.
- [#4374](https://github.com/RedisInsight/RedisInsight/pull/4374) Connection errors for clustered databases now include more detailed information to improve troubleshooting.
- [#4358](https://github.com/RedisInsight/RedisInsight/pull/4358) A new setting allows to manually force standalone mode instead of automatic clustered mode when adding or editing a clustered database connection.
- [#4418](https://github.com/RedisInsight/RedisInsight/pull/4418) An ability to see key names in HEX format. To switch from Unicode to HEX, open the "Decompression & Formatters" tab while adding or editing a database connection.
- [#4401](https://github.com/RedisInsight/RedisInsight/pull/4401) Added an option to close key details for unsupported data types in the Browser to free up space.
- [#4296](https://github.com/RedisInsight/RedisInsight/pull/4296) When working with JSON data types, Redis Insight now uses [JSONPath ($) syntax](https://redis.io/docs/latest/develop/data-types/json/path/).

**SHA-256 Checksums**
| Package | SHA-256 |
|--|--|
| Windows |  |
| Linux AppImage |  |
| Linux Debian|  |
| MacOS Intel |  |
| MacOS Apple silicon |  |
