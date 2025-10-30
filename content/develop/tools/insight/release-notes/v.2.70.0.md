---
Title: Redis Insight v2.70.0, May 2025
linkTitle: v2.70.0 (May 2025)
date: 2025-05-28 00:00:00 +0000
description: Redis Insight v2.70
weight: 1

---
## 2.70 (May 2025)
This is the General Availability (GA) release of Redis Insight 2.70.

### Highlights
- Added support for tagging database connections, making it easier to organize and quickly find what you need. Tags can be created locally in Redis Insight or imported from [Redis Cloud](https://redis.io/cloud/) or [Redis Software](https://redis.io/software/).
- Introduced highly requested improvements for working with JSON, including full-value editing and the ability to search within a JSON key.

### Details

**Features and improvements**
- [#4476](https://github.com/RedisInsight/RedisInsight/pull/4476), [#4457](https://github.com/RedisInsight/RedisInsight/pull/4457) Added support for database tags using key-value pairs to help categorize and filter database connections. Tags can be created locally in Redis Insight or imported from [Redis Cloud](https://redis.io/cloud/) or [Redis Software](https://redis.io/software/).
- [#4457](https://github.com/RedisInsight/RedisInsight/pull/4457) Added the ability to hide columns in the database list to optimize screen space.
- [#4522](https://github.com/RedisInsight/RedisInsight/pull/4522), [#4527](https://github.com/RedisInsight/RedisInsight/pull/4527), [#4483](https://github.com/RedisInsight/RedisInsight/pull/4483) Introduced highly requested improvements ([#2128](https://github.com/RedisInsight/RedisInsight/issues/2128), [#1686](https://github.com/RedisInsight/RedisInsight/issues/1686), [#4424](https://github.com/RedisInsight/RedisInsight/issues/4424)) for working with the JSON data type, including the ability to edit the entire JSON value and search within a JSON using native Ctrl+F/Cmd+F, powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/).
- [#4483](https://github.com/RedisInsight/RedisInsight/pull/4483) Added a confirmation prompt when attempting to create a duplicate key in a JSON object, preventing silent overwrites.

**Bugs**
- [#4514](https://github.com/RedisInsight/RedisInsight/pull/4514) Fixed an issue ([#4478](https://github.com/RedisInsight/RedisInsight/issues/4478)) where accessing a JSON key could result in a "Cannot read properties of undefined (reading '0')" error.

**SHA-256 Checksums**
| Package | SHA-256 |
|--|--|
| Windows | AMAdQy5TsKc/76OAH4NdJ+abe/ogRdBGTPmVmAMgCG3O74hGZ0Q5h53HMaGzaOpTM+bEiRqTfi/i/iHgTNRmDA== |
| Linux AppImage | 6E1d++C6C4M8P/onVHrdsC1CwsdQ1dYysLedbIhsgmsxR9t37LA+mdxIWFOCi0Z/XZqox/kGb/EjPxRIyF2apw== |
| Linux Debian| 3opZq01Di5DCBEX1tYaO59dHbHmeG2928RrIZAcJKiZnGNLNbOeg3AuXalkYuzb3i/kIBLeEKQIwwzW7GFw0VA== |
| Linux RPM | bC7FpokqgG7/gMqHQRy4pB6U1leu5pWXAcS0jPfUveQHfrbth2zcNlCCIiZ7QW4eUbxeObmDK8dfiL3GojSBLg== |
| MacOS Intel | gLlxX8kt26QpO0Wa0xjA5+dvW+ZbayJPh/BJ6r4PsRO/l7t7plNNI7RtJKPO4kc39x6FqJ1ipT5poQQQn5lPhQ== |
| MacOS Apple silicon | V/yQCCf0sndGYgXNkjkKo7FrJwknnCDwKqBg+uUdKjpSwDaDa8zobSbREJ7rDdSMjj6F6eCedYPmhalfe0VZbw== |
