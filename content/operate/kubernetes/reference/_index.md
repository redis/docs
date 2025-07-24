---
Title: Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Resources to help you manage Redis Enterprise custom resources on Kubernetes.
hideListLinks: true
linkTitle: Reference
weight: 89
---

Reference documentation for Redis Enterprise custom resources, including API specifications and practical guides for creating, configuring, and managing Redis Enterprise deployments on Kubernetes.

## Work with custom resources

Redis Enterprise for Kubernetes uses custom resources to manage clusters and databases. You can create, modify, and delete these resources using standard Kubernetes tools.

### Create custom resources

Create custom resources using `kubectl apply` with YAML manifests:

```bash
kubectl apply -f my-redis-cluster.yaml
kubectl apply -f my-redis-database.yaml
```

### View custom resources

List and inspect existing custom resources:

```bash
# List Redis Enterprise clusters
kubectl get rec

# List Redis Enterprise databases
kubectl get redb

# List Active-Active databases
kubectl get reaadb

# List remote clusters
kubectl get rerc

# Get detailed information about a specific resource
kubectl describe rec my-cluster
kubectl describe redb my-database
```

### Modify custom resources

Update custom resources by editing the YAML manifest and reapplying:

```bash
# Edit and apply updated manifest
kubectl apply -f updated-redis-cluster.yaml

# Or edit directly (not recommended for production)
kubectl edit rec my-cluster
kubectl edit redb my-database
```

## YAML examples

Complete YAML examples for common deployment scenarios:

- [YAML examples]({{< relref "/operate/kubernetes/reference/yaml-examples" >}}) - Ready-to-use YAML configurations for different deployment types

### Example categories

- [Basic deployment]({{< relref "/operate/kubernetes/reference/yaml-examples/basic-deployment" >}}) - Essential YAML files for simple Redis Enterprise deployment
- [Rack awareness]({{< relref "/operate/kubernetes/reference/yaml-examples/rack-awareness" >}}) - YAML examples for rack-aware deployments across availability zones
- [Active-Active]({{< relref "/operate/kubernetes/reference/yaml-examples/active-active" >}}) - YAML examples for Active-Active databases across multiple clusters
- [Multi-namespace]({{< relref "/operate/kubernetes/reference/yaml-examples/multi-namespace" >}}) - YAML examples for deploying across multiple namespaces

## API reference

Complete API specifications for all Redis Enterprise custom resources:

Core resources:

- [Redis Enterprise cluster API (REC)]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}}) - Manage Redis Enterprise clusters
- [Redis Enterprise database API (REDB)]({{< relref "/operate/kubernetes/reference/redis_enterprise_database_api" >}}) - Manage Redis databases

Active-Active resources:

- [Active-Active database API (REAADB)]({{< relref "/operate/kubernetes/reference/redis_enterprise_active_active_database_api" >}}) - Manage Active-Active databases
- [Remote cluster API (RERC)]({{< relref "/operate/kubernetes/reference/redis_enterprise_remote_cluster_api" >}}) - Configure remote cluster connections

## Compatibility

Information about supported Kubernetes distributions and versions:

- [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) - Compatible Kubernetes platforms and versions

## Best practices

When working with custom resources:

- **Use version control**: Store your YAML manifests in version control systems
- **Validate before applying**: Use `kubectl apply --dry-run=client` to validate changes
- **Monitor resource status**: Check resource status after applying changes
- **Follow naming conventions**: Use consistent naming for easier management
- **Document configurations**: Add annotations and labels to describe resource purpose