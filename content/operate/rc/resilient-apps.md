---
Title: Develop highly available and resilient apps with Redis Cloud 
alwaysopen: false
categories:
- docs
- operate
- rc
description: 
hideListLinks: true
linkTitle: Develop highly available apps
weight: 50
---

You can set up your Redis Cloud databases and Redis Client libraries that can help your app re-connect to your database after unexpected failover events or network outages and minimize data losses. 

## Set up databases

These settings can be turned on when you create or edit your database. 

### Enable data persistence

[Data persistence]({{< relref "/operate/rc/databases/configuration/high-availability" >}})

Redis Cloud supports the following data persistence options:

- An **Append-Only File** maintains a record of write operations. This allows the data to be restored by using the record to reconstruct the database up to the point of failure. The Append-only file updates on every write or on

- A **Snapshot** is a copy of the in-memory database, taken at periodic intervals (one, six, or twelve hours). You can restore data to the snapshot's point in time. 

Append-only files provide greater protection than snapshots at the cost of resources and recovery time. 
Although snapshot recovery is faster, the risk of data loss is higher, depending on the time between failure and the most recent snapshot.

If you do not enable data persistence, your data will be lost when the database goes down. We recommend that you enable data persistence for all production databases. You can turn on data persistence when you create or edit your database. 

### Enable replication

[Database replication]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) allows for automatic failover and greater fault tolerance. It can prevent data loss in the event of a hardware or zone failure. 

Redis Cloud supports these replication settings:

- **No replication**: You will have a single copy of your database in one zone. If anything happens to your database, your app will not be able to connect to it. 
- **Single-Zone**: Your database will have a primary dataset and a replica dataset located in the same cloud zone. If anything happens to the primary database, the replica takes over and becomes the new primary. Your app will connect to the new primary database automatically with the same endpoint.
- **Multi-Zone** _(or Multi-AZ)_: The primary and its replicas are stored in different availability zones. This means that your database can remain online even if an entire availability zone becomes unavailable.

You can enable replication when you create your database. You can switch between no replication and single-zone replication after your create your database. However, you can't switch from no replication or single-zone replication to multi-zone replication.

We recommend that you enable replication for any databases that need to be highly available.

### Create Active-Active database

[Active-Active databases]({{< relref "/operate/rc/databases/configuration/active-active-redis" >}}) store data across multiple regions and availability zones.

Active-Active Redis allows you to [manually fail over to a different region]({{< relref "/operate/rs/databases/active-active/develop/app-failover-active-active" >}}) if a whole region fails. However, you need to specifically develop your app with Active-Active in mind. For more information on developing with Active-Active, see [Active-Active Redis applications]({{< relref "/operate/rs/databases/active-active/develop" >}}).

To create Active-Active databases, you need to create Redis Cloud Pro subscription and enable Active-Active Redis and define the regions for each copy of your databases. See [Create an Active-Active database]({{< relref "/operate/rc/databases/create-database/create-active-active-database" >}}) for instructions.

### Set manual maintenance windows

Redis maintains your Redis Cloud subscriptions and databases as needed to ensure your databases are running the most stable and up-to-date version of Redis. By default, Redis will perform [maintenance]({{< relref "/operate/rc/subscriptions/maintenance" >}}) automatically while limiting service disruption as much as possible.

For stable apps, you may want to control when Redis can perform maintenance on your databases. For Redis Cloud Pro subscriptions, you can [set manual maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows" >}}) to ensure non-urgent maintenance will occur at set times. Configuring or altering the maintenance window will not have any impact on your subscription or databases.

### Enable TLS

Transport Layer Security (TLS) uses encryption to secure network communications. 

Because TLS has an impact on performance, you need to determine whether the security benefits of TLS are worth the performance impact. TLS recommendations depend on the subscription plan and whether clients connect to your database using public or private endpoints.

This table shows TLS recommendations:

| Subscription | Public&nbsp;endpoint | Private endpoint |
|--------------|----------------------|------------|
| Redis Cloud Essentials        | Enable TLS           | N/A |
| Redis Cloud Pro     | Enable TLS           | Enable TLS if security outweighs performance impact |

## Set up Redis clients

When you're developing your apps, we recommend that you use specific Redis Client features to connect to Redis Cloud if they are available for your preferred client.

See [Clients]({{< relref "/develop/connect/clients/" >}}) to learn how to connect with the official Redis clients.

### Re-attempt connections

Some clients allow you to re-try connecting to your database if the connection fails. For these clients, we recommend that you implement connection re-attempts to ensure high availability and connection stability. 

For example, `redis-py` uses the [Retry](https://redis-py.readthedocs.io/en/stable/retry.html) class to implement connection retries.

### Refresh DNS

Your application may disconnect from your database either during planned maintenance or for other, unplanned reasons. Most Redis clients are set to refresh their DNS address when they reconnect to the database, and you will not be required to perform any further action. If you encounter connectivity problems for more than a minute during maintenance, please refresh your DNS entries. 