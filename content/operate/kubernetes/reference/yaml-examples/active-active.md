---
Title: Active-Active examples
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: YAML examples for Active-Active Redis Enterprise databases across multiple Kubernetes clusters.
linkTitle: Active-Active
weight: 30
---

This page provides YAML examples for deploying Active-Active Redis Enterprise databases across multiple Kubernetes clusters. Active-Active databases provide multi-master replication with conflict resolution, enabling global distribution and local read/write access.

## Overview

Active-Active databases span multiple Redis Enterprise clusters and provide:
- **Multi-master replication**: Write to any participating cluster
- **Conflict resolution**: Automatic handling of concurrent writes
- **Global distribution**: Low-latency access from multiple regions
- **High availability**: Continues operating even if clusters go offline

## Prerequisites

Before creating Active-Active databases:

1. **Multiple REC clusters**: Deploy Redis Enterprise clusters in different regions/zones
2. **Network connectivity**: Clusters must be able to communicate with each other
3. **DNS configuration**: Set up ingress/routes with proper DNS records
4. **Admission controller**: Enable the ValidatingWebhook for Active-Active support

## Architecture

This example shows a two-cluster Active-Active setup:
- **Cluster 1**: `rec-chicago` in namespace `ns-chicago`
- **Cluster 2**: `rec-boston` in namespace `ns-boston`

## RERC for Chicago cluster

Each participating cluster needs a RedisEnterpriseRemoteCluster (RERC) resource pointing to the other clusters.

{{<embed-md "k8s/rerc.md">}}

### RERC configuration

- **metadata.name**: Unique name for this remote cluster reference
- **spec.recName**: Name of the remote REC
- **spec.recNamespace**: Namespace of the remote REC
- **spec.apiFqdnUrl**: API endpoint URL for the remote cluster
- **spec.dbFqdnSuffix**: Database hostname suffix for the remote cluster
- **spec.secretName**: Secret containing authentication credentials

### Customization for your environment

Edit these values for your specific setup:

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRemoteCluster
metadata:
  name: rerc-chicago
spec:
  # Remote cluster details
  recName: rec-chicago
  recNamespace: ns-chicago

  # Update with your actual domain
  apiFqdnUrl: api-rec-chicago-ns-chicago.example.com
  dbFqdnSuffix: -db-rec-chicago-ns-chicago.example.com

  # Secret with remote cluster credentials
  secretName: redis-enterprise-rerc-chicago
```

## RERC for Boston cluster

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRemoteCluster
metadata:
  name: rerc-boston
spec:
  recName: rec-boston
  recNamespace: ns-boston
  apiFqdnUrl: api-rec-boston-ns-boston.example.com
  dbFqdnSuffix: -db-rec-boston-ns-boston.example.com
  secretName: redis-enterprise-rerc-boston
```

## Active-Active database

The RedisEnterpriseActiveActiveDatabase (REAADB) resource defines the Active-Active database.

{{<embed-md "k8s/reaadb.md">}}

### REAADB configuration

- **metadata.name**: Active-Active database name
- **spec.participatingClusters**: List of RERC names that participate in this database
- **spec.globalConfigurations**: Database settings applied to all participating clusters

### Advanced configuration

Add global database settings:

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseActiveActiveDatabase
metadata:
  name: reaadb
spec:
  # Global database configuration
  globalConfigurations:
    # Memory allocation per participating cluster
    memorySize: 1GB
    
    # Number of shards (affects performance)
    shardCount: 2
    
    # Enable replication within each cluster
    replication: true
    
    # Secret containing database password
    databaseSecretName: my-db-secret
    
    # Redis modules to enable
    modules:
      - name: RedisJSON
      - name: RedisSearch
    
    # Database-specific Redis configuration
    redisEnterpriseConfiguration:
      # Set eviction policy
      maxmemory-policy: allkeys-lru
      
      # Enable keyspace notifications
      notify-keyspace-events: Ex
  
  # Participating clusters
  participatingClusters:
    - name: rerc-chicago
    - name: rerc-boston
