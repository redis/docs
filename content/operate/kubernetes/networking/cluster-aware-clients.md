---
Title: Enable cluster-aware clients (OSS Cluster API)
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Improve performance with cluster-aware clients by enabling the OSS Cluster API for your Redis Enterprise for Kubernetes database.
linkTitle: Cluster-aware clients
weight: 99
---

The OSS Cluster API improves performance by allowing cluster-aware Redis clients to discover database topology and route requests directly. This feature supports cluster-aware clients running on the same Kubernetes cluster (internal) and cluster-aware clients outside the Kubernetes cluster (external).

{{< note >}}
Enabling external access for OSS Cluster API creates a separate LoadBalancer service for each Redis Enterprise pod in addition to the LoadBalancer service for the cluster endpoint. LoadBalancers are resources that can significantly increase operational costs; plan your infrastructure budget accordingly.
{{< /note >}}

## Prerequisites

- RedisEnterpriseCluster (REC) running version 8.0.10-tbd or later.
- Proxy policy is set to `all-master-shards` or `all-nodes`.
- Modules used by the database (if any) are bundled modules.
- The database is not an Active-Active database.

## Limitations

- OSS Cluster databases with external access must be created and managed using the RedisEnterpriseDatabase (REDB) custom resource. You cannot create or configure these databases using the Redis Enterprise REST API directly.

## Enable OSS Cluster API

To enable cluster-aware clients, edit the REC and REDB custom resources with the following fields.

### Edit REC (RedisEnterpriseCluster) {#edit-rec}

1. Edit the RedisEnterpriseCluster (REC) custom resource to add the `ossClusterSettings` section to the `spec` section.

Set `externalAccessType` to `LoadBalancer` and add any `serviceAnnotations` as required by your service provider.

```yaml
ossClusterSettings:
    externalAccessType: LoadBalancer
    loadBalancer:
      serviceAnnotations:
```

2. If you are using internal clients (within the Kubernetes cluster), you can specify their IP ranges in the `podCIDRs` field to improve performance. Clients from these ranges are routed directly to the Redis Enterprise pods, without going through the load balancer.

The following is an example `podCIDRs` field using example values; replace with your own unique CIDRs.

```yaml
 podCIDRs:
  - "192.0.2.0/24"
  - "198.51.100.0/24"
  - "203.0.113.0/24"
```

### Edit REDB (RedisEnterpriseDatabase) {#edit-redb}

3. Edit the REDB custom resource to add the following fields and values to the `spec` section.

Set `enableExternalAccess: true` to allow external clients to connect. This provisions a LoadBalancer service for each Redis Enterprise pod running a node, which increases infrastructure costs.

```yaml
  ossCluster: true

  ossClusterSettings:
    enableExternalAccess: true
```

## Connect clients

Use the `kubectl get svc` command to view the services created by the OSS Cluster API. It should look similar to this example:

```sh
NAME                           TYPE           CLUSTER-IP       EXTERNAL-IP      PORT(S)              AGE
admission                      ClusterIP      10.0.1.10        <none>           443/TCP              3h28m
oss-cluster                    ClusterIP      10.0.1.20        <none>           11712/TCP            3h6m
oss-cluster-headless           ClusterIP      None             <none>           11712/TCP            3h6m
oss-cluster-load-balancer      LoadBalancer   10.0.1.30        203.0.113.10     11712:30245/TCP      3h6m
rec                            ClusterIP      10.0.1.40        <none>           9443/TCP,8001/TCP    3h27m
rec-cluster                    LoadBalancer   10.0.1.50        203.0.113.20     11712:32559/TCP      3h6m
rec-1-lb                       LoadBalancer   10.0.1.60        203.0.113.30     11712:31976/TCP      3h6m
rec-2-lb                       LoadBalancer   10.0.1.70        203.0.113.40     11712:31972/TCP      3h6m
rec-oss                        ClusterIP      None             <none>           8070/TCP             3h27m
rec-ui                         ClusterIP      10.0.1.80        <none>           8443/TCP             3h27m
```

To connect an external client (outside the Kubernetes cluster), use the `EXTERNAL-IP` address for the `oss-cluster-load-balancer` service.

To connect an internal client (listed in the `podCIDRs` field), use the `CLUSTER-IP` address for the `oss-cluster` service.
