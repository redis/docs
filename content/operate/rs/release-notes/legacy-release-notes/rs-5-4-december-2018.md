---
Title: Redis Enterprise Software Release Notes 5.4 (December 2018)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 5.4 (December 2018)
weight: 88
---
Redis Enterprise Software (RS) 5.4 is now available. RS 5.4 adds support for Redis 5.0 (GA) with the new Redis Streams data type.

## Overview

You can upgrade to RS 5.4 from RS 5.0 and above according to the [upgrade instructions]({{< relref "/operate/rs/installing-upgrading/upgrading" >}}). If you have a version older than 5.0, you should first upgrade to version 5.2 (or at least 5.0).

## New features

### Redis 5.0 GA - Redis Streams

RS 5.4 adds support for Redis 5.0 (GA version- 5.0.2), which introduces the new [Redis Streams]({{< relref "/develop/data-types/streams" >}}) data type. Redis Streams models a log data structure in-memory and implements additional powerful operations, such as Consumer Groups.

### Redis graph module

Starting from RS 5.4, Redis Graph, a new Redis Enterprise Module that introduces the world's fastest graph database, is an integral part of Redis Enterprise package.

RedisGraph is the first queryable [Property Graph](https://github.com/opencypher/openCypher/blob/master/docs/property-graph-model.adoc) database to use [sparse matrices](https://en.wikipedia.org/wiki/Sparse_matrix) to represent the [adjacency matrix](https://en.wikipedia.org/wiki/Adjacency_matrix) in graphs and [linear algebra](http://faculty.cse.tamu.edu/davis/GraphBLAS.html) to query the graph.

### Active-Active Redis (CRDB) - Creation in non-clustering mode {#activeactive-redis-crdb-creation-in-nonclustering-mode}

In RS 5.4 you can [create Active-Active databases (CRDBs)]({{< relref "/operate/rs/databases/active-active/create.md" >}}) in a non-clustering mode. As a result, the following creation options are allowed:

1. Clustering mode - Creates a CRDB that consists of any number of shards in a clustering mode and is subject to [multi-key commands limitations]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}).
1. Non-clustering mode - Creates a CRDB that consists of one shard only in a non-clustering mode so that [multi-key command limitations]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}) do not apply.

### High availability for replica shards

When [replica high availability]({{< relref "/operate/rs/databases/configure/replica-ha.md" >}}) is enabled and a master shard fails, a replica (formerly _slave_) shard is automatically promoted to a master shard to maintain data availability. This creates a single point of failure until a new replica shard is manually created.

RS 5.4 expands the high availability capabilities by adding the ability to automatically avoid this single point of failure by configuring the cluster to automatically migrate the replica shard to another available node. In practice, replica migration creates a new replica shard and replicates the data from the master shard to the new replica shard.

*_Note that just as is the case with the Redis open-source project, Redis is in the process of changing the "master-replica" terminology to "master-replica" everywhere, including within our documentation._

## Additional capabilities

- Support for new operating systems- Ubuntu 18.04 and RHEL 7.6.

## Product version lifecycle

- The End of Life (EOL) for Redis Enterprise Software 4.5.X was November 30th, 2018, in accordance with our [published policy]({{< relref "/operate/rs/installing-upgrading/product-lifecycle.md" >}}). We recommend that customers with version 4.5 or below upgrade to the latest version.

## Important fixes

- RS23616 - Fixed a failure when updating the memory limit of RoF database.
- RS22871 - Fixed a certificate verify failure after nodes upgrade.
- RS2862 - Improved admin console performance in case multiple browsers or windows are directed to the admin console.
- RS22751 - Fixed an issue in the backup process which caused temporary service outage.
- RS22636 - Fixed Redis process failure when a ReJSON Module's command is executed.
- RS22601 - Fixed a failure during shard migration procedure.
- RS22478 - Fixed a failure in replica-of process between two databases with ReBloom Module.
- RS21974 - SMTP username and password are not mandatory in the email server settings when there is no need for authentication.
- RS21801 - Fixed admin console issues when cluster is configured with FIPS compliance.
- RS21772 - Fixed a failure when trying to update a database's endpoint policy to all-master-shards.
- RS19842 - Updated permissions of some internal files.
- RS19433 - Improved RAM eviction process for RoF databases.
- RS18875 - Added the ability to upgrade database gradually, few shards at a time.
- RS15207 - Fixed a failure during re-shard operation.

## Known limitations

### Installation

- In default Ubuntu 18.04 installations, port 53 is in use by systemd-resolved (DNS server). In such a case, the system configuration must be changed to make this port available before running RS installation.

### Upgrade

- Before you upgrade a database with the RediSearch module to Redis 5.0, you must [upgrade the RediSearch module on that DB]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) to 1.4.2 or higher. We recommend that you upgrade the RediSearch module before you upgrade the cluster to RS 5.4.
- Node upgrade fails if SSL certificates were configured in version 5.0.2 and above by updating the certificates on the disk instead of using the new API. For assistance with this issue, please [contact Redis support](https://redislabs.com/company/support/).

### Cluster API

- Removed the deprecated argument `backup_path` from cluster API. To create or update BDBs, please use `backup_location`.

### Redis commands

- The capability of disabling specific Redis commands does not work on Redis Module specific commands.
- The CLIENT ID command cannot guarantee incremental IDs between clients that connect to different nodes under multi proxy policies.
- The length of the socket_path variable, which is defined in a node, cannot exceed 88 characters.
- CLIENT UNBLOCK command is not supported in RS 5.4.
