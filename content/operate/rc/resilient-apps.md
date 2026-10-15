---
Title: Develop highly available and resilient apps with Redis Cloud 
alwaysopen: false
categories:
- docs
- operate
- rc
description: Set up your Redis Cloud databases to enable stable and highly available apps.
hideListLinks: true
linkTitle: Develop highly available apps
weight: 85
---

You can set up your Redis Cloud databases and Redis Client libraries to ensure your app re-connects to your database after unexpected failover events or network outages and minimize data losses. 

## Set up databases

These settings can be turned on when you create or edit your database. 

### Enable data persistence

Enabling [Data persistence](/content/operate/rc/databases/configuration/data-persistence.md) allows Redis to save your data to a durable storage medium, such as a disk, to ensure data availability in case of memory loss or system failure.

Redis Cloud supports the following data persistence options:

- An **Append-Only File** maintains a record of write operations. This lets you restore data by using the record to reconstruct the database up to the point of failure. The Append-only file updates on every write or every second.

- A **Snapshot** is a copy of the in-memory database, taken at periodic intervals (one, six, or twelve hours). You can restore data to the snapshot's point in time. 

Append-only files provide greater protection than snapshots at the cost of resources and recovery time. 
Although snapshot recovery is faster, the risk of data loss is higher, depending on the time between failure and the most recent snapshot.

If you do not enable data persistence, your data may be lost if the database goes down. It is best practice to  enable data persistence for all production databases. You can turn on data persistence when you create or edit your database. 

### Enable replication

[Database replication](/content/operate/rc/databases/configuration/high-availability.md) allows for automatic failover and greater fault tolerance. Replication can prevent data loss in the event of a hardware or zone failure. 

Redis Cloud supports these replication settings:

- **No replication**: You will have a single copy of your database in one zone. If anything happens to your database, your app will not be able to connect to it. 
- **Single-Zone**: Your database will have a primary dataset and a replica dataset located in the same cloud zone. If anything happens to the primary database, the replica takes over and becomes the new primary. Your app will connect to the new primary database automatically with the same endpoint.
- **Multi-Zone** _(or Multi-AZ)_: The primary and its replicas are stored in different availability zones. This means that your app will connect to the new primary database zone automatically if an entire availability zone becomes unavailable.

You can enable replication when you create your database. You can switch between no replication and single-zone replication after your create your database. However, you can't switch from no replication or single-zone replication to multi-zone replication.

It is best practice to enable replication for any databases that need to be highly available.

### Create Active-Active databases for geographic availability

For geographic availability, create [Active-Active databases](/content/operate/rc/databases/active-active/_index.md), which provide:

- **Geographic distribution**: Data is replicated across multiple regions and availability zones. Applications can read from and write to the nearest region, reducing latency for users worldwide.

- **99.999% availability**: Higher availability than single-region deployments by protecting against regional outages. Regions with fewer than three availability zones use single-zone replication and provide 99.99% (four-nines) availability instead. When an Active-Active database spans regions with different availability zone counts, the availability of the entire deployment is determined by the least resilient region.

- **Automatic conflict resolution**: Uses conflict-free replicated data types (CRDTs) to handle concurrent writes across regions.

### Set manual maintenance windows

Redis maintains your Redis Cloud subscriptions and databases as needed to ensure your databases are running the most stable and up-to-date version of Redis. By default, Redis will perform [maintenance](/content/operate/rc/subscriptions/maintenance/_index.md) automatically while limiting service disruption as much as possible.

For stable apps, you may want to control when Redis can perform maintenance on your databases. For Redis Cloud Pro subscriptions, you can [set manual maintenance windows](/content/operate/rc/subscriptions/maintenance/set-maintenance-windows.md) to ensure non-urgent maintenance will occur at set times. Configuring or altering the maintenance window will not have any impact on your subscription or databases.

A Redis Cloud Essentials database has a set maintenance window based on the region where it is located. See [Essentials maintenance](/content/operate/rc/subscriptions/maintenance/_index.md#redis-cloud-essentials) for more information.

## Set up Redis clients

When you're developing your apps, it is best to use specific Redis Client features to connect to Redis Cloud if they are available for your preferred client. Use the latest version of your client library to ensure you have access to the latest resilience features and security patches.

See [Clients](/content/develop/clients/_index.md) to learn how to connect with the official Redis clients.

### Use Smart Client Handoffs

Some Redis client libraries support [Smart Client Handoffs (SCH)](/content/develop/clients/sch.md).
SCH allows the Cloud server to notify the client when server maintenance is about to start. The client can then take action to avoid disruptions in service.

See [Smart client handoffs](/content/develop/clients/sch.md) for more information about SCH,
including a list of clients that support it.

### Production usage guides

For production-ready configurations and best practices, see the production usage guides for each client:

- [redis-py](/content/develop/clients/redis-py/produsage.md)
- [Node.js](/content/develop/clients/nodejs/produsage.md)
- [Jedis](/content/develop/clients/jedis/produsage.md)
- [Lettuce](/content/develop/clients/lettuce/produsage.md)
- [go-redis](/content/develop/clients/go/produsage.md)
- [StackExchange.Redis](/content/develop/clients/dotnet/produsage.md)

### Re-attempt connections

Some clients allow you to re-try connecting to your database if the connection fails. For these clients, we recommend that you implement connection re-attempts to ensure high availability and connection stability. 

View your [client's docs](/content/develop/clients/_index.md) to learn more.

### Refresh DNS

Your application may disconnect from your database either during planned maintenance or for other, unplanned reasons. Most Redis clients are set to refresh their DNS address when they reconnect to the database, and you will not be required to perform any further action. If you encounter connectivity problems for more than a minute during maintenance then you should refresh your DNS entries. 

Depending on the client, you may be recommended to turn off the DNS cache entirely. Refer to your [client's docs](/content/develop/clients/_index.md) to learn more.

### Use the WAIT and WAITAOF commands

The [WAIT](/content/commands/wait.md) and [WAITAOF](/content/commands/waitaof.md) commands block the current client until all previous write commands are persisted between replicas. With these commands, your application guarantees that acknowledged writes are recorded between replicas. 

For more info, see [Use the WAIT command for strong consistency](/content/operate/rs/clusters/optimize/wait.md).

## Test failover behavior

You can test your app's failover behavior in Redis Cloud by running a failover test. A failover test in Redis Cloud simulates a controlled disruption such as an endpoint migration, node failure, or cluster outage to confirm that your app can reconnect, recover, and continue operating without data loss. These tests are a critical part of validating high-availability and disaster recovery, ensuring that applications meet recovery time and recovery point objectives. 

For more info, see [How to run a Failover Test in Redis Cloud](https://support.redislabs.com/hc/en-us/articles/29001166157074-How-to-Run-a-Failover-Test-in-Redis-Cloud).

## More info

- [Redis Clients](/content/develop/clients/_index.md)
- [Active-Active Redis](/content/operate/rc/databases/active-active/_index.md)
- [Active-Active Redis applications](/content/operate/rs/databases/active-active/develop/_index.md)