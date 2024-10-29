---
Title: RedisBloom 2.8 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: RedisBloom 2.8 introduces improvements and bug fixes.
linkTitle: v2.8 (July 2024)
min-version-db: '7.4'
min-version-rs: 7.6 (TBD)
toc: 'true'
weight: 94
---

## Requirements

RedisBloom v2.8.2 requires:

- Minimum Redis compatibility version (database): 7.4
- Minimum Redis Enterprise Software version (cluster): 7.6 (TBD)

## v2.8 GA (v2.8.2) (July 2024)

This is the General Availability release of RedisBloom 2.8

### Headlines:

RedisBloom 2.8 introduces improvements and bug fixes.

### Details

- Bug fixes

  - [#773](https://github.com/RedisBloom/RedisBloom/pull/773) `CMS.MERGE`: reply with an error on overflow and underflow (MOD-6962)
  - [#720](https://github.com/RedisBloom/RedisBloom/pull/720) `BF` crashes on high error rate (MOD-6268)

{{< note >}}
- The version inside Redis will be 2.8.2 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.
- Minimal Redis version: 7.4
{{</note>}}
