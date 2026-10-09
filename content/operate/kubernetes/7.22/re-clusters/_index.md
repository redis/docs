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
url: '/operate/kubernetes/7.22/re-clusters/'
---

A Redis Enterprise cluster (REC) is a custom Kubernetes resource that represents a Redis Enterprise cluster deployment. The Redis Enterprise operator manages the lifecycle of REC resources, including deployment, scaling, upgrades, and recovery operations.

REC resources define the cluster configuration, including node specifications, storage requirements, security settings, and networking configuration. After you deploy the cluster, it provides a foundation for creating and managing Redis Enterprise databases (REDB).

## Cluster management

Manage your Redis Enterprise cluster lifecycle and configuration:

- [Connect to admin console](/content/operate/kubernetes/7.22/re-clusters/connect-to-admin-console.md) - Access the Redis Enterprise web UI for cluster management
- [Multi-namespace deployment](/content/operate/kubernetes/7.22/re-clusters/multi-namespace.md) - Deploy clusters across multiple Kubernetes namespaces
- [Delete custom resources](/content/operate/kubernetes/7.22/re-clusters/delete-custom-resources.md) - Safely remove REC and related resources

## Storage and performance

Optimize storage and performance for your Redis Enterprise cluster:

- [Auto Tiering](/content/operate/kubernetes/7.22/re-clusters/auto-tiering.md) - Configure automatic data tiering between RAM and flash storage
- [Expand PVC](/content/operate/kubernetes/7.22/re-clusters/expand-pvc.md) - Expand persistent volume claims for additional storage

## Monitoring and observability

Monitor cluster health and performance:

- [Connect to Prometheus operator](/content/operate/kubernetes/7.22/re-clusters/connect-prometheus-operator.md) - Integrate with Prometheus for metrics collection and monitoring

### Call home client

The call home client sends health or error data from your deployment(s) back to Redis. You can disable it by adding the following to your REC specification:

```yaml
spec:
  usageMeter:
    callHomeClient:
      disabled: true
```

> [!NOTE]
> The REST API approach used for Redis Software deployments will have no effect on Kubernetes deployments. You must use the REC specification method shown above.

## Recovery and troubleshooting

Handle cluster recovery and troubleshooting scenarios:

- [Cluster recovery](/content/operate/kubernetes/7.22/re-clusters/cluster-recovery.md) - Recover from cluster failures and restore operations

## Related topics

- [Redis Enterprise databases (REDB)](/content/operate/kubernetes/7.22/re-databases/_index.md) - Create and manage databases on your cluster
- [Security](/content/operate/kubernetes/7.22/security/_index.md) - Configure security settings for your cluster
- [Networking](/content/operate/kubernetes/7.22/networking/_index.md) - Set up networking and ingress for cluster access
- [REC API reference](/content/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api.md) - Complete API specification for REC resources
