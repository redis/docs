---
Title: Proxy-based disaster recovery
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Proxy-based disaster recovery for Active-Active databases.
linkTitle: Proxy-based
weight: 20
---

If you add a lightweight proxy software component between the clients and the Active-Active database, applications can dynamically route requests to the optimal endpoint.

Advantages:

- Proxies provide proactive and reactive health check methods, such as polling target health periodically using either a TCP connection or an HTTP request, or monitoring live operations for errors.

- Proxies can be configured to run Active-Active health checks, such as the lag-aware database availability requests.

- If an Active-Active database member fails, a proxy can automatically detect the issue and redirect traffic to a healthy Active-Active database member without requiring DNS propagation delays or client disconnections. This enables fast, controlled failover and minimizes downtime.

Considerations:

- If you do not use DNS to resolve the Active-Active database members' FQDNs:

    - The proxies must have static IPs.

    - If you add a new node to the cluster, you must configure the proxy with the new endpoint.

    - A configuration syncer component is required to discover topology changes and reconfigure the proxy.

- Proxies introduce latency.

- Proxy failures can disconnect clients and cause disruptions.

## Avoid concurrent access across replicas

If concurrent access across replicas must be avoided in every scenario, you can use a centralized proxy with a standby proxy instance for high availability.

Advantages:

- Prevents concurrent access across replicas.

- Failover and failback are simultaneous regardless of the Active-Active health check policy.

Considerations:

- Although the proxy can be monitored with a watchdog and restarted in case of failure, this setup does not grant high availability for the proxy.

- Limited scalability.

The following diagram shows a centralized proxy architecture with a standby proxy instance:

<div class="flex justify-center">
<img src="../../../../../../images/active-active-disaster-recovery/centralized-proxy.svg" alt="Diagram of a centralized proxy architecture with active and standby proxy instances routing to Active-Active database members" width="50%">
</div>

## Co-locate to reduce latency and improve scalability

To reduce latency and improve scalability, you can use a proxy co-located in the application server.

Advantages:

- Reduced latency.

- Better scalability.

Considerations:

- Failover and failback might not be simultaneous depending on the Active-Active health check policy.

The following diagram shows a co-located proxy architecture where each application server has its own proxy:

<div class="flex justify-center">
<img src="../../../../../../images/active-active-disaster-recovery/co-located-proxy-and-app.svg" alt="Diagram of co-located proxy architecture where each application server has its own proxy instance" width="50%">
</div>

## Pool proxies for scalability

You can use a pool of active proxies to scale the routing layer. Application servers can balance new connections to the pool of proxies using a round-robin distribution algorithm, such as DNS-based round robin.

Advantages:

- High availability without complex monitoring and failover solutions.

- Flexible scalability of the routing layer.

Considerations:

- Concurrent access across replicas is possible, but can be mitigated using database availability API requests.

The following diagram shows a pool of proxies:

<div class="flex justify-center">
<img src="../../../../../../images/active-active-disaster-recovery/proxy-pool.svg" alt="Diagram of a pool of active proxy instances" width="50%">
</div>
