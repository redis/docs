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
url: '/operate/kubernetes/7.22/re-clusters/multi-namespace/'
---

Multiple Redis Enterprise database resources (REDBs) can be associated with a single Redis Enterprise cluster resource (REC) even if they reside in different namespaces.

To learn more about designing a multi-namespace Redis Enterprise cluster, see [flexible deployment options]({{< relref "/operate/kubernetes/7.22/architecture/deployment-options" >}}).

{{<note>}}
Multi-namespace installations now support Active-Active databases (REAADB) with certain configuration requirements. For details, see [Multi-namespace Active-Active databases](#multi-namespace-active-active-databases).
{{</note>}}

## Prerequisites

Before configuring a multi-namespace deployment, you must have a running [Redis Enterprise cluster (REC)]({{< relref "/operate/kubernetes/7.22/deployment/quick-start" >}}). See more information in the [deployment]({{< relref "/operate/kubernetes/7.22/deployment/" >}}) section.

## Create role and role binding for managed namespaces

Both the operator and the RedisEnterpriseCluster (REC) resource need access to each namespace the REC will manage. For each **managed** namespace, create a `consumer_role.yaml` and `consumer_role_binding.yaml` file within the managed namespace, as shown in the examples below.

{{<note>}}These will need to be reapplied each time you [upgrade]({{< relref "/operate/kubernetes/7.22/upgrade/upgrade-redis-cluster" >}}). {{</note>}}

Replace `<rec-namespace>` with the namespace the REC resides in.
Replace `<service-account-name>` with your own value (defaults to the REC name).

`consumer_role.yaml` example: 

{{<embed-yaml "k8s/multi-ns_role.md" "consumer_role.yaml">}}

`consumer_role_binding.yaml` example:

{{<embed-yaml "k8s/multi-ns_role_binding.md" "consumer_role_binding.yaml">}}

{{<note>}}
**Alternative approach**: Instead of creating individual `Role` objects for each namespace, you can create a single `ClusterRole` and bind it with multiple `RoleBinding` objects. This reduces the number of objects and simplifies role management.

To use this approach:
1. Change `kind: Role` to `kind: ClusterRole` in the role definition above
2. Change `roleRef.kind: Role` to `roleRef.kind: ClusterRole` in the role binding definition above
3. Apply the ClusterRole once globally, then apply a RoleBinding in each managed namespace
{{</note>}}

Apply the files, replacing `<managed-namespace>` with your own values:

```sh
kubectl apply -f consumer_role.yaml -n <managed-namespace>
kubectl apply -f consumer_role_binding.yaml -n <managed-namespace>
```

{{<note>}}
If the REC is configured to watch a namespace without setting the role and role binding permissions, or a namespace that is not yet created, the operator will fail and halt normal operations.
{{</note>}}

## Update Redis Enterprise operator ConfigMap

There are two methods of updating the operator ConfigMap (`operator-environment-config`) to specify which namespaces to manage.

- Method 1: Configure the operator to watch for a namespace label and add this label to managed namespaces (available in versions 6.4.2-4 or later).
- Method 2: Configure the operator with an explicit list of namespaces to manage.

You can create this ConfigMap manually before deployment, or it will be created automatically after the operator was deployed.

{{<warning>}}
Only configure the operator to watch a namespace after the namespace is created and configured with the role/role_binding as explained above. If configured to watch a namespace without setting those permissions or a namespace that is not created yet, the operator will fail and not perform normal operations.
{{</warning>}}

### Method 1: Namespace label (available in versions 6.4.2-4 or later)

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

{{<note>}}
The operator restarts when it detects a namespace label was added or removed.
{{</note>}}

### Method 2: Explicit namespace list

Patch the `operator-environment-config` in the REC namespace with a new environment variable (`REDB_NAMESPACES`).

```sh
kubectl patch ConfigMap/operator-environment-config \ 
-n <rec-namespace> \
--type merge \
-p '{"data":{"REDB_NAMESPACES": "<comma,separated,list,of,namespaces,to,watch"}}'
```

## Multi-namespace Active-Active databases

You can also deploy `RedisEnterpriseActiveActiveDatabase` (REAADB) objects in consumer namespaces separate from the Redis Enterprise operator or cluster (REC) namespace.

To do this:

1. Configure each participating cluster’s operator to watch the relevant consumer namespace. See [multi-namespace operator setup](#update-redis-enterprise-operator-configmap).
2. Ensure all Active-Active prerequisites are met as described in [Configure Active-Active]({{<relref "/operate/kubernetes/7.22/active-active/create-reaadb/">}}).
3. In your REAADB custom resource, specify the target consumer namespace using `metadata.namespace`. For each participating cluster, use the `namespace` field under `spec.participatingClusters` to indicate the namespace where the REAADB should be deployed.
4. If you are using a [global database secret]({{<relref "operate/kubernetes/active-active/global-db-secret/">}}), deploy the secret in each consumer namespace.

{{<note>}}
Apply the REAADB object to only one Kubernetes cluster. Based on the specified participating clusters and namespaces, the operator automatically creates the necessary resources in the other clusters.
{{</note>}}

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

{{<warning>}}
Configure the operator to watch a namespace only after the namespace exists and the required `Role` and `RoleBinding` resources have been applied. If the operator is configured to watch a namespace that lacks these permissions or does not exist, it will fail and halt normal operations.
{{</warning>}}
