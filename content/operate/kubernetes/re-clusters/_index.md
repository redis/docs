---
Title: Redis Enterprise clusters (REC)
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Create and manage Redis Enterprise clusters (REC) on Kubernetes using the Redis Enterprise operator.
hideListLinks: true
linkTitle: Redis Enterprise clusters (REC)
weight: 30
---

A Redis Enterprise cluster (REC) is a custom Kubernetes resource that represents a Redis Enterprise cluster deployment. The Redis Enterprise operator manages the lifecycle of REC resources, including deployment, scaling, upgrades, and recovery operations.

REC resources define the cluster configuration, including node specifications, storage requirements, security settings, and networking configuration. After you deploy the cluster, it provides a foundation for creating and managing Redis Enterprise databases (REDB).

## Cluster management

Manage your Redis Enterprise cluster lifecycle and configuration:

- [Connect to admin console]({{< relref "/operate/kubernetes/re-clusters/connect-to-admin-console" >}}) - Access the Redis Enterprise web UI for cluster management
- [Multi-namespace deployment]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}}) - Deploy clusters across multiple Kubernetes namespaces
- [Delete custom resources]({{< relref "/operate/kubernetes/re-clusters/delete-custom-resources" >}}) - Safely remove REC and related resources

## Storage and performance

Optimize storage and performance for your Redis Enterprise cluster:

- [Auto Tiering]({{< relref "/operate/kubernetes/re-clusters/auto-tiering" >}}) - Configure automatic data tiering between RAM and flash storage
- [Expand PVC]({{< relref "/operate/kubernetes/re-clusters/expand-pvc" >}}) - Expand persistent volume claims for additional storage

## Monitoring and observability

Monitor cluster health and performance:

- [Connect to Prometheus operator]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}}) - Integrate with Prometheus for metrics collection and monitoring

### Call home client

The call home client sends daily usage statistics to Redis. You can disable it by adding the following to your REC specification:

```yaml
spec:
  usageMeter:
    callHomeClient:
      disabled: true
```

{{<note>}}
The REST API approach used for Redis Software deployments will have no effect on Kubernetes deployments. You must use the REC specification method shown above.
{{</note>}}

## Recovery and troubleshooting

Handle cluster recovery and troubleshooting scenarios:

- [Cluster recovery]({{< relref "/operate/kubernetes/re-clusters/cluster-recovery" >}}) - Recover from cluster failures and restore operations

## Related topics

- [Redis Enterprise databases (REDB)]({{< relref "/operate/kubernetes/re-databases" >}}) - Create and manage databases on your cluster
- [Security]({{< relref "/operate/kubernetes/security" >}}) - Configure security settings for your cluster
- [Networking]({{< relref "/operate/kubernetes/networking" >}}) - Set up networking and ingress for cluster access
- [REC API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}) - Complete API specification for REC resources
