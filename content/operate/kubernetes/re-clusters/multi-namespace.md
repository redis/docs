---
Title: Manage databases in multiple namespaces
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Redis Enterprise for Kubernetes allows you to deploy to multiple namespaces
  within your Kubernetes cluster. This article shows you how to configure your Redis
  Enterprise cluster to connect to databases in multiple namespaces
linktitle: Manage multiple namespaces
weight: 17
---

Multiple Redis Software for Kubernetes database resources (REDBs) can be associated with a single RedisEnterpriseCluster (REC) resource even if they reside in different namespaces.

To learn more about designing a multi-namespace Redis Enterprise cluster, see [flexible deployment options](/content/operate/kubernetes/architecture/deployment-options.md).

Multi-namespace installations support Active-Active databases (REAADB) with certain configuration requirements. For details, see [Multi-namespace Active-Active databases](#multi-namespace-active-active-databases).

## Prerequisites

Before configuring a multi-namespace deployment, you must have:

- A running [Redis Enterprise cluster (REC)](/content/operate/kubernetes/deployment/quick-start.md). See more information in the [deployment](/content/operate/kubernetes/deployment/_index.md) section.
- Each namespace you want the REC to manage. Create it before you configure the operator to watch it.

## Create role and role binding for managed namespaces

Both the operator and the RedisEnterpriseCluster (REC) resource need access to each namespace managed by the REC. There are two ways to grant it:

| | Namespace-scoped roles | Cluster-scoped roles |
| --- | --- | --- |
| Use it to | Limit the operator's permissions to specific namespaces | Simplify multi-namespace management |
| Setup | Create a `Role` and `RoleBinding` in each managed namespace | Create a `ClusterRole` and `ClusterRoleBinding` once for all namespaces |

### Namespace-scoped roles

For each managed namespace, create a `consumer_role.yaml` and `consumer_role_binding.yaml` file within the managed namespace, as shown in the examples below.

> [!NOTE]
> These will need to be reapplied each time you [upgrade](/content/operate/kubernetes/upgrade/upgrade-redis-cluster.md). 

Replace `<rec-namespace>` with the namespace the REC resides in.
Replace `<service-account-name>` with your own value (defaults to the REC name).

`consumer_role.yaml` example:

{{<embed-yaml "k8s/multi-ns_role.md" "consumer_role.yaml">}}

`consumer_role_binding.yaml` example:

{{<embed-yaml "k8s/multi-ns_role_binding.md" "consumer_role_binding.yaml">}}

Apply the files, replacing `<managed-namespace>` with your own values:

```sh
kubectl apply -f consumer_role.yaml -n <managed-namespace>
kubectl apply -f consumer_role_binding.yaml -n <managed-namespace>
```

To define the rules once and still grant access per namespace, create a single `ClusterRole` and bind it with a `RoleBinding` in each managed namespace. Set `kind: ClusterRole` in the role definition and `roleRef.kind: ClusterRole` in the role binding, apply the `ClusterRole` once without a namespace, and apply the `RoleBinding` in each managed namespace.

### Cluster-scoped roles

A `ClusterRoleBinding` grants the operator access to all namespaces in the Kubernetes cluster. You create it once instead of in each managed namespace. The operator still manages only the namespaces you configure.

1. Create `consumer_cluster_role.yaml`. Start from the `consumer_role.yaml` example in [Namespace-scoped roles](#namespace-scoped-roles) and change `kind: Role` to `kind: ClusterRole`.

1. Create `consumer_cluster_role_binding.yaml`. Start from the `consumer_role_binding.yaml` example in [Namespace-scoped roles](#namespace-scoped-roles) and make these changes:

    - Change `kind: RoleBinding` to `kind: ClusterRoleBinding`.
    - Change `roleRef.kind: Role` to `roleRef.kind: ClusterRole`.
    - Replace the placeholders as described in [Namespace-scoped roles](#namespace-scoped-roles).

1. Apply the files once, without specifying a namespace:

    ```sh
    kubectl apply -f consumer_cluster_role.yaml
    kubectl apply -f consumer_cluster_role_binding.yaml
    ```

## Update Redis Enterprise operator ConfigMap

There are two methods of updating the operator ConfigMap (`operator-environment-config`) to specify which namespaces to manage.

- Namespace label: Configure the operator to watch for a namespace label and add this label to managed namespaces.
- Explicit namespace list: Configure the operator with an explicit list of namespaces to manage.

You can create this ConfigMap manually before deployment, or it will be created automatically after the operator was deployed.

> [!WARNING]
> Create the namespace and give the operator access to it **before** you configure the operator to watch it. See [Create role and role binding for managed namespaces](#create-role-and-role-binding-for-managed-namespaces). If the operator is configured to watch a namespace that doesn't exist or that it can't access, it will fail and halt normal operations.

### Namespace label

1. Create the `cluster_role_binding.yaml` and `cluster_role.yaml` files. Replace the `<rec-namespace>` with the namespace the Redis Enterprise cluster (REC) resides in.

  `operator_cluster_role.yaml` example:

{{<embed-yaml "k8s/multi-ns_operator_cluster_role.md" "operator_cluster_role.yaml">}}

  `operator_cluster_role_binding.yaml` example:

{{<embed-yaml "k8s/multi-ns_operator_cluster_role_binding.md" "operator_cluster_role_binding.yaml">}}

2. Apply the files.

  ```sh
  kubectl apply -f operator_cluster_role.yaml
  kubectl apply -f operator_cluster_role_binding.yaml 
  ```

3. Patch the ConfigMap in the REC namespace (`<rec-namespace>`) to identify the managed namespaces with your label (`<label-name>`).

  ```sh
   kubectl patch ConfigMap/operator-environment-config \
  -n <rec-namespace> \
  --type merge \
  -p '{"data": {"REDB_NAMESPACES_LABEL": "<label-name>"}}'
  ```

4. For each managed namespace, apply the same label. Replace `<managed-namespace>` with the namespace the REC will manage. Replace `<label-name>` with the value used in the previous step. If you specify a value for `<label-value>`, both the label name and value in managed namespaces must match to be detected by the operator. If the `<label-value>` is empty, only the label name needs to match on managed namespaces and the value is disregarded.

  ```sh
  kubectl label namespace <managed-namespace> <label-name>=<label-value>
  ```

> [!NOTE]
> The operator restarts when it detects a namespace label was added or removed.

### Explicit namespace list

Patch the `operator-environment-config` in the REC namespace with a new environment variable (`REDB_NAMESPACES`).

```sh
kubectl patch ConfigMap/operator-environment-config \ 
-n <rec-namespace> \
--type merge \
-p '{"data":{"REDB_NAMESPACES": "<comma,separated,list,of,namespaces,to,watch"}}'
```

## Delete a managed namespace

> [!WARNING]
> This procedure deletes the namespace's REDBs, including their databases and data.

1. Back up any data you need from the namespace's databases.

1. If you use [namespace-scoped roles](#namespace-scoped-roles), or a `ClusterRole` bound with a `RoleBinding`, delete the REDBs in the namespace.

    Deleting the namespace deletes its role binding, which revokes the operator's access before it can remove the finalizers on the namespace's REDBs. If the REDBs still exist, they and the namespace stay in the `Terminating` state.

1. Delete the namespace.

1. If you configured the operator with an [explicit namespace list](#explicit-namespace-list), remove the namespace from `REDB_NAMESPACES` after the namespace deletion completes. With cluster-scoped roles, the operator restarts repeatedly until you remove it.

## Multi-namespace Active-Active databases

You can also deploy `RedisEnterpriseActiveActiveDatabase` (REAADB) objects in consumer namespaces separate from the Redis Enterprise operator or cluster (REC) namespace.

To deploy a REAADB in a consumer namespace:

1. Configure each participating cluster’s operator to watch the relevant consumer namespace. See [multi-namespace operator setup](#update-redis-enterprise-operator-configmap).
2. Ensure all Active-Active prerequisites are met as described in [Configure Active-Active](/content/operate/kubernetes/active-active/create-reaadb.md).
3. In your REAADB custom resource, specify the target consumer namespace using `metadata.namespace`. For each participating cluster, use the `namespace` field under `spec.participatingClusters` to indicate the namespace where the REAADB should be deployed.
4. If you are using a [global database secret](/content/operate/kubernetes/active-active/global-db-secret.md), deploy the secret in each consumer namespace.
5. Apply the REAADB object to only one Kubernetes cluster. Based on the specified participating clusters and namespaces, the operator automatically creates the necessary resources in the other clusters.

For example:

```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseActiveActiveDatabase
metadata:
  name: consumer-reaadb
  namespace: consumer-namespace-main
spec:
  participatingClusters:
    - name: participating-cluster-main
    - name: participating-cluster-peer
      namespace: consumer-namespace-peer
  globalConfigurations:
    <your global configurations>
```

> [!WARNING]
> On each participating cluster, create the consumer namespace and give the operator access to it **before** you configure the operator to watch it. See [Create role and role binding for managed namespaces](#create-role-and-role-binding-for-managed-namespaces). If the operator is configured to watch a namespace that doesn't exist or that it can't access, it will fail and halt normal operations.
