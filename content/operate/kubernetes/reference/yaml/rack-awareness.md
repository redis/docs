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

This page provides YAML examples for deploying Redis Enterprise with [rack awareness]({{< relref "/operate/kubernetes/architecture/operator-architecture#rack-awareness" >}}). Rack awareness distributes Redis Enterprise nodes across different availability zones or failure domains to improve high availability and fault tolerance.

## Prerequisites

- [Kubernetes nodes](https://kubernetes.io/docs/concepts/architecture/nodes/) must be labeled with zone information
- Typically uses the standard label `topology.kubernetes.io/zone`
- Verify node labels: `kubectl get nodes --show-labels`
- [Redis Enterprise operator]({{< relref "/operate/kubernetes/deployment" >}}) must be installed

For complete deployment instructions, see the [Redis Enterprise operator deployment guide]({{< relref "/operate/kubernetes/deployment" >}}).

## Service account

The service account for rack-aware deployments is the same as [basic deployments]({{< relref "/operate/kubernetes/reference/yaml-examples/basic-deployment#service-account" >}}).

{{<embed-yaml "k8s/service_account.md" "service-account.yaml">}}

## Cluster role

Rack awareness requires additional permissions to read [node labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) across the cluster.

{{<embed-yaml "k8s/rack_aware_cluster_role.md" "rack-aware-cluster-role.yaml">}}

### Cluster role configuration

- `name`: ClusterRole name for rack awareness permissions
- `rules`: Permissions to read nodes and their labels cluster-wide
- `resources`: Access to `nodes` resource for zone label discovery

### Key permissions

- `nodes`: Read access to discover node zone labels
- `get, list, watch`: Monitor node changes and zone assignments

## Cluster role binding

The [ClusterRoleBinding](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding) grants cluster-wide permissions to the service account.

{{<embed-yaml "k8s/rack_aware_cluster_role_binding.md" "rack-aware-cluster-role-binding.yaml">}}

### Cluster role binding configuration

- `subjects.name`: Must match the service account name
- `subjects.namespace`: Namespace where the operator is deployed
- `roleRef.name`: Must match the cluster role name

## Rack-aware Redis Enterprise cluster

The rack-aware [REC configuration]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}}) includes the `rackAwarenessNodeLabel` field.

{{<embed-yaml "k8s/rack_aware_rec.md" "rack-aware-cluster.yaml">}}

### Rack-aware cluster configuration

- `metadata.name`: Cluster name (cannot be changed after creation)
- `spec.rackAwarenessNodeLabel`: Node label used for zone identification
- `spec.nodes`: Minimum 3 nodes, ideally distributed across zones

### Customization options

Edit these values based on your environment:

```yaml
spec:
  # Increase nodes for better zone distribution
  nodes: 6
  
  # Use custom zone label if needed
  rackAwarenessNodeLabel: "failure-domain.beta.kubernetes.io/zone"
  
  # Add resource specifications
  redisEnterpriseNodeResources:
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 2
      memory: 4Gi
  
  # Enable persistent storage
  persistentSpec:
    enabled: true
    volumeSize: 20Gi
```

### Common zone labels

Different Kubernetes distributions use different zone labels:

- `Standard`: `topology.kubernetes.io/zone`
- `Legacy`: `failure-domain.beta.kubernetes.io/zone`
- `Custom`: Your organization's specific labeling scheme

Verify the correct label on your nodes:

```bash
kubectl get nodes -o custom-columns=NAME:.metadata.name,ZONE:.metadata.labels.'topology\.kubernetes\.io/zone'
```

## Redis Enterprise database

Database configuration for rack-aware clusters is the same as [basic deployments]({{< relref "/operate/kubernetes/reference/yaml-examples/basic-deployment#redis-enterprise-database" >}}).

{{<embed-yaml "k8s/redb.md" "redis-enterprise-database.yaml">}}

### Rack awareness benefits

When deployed on a rack-aware cluster, databases automatically benefit from:

- **Shard distribution**: Database shards are distributed across zones
- **Replica placement**: Replicas are placed in different zones than their masters
- **Automatic failover**: Cluster can survive zone failures

## Applying the configuration

To deploy rack-aware Redis Enterprise clusters, follow the [Redis Enterprise operator deployment guide]({{< relref "/operate/kubernetes/deployment" >}}) and ensure your Kubernetes nodes have proper zone labels. For detailed rack awareness configuration, see the [node selection recommendations]({{< relref "/operate/kubernetes/recommendations/node-selection" >}}).

## Verification

### Check cluster rack awareness

```bash
# View cluster status
kubectl get rec rack-aware-cluster -o yaml

# Check that nodes are distributed across zones
kubectl get pods -l app=redis-enterprise -o wide

# Verify zone distribution
kubectl get pods -l app=redis-enterprise -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,ZONE:.spec.nodeSelector.'topology\.kubernetes\.io/zone'
```

### Verify database placement

Access the [Redis Enterprise admin console]({{< relref "/operate/kubernetes/re-clusters/connect-to-cluster#access-the-cluster-manager-ui" >}}) to verify:

1. Database shards are distributed across zones
2. Replicas are in different zones than their masters
3. Zone information is displayed in the cluster topology

### Test zone failure

To test rack awareness:

1. Simulate zone failure by [cordoning nodes](https://kubernetes.io/docs/concepts/architecture/nodes/#manual-node-administration) in one zone
2. Verify that the cluster remains operational
3. Check that databases continue to serve requests

```bash
# Cordon nodes in a specific zone
kubectl cordon <node-in-zone-1>

# Check cluster and database status
kubectl get rec,redb
```

## Troubleshooting

### Common issues

**Nodes not distributed across zones**

- Verify node labels are correct
- Check that sufficient nodes exist in each zone
- Ensure the `rackAwarenessNodeLabel` matches actual node labels

**Cluster role permissions denied**

- Verify the ClusterRole and ClusterRoleBinding are applied
- Check that the service account name matches in all resources

**Database shards not distributed**

- Confirm the cluster has rack awareness enabled
- Check that the database has multiple shards
- Verify sufficient nodes exist across zones

### Debug commands

```bash
# Check node labels
kubectl describe nodes | grep -A5 Labels

# View cluster role permissions
kubectl describe clusterrole redis-enterprise-operator-consumer

# Check operator logs
kubectl logs deployment/redis-enterprise-operator
```

For more troubleshooting guidance, see [troubleshooting Redis Enterprise on Kubernetes]({{< relref "/operate/kubernetes/troubleshooting" >}}).

## Next steps

- [Configure Active-Active databases]({{< relref "/operate/kubernetes/reference/yaml-examples/active-active" >}})
- [Set up multi-namespace deployment]({{< relref "/operate/kubernetes/reference/yaml-examples/multi-namespace" >}})
- [Learn about database replication]({{< relref "/operate/kubernetes/re-databases/replica-redb" >}})

## Related documentation

- [Node selection recommendations]({{< relref "/operate/kubernetes/recommendations/node-selection" >}})
- [REC API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}})
- [REDB API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_database_api" >}})
- [Kubernetes node affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
- [Redis Enterprise cluster architecture]({{< relref "/operate/kubernetes/architecture" >}})
