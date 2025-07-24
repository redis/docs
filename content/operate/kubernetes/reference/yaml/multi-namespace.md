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

Multi-namespace deployment lets a single Redis Enterprise operator manage clusters and databases in different namespaces, providing better resource isolation and organization.

Multi-namespace deployment enables:
- Namespace isolation: Separate Redis Enterprise resources by team, environment, or application
- Centralized management: Single operator manages multiple namespaces
- Resource sharing: Efficient use of cluster resources across namespaces
- Flexible RBAC: Fine-grained permissions per namespace

This example shows:
- Operator namespace: `redis-enterprise-operator` (where the operator runs)
- Consumer namespaces: `app-production`, `app-staging` (where REC/REDB resources are created)

For complete deployment instructions, see [Manage databases in multiple namespaces]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}}).

## Operator service account

Deploy these resources in the namespace where the Redis Enterprise operator runs.

{{<embed-yaml "k8s/service_account.md" "operator-service-account.yaml">}}

## Operator cluster role

Grant the operator cluster-wide permissions to manage resources across namespaces.

{{<embed-yaml "k8s/multi-ns_operator_cluster_role.md" "operator-cluster-role.yaml">}}

## Operator cluster role binding

{{<embed-yaml "k8s/multi-ns_operator_cluster_role_binding.md" "operator-cluster-role-binding.yaml">}}

## Consumer role

{{<embed-yaml "k8s/multi-ns_role.md" "consumer-role.yaml">}}

## Consumer role binding

{{<embed-yaml "k8s/multi-ns_role_binding.md" "consumer-role-binding.yaml">}}

Consumer namespace configuration:

- `subjects.name`: Must match the operator service account name
- `subjects.namespace`: Must be the operator namespace, not the consumer namespace
- `roleRef.name`: Must match the consumer role name

## Next steps

- [Configure networking across namespaces]({{< relref "/operate/kubernetes/networking" >}})
- [Set up monitoring for multi-namespace deployment]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}})
- [Learn about resource management]({{< relref "/operate/kubernetes/recommendations" >}})

## Related documentation

- [Manage databases in multiple namespaces]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}})
- [RBAC configuration]({{< relref "/operate/kubernetes/security" >}})
- [Kubernetes namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
