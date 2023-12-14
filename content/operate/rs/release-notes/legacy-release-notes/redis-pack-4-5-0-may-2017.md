---
Title: Redis Enterprise Pack 4.5 Release Notes (May 2017)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 4.5 (May 2017)
weight: 94
---
If you are upgrading from a previous version, make sure to review the
upgrade instructions before beginning the upgrade process.

You can upgrade to this version from any 4.4 version. If you have a
version older than 4.4 you must first upgrade to 4.4 or higher, and only
then upgrade to this version.

## New features

### The new discovery service with supportfor Redis Sentinel API

The Discovery Service provides an IP-based connection management service
used when connecting to Redis Enterprise Pack databases. When used in
conjunction with Redis Enterprise Pack's other high availability
features, the Discovery Service assists an application cope with
topology changes such as adding, removing of nodes, node failovers and
so on. It does this by providing your application with the ability to
easily discover which node hosts the database endpoint. The API used for
discovery service is compliant with the Redis Sentinel API.

Discovery Service is an alternative for applications that do not want to
depend on DNS name resolution for their connectivity. Discovery Service
and DNS based connectivity are not mutually exclusive. They can be used
side by side in a given cluster where some clients can use Discovery
Service based connection while others can use DNS name resolution when
connecting to databases.

### Building large databases with RAM and Flash memory in Auto Tiering v2.0

With Redis Enterprise Pack 4.5, Auto Tiering v2 is production
ready. RFv2 brings performance, reliability, and stability enhancements
as well as many features customers have been waiting for.

Auto Tiering offers users of Redis Enterprise Pack and
Redis Cloud Private the unique ability to operate a Redis
database that spans both RAM and flash memory (SSD), but remains
separate from Redis Enterprise Pack's persistence mechanisms. Whilst
keys are always stored in RAM, RoF intelligently manages the location of
their values (RAM vs Flash) in the database via a LRU-based
(least-recently-used) mechanism. Hot values will be in RAM and
infrequently used, while warm values will be ejected to flash memory.
This enables you to have much larger datasets with RAM-like latency and
performance, but at dramatically lower cost than an all-RAM database.

### Additional capabilities

Support for additional Redis commands and features:

- The Redis TOUCH command is now supported
- Redis version upgraded to 3.2.8
- Support for OBJECT in Lua scripts

Support has been added RHEL 7.3 with this version.

## Important fixes

- RP10106 - SSL Certificate should not need to be signed with a
    stronger hashing algorithm to be accepted
- RP10465 - failover times can be higher under certain scenarios in
    local watchdog profile
- RP10633 - Improve install.sh and answers file
- RP11880 - Improved replica sync and add node robustness
- RP8689 - Minimized impact when changing RAM-Flash limit on Redis
    Enterprise Flash
- RP12063 - Improved Redis Flash data import/population performance
- RP11608 - Improvements to databases.txt creation in support package
- RP11941 - Eliminated warning and errors during upgrade on RHEL6
    with leash and python2.6 is installed
- RP11994 - Databases under certain cases may not display in UI even
    though they are in the cluster metadata and safely operating.
- RP12438 - Email alerts with Amazon SES may fail under certain
    conditions.
- RP12538 - Redis failover was initiated by node_wd during sync to
    new replica
- RP10264 - Improved debuginfo package for better supportability

Important fixes in RP 4.5.0-22

- RP12667 - NGINX security improvements, improved TLS and SSL related
    warnings on security scans.
- RP12690 - Added simpler ability to recover cluster from AWS S3
- RP13359 - Advanced memory allocation and booking enhancements

Important fixes in RP 4.5.0-31

- RP13060 - Client may experience reconnect issues after failover of
    the endpoint.
- RP13711 - Disabling IPv6 may cause startup of node services to fail
    (NGINX) on RHEL 7
- RP12747 - Calculation can be incorrect for memory quota for
    databases

Important fixes in RP 4.5.0-35

- RP12844 - cnm_exec crashes on "not enough arguments for format
    string"

Important fixes in RP 4.5.0-43

- RP9846 - In UI, Used Memory may show incorrect values
- RP12211 - UI fails import from a Redis OSS DB with password
- RP13356 - Enable failover when license expires
- RP14692 - rladmin status command may crash during backup
- RP14541 - In rare cases, DMC log grew quickly and caused stability
    issues
- RP15107 - When using Auto Tiering, it may cause DMC proxy
    crashes

Important fixes in RP 4.5.0-47

- Multiple important Auto Tiering updates.

Important fixes in RP 4.5.0-51

- 15161 - Make Unix socket folder configurable at install time
- 15164 - Make Unix socket folder configurable at build time
- 16082 - Make Unix socket folder configurable at runtime
- Fixed an issue where on import of data, TTL information was set
    incorrectly
