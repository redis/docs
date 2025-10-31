---
Title: Manage node resources
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Recommendations on managing node resources and setting eviction thresholds
  with Redis Enterprise for Kubernetes.
linktitle: Manage resources
weight: 17
url: '/operate/kubernetes/7.22/recommendations/node-resources/'
---
 


## Node eviction thresholds

 Kubernetes uses [node-pressure eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/) to terminate pods and free up node resources. Redis Enterprise for Kubernetes works best when you use the recommendations below.

Eviction thresholds are managed by [kubelet arguments](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/).

Redis recommends setting a high [soft eviction threshold](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/#soft-eviction-thresholds). This changes the node condition early enough to alert the administrator.

We also recommend setting the [`eviction-soft-grace-period`](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/#soft-eviction-thresholds) high enough for the administrator to scale the cluster.

For more information about configuring eviction thresholds on specific platforms, see [Freeing node resources](https://docs.openshift.com/container-platform/4.9/nodes/nodes/nodes-nodes-garbage-collection.html) for OpenShift or [Cluster architecture](https://cloud.google.com/kubernetes-engine/docs/concepts/cluster-architecture#node_allocatable) for GKE.

### Monitor node conditions

Redis recommends monitoring the node conditions. If both `MemoryPressure` and `DiskPressure` are true, the eviction threshold was met.

```sh
> kubectl get nodes -o jsonpath='{range .items[*]}name:{.metadata.name}{"\t"}MemoryPressure:{.status.conditions[?(@.type == "MemoryPressure")].status}{"\t"}DiskPressure:{.status.conditions[?(@.type == "DiskPressure")].status}{"\n"}{end}'
name:gke-55d1ac88-213c	MemoryPressure:False	DiskPressure:False
name:gke-55d1ac88-vrpp	MemoryPressure:False	DiskPressure:False
name:gke-7253cc19-42g0	MemoryPressure:False	DiskPressure:False
```

For more information about monitoring node conditions, see [Node conditions](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/#node-conditions) on [kubernetes.io](https://kubernetes.io/docs/home/).

## Resource quotas

Kubernetes uses the `ResourceQuota` object to limit resource consumption per namespace. This lets you limit the number of objects created by a namespace or the amount of compute resources consumed by a namespace. 

The resource settings for Redis Enterprise for Kubernetes are defined in the `operator.yaml` and the [`RedisEnterpriseCluster`](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/redis_enterprise_cluster_api.md#redisenterpriseclusterspec) custom resource.

The following settings are the minimum workloads for the operator to function.

```yaml
  resources:
    limits:
      cpu: 0.5
      memory: 256Mi
    requests:
      cpu: 0.5
      memory: 256Mi
```
For more details on using resource quotas, see the [Kubernetes documentation](https://kubernetes.io/docs/concepts/policy/resource-quotas/).


