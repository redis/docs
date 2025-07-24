---
Title: YAML examples
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Example YAML files for deploying Redis Enterprise on Kubernetes with different configurations.
hideListLinks: true
linkTitle: YAML examples
weight: 85
---

This section provides complete YAML examples for common Redis Enterprise for Kubernetes deployment scenarios. Each example includes the necessary configuration files and step-by-step instructions for editing and applying them.

## How to use these examples

### Download and customize

1. Copy the YAML content from the examples below
2. Save each YAML block to a separate file with a descriptive name
3. Edit the configuration values to match your environment
4. Apply the files in the correct order using `kubectl apply`

### Configuration storage

Redis Enterprise for Kubernetes stores configuration in several places:

- Custom resources: Cluster and database specifications are stored as Kubernetes custom resources (REC, REDB, REAADB, RERC)
- Secrets: Sensitive data like passwords and certificates are stored in Kubernetes secrets
- ConfigMaps: Non-sensitive configuration data is stored in ConfigMaps
- RBAC resources: Permissions are defined through Roles, ClusterRoles, and their bindings

### Applying YAML files

Apply YAML files using `kubectl apply`:

```bash
# Apply a single file
kubectl apply -f my-config.yaml

# Apply multiple files
kubectl apply -f rbac/ -f cluster/ -f database/

# Apply with validation
kubectl apply --dry-run=client -f my-config.yaml
```

### Monitoring deployment

Check the status of your resources after applying:

```bash
# Check operator deployment
kubectl get deployment redis-enterprise-operator

# Check cluster status
kubectl get rec
kubectl describe rec <cluster-name>

# Check database status
kubectl get redb
kubectl describe redb <database-name>

# View events for troubleshooting
kubectl get events --sort-by=.metadata.creationTimestamp
```

## Example categories

- [Basic deployment examples]({{< relref "/operate/kubernetes/reference/yaml-examples/basic-deployment" >}}) - Service account, RBAC, cluster, and database configurations
- [Rack awareness examples]({{< relref "/operate/kubernetes/reference/yaml-examples/rack-awareness" >}}) - Rack-aware cluster configuration and required RBAC
- [Active-Active examples]({{< relref "/operate/kubernetes/reference/yaml-examples/active-active" >}}) - Multi-cluster Active-Active database setup
- [Multi-namespace examples]({{< relref "/operate/kubernetes/reference/yaml-examples/multi-namespace" >}}) - Cross-namespace operator and cluster configurations

## Best practices

- Validate syntax: Use `kubectl apply --dry-run=client` to check YAML syntax before applying
- Version control: Store your customized YAML files in version control
- Resource naming: Use consistent, descriptive names for all resources

## Related documentation

- [API reference]({{< relref "/operate/kubernetes/reference" >}}) - Complete API specifications for all custom resources
- [Quick start deployment]({{< relref "/operate/kubernetes/deployment/quick-start" >}}) - Step-by-step deployment guide
- [Multi-namespace deployment]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}}) - Detailed multi-namespace setup guide
- [Active-Active databases]({{< relref "/operate/kubernetes/active-active" >}}) - Active-Active configuration and management
