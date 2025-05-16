---
Title: Redis Insight v2.56.0, September 2024
linkTitle: v2.56.0 (September 2024)
date: 2024-09-09 00:00:00 +0000
description: Redis Insight v2.56
weight: 1

---
## 2.56 (September 2024)
This is the General Availability (GA) release of Redis Insight 2.56.

### Highlights
- Seamlessly sign in to your Redis Cloud account using the new [SAML single sign-on](https://redis.io/docs/latest/operate/rc/security/console-access-control/saml-sso/) feature, now available alongside existing social logins via Google and GitHub. This integration lets you connect to all your Redis Cloud databases in several clicks.
- Start your Redis journey faster with a sample data set automatically loaded for new free Redis Cloud databases created directly within Redis Insight.
- Focus on what matters most:
  - Hide or show [TTL for individual hash fields](https://redis.io/docs/latest/develop/data-types/hashes/?utm_source=redisinsight&utm_medium=release_notes&utm_campaign=2.52#field-expiration) to create a cleaner, more efficient workspace.
  - Enhanced vector data representation with updated 32-bit and 64-bit vector formatters in the Browser.
  - UX optimizations to make it easier and more intuitive to connect to your [Redis Data Integration (RDI)](https://redis.io/data-integration/?utm_source=redisinsight&utm_medium=repository&utm_campaign=release_notes) instance within Redis Insight.


### Details

**Features and improvements**
- [#3727](https://github.com/RedisInsight/RedisInsight/pull/3727) Seamlessly sign in to your Redis Cloud account using the new [SAML single sign-on](https://redis.io/docs/latest/operate/rc/security/console-access-control/saml-sso/) feature, now available alongside existing social logins via Google and GitHub. This integration lets you connect to all your Redis Cloud databases in several clicks. Before setting up SAML in Redis Cloud, you must first [verify domain ownership](https://redis.io/docs/latest/operate/rc/security/console-access-control/saml-sso/?utm_source=redisinsight&utm_medium=repository&utm_campaign=release_notes) for any domains associated with your SAML setup. Note that integration with Redis Cloud is currently available only in the desktop version of Redis Insight.
- [#3659](https://github.com/RedisInsight/RedisInsight/pull/3659) Start your Redis journey faster with a sample data set automatically loaded for new free Redis Cloud databases created directly within Redis Insight. This feature ensures a smoother setup process, allowing you to dive into your data immediately.
- [#3624](https://github.com/RedisInsight/RedisInsight/pull/3624) The ability to hide or show [TTL for individual hash fields](https://redis.io/docs/latest/develop/data-types/hashes/?utm_source=redisinsight&utm_medium=release_notes&utm_campaign=2.52#field-expiration) to create a cleaner, more efficient workspace. This optimization complements the highly requested hash field expiration feature introduced in the [first release candidate of Redis 7.4](https://github.com/redis-stack/redis-stack/releases/tag/v7.4.0-v0).
- [#3701](https://github.com/RedisInsight/RedisInsight/pull/3701) Enhanced vector data representation with updated 32-bit and 64-bit vector formatters in the Browser. These changes ensure that vector formatters are applied only to data containing unprintable values when converted to UTF-8, providing a clearer and more accurate view of your data.
- [#3714](https://github.com/RedisInsight/RedisInsight/pull/3714) UX optimizations to make it easier and more intuitive to connect to your [Redis Data Integration (RDI)](https://redis.io/data-integration/?utm_source=redisinsight&utm_medium=repository&utm_campaign=release_notes) instance within Redis Insight.
- [#3665](https://github.com/RedisInsight/RedisInsight/pull/3665) A new timestamp formatter in the Browser to improve data readability. This formatter converts timestamps in hash fields to a human-readable format, making it easier to interpret results, validate and optimize queries, and inspect indexed data when using the [Redis Query Engine](https://redis.io/docs/latest/develop/interact/search-and-query/?utm_source=redisinsight&utm_medium=repository&utm_campaign=release_notes).
- [#3730](https://github.com/RedisInsight/RedisInsight/pull/3730) Date and time format customization to make the data more intuitive in Redis Insight. This flexibility helps match your local time zone or standardize it to UTC for better alignment in time-critical operations across global teams.
