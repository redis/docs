---
Title: Multi-namespace examples
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: YAML examples for deploying Redis Enterprise across multiple Kubernetes namespaces.
linkTitle: Multi-namespace
weight: 40
---

This page provides YAML examples for deploying Redis Enterprise across multiple Kubernetes namespaces. Multi-namespace deployment allows a single Redis Enterprise operator to manage clusters and databases in different namespaces, providing better resource isolation and organization.

## Overview

Multi-namespace deployment enables:
- **Namespace isolation**: Separate Redis Enterprise resources by team, environment, or application
- **Centralized management**: Single operator manages multiple namespaces
- **Resource sharing**: Efficient use of cluster resources across namespaces
- **Flexible RBAC**: Fine-grained permissions per namespace

## Architecture

This example shows:
- **Operator namespace**: `redis-enterprise-operator` (where the operator runs)
- **Consumer namespaces**: `app-production`, `app-staging` (where REC/REDB resources are created)

## Deployment order

Apply the YAML files in this order:

1. [Operator service account](#operator-service-account)
2. [Operator cluster role](#operator-cluster-role)
3. [Operator cluster role binding](#operator-cluster-role-binding)
4. [Consumer service account](#consumer-service-account)
5. [Consumer role](#consumer-role)
6. [Consumer role binding](#consumer-role-binding)
7. [Redis Enterprise clusters](#redis-enterprise-clusters)
8. [Redis Enterprise databases](#redis-enterprise-databases)

## Operator service account

These resources are deployed in the namespace where the Redis Enterprise operator runs.

{{<embed-yaml "k8s/service_account.md" "operator-service-account.yaml">}}

## Operator cluster role

The operator needs cluster-wide permissions to manage resources across namespaces.

{{<embed-yaml "k8s/multi-ns_operator_cluster_role.md" "operator-cluster-role.yaml">}}

## Operator cluster role binding

{{<embed-yaml "k8s/multi-ns_operator_cluster_role_binding.md" "operator-cluster-role-binding.yaml">}}

## Consumer service account

These resources are deployed in each namespace where you want to create Redis Enterprise clusters or databases.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: redis-enterprise-operator
  labels:
    app: redis-enterprise
```

## Consumer role

{{<embed-yaml "k8s/multi-ns_role.md" "consumer-role.yaml">}}

## Consumer role binding

{{<embed-yaml "k8s/multi-ns_role_binding.md" "consumer-role-binding.yaml">}}

### Consumer namespace configuration

- `subjects.name`: Must match the operator service account name
- `subjects.namespace`: Must be the operator namespace, not the consumer namespace
- `roleRef.name`: Must match the consumer role name

## Redis Enterprise clusters

Deploy Redis Enterprise clusters in consumer namespaces.

### Production cluster

**File: `production-cluster.yaml`**

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec-production
  namespace: app-production
  labels:
    app: redis-enterprise
    environment: production
spec:
  nodes: 5
  
  persistentSpec:
    enabled: true
    volumeSize: 50Gi
  
  redisEnterpriseNodeResources:
    requests:
      cpu: 4
      memory: 8Gi
    limits:
      cpu: 4
      memory: 8Gi
  
  # Production-specific configuration
  redisEnterpriseConfiguration:
    # Enable cluster backup
    backup_interval: "24h"
    
    # Set log level
    log_level: "info"
```

### Staging cluster

**File: `staging-cluster.yaml`**

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec-staging
  namespace: app-staging
  labels:
    app: redis-enterprise
    environment: staging
spec:
  nodes: 3
  
  persistentSpec:
    enabled: true
    volumeSize: 20Gi
  
  redisEnterpriseNodeResources:
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 2
      memory: 4Gi
```

## Redis Enterprise databases

Create databases in the appropriate namespaces.

### Production database

**File: `production-database.yaml`**

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseDatabase
metadata:
  name: redb-production
  namespace: app-production
  labels:
    app: redis-enterprise
    environment: production
spec:
  memorySize: 2GB
  shardCount: 3
  replication: true
  
  # Production-specific settings
  redisEnterpriseConfiguration:
    # Enable persistence
    persistence: aof
    
    # Set eviction policy
    maxmemory-policy: allkeys-lru
    
    # Enable modules
    modules:
      - name: RedisJSON
      - name: RedisSearch
```

### Staging database

**File: `staging-database.yaml`**

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseDatabase
metadata:
  name: redb-staging
  namespace: app-staging
  labels:
    app: redis-enterprise
    environment: staging
spec:
  memorySize: 512MB
  shardCount: 1
  replication: false
  
  # Staging-specific settings
  redisEnterpriseConfiguration:
    # Disable persistence for faster testing
    persistence: disabled
    
    # Enable modules for testing
    modules:
      - name: RedisJSON
```

## Applying the configuration

For detailed multi-namespace deployment steps, see [Multi-namespace deployment]({{< relref "/operate/kubernetes/deployment/multi-namespace" >}}). The process includes:

1. Create operator and consumer namespaces
2. Deploy operator with cluster-wide permissions
3. Configure RBAC for consumer namespaces
4. Deploy clusters and databases in consumer namespaces

## Verification

For verification steps and troubleshooting multi-namespace deployments, see [Multi-namespace verification]({{< relref "/operate/kubernetes/deployment/multi-namespace#verify-deployment" >}}) and [troubleshooting guide]({{< relref "/operate/kubernetes/troubleshooting" >}}).

## Management operations

For managing multi-namespace deployments including adding/removing namespaces and monitoring, see [Multi-namespace management]({{< relref "/operate/kubernetes/deployment/multi-namespace" >}}).

## Security considerations

For security considerations including namespace isolation, RBAC permissions, and network policies, see [Kubernetes security]({{< relref "/operate/kubernetes/security" >}}) and [multi-namespace security]({{< relref "/operate/kubernetes/deployment/multi-namespace#security-considerations" >}}).

## Troubleshooting

For troubleshooting multi-namespace deployments, see [Multi-namespace troubleshooting]({{< relref "/operate/kubernetes/troubleshooting" >}}).

## Next steps

- [Configure networking across namespaces]({{< relref "/operate/kubernetes/networking" >}})
- [Set up monitoring for multi-namespace deployment]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}})
- [Learn about resource management]({{< relref "/operate/kubernetes/recommendations" >}})

## Related documentation

- [Multi-namespace deployment guide]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}})
- [RBAC configuration]({{< relref "/operate/kubernetes/security" >}})
- [Kubernetes namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
