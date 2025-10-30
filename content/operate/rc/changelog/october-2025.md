---
Title: Redis Cloud changelog (October 2025)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  October 2025.
highlights: Security fixes
linktitle: October 2025
weight: 65
tags:
- changelog
---

## New features

### Data Integration

Redis Cloud now supports [Redis Data Integration (RDI)]({{< relref "/operate/rc/databases/rdi" >}}) to create data pipelines that ingest data from a supported primary database to Redis. 

Using a data pipeline lets you have a cache that is always ready for queries. RDI Data pipelines ensure that any changes made to your primary database are captured in your Redis cache within a few seconds, preventing cache misses and stale data within the cache. 

See [Data Integration]({{< relref "/operate/rc/databases/rdi" >}}) to learn how to set up data pipelines with Redis Cloud.

## Security fixes

Redis Cloud has already been updated with a patches for the following vulnerabilities: 

- (CVE-2025-49844) A Lua script may lead to remote code execution
- (CVE-2025-46817) A Lua script may lead to integer overflow and potential RCE
- (CVE-2025-46818) A Lua script can be executed in the context of another user
- (CVE-2025-46819) LUA out-of-bound read

No further action is required at this time. 

For more information, see the [Redis blog](https://redis.io/blog/security-advisory-cve-2025-49844/) and the [Redis release notes](https://github.com/redis/redis/releases).
