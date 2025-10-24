---
Title: Replica Of Repeatedly Fails
alwaysopen: false
categories:
- docs
- operate
- rs
description: Troubleshoot when the Replica Of process repeatedly fails and restarts.
linktitle: Troubleshoot repeat failures
weight: 20
url: '/operate/rs/7.22/databases/import-export/replica-of/replicaof-repeatedly-fails/'
---
**Problem**: The Replica Of process repeatedly fails and restarts

**Diagnostic**: A log entry in the Redis log of the source database shows repeated failures and restarts.

**Cause**: The Redis "client-output-buffer-limit" setting on the source database
is configured to a relatively small value, which causes the connection drop.

**Resolution**: Reconfigure the buffer on the source database to a bigger value:

- If the source is a Redis database on a Redis Enterprise Software cluster,
    increase the replica buffer size of the **source database** with:

    `rladmin tune db < db:id | name > slave_buffer < value >`

- If the source is a Redis database not on a Redis Enterprise Software cluster,
    use the [config set](http://redis.io/commands/config-set) command through
    `redis-cli` to increase the client output buffer size of the **source database** with:

    `config set client-output-buffer-limit "slave <hard_limit> <soft_limit> <soft_seconds>"`

**Additional information**: [Top Redis Headaches for DevOps - Replication Buffer](https://redis.io/blog/top-redis-headaches-for-devops-replication-buffer/)
