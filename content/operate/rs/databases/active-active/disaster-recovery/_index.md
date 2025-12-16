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
weight: 50
---

An application deployed with an Active-Active database connects to a database member that is geographically nearby. If that database member becomes unavailable, the application can fail over to a secondary Active-Active database member, and fail back to the original database member again if it recovers.

However, Active-Active Redis databases do not have a built-in [failover](https://en.wikipedia.org/wiki/Failover) or failback mechanism for application connections. To implement failover and failback, you can use one of the following disaster recovery strategies:

- [Network-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/network-based">}}): Global traffic managers and load balancers for routing.

- [Proxy-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/proxy-based">}}): Software proxies handle detection and routing logic.

- [Client library-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/client-library-based">}}): Database client libraries with built-in failover logic.

- [Application-based]({{<relref "/operate/rs/databases/active-active/disaster-recovery/application-based">}}): Custom application-level monitoring and connectivity management.

## Detect failures with health checks

You can use the following health checks to help detect Active-Active database failures and determine when to failover to a secondary Active-Active member or failback to the primary member:

- [`PING`]({{<relref "/commands/ping">}}) or [`ECHO`]({{<relref "/commands/echo">}}).

- Connection timeouts or Redis errors.

- [Lag-aware database availability requests]({{<relref "/operate/rs/monitoring/db-availability#lag-aware">}}).

- Probing the keyspace with [`SET`]({{<relref "/commands/set">}}) or [`GET`]({{<relref "/commands/get">}}) commands to cover all available shards.

- A custom health check.

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
