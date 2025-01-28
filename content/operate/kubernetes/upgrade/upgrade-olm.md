---
Title: Upgrade Redis Enterprise 7.8.2-6 with OpenShift OperatorHub
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

  1. [Upgrade the Redis Enterprise operator](#upgrade-the-operator)
  1. [Upgrade the Redis Enterprise cluster (REC)](#upgrade-the-redis-enterprise-cluster-rec)
  1. [Upgrade Redis Enterprise databases (REDB)](#upgrade-databases)

## Prerequisites

The following steps ensure you have the minimum versions of all components necessary to upgrade to 7.8.2-6. **Without these minimum versions, the upgrade will freeze and require manual recovery.**

See the [troubleshooting](#troubleshooting) section for details on recovering a failed upgrade.

### Kubernetes version

Check [Supported Kubernetes distributions]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) to make sure your Kubernetes distribution is supported by 7.8.2-6. If not, upgrade your Kubernetes distribution before upgrading the Redis operator.

### Redis operator version

Your Redis Enterprise clusters must be running version 7.4.2-2 or later before upgrading to 7.8.2-6. See the [7.4 upgrade](https://redis.io/docs/latest/operate/kubernetes/7.4.6/upgrade/upgrade-olm/) for detailed steps.

### Redis database version

Your Redis databases must be running version 7.2 or later before upgrading your cluster version to 7.8.2-6. See [upgrade databases](#upgrade-databases) for detailed steps. You can find your database version in the [REDB `spec.redisVersion` field]({{<relref "/operate/kubernetes/reference/redis_enterprise_database_api#redisversion" >}}).

### RHEL9-compatible modules

Upgrading to Redis operator version 7.8.2-6 involves migrating your Redis Enterprise nodes to RHEL9 from either Ubuntu 18 or RHEL8. If your databases use modules, you need to manually install modules compatibile with RHEL9.

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

## Upgrade the Redis Enterprise operator

1. Select the **Redis Enterprise Operator** from the **Operators**>**Installed Operators** page.

2. Select the **Subscription** tab.

3. Verify your **Update approval** is set to "Manual".

4. If you wish to upgrade to the most recent version, set your **Update channel** to "production". If you wish to upgrade to an older version, select it for your Update channel.

5. Select **Upgrade available** shown under **Upgrade status**.

6. When the "Review manual InstallPlan" section appears, select **Preview installPlan** and then **Approve** after reviewing the details. This will start the operator upgrade.

You can monitor the upgrade from the **Installed Operators** page. A new Redis Enterprise Operator will appear in the list, with the status "Installing". The OpenShift will delete the old operator, showing the "Cannot update" status during deletion.

## Reapply the SCC

If you are using OpenShift, you will also need to manually reapply the [security context constraints](https://docs.openshift.com/container-platform/4.8/authentication/managing-security-context-constraints.html) file ([`scc.yaml`]({{< relref "/operate/kubernetes/deployment/openshift/openshift-cli#deploy-the-operator" >}})) and bind it to your service account.

```sh
oc apply -f openshift/scc.yaml
```

```sh
oc adm policy add-scc-to-user redis-enterprise-scc-v2 \
  system:serviceaccount:<my-project>:<rec-name>
```

### Upgrade databases

After the cluster is upgraded, you can upgrade your databases. Specify your new database version in the `spec.redisVersion` field for your REDB and REAADB custom resources. Supported database versions for operator version 7.8.2-6 include `"7.2"` and `"7.4"` (note this value is a string).

Note that if your cluster [`redisUpgradePolicy`]({{<relref "/operate/kubernetes/reference/redis_enterprise_cluster_api#redisupgradepolicy" >}}) or your database [`redisVersion`]({{< relref "/operate/kubernetes/reference/redis_enterprise_database_api#redisversion" >}}) are set to `major`, you won't be able to upgrade those databases to minor versions. See [Redis upgrade policy]({{< relref "/operate/rs/installing-upgrading/upgrading#redis-upgrade-policy" >}}) for more details.

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

After updating the modules with the Redis Software API, update the REDB custom resource to reflect the change.
