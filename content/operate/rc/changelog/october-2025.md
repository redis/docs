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

### Redis 8.2 on Redis Cloud Pro

Redis 8.2 is now available on Redis Cloud Pro. 

Starting with the release of Redis 8.2 on Redis Cloud Pro, Redis Cloud will automatically upgrade your database to the latest minor version during maintenance windows. See [Redis version management]({{< relref "/operate/rc/databases/version-management" >}}) for more information.

See [upgrade database version]({{< relref "/operate/rc/databases/version-management/upgrade-version" >}}) to learn how to upgrade your existing Pro database to the latest version.

## Security fixes

Redis Cloud has already been updated with a patches for the following vulnerabilities: 

- (CVE-2025-49844) A Lua script may lead to remote code execution
- (CVE-2025-46817) A Lua script may lead to integer overflow and potential RCE
- (CVE-2025-46818) A Lua script can be executed in the context of another user
- (CVE-2025-46819) LUA out-of-bound read

No further action is required at this time. 

For more information, see the [Redis blog](https://redis.io/blog/security-advisory-cve-2025-49844/) and the [Redis release notes](https://github.com/redis/redis/releases).
