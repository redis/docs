---
Title: Client library-based disaster recovery
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Client library-based disaster recovery for Active-Active databases using Redis client libraries with built-in failover logic.
linkTitle: Client library-based
weight: 30
---

Some Redis client libraries support geographic failover and failback. These client libraries monitor all Active-Active database members and instantiate connections for all endpoints in advance to allow faster failover and failback.

Advantages:

- No additional hardware or software components required.

- No high availability considerations.

- No scalability concerns.

- Tighter control over connectivity, such as timeouts, connection retries, and dynamic reconfiguration.

- OSS Cluster API support.

- Low latency.

Considerations:

- Requires code changes for failover and failback logic.

- Concurrent access across replicas is possible, but can be mitigated using the distributed health status provided by the database availability API requests.

- When a development framework uses Redis transparently, failover and failback might not be easy to configure.

The following diagram shows a client library-based disaster recovery approach:

<div class="flex justify-center">
<img src="../../../../../../images/active-active-disaster-recovery/client-library.svg" alt="Diagram of client libraries routing traffic to Active-Active database members" width="50%">
</div>

The following diagram shows a client-based disaster recovery approach that also uses [connection pooling]({{<relref "/develop/clients/pools-and-muxing#connection-pooling">}}):

<div class="flex justify-center">
<img src="../../../../../../images/active-active-disaster-recovery/client-library-connection-pool.svg" alt="Diagram of client libraries with connection pooling routing traffic to Active-Active database members" width="50%">
</div>

For additional information, see the following client library guides for failover and failback:

- [Jedis (Java)]({{<relref "/develop/clients/jedis/failover">}})

- [redis-py (Python)]({{<relref "/develop/clients/redis-py/failover">}})
