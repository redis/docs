---
Title: Rack awareness examples
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: YAML examples for rack-aware Redis Enterprise deployments that distribute nodes across availability zones.
linkTitle: Rack awareness
weight: 20
---

This page provides YAML examples for deploying Redis Enterprise with [rack awareness]({{< relref "/operate/kubernetes/recommendations/node-selection#using-rack-awareness" >}}). Rack awareness distributes Redis Enterprise nodes and database shards across different availability zones or failure domains to improve high availability and fault tolerance.

## Prerequisites

- Label [Kubernetes nodes](https://kubernetes.io/docs/concepts/architecture/nodes/) with zone information
- Typically uses the standard label `topology.kubernetes.io/zone`
- Verify node labels: `kubectl get nodes -o custom-columns="name:metadata.name","rack\\zone:metadata.labels.topology\.kubernetes\.io/zone"`
- Install the [Redis Enterprise operator]({{< relref "/operate/kubernetes/deployment" >}})

For complete deployment instructions, see [Deploy on Kubernetes]({{< relref "/operate/kubernetes/deployment" >}}).

## Service account

The service account for rack-aware deployments is the same as [basic deployments]({{< relref "/operate/kubernetes/reference/yaml/basic-deployment#service-account" >}}).

{{<embed-yaml "k8s/service_account.md" "service-account.yaml">}}

## Cluster role

Rack awareness requires additional permissions to read [node labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) across the cluster.

{{<embed-yaml "k8s/rack_aware_cluster_role.md" "rack-aware-cluster-role.yaml">}}

Cluster role configuration:

- `name`: ClusterRole name for rack awareness permissions
- `rules`: Permissions to read nodes and their labels cluster-wide
- `resources`: Access to `nodes` resource for zone label discovery

Key permissions:

- `nodes`: Read access to discover node zone labels
- `get, list, watch`: Monitor node changes and zone assignments

## Cluster role binding

The [ClusterRoleBinding](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding) grants cluster-wide permissions to the service account.

{{<embed-yaml "k8s/rack_aware_cluster_role_binding.md" "rack-aware-cluster-role-binding.yaml">}}

Cluster role binding configuration:

- `subjects.name`: Must match the service account name
- `subjects.namespace`: Namespace where the operator is deployed
- `roleRef.name`: Must match the cluster role name

## Rack-aware Redis Enterprise cluster

The rack-aware [REC configuration]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}) includes the `rackAwarenessNodeLabel` field.

{{<embed-yaml "k8s/rack_aware_rec.md" "rack-aware-cluster.yaml">}}

Rack-aware cluster configuration:

- `metadata.name`: Cluster name (cannot be changed after creation)
- `spec.rackAwarenessNodeLabel`: Node label used for zone identification
- `spec.nodes`: Minimum 3 nodes, ideally distributed across zones

Edit the values in the downloaded YAML file based on your environment, such as increasing nodes for better zone distribution, using custom zone labels, adding resource specifications, or enabling persistent storage.

### Common zone labels

Different Kubernetes distributions use different zone labels:

- `Standard`: `topology.kubernetes.io/zone`
- `Legacy`: `failure-domain.beta.kubernetes.io/zone`
- `Custom`: Your organization's specific labeling scheme

Verify the correct label on your nodes:

```bash
kubectl get nodes -o custom-columns="name:metadata.name","rack\\zone:metadata.labels.topology\.kubernetes\.io/zone"
```

## Redis Enterprise database

Database configuration for rack-aware clusters is the same as [basic deployments]({{< relref "/operate/kubernetes/reference/yaml/basic-deployment#redis-enterprise-database" >}}).

**Important**: For rack awareness to be effective, ensure your database has replication enabled. Rack awareness distributes primary and replica shards across zones, so databases without replication will not benefit from zone distribution.

{{<embed-yaml "k8s/redb.md" "redis-enterprise-database.yaml">}}

## Apply the configuration

To deploy rack-aware Redis Enterprise clusters, follow [Deploy on Kubernetes]({{< relref "/operate/kubernetes/deployment" >}}) and ensure your Kubernetes nodes have proper zone labels. For detailed rack awareness configuration, see the [node selection recommendations]({{< relref "/operate/kubernetes/recommendations/node-selection" >}}).

## Troubleshooting

### Nodes not distributed across zones

- Verify node labels are correct
- Check that sufficient nodes exist in each zone
- Ensure the `rackAwarenessNodeLabel` matches actual node labels

### Cluster role permissions denied

- Verify the ClusterRole and ClusterRoleBinding are applied
- Check that the service account name matches in all resources

### Database shards not distributed

- Confirm the cluster has rack awareness enabled
- **Check that the database has replication enabled** - rack awareness distributes primary/replica pairs across zones
- Verify the database has multiple shards
- Ensure sufficient nodes exist across zones

## Next steps

- [Configure Active-Active databases]({{< relref "/operate/kubernetes/reference/yaml/active-active" >}})
- [Set up multi-namespace deployment]({{< relref "/operate/kubernetes/reference/yaml/multi-namespace" >}})
- [Learn about database replication]({{< relref "/operate/kubernetes/re-databases/replica-redb" >}})

## Related documentation

- [Node selection recommendations]({{< relref "/operate/kubernetes/recommendations/node-selection" >}})
- [REC API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}})
- [REDB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}})
- [Kubernetes node affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
- [Redis Enterprise cluster architecture]({{< relref "/operate/kubernetes/architecture" >}})
