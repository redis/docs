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

{{<embed-md "k8s/service_account.md">}}

### Service account configuration

- **name**: The service account name used by the operator
- **labels**: Standard labels for Redis Enterprise resources

## Role

The Role defines the permissions needed by the Redis Enterprise operator within the namespace.

{{<embed-md "k8s/role.md">}}

### Role configuration

- **name**: Must match the role name referenced in the role binding
- **rules**: Comprehensive permissions for managing Redis Enterprise resources
- **apiGroups**: Includes core Kubernetes APIs and Redis Enterprise custom resources

### Key permissions

- **app.redislabs.com**: Full access to Redis Enterprise custom resources
- **secrets**: Manage TLS certificates and database credentials
- **services**: Create and manage service endpoints
- **pods**: Monitor and manage Redis Enterprise pods
- **persistentvolumeclaims**: Manage persistent storage

## Role binding

The RoleBinding connects the service account to the role, granting the necessary permissions.

{{<embed-md "k8s/role_binding.md">}}

### Role binding configuration

- **subjects.name**: Must match the service account name
- **roleRef.name**: Must match the role name
- **namespace**: Apply in the same namespace as other resources

## Redis Enterprise cluster

The RedisEnterpriseCluster (REC) custom resource defines the cluster specification.

{{<embed-md "k8s/rec.md">}}

### Cluster configuration

- **metadata.name**: Cluster name (cannot be changed after creation)
- **spec.nodes**: Number of Redis Enterprise nodes (minimum 3)
- **persistentSpec.volumeSize**: Storage size per node
- **redisEnterpriseNodeResources**: CPU and memory allocation per node

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

{{<embed-md "k8s/redb.md">}}

### Database configuration

- **metadata.name**: Database name
- **spec.memorySize**: Memory allocation for the database
- **spec.shardCount**: Number of shards (affects performance and scalability)
- **spec.replication**: Enable/disable database replication

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

### Step 1: Create namespace

```bash
kubectl create namespace redis-enterprise
kubectl config set-context --current --namespace=redis-enterprise
```

### Step 2: Apply RBAC resources

```bash
kubectl apply -f service-account.yaml
kubectl apply -f role.yaml  
kubectl apply -f role-binding.yaml
```

### Step 3: Deploy the cluster

```bash
kubectl apply -f redis-cluster.yaml
```

Wait for the cluster to be ready:

```bash
kubectl get rec
kubectl describe rec rec
```

### Step 4: Create the database

```bash
kubectl apply -f redis-database.yaml
```

Verify the database is created:

```bash
kubectl get redb
kubectl describe redb redb
```

## Verification

### Check cluster status

```bash
# View cluster details
kubectl get rec -o wide

# Check cluster events
kubectl describe rec rec

# View cluster pods
kubectl get pods -l app=redis-enterprise
```

### Check database status

```bash
# View database details  
kubectl get redb -o wide

# Check database events
kubectl describe redb redb

# Get database connection details
kubectl get secret redb -o yaml
```

### Access the admin console

Get the admin console URL and credentials:

```bash
# Get admin console service
kubectl get svc rec-ui

# Get admin credentials
kubectl get secret rec -o jsonpath='{.data.username}' | base64 -d
kubectl get secret rec -o jsonpath='{.data.password}' | base64 -d
```

## Next steps

- [Create additional databases]({{< relref "/operate/kubernetes/re-databases" >}})
- [Configure networking]({{< relref "/operate/kubernetes/networking" >}})
- [Set up monitoring]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}})
- [Explore rack awareness]({{< relref "/operate/kubernetes/reference/yaml-examples/rack-awareness" >}})

## Related documentation

- [Quick start deployment]({{< relref "/operate/kubernetes/deployment/quick-start" >}})
- [REC API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}})
- [REDB API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_database_api" >}})
