---
Title: RedisJSON 1.0 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Serialization cache for JSON.GET.
linkTitle: v1.0 (December 2017)
min-version-db: 4.0.0
min-version-rs: 5.0.0
weight: 100
---
## Requirements

RedisJSON v1.0.8 requires:

- Minimum Redis compatibility version (database): 4.0.0
- Minimum Redis Enterprise Software version (cluster): 5.0.0

## v1.0.8 (August 2021)

This is a maintenance release for version 1.0.

Update urgency: `LOW` -  No need to upgrade unless there are new features you want to use.

Details:

- Enhancements:
    - #[257](https://github.com/redisjson/redisjson/issues/257) Support inter shards TLS capability

- Bug fixes:
   - #[282](https://github.com/redisjson/redisjson/issues/282) Change `JSON.DEBUG` first key index to 2


## v1.0.7 (December 2020)

This is a maintenance release for version 1.0.

Headlines:

- This release improves overall stability and provides fixes for issues found after the previous release.

Details:

- [#222](https://github.com/RedisJSON/RedisJSON/pull/222) Validate path is not empty.
- [#253](https://github.com/RedisJSON/RedisJSON/pull/253) `NULL` de-reference after error.

## v1.0.5 (September 2020)

This is a maintenance release for version 1.0.

Headlines:

- This release improves overall stability and provides fixes for issues found after the previous release.

Details:

- Enhancements:
    - Republish docker image based on Redis 6
- Bugfixes:
    - #[200](https://github.com/RedisJSON/RedisJSON/issues/200) Following a call to JSON.ARRPOP and JSON.STRAPPEND, the LRU cache should be invalidated.

## v1.0.4 (February 2019)

This release updates the version to 1.0.4.

## v1.0.3 (12 September 2018)

This release disables the cache by default, and allows an explicit `CACHE` `<ON|OFF>` module argument to enable it.

## v1.0.2 (10 September 2018)

This release contains some bug fixes over 1.0.2. It also includes some ci changes as well.

## v1.0.1 (December 2017)

This version provides a serialization cache for JSON.GET (when used with the
default parameters). The cache policy is LRU (last recently used), and extremely
small items are not cached.

In the future, options may be added to configure the cache, but for the time being
the cache is intended to be small and transparent.
