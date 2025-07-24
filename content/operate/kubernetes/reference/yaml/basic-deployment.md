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

For complete deployment instructions, see the [Quick start deployment guide]({{< relref "/operate/kubernetes/deployment/quick-start" >}}).

## Service account

The service account provides an identity for the Redis Enterprise operator.

{{<embed-yaml "k8s/service_account.md" "service-account.yaml">}}

Service account configuration:
- `name`: The service account name used by the operator
- `labels`: Standard labels for Redis Enterprise resources

## Role

The Role defines the permissions needed by the Redis Enterprise operator within the namespace.

{{<embed-yaml "k8s/role.md" "role.yaml">}}

Role configuration:
- `name`: Must match the role name referenced in the role binding
- `rules`: Comprehensive permissions for managing Redis Enterprise resources
- `apiGroups`: Includes core Kubernetes APIs and Redis Enterprise custom resources

Key permissions:
- `app.redislabs.com`: Full access to Redis Enterprise custom resources
- `secrets`: Manage TLS certificates and database credentials
- `services`: Create and manage service endpoints
- `pods`: Monitor and manage Redis Enterprise pods
- `persistentvolumeclaims`: Manage persistent storage

## Role binding

The RoleBinding connects the service account to the role, granting the necessary permissions.

{{<embed-yaml "k8s/role_binding.md" "role-binding.yaml">}}

Role binding configuration:
- `subjects.name`: Must match the service account name
- `roleRef.name`: Must match the role name
- `namespace`: Apply in the same namespace as other resources

## Redis Enterprise cluster

The RedisEnterpriseCluster (REC) custom resource defines the cluster specification.

{{<embed-yaml "k8s/rec.md" "redis-enterprise-cluster.yaml">}}

Cluster configuration:
- `metadata.name`: Cluster name (cannot be changed after creation)
- `spec.nodes`: Number of Redis Enterprise nodes (minimum 3)
- `persistentSpec.volumeSize`: Storage size per node
- `redisEnterpriseNodeResources`: CPU and memory allocation per node

Edit the values in the downloaded YAML file based on your requirements, such as increasing the number of nodes, adjusting storage size, or modifying resource allocation.

## Redis Enterprise database

The RedisEnterpriseDatabase (REDB) custom resource defines the database specification.

{{<embed-yaml "k8s/redb.md" "redis-enterprise-database.yaml">}}

Database configuration:
- `metadata.name`: Database name
- `spec.memorySize`: Memory allocation for the database
- `spec.shardCount`: Number of shards (affects performance and scalability)
- `spec.replication`: Enable/disable database replication

Edit the values in the downloaded YAML file based on your requirements, such as increasing memory for larger datasets, adding more shards for better performance, enabling replication for high availability, or adding Redis modules.

## Apply the configuration

To deploy these YAML files, follow the [deployment guide]({{< relref "/operate/kubernetes/deployment/quick-start" >}}), which provides step-by-step instructions for creating namespaces, deploying the operator, and applying these configuration files.

## Related documentation

- [Deploy on Kubernetes]({{< relref "/operate/kubernetes/deployment/quick-start" >}})
- [REC API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}})
- [REDB API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_database_api" >}})
