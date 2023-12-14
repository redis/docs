---
Title: Redis Enterprise Software 5.0.2 (2018 March)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 5.0.2 (2018 March)
weight: 92
---
Redis Enterprise Software 5.0.2 is now available. Key features include
functional and performance updates for CRDB, changes to module
deployment, and general fixes.

## Overview

If you are upgrading from a previous version, make sure to review the
upgrade instructions before beginning the upgrade process.

You can upgrade to RS 5.0.2 from RS 4.4.2 and above. If you have a
version older than 4.4.2, you must first upgrade to at least 5.0.

{{< note >}}
Starting from RS 5.0.2, ports 3338 and 3339 should also be opened
on each node for the purpose of internal cluster communication.
For more information, check the ['network port
configurations']({{< relref "/operate/rs/networking/port-configurations.md" >}})
page
{{< /note >}}

## New features

### CRDBs

- The ability to add and remove participating clusters from a CRDB
- Communications between participating clusters can be encrypted using
    SSL/TLS
- Imports can be done to an existing database without flushing the
    existing data beforehand.

### Modules

- Redis Enterprise Modules are installed with Redis Enterprise
    Software by default
- RedisBloom and RediSearch Enterprise have been updated to newer
    versions

### Other

- Discovery Service supports encryption using SSL/TLS
- Starting from version 5.0.2 build #30, Redis Enterprise Software is
    supported on RHEL 7.5

## Important fixes

- RS16153 -- Supervisord version update
- RS16667 - Fixed issue with 'rladmin status' timeout
- RS17746 - Fixed upgrade issue when -s option used
- RS17997, RS18088 - Upgrade issues when using non-default socket
    file path
- RS8584 -- Endpoint migration provided misleading plan message
- RS17696 - Fixed issues with Multi-proxy and intermittent network
    issues
- RS17362 - Upgrade fails under some circumstances
- RS18351 - Listener active after node has been declared dead
- RS18874 - Fixed OOM issue due to redis_mgr high memory consumption
- RS19002 - Fixed wrong message when an upgrade of a quorum node with
    all-nodes policy takes place

**Important Fixes in Build #30:**

- RS19701 - Fixed high CPU usage on large scale clusters
- RS19869- Added support for Redis
    version 4.0.9
- RS20153- Fixed Redis important security issues related to the Lua
    scripting engine
- RS19852- Fixed proxy crash which might happen for SSL-enabled
    DBs

## Known limitations

- Since Redis Enterprise CRDBs have counters, unlike traditional Redis
    databases, they must be handled differently when importing. There is
    a special type of import because of importing counter data types.
    When performing the import through the admin console, you will be prompted
    to confirm you want to add the data to the CRDB or stop and go flush
    the database.
- This version of RS comes with a pre-bundled python which might
    over-ride your default installed python version, this can be solved
    by changing your PATH environment variable.
- Uploading a Redis Module through the admin console, can be performed only
    when the admin console is connected to the master node.
- Write operations are not allowed for database which was created with
    password of exactly 50-characters.
