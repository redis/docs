---
Title: Basic deployment examples
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: YAML examples for basic Redis Enterprise deployment including RBAC, cluster, and database configurations.
linkTitle: Basic deployment
weight: 10
---

This page provides complete YAML examples for a basic Redis Enterprise deployment on Kubernetes. These examples include all the essential components needed to deploy a Redis Enterprise cluster and create a database.

## Deployment order

Apply the YAML files in this order:

1. [Service account](#service-account)
2. [Role](#role)
3. [Role binding](#role-binding)
4. [Redis Enterprise cluster](#redis-enterprise-cluster)
5. [Redis Enterprise database](#redis-enterprise-database)

## Service account

The service account provides an identity for the Redis Enterprise operator.

{{<embed-yaml "k8s/service_account.md" "service-account.yaml">}}

### Service account configuration

- `name`: The service account name used by the operator
- `labels`: Standard labels for Redis Enterprise resources

## Role

The Role defines the permissions needed by the Redis Enterprise operator within the namespace.

{{<embed-yaml "k8s/role.md" "role.yaml">}}

### Role configuration

- `name`: Must match the role name referenced in the role binding
- `rules`: Comprehensive permissions for managing Redis Enterprise resources
- `apiGroups`: Includes core Kubernetes APIs and Redis Enterprise custom resources

### Key permissions

- `app.redislabs.com`: Full access to Redis Enterprise custom resources
- `secrets`: Manage TLS certificates and database credentials
- `services`: Create and manage service endpoints
- `pods`: Monitor and manage Redis Enterprise pods
- `persistentvolumeclaims`: Manage persistent storage

## Role binding

The RoleBinding connects the service account to the role, granting the necessary permissions.

{{<embed-yaml "k8s/role_binding.md" "role-binding.yaml">}}

### Role binding configuration

- `subjects.name`: Must match the service account name
- `roleRef.name`: Must match the role name
- `namespace`: Apply in the same namespace as other resources

## Redis Enterprise cluster

The RedisEnterpriseCluster (REC) custom resource defines the cluster specification.

{{<embed-yaml "k8s/rec.md" "redis-enterprise-cluster.yaml">}}

### Cluster configuration

- `metadata.name`: Cluster name (cannot be changed after creation)
- `spec.nodes`: Number of Redis Enterprise nodes (minimum 3)
- `persistentSpec.volumeSize`: Storage size per node
- `redisEnterpriseNodeResources`: CPU and memory allocation per node

### Cluster customization options

Edit these values based on your requirements:

```yaml
spec:
  # Increase nodes for larger clusters
  nodes: 5

  # Adjust storage size
  persistentSpec:
    volumeSize: 50Gi

  # Modify resource allocation
  redisEnterpriseNodeResources:
    requests:
      cpu: 4
      memory: 8Gi
    limits:
      cpu: 4
      memory: 8Gi
```

## Redis Enterprise database

The RedisEnterpriseDatabase (REDB) custom resource defines the database specification.

{{<embed-yaml "k8s/redb.md" "redis-enterprise-database.yaml">}}

### Database configuration

- `metadata.name`: Database name
- `spec.memorySize`: Memory allocation for the database
- `spec.shardCount`: Number of shards (affects performance and scalability)
- `spec.replication`: Enable/disable database replication

### Database customization options

Edit these values based on your requirements:

```yaml
spec:
  # Increase memory for larger datasets
  memorySize: 1GB

  # Add more shards for better performance
  shardCount: 3

  # Enable replication for high availability
  replication: true

  # Add database-specific configuration
  redisEnterpriseConfiguration:
    # Enable specific Redis modules
    modules:
      - name: RedisJSON
      - name: RedisSearch
```

## Applying the configuration

For detailed deployment steps, see the [Quick start deployment guide]({{< relref "/operate/kubernetes/deployment/quick-start" >}}). The process includes:

1. [Create namespace]({{< relref "/operate/kubernetes/deployment/quick-start#create-a-new-namespace" >}})
2. [Deploy the operator]({{< relref "/operate/kubernetes/deployment/quick-start#deploy-the-operator" >}})
3. [Create Redis Enterprise cluster]({{< relref "/operate/kubernetes/deployment/quick-start#create-a-redis-enterprise-cluster-rec" >}})
4. [Create Redis Enterprise database]({{< relref "/operate/kubernetes/deployment/quick-start#create-a-database" >}})

## Verification

For verification steps and accessing the admin console, see:

- [Verify cluster deployment]({{< relref "/operate/kubernetes/deployment/quick-start#verify-the-deployment" >}})
- [Connect to the cluster]({{< relref "/operate/kubernetes/re-clusters/connect-to-cluster" >}})
- [Access the admin console]({{< relref "/operate/kubernetes/re-clusters/connect-to-cluster#access-the-cluster-manager-ui" >}})

## Next steps

- [Create additional databases]({{< relref "/operate/kubernetes/re-databases" >}})
- [Configure networking]({{< relref "/operate/kubernetes/networking" >}})
- [Set up monitoring]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}})
- [Explore rack awareness]({{< relref "/operate/kubernetes/reference/yaml-examples/rack-awareness" >}})

## Related documentation

- [Quick start deployment]({{< relref "/operate/kubernetes/deployment/quick-start" >}})
- [REC API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}})
- [REDB API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_database_api" >}})
