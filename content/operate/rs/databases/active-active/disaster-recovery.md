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

- [Network-based](#network-based-disaster-recovery): Global traffic managers and load balancers for routing.

- [Proxy-based](#proxy-based-disaster-recovery): Software proxies handle detection and routing logic.

- [Client library-based](#client-library-based-disaster-recovery): Database client libraries with built-in failover logic.

- [Application-based](#application-based-disaster-recovery): Custom application-level monitoring and connectivity management.

## Detect failures with health checks

You can use the following health checks to help detect Active-Active database failures and determine when to failover to a secondary Active-Active member or failback to the primary member:

- [`PING`]({{<relref "/commands/ping">}}) or [`ECHO`]({{<relref "/commands/echo">}}).

- Connection timeouts or Redis errors.

- [Lag-aware database availability requests]({{<relref "/operate/rs/monitoring/db-availability">}}).

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

- Can you modify the existing codebase or introduce new components such as load balancers or proxies?

## Network-based disaster recovery

Network-based solutions use DNS or load balancing to route traffic across regions without application changes.

Advantages:

- Because routing happens at the network level:

    - No application code changes are needed.

    - Development frameworks are agnostic and can connect to a single Active-Active database member's endpoint.

### Cross-region availability

For cross-region availability, you can use a global traffic manager or a global load balancer.

Advantages:

- If DNS routing is available at the application level, no additional load balancer is required between the application and the data tier to resolve the Active-Active database member’s FQDN, reducing latency.

- Protects against data center failure since failure in one region should not affect services running in another region.

#### Global traffic manager

A global traffic manager acts as an intelligent DNS server that directs clients to healthy endpoints based on distance, latency, or availability. You should configure the traffic manager to route to the local region first and fail over to other regions if an issue occurs.

Advantages:

- High availability.

- Latency optimization.

- Seamless disaster recovery.

Considerations:

- DNS propagation delays affect failover time.

- DNS caches can impact proper functioning.

- Limited custom health check support.

- May route traffic during CRDT synchronization, causing stale data reads.

The following diagram shows how a global traffic manager with DNS resolution routes traffic:

{{<image filename="images/active-active-disaster-recovery/gtm-with-DNS.svg" alt="Diagram of a global traffic manager routing applications to Active-Active database members across regions">}}

If the environment does not allow DNS resolution, you can use a load balancer to direct traffic to the cluster nodes: 

{{<image filename="images/active-active-disaster-recovery/gtm-with-load-balancer.svg" alt="Diagram of a global traffic manager with a load balancer directing traffic to Active-Active database members across regions">}}

#### Global load balancer

For real-time traffic control and more advanced routing logic for cross-region failover and failback, you can use a global load balancer. However, this solution can have higher latency than a global traffic manager.

The following diagram shows how a global load balancer routes traffic between regions:

{{<image filename="images/active-active-disaster-recovery/global-load-balancer.svg" alt="Diagram of a global load balancer routing traffic between Active-Active database members in different regions">}}

### Cross-zone availability

If your deployment does not require cross-region availability, you can use a regional load balancer to route requests to a healthy Active-Active database member in a different availability zone within the same region.

The following diagram shows how a regional load balancer routes traffic across availability zones:

{{<image filename="images/active-active-disaster-recovery/regional-load-balancer.svg" alt="Diagram of a regional load balancer routing traffic across availability zones within a single region">}}

## Proxy-based disaster recovery

If you add a lightweight proxy software component between the clients and the Active-Active database, applications can dynamically route requests to the optimal endpoint.

Advantages:

- Proxies provide out-of-the-box proactive and reactive health check methods, such as polling target health periodically using either a TCP connection or an HTTP request, or monitoring live operations for errors.

- Proxies can be configured to easily run the desired A-A health check policy, such as the lag-aware database availability.

- If an Active-Active database member fails, a proxy can automatically detect the issue and redirect traffic to a healthy Active-Active database member without requiring DNS propagation delays or client disconnections. This enables fast, controlled failover and minimizes downtime.

Considerations:

- If you do not use DNS to resolve the Active-Active database members' FQDNs:

    - The proxies must have static IPs.

    - Adding a new node to the cluster requires that the proxy be configured with the new endpoint.

    - A config syncer component is required to discover topology changes and reconfigure the proxy.

- Proxies introduce latency.

- Proxy failures can disconnect clients and cause disruptions.

### Avoid concurrent access across replicas

If concurrent access across replicas must be avoided in every scenario, you can use a centralized proxy with a standby proxy instance for high availability.

Advantages:

- Concurrent access across replicas is not possible.

- Failover and failback are simultaneous regardless of the Active-Active health check policy.

Considerations:

- Although the proxy can be monitored with a watchdog and restarted in case of failure, this setup does not grant high availability for the proxy.

- Limited scalability.

The following diagram shows a centralized proxy architecture with a standby proxy instance:

{{<image filename="images/active-active-disaster-recovery/centralized-proxy.svg" alt="Diagram of a centralized proxy architecture with active and standby proxy instances routing to Active-Active database members">}}

### Co-locate to reduce latency and improve scalability

To reduce latency and improve scalability, you can use a proxy co-located in the application server.

Advantages:

- Reduced latency.

- Better scalability.

Considerations:

- Failover and failback might not be simultaneous depending on the Active-Active health check policy.

The following diagram shows a co-located proxy architecture where each application server has its own proxy:

{{<image filename="images/active-active-disaster-recovery/co-located-proxy-and-app.svg" alt="Diagram of co-located proxy architecture where each application server has its own proxy instance">}}

### Pool proxies for scalability

You can use a pool of active proxies to scale the routing layer. Application servers can balance new connections to the pool of proxies using a round-robin distribution algorithm, such as DNS-based round robin.

Advantages:

- High availability without complex monitoring and failover solutions.

- Flexible scalability of the routing layer.

Considerations:

- Concurrent access across replicas is possible, but can be mitigated using database availability API requests.

The following diagram shows a pool of proxies:

{{<image filename="images/active-active-disaster-recovery/proxy-pool.svg" alt="Diagram of a pool of active proxy instances">}}

## Client library-based disaster recovery

Some Redis client libraries support geographic failover and failback. These client libraries monitor all Active-Active database members and instantiate connections for all endpoints in advance to allow faster failover and failback.

Advantages:

- No additional hardware or software components required.

- No high availability considerations.

- No scalability concerns.

- Tighter control over connectivity such as timeouts, connection retries, and dynamic reconfiguration.

- OSS Cluster API support.

- Low latency.

Considerations:

- Requires code changes for failover and failback logic.

- Concurrent access across replicas is possible, but can be mitigated using the distributed health status provided by the database availability API requests.

- When a development framework uses Redis transparently, failover and failback might not be easy to configure.

The following diagram shows a client library-based disaster recovery approach:

{{<image filename="images/active-active-disaster-recovery/client-library.svg" alt="Diagram of client libraries routing traffic to Active-Active database members">}}

The following diagram shows a client-based disaster recovery approach that also uses [connection pooling]({{<relref "/develop/clients/pools-and-muxing#connection-pooling">}}):

{{<image filename="images/active-active-disaster-recovery/client-library-connection-pool.svg" alt="Diagram of client libraries with connection pooling routing traffic to Active-Active database members">}}

For additional information, see the following client library guides for failover and failback:

- [Jedis (Java)]({{<relref "/develop/clients/jedis/failover">}})

## Application-based disaster recovery

For complete control over failover and failback, you can implement disaster recovery mechanisms directly in the application server.

For more information, see [Application failover with Active-Active databases]({{<relref "/operate/rs/databases/active-active/develop/app-failover-active-active">}}).
