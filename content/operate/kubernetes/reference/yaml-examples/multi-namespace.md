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

**File: `operator-service-account.yaml`**

{{<embed-md "k8s/service_account.md">}}

## Operator cluster role

The operator needs cluster-wide permissions to manage resources across namespaces.

**File: `operator-cluster-role.yaml`**

{{<embed-md "k8s/multi-ns_operator_cluster_role.md">}}

## Operator cluster role binding

**File: `operator-cluster-role-binding.yaml`**

{{<embed-md "k8s/multi-ns_operator_cluster_role_binding.md">}}

## Consumer service account

These resources are deployed in each namespace where you want to create Redis Enterprise clusters or databases.

**File: `consumer-service-account.yaml`**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: redis-enterprise-operator
  labels:
    app: redis-enterprise
```

## Consumer role

**File: `consumer-role.yaml`**

{{<embed-md "k8s/multi-ns_role.md">}}

## Consumer role binding

**File: `consumer-role-binding.yaml`**

{{<embed-md "k8s/multi-ns_role_binding.md">}}

### Consumer namespace configuration

- **subjects.name**: Must match the operator service account name
- **subjects.namespace**: Must be the operator namespace, not the consumer namespace
- **roleRef.name**: Must match the consumer role name

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

### Step 1: Create namespaces

```bash
# Create operator namespace
kubectl create namespace redis-enterprise-operator

# Create consumer namespaces
kubectl create namespace app-production
kubectl create namespace app-staging
```

### Step 2: Deploy operator resources

```bash
# Switch to operator namespace
kubectl config set-context --current --namespace=redis-enterprise-operator

# Apply operator RBAC
kubectl apply -f operator-service-account.yaml
kubectl apply -f operator-cluster-role.yaml
kubectl apply -f operator-cluster-role-binding.yaml

# Deploy the operator (using bundle or Helm)
kubectl apply -f https://raw.githubusercontent.com/RedisLabs/redis-enterprise-k8s-docs/v7.8.6/bundle.yaml
```

### Step 3: Configure consumer namespaces

**For production namespace:**
```bash
kubectl config set-context --current --namespace=app-production

kubectl apply -f consumer-service-account.yaml
kubectl apply -f consumer-role.yaml
kubectl apply -f consumer-role-binding.yaml
```

**For staging namespace:**
```bash
kubectl config set-context --current --namespace=app-staging

kubectl apply -f consumer-service-account.yaml
kubectl apply -f consumer-role.yaml
kubectl apply -f consumer-role-binding.yaml
```

### Step 4: Deploy clusters

```bash
# Deploy production cluster
kubectl apply -f production-cluster.yaml

# Deploy staging cluster
kubectl apply -f staging-cluster.yaml
```

### Step 5: Create databases

```bash
# Create production database
kubectl apply -f production-database.yaml

# Create staging database
kubectl apply -f staging-database.yaml
```

## Verification

### Check operator status

```bash
# Verify operator is running
kubectl get deployment redis-enterprise-operator -n redis-enterprise-operator

# Check operator logs
kubectl logs deployment/redis-enterprise-operator -n redis-enterprise-operator
```

### Check clusters across namespaces

```bash
# View all clusters
kubectl get rec --all-namespaces

# Check specific cluster status
kubectl describe rec rec-production -n app-production
kubectl describe rec rec-staging -n app-staging
```

### Check databases across namespaces

```bash
# View all databases
kubectl get redb --all-namespaces

# Check specific database status
kubectl describe redb redb-production -n app-production
kubectl describe redb redb-staging -n app-staging
```

### Verify RBAC permissions

```bash
# Check cluster role bindings
kubectl get clusterrolebinding | grep redis-enterprise

# Check role bindings in consumer namespaces
kubectl get rolebinding -n app-production
kubectl get rolebinding -n app-staging
```

## Management operations

### Adding new consumer namespaces

To add a new consumer namespace:

1. Create the namespace
2. Apply consumer RBAC resources
3. Deploy clusters and databases as needed

```bash
# Create new namespace
kubectl create namespace app-development

# Apply RBAC resources
kubectl config set-context --current --namespace=app-development
kubectl apply -f consumer-service-account.yaml
kubectl apply -f consumer-role.yaml
kubectl apply -f consumer-role-binding.yaml
```

### Monitoring across namespaces

Monitor resources across all namespaces:

```bash
# Watch all Redis Enterprise resources
kubectl get rec,redb,reaadb,rerc --all-namespaces -w

# Check resource usage by namespace
kubectl top pods --all-namespaces | grep redis-enterprise
```

## Security considerations

### Namespace isolation

- Each consumer namespace has its own RBAC configuration
- Resources in one namespace cannot access resources in another
- Secrets and ConfigMaps are namespace-scoped

### Operator permissions

The operator has cluster-wide permissions but only for:
- Reading namespace information
- Managing Redis Enterprise custom resources
- Creating necessary Kubernetes resources

### Network policies

Consider implementing network policies for additional isolation:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: redis-enterprise-isolation
  namespace: app-production
spec:
  podSelector:
    matchLabels:
      app: redis-enterprise
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: app-production
```

## Troubleshooting

### Common issues

**Operator cannot create resources in consumer namespace**
- Verify ClusterRole and ClusterRoleBinding are applied
- Check that consumer namespace has proper Role and RoleBinding
- Ensure service account names match across configurations

**Resources not appearing in consumer namespace**
- Confirm operator is running and healthy
- Check operator logs for permission errors
- Verify namespace labels and selectors

### Debug commands

```bash
# Check operator permissions
kubectl auth can-i create rec --as=system:serviceaccount:redis-enterprise-operator:redis-enterprise-operator -n app-production

# View operator logs
kubectl logs deployment/redis-enterprise-operator -n redis-enterprise-operator --tail=100

# Check RBAC configuration
kubectl describe clusterrole redis-enterprise-operator-consumer-ns
kubectl describe rolebinding redis-enterprise-operator -n app-production
```

## Next steps

- [Configure networking across namespaces]({{< relref "/operate/kubernetes/networking" >}})
- [Set up monitoring for multi-namespace deployment]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}})
- [Learn about resource management]({{< relref "/operate/kubernetes/recommendations" >}})

## Related documentation

- [Multi-namespace deployment guide]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}})
- [RBAC configuration]({{< relref "/operate/kubernetes/security" >}})
- [Kubernetes namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
