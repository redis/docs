---
Title: Control node selection
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This section provides information about how Redis Enterprise cluster
  pods can be scheduled to only be placed on specific nodes or node pools.
linkTitle: Node selection
weight: 80
url: '/operate/kubernetes/7.22/recommendations/node-selection/'
---

Kubernetes clusters often include nodes with different CPU and memory profiles. You control where Redis Enterprise cluster (REC) pods run by setting fields in the REC custom resource (CRD).

A Redis Enterprise cluster (REC) runs as a StatefulSet. The Kubernetes scheduler assigns nodes when you create or resize the cluster, or when a pod restarts.

Use these options to control pod placement:

## Use node selectors

The [`nodeSelector`]({{<relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api#spec">}}) field matches the Kubernetes [`nodeSelector`](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) syntax.
Label the nodes you want to target. For example, if nodes 'n1' and 'n2' are labeled with `memory=high`:

```sh
kubectl label nodes n1 memory=high
kubectl label nodes n2 memory=high
```

The Redis Enterprise cluster CRD can request to be scheduled on these nodes:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  nodeSelector:
     memory: high
```

The operator copies [`nodeSelector`]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api#spec" >}}) into the pod spec. The scheduler places pods only on nodes that match the selector.

## Use node pools

Node pools group similar nodes. Providers label nodes by pool.

Use [`nodeSelector`]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api#spec" >}}) to target a pool by label. For example, on GKE:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  nodeSelector:
     cloud.google.com/gke-nodepool: 'high-memory'
```

### Provider resources

Cloud providers label nodes by pool. See links below for specific documentation.

- GKE:
  - [Create and manage cluster and node pool labels](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-managing-labels)
  - [Update node labels and taints for existing node pools](https://cloud.google.com/kubernetes-engine/docs/how-to/update-existing-nodepools)
- AKS:
  - [Use labels in an AKS cluster](https://learn.microsoft.com/en-us/azure/aks/use-labels)
  - [Manage node pools in AKS](https://learn.microsoft.com/en-us/azure/aks/manage-node-pools)
- EKS:
  - [Create a managed node group with labels (AWS CLI)](https://docs.aws.amazon.com/cli/latest/reference/eks/create-nodegroup.html)
  - [Update a managed node group to add labels (AWS CLI)](https://docs.aws.amazon.com/cli/latest/reference/eks/update-nodegroup-config.html)


## Use node taints

Use node taints and pod tolerations to control REC pod scheduling. Set tolerations with [`spec.podTolerations`]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api#specpodtolerations" >}}) (standard [Kubernetes tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts)).

Example: on a single node pool, reserve nodes n1–n3 for REC by adding taints:

```sh
kubectl taint nodes n1 db=rec:NoSchedule
kubectl taint nodes n2 db=rec:NoSchedule
kubectl taint nodes n3 db=rec:NoSchedule
```

This blocks pods unless they tolerate the `db=rec` taint.

Then add a matching toleration to the REC:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  podTolerations:
  - key: db
    operator: Equal
    value: rec
    effect: NoSchedule
```

A set of taints can also handle more complex use cases.
For example, a `role=test` or `role=dev` taint can be used to designate a node as dedicated for testing or development workloads via pod tolerations.

## Use pod anti-affinity

By default, REC node pods are not scheduled on the same node within the same cluster:

```yaml
podAntiAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
  - labelSelector:
      matchLabels:
        app: redis-enterprise
        redis.io/cluster: rec
        redis.io/role: node
    topologyKey: kubernetes.io/hostname
```

Each pod has these labels. `redis.io/cluster` is your cluster name.

Modify this rule to widen or narrow placement. For example, remove the `redis.io/cluster` label to prevent pods from different clusters from sharing a node:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          app: redis-enterprise
          redis.io/role: node
      topologyKey: kubernetes.io/hostname
```

To avoid co-locating with other database workloads, label those pods `local/role: database` and add anti-affinity to keep one database per node:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  extraLabels:
     local/role: database
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          local/role: database
          app: redis-enterprise
          redis.io/cluster: rec
          redis.io/role: node
      topologyKey: kubernetes.io/hostname
```

Kubernetes will not schedule two pods with label `local/role: database` on the same node.

## Enable rack awareness

Enable rack-zone awareness to improve availability during rack or zone failures.

{{%note%}}When creating your rack-zone ID, there are some constraints to consider; see [rack-zone awareness]({{< relref "/operate/rs/clusters/configure/rack-zone-awareness#rack-zone-id-rules" >}}) for more info. {{%/note%}}

Configure it with [`spec.rackAwarenessNodeLabel`]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api#spec" >}}) in the REC.

### Choose a node label

The most common label used for rack-zone awareness is topology.kubernetes.io/zone, a standard Kubernetes label that shows the zone a node runs in. Many Kubernetes platforms add this label to nodes by default, as noted in the [Kubernetes documentation](https://kubernetes.io/docs/setup/best-practices/multiple-zones/#nodes-are-labeled).

If your platform doesn’t set this label automatically, you can use any custom label that describes the node’s topology (such as rack, zone, or region).

### Label all eligible nodes

{{< warning >}}
All eligible nodes **must** have the label for rack awareness to work. The operator requires every node that might run Redis Enterprise pods to be labeled. If any nodes are missing the label, reconciliation fails.
{{< /warning >}}

Eligible nodes are nodes where REC pods can run. By default, this means all worker nodes. You can limit eligibility with [`spec.nodeSelector`]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api#spec" >}}).

Give each eligible node a label value that reflects its rack, zone, or region.

Check node label values:

```sh
kubectl get nodes -o custom-columns="name:metadata.name","rack\\zone:metadata.labels.topology\.kubernetes\.io/zone"

name                                            rack\zone
ip-10-0-x-a.eu-central-1.compute.internal    eu-central-1a
ip-10-0-x-b.eu-central-1.compute.internal    eu-central-1a
ip-10-0-x-c.eu-central-1.compute.internal    eu-central-1b
ip-10-0-x-d.eu-central-1.compute.internal    eu-central-1b
```

### Enable the cluster role

Grant the operator read access to node labels with a ClusterRole and ClusterRoleBinding.

ClusterRole:

{{<embed-yaml "k8s/rack_aware_cluster_role.md" "rack-aware-cluster-role.yaml">}}

Bind to the `redis-enterprise-operator` service account:

{{<embed-yaml "k8s/rack_aware_cluster_role_binding.md" "rack-aware-cluster-role-binding.yaml">}}

Apply these files with `kubectl apply`. For example:

```sh
kubectl apply -f rack-aware-cluster-role.yaml
kubectl apply -f rack-aware-cluster-role-binding.yaml
```

After you apply the role and binding, you can configure rack awareness.

### Configure rack awareness

Set [`spec.rackAwarenessNodeLabel`]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api#spec" >}}) to the node label to use:

{{<embed-yaml "k8s/rack_aware_rec.md" "rack-aware-cluster.yaml">}}

{{< note >}}
When you set [`spec.rackAwarenessNodeLabel`]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api#spec" >}}), the operator sets the anti-affinity `topologyKey` to that label unless you define [`spec.podAntiAffinity`]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api#specpodantiaffinity" >}}). If you define both, make sure `topologyKey` matches your node label.
{{< /note >}}

### Rack awareness limitations

{{< warning >}}
**Pod restart distribution maintenance**: When rack awareness is enabled, node pods and shards are initially deployed based on rack constraints to ensure proper distribution across zones. However, Redis Enterprise does not automatically maintain this distribution when node pods are restarted.

After pod restarts, the rack awareness policy may be violated, requiring manual intervention to restore proper shard distribution. While Redis Enterprise provides tools to identify shards that need to be moved to restore correct rack distribution, it does not provide automated orchestration to perform these moves.
{{< /warning >}}

**Important considerations for production deployments:**

- At scale, manual shard redistribution can become operationally challenging
- This limitation is particularly important for edge deployments where automated recovery is preferred
- Plan for operational procedures to handle rack awareness policy violations after pod restarts
- Consider monitoring tools to detect when rack awareness constraints are violated
