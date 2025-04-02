---
Title: Redis Insight v2.68.0, April 2025
linkTitle: v2.68.0 (April 2025)
date: 2025-04-01 00:00:00 +0000
description: Redis Insight v2.68
weight: 1

---
## 2.68 (April 2025)
This is the General Availability (GA) release of Redis Insight 2.68.

### Highlights
- You can now test the connectivity to your source database when setting up a [Redis Data Integration](https://redis.io/docs/latest/integrate/redis-data-integration/) (RDI) data pipeline in Redis Insight. This will help ensure that RDI can connect to the source database and keep your Redis cache updated with changes from the source database.
- Configure database connections via environment variables or a JSON file, allowing for centralized and efficient configuration management. This is specifically useful for automated deployments.
- Allows connecting to databases without requiring the `INFO` command.

### Details

**Features and improvements**
- [#4368](https://github.com/RedisInsight/RedisInsight/pull/4368), [#4389](https://github.com/RedisInsight/RedisInsight/pull/4389) You can now test the connectivity to your source database when setting up a [Redis Data Integration](https://redis.io/docs/latest/integrate/redis-data-integration/) (RDI) data pipeline in Redis Insight. This will help ensure that RDI can connect to the source database and keep your Redis cache updated with changes from the source database.
- [#308](https://github.com/redislabsdev/RedisInsight-Cloud/pull/308) Configure database connections via environment variables or a JSON file, allowing for centralized and efficient configuration management. This is specifically useful for automated deployments. See [here](https://redis.io/docs/latest/operate/redisinsight/configuration/) for more details.
- [#4428](https://github.com/RedisInsight/RedisInsight/pull/4428) Added an environment variable to disable the ability to manage database connections (adding, editing, or deleting) in Redis Insight. This provides enhanced security and configuration control in scenarios where preventing changes to database connections is necessary. See [here](https://redis.io/docs/latest/operate/redisinsight/configuration/) for more details.
- [#4377](https://github.com/RedisInsight/RedisInsight/pull/4377), [#4383](https://github.com/RedisInsight/RedisInsight/pull/4383) Allows connecting to databases without requiring credentials for dangerous commands. In this mode, certain features, such as database statistics, are hidden.
- [#4427](https://github.com/RedisInsight/RedisInsight/pull/4427) Added the ability to download a file containing all keys deleted through bulk actions, which helps in tracking changes.
- [#4335](https://github.com/RedisInsight/RedisInsight/pull/4335) [Redis Data Integration](https://redis.io/docs/latest/integrate/redis-data-integration/) deployment errors are now stored in a file instead of being displayed in error messages, improving space efficiency.
- [#4374](https://github.com/RedisInsight/RedisInsight/pull/4374) Improved connection errors for clustered databases by adding detailed information to help with troubleshooting.
- [#4358](https://github.com/RedisInsight/RedisInsight/pull/4358) Added a setting to manually enforce standalone mode for clustered database connections instead of automatic clustered mode.
- [#4418](https://github.com/RedisInsight/RedisInsight/pull/4418) An ability to see key names in HEX format, useful for non-ASCII characters or debugging. To switch from Unicode to HEX, open the "Decompression & Formatters" tab while adding or editing a database connection.
- [#4401](https://github.com/RedisInsight/RedisInsight/pull/4401) Added an option to close key details for unsupported data types in the Browser to free up space.
- [#4296](https://github.com/RedisInsight/RedisInsight/pull/4296) When working with JSON data types, Redis Insight now uses [JSONPath ($) syntax](https://redis.io/docs/latest/develop/data-types/json/path/).

**SHA-256 Checksums**
| Package | SHA-256 |
|--|--|
| Windows | 50YAPT59n2cLQu+P7kvc+kT+FxnW67pV53F1xz/C1IfgjmycgWpemycosbooQdLvXWPK4GLgk/NOnoZMI/15Lg== |
| Linux AppImage | QbI7V8jCCVPum4jdd1W8CEOqT+iFzwUTrt9tVbu9Kpv81Pub27aIJve3kWDdXWyvxHPUlUOsBHIo/uHIzdFJPw== |
| Linux Debian| V0/W8RclF6q0uT6uBR/lDNMt+OXqm7xmkSYf9vd8xCe4mGWUQBHiACX/aIgWs8l3Na5AQCNSJLrHnDXWiDD9Fw== |
| MacOS Intel | j3bdEX0rvxPGBUMZ6hD9aD+C/WTR1bOZT+lekJqujkDnRSPMZS5syGfkd1cQfx8QSnM10qYBO4RCH0Ew0m3g0A== |
| MacOS Apple silicon | iKOsvtOLOMcAvlbxL1LJI+45DgJxc+VIe9mVdoJZaNtMPCTAdxBX07GcvVVGfJOE8MdomsKrN8S2yYek7L6YLQ== |
