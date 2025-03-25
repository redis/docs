---
Title: Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Content related to Active-Active Redis Enterprise databases for Kubernetes.
hideListLinks: true
linkTitle: Active-Active databases
weight: 40
url: '/operate/kubernetes/7.8.4/kubernetes/active-active/'
---

On Kubernetes, Redis Enterprise [Active-Active]({{< relref "/operate/rs/databases/active-active/" >}}) databases provide read and write access to the same dataset from different Kubernetes clusters.

## Active-Active setup methods

There are two methods for creating an Active-Active database with Redis Enterprise for Kubernetes:

- The `RedisEnterpriseActiveActiveDatabase` (REAADB) custom resource is available for versions 6.4.2 and later.
- The `crdb-cli` method is available for versions 6.4.2 or earlier.


We recommend creating new Active-Active databases using the RedisEnterpriseActiveActiveDatabase (REAADB) custom resource. This allows you to manage your Active-Active database with the operator and ensures you have the latest features and functionality.

### Active-Active controller method

Versions 6.4.2-6 or later fully support the Active-Active controller. Some of these features were available as a preview in 6.4.2-4 and 6.4.2-5. Please upgrade to 6.4.2-6 for the full set of general availability features and bug fixes.

This setup method includes the following steps:

1. Gather REC credentials and [prepare participating clusters]({{< relref "/operate/kubernetes/active-active/prepare-clusters.md" >}}).
2. Create [`RedisEnterpriseRemoteCluster` (RERC)]({{< relref "/operate/kubernetes/active-active/create-reaadb#create-rerc" >}}) resources.
3. Create [`RedisEnterpriseActiveActiveDatabase` (REAADB)]({{< relref "/operate/kubernetes/active-active/create-reaadb#create-reaadb" >}}) resource.

### `crdb-cli` method

For versions 6.4.2 or earlier, this Active-Active setup method includes the following steps:

1. Install and configure an ingress.
2. Gather configuration details.
3. Add the `ActiveActive` field to the REC spec.
4. Create the database with the `crdb-cli` tool.

## Redis Enterprise Active-Active controller for Kubernetes

{{<note>}}These features are supported for general availability in releases 6.4.2-6 and later.{{</note>}}

[Active-Active]({{< relref "/operate/rs/databases/active-active/" >}}) databases give you read-and-write access to Redis Enterprise clusters (REC) in different Kubernetes clusters or namespaces. Active-Active deployments managed by the Redis Enterprise operator require two additional custom resources: Redis Enterprise Active-Active database (REAADB) and Redis Enterprise remote cluster (RERC).

To create an Active-Active Redis Enterprise deployment for Kubernetes with these new features, first [prepare participating clusters]({{< relref "/operate/kubernetes/active-active/prepare-clusters.md" >}}) then [create an Active-Active database]({{< relref "/operate/kubernetes/active-active/create-reaadb.md" >}}).

### Preview versions

If you are using a preview version of these features (operator version 6.4.2-4 or 6.4.2-5), you'll need to enable the Active-Active controller with the following steps. You need to do this only once per cluster. We recommend using the fully supported 6.4.2-6 version.

1. Download the custom resource definitions (CRDs) for the most recent release (6.4.2-4) from [redis-enterprise-k8s-docs Github](https://github.com/RedisLabs/redis-enterprise-k8s-docs/tree/master/crds).

1. Apply the new CRDs for the Redis Enterprise Active-Active database (REAADB) and Redis Enterprise remote cluster (RERC) to install those controllers.

    ```sh
    kubectl apply -f crds/reaadb_crd.yaml
    kubectl apply -f crds/rerc_crd.yaml
    ```

1. Enable the Active-Active and remote cluster controllers on the operator ConfigMap.

    ```sh
    kubectl patch cm  operator-environment-config --type merge --patch "{\"data\": \
    {\"ACTIVE_ACTIVE_DATABASE_CONTROLLER_ENABLED\":\"true\", \
    \"REMOTE_CLUSTER_CONTROLLER_ENABLED\":\"true\"}}"


### REAADB custom resource

Redis Enterprise Active-Active database (REAADB) contains a link to the RERC for each participating cluster, and provides configuration and status to the management plane.

For a full list of fields and options, see the [REAADB API reference]({{<relref "/operate/kubernetes/reference/redis_enterprise_active_active_database_api">}}).

### RERC custom resource

Redis Enterprise remote cluster (RERC) custom resource contains configuration details for all the participating clusters.

For a full list of fields and options, see the [RERC API reference]({{<relref "/operate/kubernetes/reference/redis_enterprise_remote_cluster_api">}}).

### Limitations

* Existing Redis databases cannot be migrated to a REAADB. (DOC-3594)
* Admission is not blocking REAADB with `shardCount` which exceeds license quota. (RED-96301)
    Workaround: Fix the problems with the REAADB and reapply.
* The `<rec-name>/<rec-namespace>` value must be unique for each RERC resource. (RED-96302)
* Only global database options are supported, no support for specifying configuration per location.
* No support for migration from old (`crdb-cli`) Active-Active database method to new Active-Active controller.
* No support for REAADB with participating clusters co-located within the same Kubernetes cluster, except for a single designated local participating cluster.

## More info

For more general information about Active-Active, see the [Redis Enterprise Software docs]({{< relref "/operate/rs/databases/active-active/" >}}).
