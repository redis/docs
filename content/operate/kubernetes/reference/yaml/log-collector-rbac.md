---
Title: Log collector RBAC examples
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: YAML examples for configuring RBAC permissions for the Redis Enterprise log collector tool in restricted and all modes.
linkTitle: Log collector RBAC
weight: 50
---

This page provides YAML examples for configuring RBAC permissions for the Redis Enterprise log collector tool. The log collector requires different permission levels depending on the collection mode you choose.

For complete log collection instructions, see [Collect logs]({{< relref "/operate/kubernetes/logs/collect-logs" >}}).

## Prerequisites

- Install the [Redis Enterprise operator]({{< relref "/operate/kubernetes/deployment" >}})
- Appropriate permissions to create RBAC resources in target namespaces
- Understanding of your deployment model (single namespace, multi-namespace, etc.)

## Collection modes

The log collector has two collection modes that require different RBAC permissions:

- **Restricted mode** (recommended): Collects only Redis Enterprise resources with minimal security exposure. Default for versions 6.2.18-3+.
- **All mode**: Collects comprehensive cluster information including nodes, storage classes, and operator resources. Use when specifically requested by Redis Support.

## Restricted mode RBAC

The restricted mode configuration provides minimal permissions for collecting Redis Enterprise resources only.

{{<embed-yaml "k8s/log_collector_role_restricted_mode.md" "log-collector-restricted-rbac.yaml">}}

Restricted mode configuration:

- `Role`: Namespace-scoped permissions for Redis Enterprise resources
- `ClusterRole`: Cluster-wide permissions for CRDs and basic cluster resources
- `rules`: Minimal permissions for Redis Enterprise diagnostics

Key permissions:

- `pods, pods/log, pods/exec`: Access to pod information and logs
- `app.redislabs.com/*`: All Redis Enterprise custom resources
- `persistentvolumes`: Storage information for troubleshooting

## All mode RBAC

The all mode configuration provides comprehensive permissions for collecting detailed cluster information.

{{<embed-yaml "k8s/log_collector_role_all_mode.md" "log-collector-all-rbac.yaml">}}

All mode configuration:

- `Role`: Extended namespace permissions including operator resources
- `ClusterRole`: Additional cluster-wide permissions for nodes and storage
- `rules`: Comprehensive permissions for full cluster diagnostics

Additional permissions in all mode:

- `nodes`: Node information and status
- `storageclasses, volumeattachments`: Storage system details
- `operators.coreos.com/*`: OpenShift operator information
- `networking.istio.io/*`: Istio service mesh resources

## Apply the configuration

### Namespace requirements

The Role and RoleBinding must be created in every namespace where you need to collect logs:

- **Single namespace**: Apply to the namespace where Redis Enterprise runs
- **Multi-namespace with single REC**: Apply to the REC namespace plus each REDB namespace  
- **Multi-namespace with multiple RECs**: Apply to each REC namespace

The ClusterRole and ClusterRoleBinding need to be created only once per cluster.

Edit the values in the downloaded YAML file for your specific setup, updating the namespace references and role binding subjects to match your environment.

### Manual deployment

To apply the RBAC configurations manually:

```bash
# Apply restricted mode RBAC
kubectl apply -f log-collector-restricted-rbac.yaml --namespace <namespace>

# Apply all mode RBAC  
kubectl apply -f log-collector-all-rbac.yaml --namespace <namespace>
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

### Best practices

- Use restricted mode unless you specifically need additional cluster information
- Limit namespace access to only where log collection is needed
- Handle collected data according to your organization's security policies

### Secrets permission explanation

The RBAC configurations request read access to secrets in the collected namespaces. **Secrets are not collected or included in the log package sent to Redis Support.** This permission is required because:

- The log collector uses Helm commands (`helm list`, `helm get all`) to gather Redis Enterprise Helm chart deployment information
- Helm stores its deployment metadata in Kubernetes secrets
- This metadata contains only deployment configuration (not sensitive data)

If your security policies prohibit secrets access, you can remove the secrets permission from the Role, but this will limit the log collector's ability to gather Helm deployment information.

## Troubleshooting

### Permission errors

- Verify that roles and bindings are applied correctly in the target namespaces
- Check that the ClusterRole is applied cluster-wide
- Ensure the service account has proper role bindings

### Missing resources

- Consider switching to all mode if additional cluster resources are needed
- Verify that custom resource definitions are installed
- Check that the operator has proper permissions

## Next steps

- [Collect logs guide]({{< relref "/operate/kubernetes/logs/collect-logs" >}})
- [Basic deployment examples]({{< relref "/operate/kubernetes/reference/yaml-examples/basic-deployment" >}})
- [Multi-namespace deployment]({{< relref "/operate/kubernetes/reference/yaml-examples/multi-namespace" >}})

## Related documentation

- [Kubernetes RBAC documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Redis Enterprise troubleshooting]({{< relref "/operate/kubernetes/logs" >}})
- [Operator deployment guide]({{< relref "/operate/kubernetes/deployment" >}})
