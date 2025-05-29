---
Title: Upgrade Redis Enterprise with OpenShift OperatorHub
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This task describes how to upgrade a Redis Enterprise cluster via OpenShift
  OperatorHub.
linkTitle: OpenShift OperatorHub
weight: 40
---

Redis implements rolling updates for software upgrades in Kubernetes deployments. The upgrade process includes updating three components:

  1. [Upgrade the Redis Enterprise operator](#upgrade-the-redis-enterprise-operator)
  1. [Upgrade the Redis Enterprise cluster (REC)](#upgrade-the-redis-enterprise-cluster)
  1. [Upgrade Redis Enterprise databases (REDB)](#upgrade-databases)

## Prerequisites

The following steps ensure you have the minimum versions of all components necessary to upgrade. **Without these minimum versions, the upgrade will freeze and require manual recovery.**

See the [troubleshooting](#troubleshooting) section for details on recovering a failed upgrade.

#### Kubernetes version

Check [Supported Kubernetes distributions]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) to make sure your Kubernetes distribution is supported. If not, upgrade your Kubernetes distribution before upgrading the Redis operator.

#### Redis operator version

Your Redis Enterprise clusters must be running version 7.4.2-2 or later before upgrading to 7.8.2-6. See the [7.4 upgrade](https://redis.io/docs/latest/operate/kubernetes/7.4.6/upgrade/upgrade-olm/) for detailed steps.

#### Redis database version

Your Redis databases must be running version 7.2 or later before upgrading your cluster version to 7.8.2-6. See [upgrade databases](#upgrade-databases) for detailed steps. You can find your database version in the [REDB `spec.redisVersion` field]({{<relref "/operate/kubernetes/reference/redis_enterprise_database_api#redisversion" >}}).

#### RHEL9-compatible modules

Upgrading to Redis operator version 7.8.2-6 or later involves migrating your Redis Enterprise nodes to RHEL9 from either Ubuntu 18 or RHEL8. If your databases use modules, you need to manually install modules compatible with RHEL9.

To see which modules you have installed, run:

```sh
curl -k -u <rec_username>:<rec_password> -X GET https://localhost:9443/v1/modules | jq -r 'map([.module_name, .semantic_version, (.platforms | keys)]) | .[] | .[0] as $name | .[1] as $version | .[2][] | $name + "-" + $version + "-" + .' | sort
```

To see which modules are currently in use, run:

```sh
curl -k -u <rec_username>:<rec_password> -X GET https://localhost:9443/v1/bdbs | jq -r '.[].module_list | map(.module_name + "-" + .semantic_version) | .[]'
```

See [Upgrade modules]({{<relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module">}}) for details on how to upgrade modules with the `rladmin` tool.

### Valid license

Use `kubectl get rec` and verify the `LICENSE STATE` is valid on your REC before you start the upgrade process.

## Upgrade with Helm charts

If you installed the Redis Enterprise operator using Helm charts on OpenShift, you can upgrade using Helm commands instead of the OperatorHub. This method automatically handles the operator upgrade and Custom Resource Definition (CRD) updates.

To upgrade using Helm on OpenShift:

```sh
helm upgrade <release-name> redis/redis-enterprise-operator --version <chart-version> \
    --set openshift.mode=true
```

For example:

```sh
helm upgrade my-redis-enterprise redis/redis-enterprise-operator --version 7.8.2-2 \
    --set openshift.mode=true
```

After the Helm upgrade completes, continue with [upgrading the Redis Enterprise cluster](#upgrade-the-redis-enterprise-cluster) and [upgrading databases](#upgrade-databases).

For detailed Helm upgrade instructions, see [Upgrade the chart]({{<relref "/operate/kubernetes/deployment/helm#upgrade-the-chart">}}).

## Upgrade the Redis Enterprise operator

1. Select the **Redis Enterprise Operator** from the **Operators**>**Installed Operators** page.

2. Select the **Subscription** tab.

3. Verify your **Update approval** is set to "Manual".

4. To upgrade to the latest version, set your **Update Channel** to ‘production’. To upgrade to an older version, specify the desired version for your **Update Channel**.

5. Select **Upgrade available** shown under **Upgrade status**.

6. When the "Review manual InstallPlan" section appears, select **Preview installPlan** and then **Approve** after reviewing the details. This will start the operator upgrade.

You can monitor the upgrade from the **Installed Operators** page. A new Redis Enterprise Operator will appear in the list, with the status "Installing". OpenShift will delete the old operator, showing the "Cannot update" status during deletion.

## Security context constraints

Upgrades to versions 7.22.0-6 and later run in **unprivileged mode** without any additional permissions or capabilities. If you don't specifally require additional capabilities, we recommend you maintain the default unprivileged mode, as its more secure. After upgrading, remove the existing `redis-enterprise-scc-v2` SCC and unbind it from the REC service account.

To enable privileged mode, see [Enable privileged mode > OpenShift upgrades]({{<relref "/operate/kubernetes/security/enable-privileged-mode#openshift-upgrades">}}).

## Upgrade the Redis Enterprise cluster

{{<warning>}}
Verify your license is valid before upgrading. Invalid licenses will cause the upgrade to fail.

Use `oc get rec` and verify the `LICENSE STATE` is valid on your REC before you start the upgrade process.
{{</warning>}}

The Redis Enterprise cluster (REC) can be updated automatically or manually. To trigger automatic upgrade of the REC after the operator upgrade completes, specify `autoUpgradeRedisEnterprise: true` in your REC spec. If you don't have automatic upgrade enabled, follow the below steps for the manual upgrade.

Before beginning the upgrade of the Redis Enterprise cluster, check the K8s operator [release notes]({{<relref "/operate/kubernetes/release-notes">}}) to find the Redis Enterprise image tag.

After the operator upgrade is complete, you can upgrade Redis Enterprise cluster (REC).

### Edit `redisEnterpriseImageSpec`

1. Edit the REC custom resource YAML file.

    ```sh
    oc edit rec <your-rec.yaml>
    ```

1. Replace the `versionTag:` declaration under `redisEnterpriseImageSpec` with the new version tag.

    ```YAML
    spec:
      redisEnterpriseImageSpec:
        imagePullPolicy:  IfNotPresent
        repository:       redislabs/redis
        versionTag:       <new-version-tag>
    ```

1. Save the changes to apply.

### Reapply roles and role bindings

If your operator is monitoring multiple namespaces, you'll need to [reapply your role and role bindings]({{< relref "/operate/kubernetes/re-clusters/multi-namespace#create-role-and-role-binding-for-managed-namespaces" >}}) for each managed namespace. See [Manage databases in multiple namespaces]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}}) for more details.

### Monitor the upgrade

You can view the state of the REC with `oc get rec`.

  During the upgrade, the state should be `Upgrade`.
  When the upgrade is complete and the cluster is ready to use, the state will change to `Running`.
  If the state is `InvalidUpgrade`, there is an error (usually relating to configuration) in the upgrade.

```sh
$ oc get rec
NAME   NODES   VERSION      STATE     SPEC STATUS   LICENSE STATE   SHARDS LIMIT   LICENSE EXPIRATION DATE   AGE
rec    3       6.2.10-107   Upgrade   Valid         Valid           4              2022-07-16T13:59:00Z      92m
```

To see the status of the current rolling upgrade, run:

```sh
oc rollout status sts <REC_name>
```

## Upgrade databases

After the cluster is upgraded, you can upgrade your databases. To upgrade your REDB, specify your new database version in the `spec.redisVersion` field in the REDB custom resources. Supported database versions for operator versions include `"7.2"` and `"7.4"` (note this value is a string).

To upgrade your REAADB, see [Upgrade an Active-Active database]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-active-active/">}}) for details on the `rladmin` and `crdb-cli` commands required. Reach out to Redis support if you have additional questions.

Note that if your cluster [`redisUpgradePolicy`]({{<relref "/operate/kubernetes/reference/redis_enterprise_cluster_api#redisupgradepolicy" >}}) or your database [`redisVersion`]({{< relref "/operate/kubernetes/reference/redis_enterprise_database_api#redisversion" >}}) are set to `major`, you won't be able to upgrade those databases to minor versions. See [Redis upgrade policy]({{< relref "/operate/rs/installing-upgrading/upgrading#redis-upgrade-policy" >}}) for more details.

The Redis Enterprise cluster (REC) can be updated automatically or manually. To trigger automatic upgrade of the REC after the operator upgrade completes, specify `autoUpgradeRedisEnterprise: true` in your REC spec. If you don't have automatic upgrade enabled, follow the below steps for the manual upgrade.

## Troubleshooting

If you start an upgrade without meeting the [prerequisites](#prerequisites), the operator will freeze the upgrade. Check the operator logs for the source of the error. The REDB reconsilliation doesn't work during an upgrade, so you need to apply a manual fix with the Redis Software API (examples below). The updates will also need to be added to the REDB custom resource.

### Invalid module version

If the operator logs show an event related to an unsupported module, download the updated module locally, and install it using the `v2/modules` API endpoint.

```sh
curl -sfk -u <rec_username>:<rec_password> -X POST -F 'module=@<full path to your module>' https://localhost:9443/v2/modules
```

After updating the modules with the Redis Software API, update the REDB custom resource to reflect the change.

### Invalid database version

If the operator logs show an event related to an incompatible database version, upgrade the database using the Redis Software API.

```sh
curl -sfk -u <rec_username>:<rec_password> -X POST -H "Content-Type: application/json" -d '{"redis_version": <target redis version>}' https://localhost:9443/v1/bdbs/<BDB UID>/upgrade
```

After updating the database with the Redis Software API, update the REDB custom resource to reflect the change.
