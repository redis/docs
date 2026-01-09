---
Title: Disaster recovery strategies for Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Disaster recovery strategies for Active-Active databases using network, proxy, client library, and application-based approaches.
linkTitle: Disaster recovery
hideListLinks: true
weight: 50
---

An application deployed with an Active-Active database connects to a database member that is geographically nearby. If that database member becomes unavailable, the application can fail over to a secondary Active-Active database member, and fail back to the original database member again if it recovers.

However, because Active-Active Redis databases do not have a built-in [failover](https://en.wikipedia.org/wiki/Failover) or failback mechanism for application connections, you must implement one of the following [disaster recovery strategies](#disaster-recovery-strategies).

## Disaster recovery strategies

Depending on your requirements for Recovery Point Objective, Recovery Time Objective, consistency, scalability, resources, maintainability, and other factors, choose one of the following strategies to fail over to a secondary Active-Active member or fail back to the primary member:

- [Network-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/network-based">}}): Global traffic managers and load balancers handle routing at the network layer, requiring no application changes.

- [Proxy-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/proxy-based">}}): Software proxies handle detection and routing logic.

- [Client library-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/client-library-based">}}): Redis client libraries with built-in failover logic.

- [Application-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/application-based">}}): Custom application-level monitoring and connectivity management.

## Considerations for disaster recovery

When implementing a disaster recovery strategy for an Active-Active database, consider the following:

- Is the Active-Active database an on-premise, cloud, multi-cloud, or hybrid-cloud deployment?

- Number of regions and availability zones.

- Application server redundancy and deployment locations.

- Acceptable values for the maximum amount of data that can be lost during a failure (Recovery Point Objective) and the maximum acceptable time to restore service after a failure (Recovery Time Objective).

- Latency and throughput requirements.

- Number of application errors that can be tolerated during a failure.

- Tolerance for reading stale but eventually consistent data during a failover scenario.

- Is concurrent access, in which different application servers can read from or write to different Active-Active database members, acceptable?

- Are there any regulatory or policy requirements for disaster recovery?

- Does the application connect to the Active-Active database using a Redis client library or through a development framework or ecosystem?

- Does the Active-Active database use DNS, the [OSS Cluster API]({{<relref "/operate/rs/clusters/optimize/oss-cluster-api">}}), or the [discovery service]({{<relref "/operate/rs/databases/durability-ha/discovery-service">}})?

- Is rate-limiting control needed?

- Can you modify the existing codebase or introduce new components, such as load balancers or proxies?

## Detect failures with health checks

Depending on the failover strategy, you can use the following health checks to detect Active-Active database failures and determine whether to fail over to a secondary Active-Active member, or fail back to the primary member after the preferred endpoint is back online.

To determine which health checks to use, consider factors such as detection speed, integrability with the failover strategy, and writability or durability guarantees.

### Lag-aware database availability requests

Lag-aware database availability requests are the recommended method to detect database failures in Redis Enterprise Software deployments. This method guarantees that all the shards of a clustered database are connectable.

See [Lag-aware database availability requests]({{<relref "/operate/rs/monitoring/db-availability#lag-aware">}}) for more information.

{{<note>}}
Lag-aware database availability requests are not supported for Redis Cloud databases.
{{</note>}}

### Redis connection health checks

You can use an existing connection to the database to check its availability.

#### PING command

The [`PING`]({{<relref "/commands/ping">}}) command checks the following:

- The database is connectable. 

- The database is readable. 

- The dataset is available.

Example response for an available database:

```
127.0.0.1:6379> PING
PONG
```

If a database is connectable but not available for reads, such as when reloading from a snapshot, `PING` returns an error message:

```
127.0.0.1:6379> PING
(error) LOADING Redis is loading the dataset in memory
```

#### Connection timeouts or Redis errors

By capturing connection errors, you can determine when to fail over to a secondary Active-Active member or fail back to the primary member based on the [circuit breaker pattern](https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern).

#### Custom health check

You can also implement custom health checks.

For example, you can check the keyspace with write operations such as using the [`SET`]({{<relref "commands/set">}}) command to write arbitrary data. This check verifies that database shards are available and writable.

For example:

```
SET <randomized_key_name> <arbitrary_value> EX 1
```

Use multiple write operations with different randomized keys to access different shards and guarantee that all the shards are available.

### Health check comparison

| Health check | Connectivity | Readability | Writability | Durability | Notes |
|--------------|--------------|-------------|--------------|------------|-------|
| Database availability requests |:white_check_mark: |  |  |  | No guarantees on readability. For example, the shard might be reloading from a snapshot. |
| `PING` |:white_check_mark: |:white_check_mark: |:white_check_mark: |  | No support for clustered databases. All `PING` requests will be forwarded to shard 1. |
| Keyspace sampling |:white_check_mark: |:white_check_mark: |:white_check_mark: |:white_check_mark: | Write operations are persisted, increasing disk usage for AOF and RDB. |
