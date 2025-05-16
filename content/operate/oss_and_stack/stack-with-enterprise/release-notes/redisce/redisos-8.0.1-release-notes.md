---
Title: Redis Open Source 8.0.1 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source 8.0.1 release notes.
linkTitle: v8.0.1 (May 2025)
min-version-db: blah
min-version-rs: blah
weight: 9
---

## Redis Open Source 8.0.1 (May 2025)

Update urgency: `MODERATE`: Plan an upgrade of the server, but it's not urgent.

### Performance and resource utilization improvements

- [#13959](https://github.com/redis/redis/pull/13959) Vector sets - faster `VSIM` `FILTER` parsing.

### Bug fixes

- [#QE6083](https://github.com/RediSearch/RediSearch/pull/6083) Query Engine - revert default policy `search-on-timeout` to `RETURN`.
- [#QE6050](https://github.com/RediSearch/RediSearch/pull/6050) Query Engine - `@__key` on `FT.AGGREGATE` used as reserved field name preventing access to Redis keyspace.
- [#QE6077](https://github.com/RediSearch/RediSearch/pull/6077) Query Engine - crash when calling `FT.CURSOR DEL` while reading from the CURSOR.

### Notes

- Fixed incorrect text in the license files.
