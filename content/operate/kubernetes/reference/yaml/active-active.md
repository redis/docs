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

Before creating Active-Active databases, see the [Active-Active prerequisites]({{< relref "/operate/kubernetes/active-active/create-reaadb#prerequisites" >}}) for detailed requirements including:

- Multiple REC clusters deployed in different regions/zones
- Network connectivity and DNS configuration
- Admission controller setup

## Architecture

This example shows a two-cluster Active-Active setup:
- **Cluster 1**: `rec-chicago` in namespace `ns-chicago`
- **Cluster 2**: `rec-boston` in namespace `ns-boston`

For complete deployment instructions, see the [Active-Active database guide]({{< relref "/operate/kubernetes/active-active" >}}).

## RERC for Chicago cluster

Each participating cluster needs a RedisEnterpriseRemoteCluster (RERC) resource pointing to the other clusters.

{{<embed-yaml "k8s/rerc.md" "redis-enterprise-remote-cluster.yaml">}}

### RERC configuration

- `metadata.name`: Unique name for this remote cluster reference
- `spec.recName`: Name of the remote REC
- `spec.recNamespace`: Namespace of the remote REC
- `spec.apiFqdnUrl`: API endpoint URL for the remote cluster
- `spec.dbFqdnSuffix`: Database hostname suffix for the remote cluster
- `spec.secretName`: Secret containing authentication credentials

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

{{<embed-yaml "k8s/reaadb.md" "redis-enterprise-active-active-database.yaml">}}

### REAADB configuration

- `metadata.name`: Active-Active database name
- `spec.participatingClusters`: List of RERC names that participate in this database
- `spec.globalConfigurations`: Database settings applied to all participating clusters

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

To deploy Active-Active databases using these YAML files, follow the [Create Active-Active database (REAADB)]({{< relref "/operate/kubernetes/active-active/create-reaadb" >}}) guide, which provides detailed instructions for preparing clusters, creating RERC resources, and deploying REAADB configurations.

## Verification

For verification steps and testing procedures, see [Verify Active-Active database creation]({{< relref "/operate/kubernetes/active-active/create-reaadb#verify-creation" >}}) and [Active-Active database management]({{< relref "/operate/kubernetes/active-active" >}}).

## Troubleshooting

For troubleshooting Active-Active databases, see [Active-Active troubleshooting]({{< relref "/operate/kubernetes/troubleshooting" >}}) and [general Kubernetes troubleshooting]({{< relref "/operate/kubernetes/troubleshooting" >}}).

## Security considerations

For security configuration including TLS encryption and authentication, see [Active-Active security]({{< relref "/operate/kubernetes/security" >}}) and [database security]({{< relref "/operate/kubernetes/re-databases" >}}).

## Next steps

- [Configure multi-namespace deployment]({{< relref "/operate/kubernetes/reference/yaml-examples/multi-namespace" >}})
- [Learn about Active-Active management]({{< relref "/operate/kubernetes/active-active" >}})
- [Set up monitoring and alerts]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}})

## Related documentation

- [Active-Active database guide]({{< relref "/operate/kubernetes/active-active/create-reaadb" >}})
- [REAADB API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_active_active_database_api" >}})
- [RERC API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_remote_cluster_api" >}})
- [Networking configuration]({{< relref "/operate/kubernetes/networking" >}})
