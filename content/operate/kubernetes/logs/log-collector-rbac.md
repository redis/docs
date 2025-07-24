---
Title: Log collector RBAC
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: RBAC configurations for Redis Enterprise log collector in all and restricted modes.
linkTitle: Log collector RBAC
weight: 90
---

This page provides YAML examples for configuring RBAC permissions for the Redis Enterprise log collector tool. The log collector requires different permission levels depending on the collection mode you choose.

## Overview

The Redis Enterprise log collector script helps gather diagnostic information for troubleshooting. It has two collection modes that require different RBAC permissions:

- **Restricted mode**: Collects only Redis Enterprise-related resources and logs (default for versions 6.2.18-3+)
- **All mode**: Collects comprehensive cluster information including non-Redis resources (default for versions 6.2.12-1 and earlier)

## When to use each mode

### Restricted mode (recommended)

Use restricted mode when:
- You want to minimize security exposure
- Your organization has strict RBAC policies
- You only need Redis Enterprise-specific troubleshooting data
- You're running version 6.2.18-3 or later (default mode)

### All mode

Use all mode when:
- You need comprehensive cluster diagnostics
- Redis Support specifically requests additional cluster information
- You're troubleshooting complex issues that may involve non-Redis resources
- You're running version 6.2.12-1 or earlier (default mode)

## Permission differences

The key differences between the two modes:

| Resource Category | Restricted Mode | All Mode |
|------------------|----------------|----------|
| **Cluster-level resources** | Limited | Full access |
| **Node information** | ❌ No access | ✅ Full access |
| **Storage classes** | ❌ No access | ✅ Full access |
| **Volume attachments** | ❌ No access | ✅ Full access |
| **Certificate signing requests** | ❌ No access | ✅ Full access |
| **Operator resources** | ❌ No access | ✅ Full access |
| **Istio resources** | ❌ No access | ✅ Full access |

## Restricted mode RBAC

Use restricted mode for minimal security exposure while still collecting essential Redis Enterprise diagnostics.

**File: `log-collector-restricted-rbac.yaml`**

{{<embed-md "k8s/log_collector_role_restricted_mode.md">}}

### Restricted mode permissions

The restricted mode provides access to:

**Role permissions (namespace-scoped):**
- **Pods and logs**: Read pod information and access container logs
- **Pod exec**: Execute commands inside containers for diagnostics
- **Core resources**: Access to services, endpoints, ConfigMaps, secrets, and storage resources
- **Workload resources**: Read deployments, StatefulSets, DaemonSets, and jobs
- **Redis Enterprise resources**: Full read access to all Redis Enterprise custom resources
- **Networking**: Read ingress and network policy configurations
- **OpenShift routes**: Read route configurations (for OpenShift environments)

**ClusterRole permissions (cluster-scoped):**
- **Persistent volumes**: Read cluster-wide storage information
- **Namespaces**: Read namespace information
- **RBAC**: Read cluster roles and bindings
- **Custom resource definitions**: Read Redis Enterprise CRDs
- **Admission controllers**: Read ValidatingWebhook configurations

## All mode RBAC

Use all mode when you need comprehensive cluster diagnostics or when specifically requested by Redis Support.

**File: `log-collector-all-rbac.yaml`**

{{<embed-md "k8s/log_collector_role_all_mode.md">}}

### All mode additional permissions

In addition to all restricted mode permissions, all mode provides:

**Additional ClusterRole permissions:**
- **Nodes**: Read cluster node information and status
- **Storage classes**: Read storage class configurations
- **Volume attachments**: Read volume attachment status
- **Certificate signing requests**: Read certificate management information
- **Operator resources**: Read OLM (Operator Lifecycle Manager) resources
- **Istio resources**: Read Istio service mesh configurations

## Role binding

Bind the Role to your service account in each namespace where you want to collect logs.

**File: `log-collector-role-binding.yaml`**

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: redis-enterprise-log-collector
  namespace: <target-namespace>
subjects:
- kind: ServiceAccount
  name: redis-enterprise-log-collector
  namespace: <service-account-namespace>
roleRef:
  kind: Role
  name: redis-enterprise-log-collector
  apiGroup: rbac.authorization.k8s.io
```

## Cluster role binding

Bind the ClusterRole to your service account for cluster-wide permissions.

**File: `log-collector-cluster-role-binding.yaml`**

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: redis-enterprise-log-collector
subjects:
- kind: ServiceAccount
  name: redis-enterprise-log-collector
  namespace: <service-account-namespace>
roleRef:
  kind: ClusterRole
  name: redis-enterprise-log-collector
  apiGroup: rbac.authorization.k8s.io
```

## Usage

Apply the appropriate RBAC configuration and role bindings, then run the log collector with the desired mode:

```bash
# Restricted mode (default for 6.2.18-3+)
python log_collector.py -m restricted -n <namespace>

# All mode
python log_collector.py -m all -n <namespace>
```

## Security considerations

### Principle of least privilege

- **Start with restricted mode**: Use restricted mode unless you specifically need additional cluster information
- **Limit namespace access**: Only grant permissions in namespaces where log collection is needed
- **Time-bound access**: Consider creating temporary RBAC resources for log collection activities

### Sensitive data handling

Both modes collect:
- **Secrets metadata**: Names and types of secrets (not the actual secret values)
- **ConfigMap data**: Configuration information that may contain sensitive settings
- **Pod logs**: Application logs that may contain sensitive information

Ensure collected logs are handled according to your organization's data security policies.

## Troubleshooting

### Permission denied errors

If you encounter permission errors:

1. **Verify RBAC resources**: Ensure roles and bindings are applied correctly
2. **Check service account**: Confirm the service account has the necessary bindings
3. **Validate namespace access**: Ensure role bindings exist in target namespaces
4. **Review mode requirements**: Verify you're using the correct mode for your needs

### Missing resources

If the log collector reports missing resources:

1. **Check cluster role permissions**: Ensure ClusterRole is applied and bound
2. **Verify CRD access**: Confirm access to Redis Enterprise custom resource definitions
3. **Review mode selection**: Consider switching to all mode if additional resources are needed

## Next steps

- [Learn about log collection]({{< relref "/operate/kubernetes/logs/collect-logs" >}})
- [Explore YAML deployment examples]({{< relref "/operate/kubernetes/reference/yaml-examples" >}})
- [Configure monitoring]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}})

## Related documentation

- [Collect logs guide]({{< relref "/operate/kubernetes/logs/collect-logs" >}})
- [Kubernetes RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Redis Enterprise troubleshooting]({{< relref "/operate/kubernetes/logs" >}})
