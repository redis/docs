---
Title: Active-Active Redis
linkTitle: Active-Active
alwaysopen: false
categories:
- docs
- operate
- rc
description: Overview of the Active-Active feature for Redis Cloud.
weight: 43
hideListLinks: true
aliases: 
  - /operate/rc/databases/configuration/active-active-redis/
---

Active-Active databases store data across multiple regions and availability zones.  This improves scalability, performance, and availability, especially when compared to standalone databases.

To create Active-Active databases, you need a Redis Cloud Pro subscription that enables Active-Active Redis and defines the regions for each copy of your databases. See [Create an Active-Active database]({{< relref "/operate/rc/databases/active-active/create-active-active-database" >}}) for instructions.

Active-Active databases are distributed across multiple regions (geo-distribution).  This improves performance by reducing latency for nearby users and improves availability by protecting against data loss in case of network or resource failure.

Active-Active databases allow read and write operations in each copy.  Each copy eventually reflects changes made in other copies ([eventual consistency]({{< relref "/glossary#eventual-consistency" >}})).  Conflict-free replicated data types (CRDTs) synchronize read and write operations between copies.  CRDTs ensure consistency and resolve conflicts.

Active-Active databases use TLS to synchronize data between regions.  You can also use TLS to encrypt client connections.  See [Transport Layer Security (TLS)]({{< relref "/operate/rc/security/database-security/tls-ssl.md" >}}) for more information.

When developing for Active-Active databases, you need to consider some important differences. See [Develop applications with Active-Active databases]({{< relref "/operate/rc/databases/active-active/develop/_index.md" >}}) for related information.

{{< note >}}
Active-Active subscriptions on Redis Cloud are limited to a maximum of 10 regions and 10 databases.
{{< /note >}}

## Active-Active geo-distributed replication highlights

### Multi-zone

Geo-distributed replication maintains copies of both primary and replica shards in multiple clusters. These clusters can be spread across multiple availability zones. Active-Active Redis uses zone awareness to spread your primary and replica shards across zones, which helps protect against data loss from regional outages.

### Local latency with unique endpoints

Applications can connect to a specific copy of an Active-Active database using its unique endpoint. For local latency, configure your application to use a database endpoint in the closest region.

### Conflict resolution

Active-Active databases use special data types called conflict-free replicated data types (CRDT). These automatically resolve conflicts that occur when writes are made to different clusters at the same time.

### Failover handling

After a failure at the process, node, or zone level, Active-Active databases automatically promote replica shards to replace failed primaries, copy data to new replica shards, and migrate shards to new nodes as needed. This reduces downtime and makes the most of your computing resources, even in the event of a failure.  

However, Active-Active databases do not have a built-in [failover](https://en.wikipedia.org/wiki/Failover) or failback mechanism for application connections. To handle cluster-level failures, you should implement one of the following disaster recovery strategies to redirect traffic between regions:

- [Network-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/network-based">}}): Global traffic managers and load balancers for routing.

- [Proxy-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/proxy-based">}}): Software proxies handle detection and routing logic.

- [Client library-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/client-library-based">}}): Database client libraries with built-in failover logic.

- [Application-based]({{<relref "/operate/rc/databases/active-active/develop/app-failover-active-active">}}): Custom application-level monitoring and connectivity management.

For more information and guidance on which disaster recovery strategy to implement, see [Disaster recovery strategies for Active-Active databases]({{< relref "/operate/rs/databases/active-active/disaster-recovery" >}}).

Data automatically syncs to a recovered cluster when it returns to a healthy state.
