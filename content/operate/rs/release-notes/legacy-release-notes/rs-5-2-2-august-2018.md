---
Title: Redis Enterprise Software 5.2.2 (August 2018)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 5.2.2 (August 2018)
weight: 89
---
Redis Enterprise Software (RS) 5.2.2 is now available.

RS 5.2.2 is a minor version that includes important fixes and minor enhancements to Redis Enterprise 5.2.

## Overview

If you are upgrading from a previous version, make sure to review the upgrade instructions before beginning the upgrade process. You can upgrade to RS 5.2.2 from RS 4.5 and above. If you have a version older than 4.5, you should first upgrade to version 5.0 (or at least 4.5).

## New capabilities

Support for Redis version 4.0.10
RediSearch Enterprise, which is installed with Redis Enterprise Software by default, has been updated to a newer version (1.4.0)

## Important fixes

- RED-21080 – Fixed the memory limit calculation for RoF databases
- RED-20825 – Updated the ‘RAM limit’ of RoF databases to a range between 10% and 100%
- RED-20506 – Fixed high CPU and File Descriptors utilization by the node watchdog process (node_wd)
- RED-20275 – Fixed wrong metrics values while importing a dataset into an RoF database
- RED-20214 – Fixed obstacles to login to the UI when using an LDAP integration
- RED-20162 – Fixed known limitation of being able to activate "Require SSL for All Communication" to Redis Enterprise CRDBs via Rest API without providing a certificate
- RED-19758 – Upgraded NGINX from 1.10.3 to 1.13.12
- RED-19415, RED-18945 – Improved support for Lettuce client with OSS Cluster enabled
- RED-19287 – Fixed a scenario of a stuck shard migration process
- RED-18459 – Updated the data persistence (AOF / Snapshot) of RoF databases to be handled, by default, by the replica shard/s
- RED-20541– Improved handling of aof file when its tail is corrupted (using aof-load-corrupt-tail flag)
- RED-21936 – Improved handling of CRDB configuration update when URL parameter was supplied at creation time
- RED-19760 – Added the capability to control the minimum TLS version that can be used for encrypting the Discovery Service data

## Known limitations

- When updating the general settings of a cluster, the ‘username’ and ‘password’ fields in the email server settings cannot be left empty. In case one wants to update the general settings and prefer to leave the ‘username’ and ‘password’ fields empty, the REST API should be used.
- An issue prevents the user from defining ‘min_data_TLS_version’ on the source cluster when working with Replica Of or CRDB.
