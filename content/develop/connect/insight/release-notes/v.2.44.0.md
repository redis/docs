---
Title: RedisInsight v2.44.0, February 2024
linkTitle: v2.44.0 (February 2024)
date: 2024-02-29 00:00:00 +0000
description: RedisInsight v2.44
weight: 1
---
## 2.44 (February 2024)
This is the General Availability (GA) release of RedisInsight 2.44.

### Highlights
- Added support for SSH tunneling for clustered databases, unblocking some users who want to migrate from RESP.app to RedisInsight.
- UX optimizations in the Browser layout to make it easier to leverage [search and query](https://redis.io/docs/interact/search-and-query/?utm_source=redisinsight&utm_medium=main&utm_campaign=redisinsight_release_notes) indexes.

### Details

**Features and improvements**
- [#2711](https://github.com/RedisInsight/RedisInsight/pull/2711), [#3040](https://github.com/RedisInsight/RedisInsight/pull/3040) Connect to your clustered Redis database via SSH tunnel using a password or private key in PEM format.
- [#3030](https://github.com/RedisInsight/RedisInsight/pull/3030), [#3070](https://github.com/RedisInsight/RedisInsight/pull/3070) UX optimizations in the Browser layout to enlarge the "Filter by Key" input field in the Browser and optimize the display of long [search and query](https://redis.io/docs/interact/search-and-query/?utm_source=redisinsight&utm_medium=main&utm_campaign=redisinsight_release_notes) indexes.
- [#3033](https://github.com/RedisInsight/RedisInsight/pull/3033), [#3036](https://github.com/RedisInsight/RedisInsight/pull/3036) Various improvements for custom [tutorials](https://github.com/RedisInsight/Tutorials), including visual highlighting of Redis code blocks and strengthening security measures for bulk data uploads by providing an option to download and preview the list of commands for upload.
- [#3010](https://github.com/RedisInsight/RedisInsight/pull/3010) Enhancements to prevent authentication errors caused by [certain special characters](https://github.com/RedisInsight/RedisInsight/issues/3019) in database passwords. 

**Bugs**
- [#3029](https://github.com/RedisInsight/RedisInsight/pull/3029) A fix for cases when autofill [prevents](https://github.com/RedisInsight/RedisInsight/issues/3026) the form to auto-discover Redis Enterprise Cluster database from being submitted.
