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

Network-based solutions use DNS or load balancing to route traffic across regions without application changes.

Advantages:

- Because routing happens at the network level:

    - No application code changes are needed.

    - Development frameworks are agnostic and can connect to a single Active-Active database member's endpoint.

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
