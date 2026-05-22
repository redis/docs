---
Title: Network-based disaster recovery
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Network-based disaster recovery for Active-Active databases using global traffic managers and load balancing solutions.
linkTitle: Network-based
weight: 10
---

For cross-region availability, you can use a global traffic manager or a global load balancer. Both help route traffic across regions, but they work in different ways:

- Global traffic managers are DNS-based and don't handle traffic directly. Instead, they answer DNS queries with the best IP address to connect to, based on factors such as distance, latency, or health. After DNS resolution, the client connects directly to the endpoint.

- Global load balancers can route actual traffic and make decisions in real time, using request headers or connection state.

If your deployment does not require cross-region availability, you can use a regional load balancer to grant cross-zone redundancy.

## Cross-region availability

For cross-region availability, you can use a global traffic manager or a global load balancer.

Advantages:

- If DNS routing is available at the application level, no additional load balancer is required between the application and the data tier to resolve the Active-Active database member's FQDN, reducing latency.

- Protects against data center failure since failure in one region should not affect services running in another region.

### Global traffic manager

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

<div class="flex justify-center">
<img src="../../../../../../images/active-active-disaster-recovery/gtm-with-DNS.svg" alt="Diagram of a global traffic manager routing applications to Active-Active database members across regions" width="50%">
</div>

If the environment does not allow DNS resolution, you can use a load balancer to direct traffic to the cluster nodes: 

<div class="flex justify-center">
<img src="../../../../../../images/active-active-disaster-recovery/gtm-with-load-balancer.svg" alt="Diagram of a global traffic manager with a load balancer directing traffic to Active-Active database members across regions" width="50%">
</div>

### Global load balancer

For real-time traffic control and more advanced routing logic for cross-region failover and failback, you can use a global load balancer. However, this solution can have higher latency than a global traffic manager.

The following diagram shows how a global load balancer routes traffic between regions:

<div class="flex justify-center">
<img src="../../../../../../images/active-active-disaster-recovery/global-load-balancer.svg" alt="Diagram of a global load balancer routing traffic between Active-Active database members in different regions" width="50%">
</div>

## Cross-zone availability

If your deployment does not require cross-region availability, you can use a regional load balancer to route requests to a healthy Active-Active database member in a different availability zone within the same region.

The following diagram shows how a regional load balancer routes traffic across availability zones:

<div class="flex justify-center">
<img src="../../../../../../images/active-active-disaster-recovery/regional-load-balancer.svg" alt="Diagram of a regional load balancer routing traffic across availability zones within a single region" width="50%">
</div>

## Advantages

Using a global traffic manager or global load balancer for disaster recovery has the following advantages:

- Because the routing logic happens at the network level:

    - No code changes are required. For applications, there is less logic to manage, and fewer working parts that can break.

    - Development frameworks are agnostic and can connect to a single member Active-Active database endpoint.

- If DNS routing is available at the application level, no additional load balancer is required between the application and the data tier to resolve the member Active-Active database’s FQDN, reducing latency.

- Failure of any kind in one region should not affect services running in another. This approach is ideal for scenarios where an entire data center is compromised, and service continuity is granted at a data center level.

## Considerations

If you plan to implement network-based disaster recovery, you should also consider the following challenges:

- Standard health check mechanisms are available, but custom health checks may not be supported. Proper availability mechanisms, such as the database availability request, must be configured directly where possible or provided as an additional lightweight service alongside the application. 

- Global load balancers introduce latency.

- Refreshing DNS records takes some time to propagate, which challenges the ability to control the failover time. In addition, DNS caches, often used by operating systems or the JVM, can impact the proper functioning of this approach.

- When failback is required, routing traffic from a secondary Active-Active database member to the primary database member can happen during CRDT synchronization. If the failback's target has not completed synchronization, applications might read stale data. 

- The Active-Active health check policy should be designed to use the lag-aware database availability request, thus granting control over the observed CRDT replication lag. This method increases consistency in a failback scenario. However, specific global traffic managers and global load balancers might require extra effort to set the Active-Active health check policy. 

- Replicating the application stack for several regions impacts planning, maintenance, and costs.

