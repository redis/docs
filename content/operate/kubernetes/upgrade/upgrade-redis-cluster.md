---
Title: Upgrade Redis Enterprise for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This task describes how to upgrade a Redis Enterprise cluster via the
  operator.
linkTitle: Kubernetes
weight: 10
---

Redis implements rolling updates for software upgrades in Kubernetes deployments. The upgrade process includes updating three components:

  1. [Upgrade the Redis Enterprise operator](#upgrade-the-operator)
  1. [Upgrade the Redis Enterprise cluster (REC)](#upgrade-the-redis-enterprise-cluster-rec)
  1. [Upgrade Redis Enterprise databases (REDB)](#upgrade-databases)

## Prerequisites

Before upgrading, ensure you have the minimum versions of all components necessary for your target version. **Without these minimum versions, the upgrade may freeze and require manual recovery.**

See the [troubleshooting](#troubleshooting) section for details on recovering a failed upgrade.

### Kubernetes version

Check [Supported Kubernetes distributions]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) to make sure your Kubernetes distribution is supported by your target Redis Enterprise operator version. If not, upgrade your Kubernetes distribution before upgrading the Redis operator.

### Redis operator version

Check the [Redis Enterprise for Kubernetes release notes]({{<relref "/operate/kubernetes/release-notes" >}}) for the minimum operator version required for your target upgrade. Some versions may require intermediate upgrades.

### Redis database version

Check the release notes for your target version to determine the minimum Redis database version required. See [upgrade databases](#upgrade-databases) for detailed steps. You can find your database version in the [REDB `spec.redisVersion` field]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#redisversion" >}}).

### User-defined modules

If your databases use user-defined modules (custom non-bundled modules):

- Set `autoUpgradeRedisEnterprise: false` in the REC custom resource before upgrading the operator.
- Define the user-defined modules in the REC custom resource before upgrading the database.
- See [Edit `redisEnterpriseImageSpec`](#edit-redisenterpriseimagespec-in-the-rec-spec) for more details.

### Valid license

Use `kubectl get rec` and verify the `LICENSE STATE` is valid on your REC before you start the upgrade process.

## Upgrade with Helm charts

If you installed the Redis Enterprise operator using Helm charts, you can upgrade using Helm commands. This method automatically handles the operator upgrade and Custom Resource Definition (CRD) updates.

To upgrade using Helm:

```sh
helm upgrade <release-name> redis/redis-enterprise-operator --version <chart-version>
```

For example:

```sh
helm upgrade my-redis-enterprise redis/redis-enterprise-operator --version <chart-version>
```

For OpenShift installations, include the `openshift.mode=true` parameter:

```sh
helm upgrade <release-name> redis/redis-enterprise-operator --version <chart-version> \
    --set openshift.mode=true
```

After the Helm upgrade completes, continue with [upgrading the Redis Enterprise cluster (REC)](#upgrade-the-redis-enterprise-cluster-rec) and [upgrading databases](#upgrade-databases).

For detailed Helm upgrade instructions, see [Upgrade the chart]({{<relref "/operate/kubernetes/deployment/helm#upgrade-the-chart">}}).

## Upgrade the operator

{{<warning>}}If your databases use user-defined modules, set `autoUpgradeRedisEnterprise: false` in the REC custom resource before upgrading the operator.{{</warning>}}

### Download the bundle

Make sure you pull the correct version of the bundle. You can find the version tags
by checking the [operator releases on GitHub](https://github.com/RedisLabs/redis-enterprise-k8s-docs/releases)
or by [using the GitHub API](https://docs.github.com/en/rest/reference/repos#releases).

You can download the bundle for the latest release with the following `curl` command:

```sh
VERSION=`curl --silent https://api.github.com/repos/RedisLabs/redis-enterprise-k8s-docs/releases/latest | grep tag_name | awk -F'"' '{print $4}'`
curl --silent -O https://raw.githubusercontent.com/RedisLabs/redis-enterprise-k8s-docs/$VERSION/bundle.yaml
```

If you need a different release, replace `VERSION` in the above with a specific release tag.

### Apply the bundle

Apply the bundle to deploy the new operator binary. This will also apply any changes in the new release to custom resource definitions, roles, role binding, or operator service accounts.

{{< note >}}
If you are not pulling images from Docker Hub, update the operator image spec to point to your private repository.
If you have made changes to the role, role binding, RBAC, or custom resource definition (CRD) in the previous version, merge them with the updated declarations in the new version files.
{{< /note >}}

Upgrade the bundle and operator with a single command, passing in the bundle YAML file:

```sh
kubectl apply -f bundle.yaml
```

After running this command, you should see a result similar to this:

```sh
role.rbac.authorization.k8s.io/redis-enterprise-operator configured
serviceaccount/redis-enterprise-operator configured
rolebinding.rbac.authorization.k8s.io/redis-enterprise-operator configured
customresourcedefinition.apiextensions.k8s.io/redisenterpriseclusters.app.redislabs.com configured
customresourcedefinition.apiextensions.k8s.io/redisenterprisedatabases.app.redislabs.com configured
deployment.apps/redis-enterprise-operator configured
```

### Reapply the admission controller webhook {#reapply-webhook}

If you have the admission controller enabled, you need to manually reapply the `ValidatingWebhookConfiguration`.

{{<note>}}
{{< embed-md "k8s-642-redb-admission-webhook-name-change.md" >}}
{{</note>}}

{{< embed-md "k8s-admission-webhook-cert.md"  >}}

### Verify the operator is running

You can check your deployment to verify the operator is running in your namespace.

```sh
kubectl get deployment/redis-enterprise-operator
```

You should see a result similar to this:

```sh
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
redis-enterprise-operator   1/1     1            1           0m36s
```

{{< warning >}}
We recommend upgrading the REC as soon as possible after updating the operator. After the operator upgrade completes, the operator suspends the management of the REC and its associated REDBs, until the REC upgrade completes.
{{< /warning >}}

## Upgrade the Redis Enterprise cluster (REC)

The Redis Enterprise cluster (REC) can be updated automatically or manually. To trigger automatic upgrade of the REC after the operator upgrade completes, specify `autoUpgradeRedisEnterprise: true` in your REC spec. If you don't have automatic upgrade enabled, follow the below steps for the manual upgrade.

Before beginning the upgrade of the Redis Enterprise cluster, check the [Redis Enterprise for Kubernetes release notes]({{<relref "/operate/kubernetes/release-notes">}}) to find the Redis Enterprise image tag for your target version.

After the operator upgrade is complete, you can upgrade Redis Enterprise cluster (REC).

{{<note>}}
For Active-Active databases, we recommend upgrading all participating clusters to the same operator version.
{{</note>}}

### Edit `redisEnterpriseImageSpec` in the REC spec

1. Edit the REC custom resource YAML file.

    ```sh
    kubectl edit rec <your-rec.yaml>
    ```

1. Replace the `versionTag:` declaration under `redisEnterpriseImageSpec` with the new version tag.

    ```YAML
    spec:
      redisEnterpriseImageSpec:
        imagePullPolicy:  IfNotPresent
        repository:       redislabs/redis
        versionTag:       <new-version-tag>
    ```

1. Define any user-defined modules used by databases in the cluster.

    ```YAML
    spec:
      userDefinedModules:
        - name: "custom-module"
          source:
            https:
              url: "https://modules.company.com/search-v2.1.zip"
              credentialsSecret: "module-repo-creds"
    ```

  The `name` field match the `display_name` or `module_name` that appears in the module manifest (for example, "redisgears"). This enables the operator to run validation on the user-defined module. If these names don't match, the operator can't run validation on the user-defined module and preventable errors may occur.

  {{< note >}}
Adding or modifying the `userDefinedModules` list triggers a rolling restart of the Redis Enterprise cluster pods in addition to the rolling upgrade for the version change.
  {{< /note >}}

1. Save the changes to apply.

### Reapply roles and role bindings

If your operator is monitoring multiple namespaces, you'll need to [reapply your role and role bindings]({{< relref "/operate/kubernetes/re-clusters/multi-namespace#create-role-and-role-binding-for-managed-namespaces" >}}) for each managed namespace. See [Manage databases in multiple namespaces]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}}) for more details.

### Monitor the upgrade

You can view the state of the REC with `kubectl get rec`.

  During the upgrade, the state should be `Upgrade`.
  When the upgrade is complete and the cluster is ready to use, the state will change to `Running`.
  If the state is `InvalidUpgrade`, there is an error (usually relating to configuration) in the upgrade.

```sh
$ kubectl get rec
NAME   NODES   VERSION      STATE     SPEC STATUS   LICENSE STATE   SHARDS LIMIT   LICENSE EXPIRATION DATE   AGE
rec    3       8.0.2-17   Upgrade   Valid         Valid           4              2022-07-16T13:59:00Z      92m
```

To see the status of the current rolling upgrade, run:

```sh
kubectl rollout status sts <REC_name>
```

## Upgrade databases

After the cluster is upgraded, you can upgrade your databases.

### Upgrade REDB

To upgrade your REDB, specify your new database version in the `spec.redisVersion` field in the REDB or REAADB custom resources. Supported database versions for operator versions include "7.2", "7.4", "8.0", and "8.2" (note this value is a string).  

### Upgrade REAADB

For Active-Active databases, the `redis.Version` change only needs to be applied on one participating cluster and will automatically propagate to all other participating clusters. All participating clusters must be running operator version 8.0.2-2 or later.

If your REAADB uses supported modules, keep the existing `moduleList` version numbers unchanged when upgrading `redisVersion`. The database will automatically use the module versions that are bundled with the new Redis version, regardless of what versions are specified in `moduleList`. After the upgrade is complete, you can optionally change the old version numbers from `moduleList`, but this change has no functional impact.

### Upgrade with user-defined modules

If a user-defined module is used by any database in the cluster, the module must be defined in the REC custom resource before upgrading the database.

### Upgrade policy

Note that if your cluster [`redisUpgradePolicy`]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#redisupgradepolicy" >}}) or your database [`redisVersion`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#redisversion" >}}) are set to `major`, you won't be able to upgrade those databases to minor versions. See [Redis upgrade policy]({{< relref "/operate/rs/installing-upgrading/upgrading#redis-upgrade-policy" >}}) for more details.

## Troubleshooting

If you start an upgrade without meeting the [prerequisites](#prerequisites), the operator will freeze the upgrade. Check the operator logs for the source of the error. The REDB reconsilliation doesn't work during an upgrade, so you need to apply a manual fix with the Redis Software API (examples below). The updates will also need to be added to the REDB custom resource.

### Invalid module version

If the operator logs show an event related to an unsupported module, download the updated module locally, and install it using the `v2/modules` API endpoint.

```sh
curl -sfk -u <rec_username>:<rec_password> -X POST -F 'module=@<full path to your module>' https://localhost:9443/v2/modules
```

After updating the database with the Redis Software API, update the REDB custom resource to reflect the change.

### Invalid database version

If the operator logs show an event related to an incompatible database version, upgrade the database using the Redis Software API.

```sh
curl -sfk -u <rec_username>:<rec_password> -X POST -H "Content-Type: application/json" -d '{"redis_version": <target redis version>}' https://localhost:9443/v1/bdbs/<BDB UID>/upgrade
```

After updating the modules with the Redis Software API, update the REDB custom resource to reflect the change.