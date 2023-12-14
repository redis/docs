---
Title: Redis Enterprise Software Release Notes 5.3 BETA (July 2018)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 5.3 beta(July 2018)
weight: 90
---
Redis Enterprise Software (RS) 5.3 is now available.

RS 5.3 is a preview version that includes all the capabilities of Redis Enterprise 5.2, plus support for Redis 5.0 with the new data type, which is called Streams.

## New features

RS 5.3 adds support for Redis 5.0 and is based on its latest Release Candidate (RC3). Redis 5.0 exposes the new Redis Streams data type, which provides a super fast in-memory abstraction of an append-only log. For more information and usage examples, check out the Streams documentation here.

## Preview considerations

As a preview version, we do not support upgrading to RS 5.3 from any previous version or upgrading from RS 5.3 to any future version. In addition, we do not commit to fixing bugs in RS 5.3.

## Known limitations

The RS 5.3 preview version does not support Enterprise Modules (- RediSearch, ReJSON and ReBloom), Auto Tiering or active-active Redis (CRDB).
