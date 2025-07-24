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

This page provides YAML examples for configuring RBAC permissions for the Redis Enterprise log collector tool. 

## Overview

The Redis Enterprise log collector script helps gather diagnostic information for troubleshooting. 
The log collector requires different permission levels depending on the collection mode you choose.
It has two collection modes that require different RBAC permissions:
h
- **Restricted mode** (recommended): Collects only Redis Enterprise resources with minimal security exposure. Default for versions 6.2.18-3+.
- **All mode**: Collects comprehensive cluster information including nodes, storage classes, and operator resources. Use when specifically requested by Redis Support.

## RBAC configurations

### Restricted mode

{{<embed-md "k8s/log_collector_role_restricted_mode.md">}}

### All mode

{{<embed-md "k8s/log_collector_role_all_mode.md">}}

{{< note >}}
For the complete list of resources and permissions required by each mode, refer to the role definitions in the YAML files above.
{{< /note >}}

## Applying RBAC configurations

### Namespace requirements

The Role and RoleBinding must be created in every namespace where you need to collect logs. This varies based on your deployment model:

- **Single namespace**: Apply to the namespace where Redis Enterprise runs
- **Multi-namespace with single REC**: Apply to the REC namespace plus each REDB namespace
- **Multi-namespace with multiple RECs**: Apply to each REC namespace

The ClusterRole and ClusterRoleBinding need to be created only once per cluster.

{{< note >}}
Each YAML file contains both Role and ClusterRole objects. Running `kubectl apply` installs both components. You can safely run the command multiple times with different namespaces.
{{< /note >}}

### Manual deployment

If you prefer to apply the configurations manually, save the YAML content to local files and apply them:

```bash
# Save the YAML content to a file
kubectl apply -f log-collector-rbac.yaml --namespace <namespace>
```

## Usage

After applying the RBAC configuration, run the log collector:

```bash
# Restricted mode (default for 6.2.18-3+)
python log_collector.py -m restricted -n <namespace>

# All mode
python log_collector.py -m all -n <namespace>
```

## Security considerations

- **Use restricted mode** unless you specifically need additional cluster information
- **Limit namespace access** to only where log collection is needed
- **Handle collected data** according to your organization's security policies (logs may contain sensitive information)

### Secrets permission explanation

The RBAC configurations request read access to secrets in the collected namespaces. **Secrets are not collected or included in the log package sent to Redis Support.** This permission is required because:

- The log collector uses Helm commands (`helm list`, `helm get all`) to gather information about Redis Enterprise Helm chart deployments
- Helm stores its deployment metadata in Kubernetes secrets
- For Redis Enterprise charts, this metadata contains only deployment configuration (not sensitive data), but follows Helm's standard storage pattern

If your security policies prohibit secrets access, you can remove the secrets permission from the Role, but this will limit the log collector's ability to gather Helm deployment information.

## Troubleshooting

If you encounter permission errors, verify that roles and bindings are applied correctly in the target namespaces. For missing resources, ensure the ClusterRole is applied and consider switching to all mode if additional resources are needed.

## Related documentation

- [Collect logs guide]({{< relref "/operate/kubernetes/logs/collect-logs" >}})
- [Kubernetes RBAC documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Redis Enterprise troubleshooting]({{< relref "/operate/kubernetes/logs" >}})