```

## Applying the configuration

### Step 1: Prepare clusters

Ensure both clusters are deployed and accessible:

```bash
# Check cluster status on both clusters
kubectl get rec --all-namespaces

# Verify ingress/routes are configured
kubectl get ingress,routes --all-namespaces
```

### Step 2: Create RERC resources

Apply RERC resources on each cluster pointing to the other clusters:

**On Chicago cluster:**
```bash
kubectl apply -f rerc-boston.yaml
```

**On Boston cluster:**
```bash
kubectl apply -f rerc-chicago.yaml
```

### Step 3: Verify RERC status

Check that remote clusters are connected:

```bash
# Check RERC status
kubectl get rerc
kubectl describe rerc rerc-boston

# Verify connectivity
kubectl logs deployment/redis-enterprise-operator
```

### Step 4: Create Active-Active database

Apply the REAADB resource on one of the participating clusters:

```bash
kubectl apply -f active-active-database.yaml
```

### Step 5: Verify database creation

Check that the database is created on all participating clusters:

```bash
# Check REAADB status
kubectl get reaadb
kubectl describe reaadb reaadb

# Verify local databases are created
kubectl get redb
```

## Verification

### Check database status

```bash
# View Active-Active database details
kubectl get reaadb reaadb -o yaml

# Check local database instances
kubectl get redb --all-namespaces

# Verify database connectivity
kubectl get svc | grep reaadb
```

### Test replication

Connect to the database on different clusters and verify data replication:

```bash
# Get database connection details
kubectl get secret reaadb -o yaml

# Connect from Chicago cluster
redis-cli -h <chicago-db-endpoint> -p <port> -a <password>
SET test-key "chicago-value"

# Connect from Boston cluster  
redis-cli -h <boston-db-endpoint> -p <port> -a <password>
GET test-key  # Should return "chicago-value"
```

### Monitor replication lag

Use the Redis Enterprise admin console to monitor:
- Replication status between clusters
- Sync lag metrics
- Conflict resolution statistics

## Troubleshooting

### Common issues

**RERC connection failures**
- Verify DNS resolution for API and database endpoints
- Check network connectivity between clusters
- Validate ingress/route configurations

**Database creation fails**
- Ensure admission controller is enabled
- Check that all RERC resources are in "Active" state
- Verify sufficient resources on all participating clusters

**Replication not working**
- Check database endpoints are accessible
- Verify TLS certificates if using encrypted connections
- Monitor operator logs for replication errors

### Debug commands

```bash
# Check RERC connectivity
kubectl describe rerc <rerc-name>

# View operator logs
kubectl logs deployment/redis-enterprise-operator

# Check database events
kubectl describe reaadb <reaadb-name>

# Verify network policies
kubectl get networkpolicies
```

## Security considerations

### TLS encryption

Enable TLS for inter-cluster communication:

```yaml
spec:
  globalConfigurations:
    # Enable TLS for replication
    tlsMode: enabled
    
    # Specify TLS certificate secret
    tlsSecretName: my-tls-secret
```

### Authentication

Secure database access with authentication:

```yaml
spec:
  globalConfigurations:
    # Enable database authentication
    requireAuth: true
    
    # Secret containing database password
    databaseSecretName: my-auth-secret
```

## Next steps

- [Configure multi-namespace deployment]({{< relref "/operate/kubernetes/reference/yaml-examples/multi-namespace" >}})
- [Learn about Active-Active management]({{< relref "/operate/kubernetes/active-active" >}})
- [Set up monitoring and alerts]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}})

## Related documentation

- [Active-Active database guide]({{< relref "/operate/kubernetes/active-active/create-reaadb" >}})
- [REAADB API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_active_active_database_api" >}})
- [RERC API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_remote_cluster_api" >}})
- [Networking configuration]({{< relref "/operate/kubernetes/networking" >}})
