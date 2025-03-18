---
Title: RedisBloom 2.6 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: RESP3 support. Bug fixes.
linkTitle: v2.6 (July 2023)
min-version-db: '7.2'
min-version-rs: 7.2.4
toc: 'true'
weight: 95
---
## Requirements

RedisBloom v2.6.17 requires:

- Minimum Redis compatibility version (database): 7.2
- Minimum Redis Enterprise Software version (cluster): 7.2.4

## v2.6.17 (February 2025)

This is a maintenance release for RedisBloom 2.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:
  - [#828](https://github.com/redisbloom/redisbloom/pull/828) `CMS.INCRBY` does not notify `WATCH`ers or client-side caching (MOD-8193)
  - [#827](https://github.com/redisbloom/redisbloom/pull/827) Top-K - suboptimal results after RDB load due to missing initialization (MOD-8194)

## v2.6.16 (January 2025)

This is a maintenance release for RedisBloom 2.6.

Update urgency: `SECURITY`: There are security fixes in the release.

Details:

- **Security and privacy:**
  - [#844](https://github.com/redisbloom/redisbloom/pull/844) (CVE-2024-53993) CMS: potential out-of-bounds write (MOD-6970)

- Bug fixes:
  - [#844](https://github.com/redisbloom/redisbloom/pull/844) `CMS.MERGE` crashes or hangs on negative number of keys (MOD-6964)

- Improvements:
  - [#830](https://github.com/redisbloom/redisbloom/pull/830) Added support for Ubuntu 22 and macOS 13 and 14

## v2.6.13 (July 2024)

This is a maintenance release for RedisBloom 2.6

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#720](https://github.com/RedisBloom/RedisBloom/pull/720) `BF` crashes on high error rate (MOD-6268)
  - [#773](https://github.com/RedisBloom/RedisBloom/pull/773) `CMS.MERGE`: reply with an error on overflow and underflow (MOD-6962)

## v2.6.12 (March 2024)

This is a maintenance release for RedisBloom 2.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#753](https://github.com/RedisBloom/RedisBloom/issues/753) Potential crash on `CMS.MERGE` when using invalid arguments

## v2.6.11 (January 2024)

This is a maintenance release for RedisBloom 2.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#727](https://github.com/RedisBloom/RedisBloom/pull/727) Additional fixes for potential crash on `CF.LOADCHUNK` (MOD-6344)

## v2.6.10 (January 2024)

This is a maintenance release for RedisBloom 2.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#735](https://github.com/RedisBloom/RedisBloom/pull/735) Potential crash on `CF.RESERVE` (MOD-6343)
  - [#727](https://github.com/RedisBloom/RedisBloom/pull/727) Potential crash on `CF.LOADCHUNK` (MOD-6344)

## v2.6.9 (December 2023)

This is a maintenance release for RedisBloom 2.6.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Bug fixes:

  - [#707](https://github.com/RedisBloom/RedisBloom/pull/707) Top-K: `TOPK.ADD` and `TOPK.QUERY` crash when an item name is an empty string (RED-114676)

## v2.6.8 (October 2023)

This is a maintenance release for RedisBloom 2.6.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Improvements:

  - [#684](https://github.com/RedisBloom/RedisBloom/pull/684), [#685](https://github.com/RedisBloom/RedisBloom/pull/685) Added support for CBL-Mariner 2
  - [#677](https://github.com/RedisBloom/RedisBloom/pull/677), [#678](https://github.com/RedisBloom/RedisBloom/pull/678) Added support for Rocky Linux 9 and RHEL9

## v2.6 GA (v2.6.3) (July 2023)

This is the General Availability release of RedisBloom 2.6.

### Headlines

RedisBloom 2.6 introduces support for RESP3 and bug fixes.

### Details

Improvements: 

- [#664](https://github.com/RedisBloom/RedisBloom/pull/664) `TOPK.ADD`, `TOPK.INCRBY`, and `TOPK.LIST` reply with blob string instead of simple string.

{{<note>}}
- The version inside Redis will be 2.6.3 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.

- Minimal Redis version: 7.2
{{</note>}}
