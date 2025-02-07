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

RedisBloom v2.8.5 requires:

- Minimum Redis compatibility version (database): 7.4
- Minimum Redis Enterprise Software version (cluster): 7.6 (TBD)

## v2.8.5 (January 2025)

This is a maintenance release for RedisBloom 2.8.

Update urgency: `SECURITY`: There are security fixes in the release.

Details:

- **Security and privacy:**
  - [#843](https://github.com/redisbloom/redisbloom/pull/843) (CVE-2024-53993) CMS: potential out-of-bounds write (MOD-6970)

- Bug fixes:
  - [#843](https://github.com/redisbloom/redisbloom/pull/843) `CMS.MERGE` crashes or hangs on negative number of keys (MOD-6964)
  - [#699](https://github.com/redisbloom/redisbloom/pull/699) `BF.RESERVE` crashes (OOM) on huge initialization values (MOD-7057)
  - [#843](https://github.com/redisbloom/redisbloom/pull/843) `CF.RESERVE` crashes (OOM) on huge initialization values (MOD-7058)
  - [#843](https://github.com/redisbloom/redisbloom/pull/843) `TOPK.RESERVE` crashes (OOM) on huge initialization values (MOD-7059)
  - [#843](https://github.com/redisbloom/redisbloom/pull/843) `CMS.INITBYDIM` and `CMS.INITBYPROB` crash (OOM) on huge initialization values (MOD-7060)

- Improvements:
  - [#801](https://github.com/redisbloom/redisbloom/pull/801) Support active memory defragmentation (MOD-7890)
  - [#829](https://github.com/redisbloom/redisbloom/pull/829) Added support for Ubuntu 22 and macOS 13 and 14

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
