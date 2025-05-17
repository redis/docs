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
url: '/operate/kubernetes/7.4.6/upgrade/upgrade-redis-cluster/'
---

Redis implements rolling updates for software upgrades in Kubernetes deployments. The upgrade process includes updating three components:

  1. [Upgrade the Redis Enterprise operator](#upgrade-the-operator)
  1. [Upgrade the Redis Enterprise cluster (REC)](#upgrade-the-redis-enterprise-cluster-rec)
  1. [Upgrade Redis Enterprise databases (REDB)](#upgrade-databases)

## Prerequisites

1. Check [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/7.4.6/reference/supported_k8s_distributions" >}}) to make sure your Kubernetes distribution is supported.

1. Use `kubectl get rec` and verify the `LICENSE STATE` is valid on your REC before you start the upgrade process.

1. Verify you are upgrading from Redis Enterprise operator version 6.2.10-45 or later. If you are not, you must upgrade to 6.2.10-45 before upgrading to versions 6.2.18 or later.

{{<warning>}}**Upgrade cluster operating system** If your databases use modules, you need to update all nodes in the cluster to Redis Enterprise 7.2.4 or later before upgrading your operating system. See [Upgrade a cluster's operating system]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-os" >}})in the Redis Enterprise Software documentation for more details.{{</warning>}}

## Upgrade the operator

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

{{<warning>}}
Verify your license is valid before upgrading. Invalid licenses will cause the upgrade to fail.

Use `kubectl get rec` and verify the `LICENSE STATE` is valid on your REC before you start the upgrade process.
{{</warning>}}

The Redis Enterprise cluster (REC) can be updated automatically or manually. To trigger automatic upgrade of the REC after the operator upgrade completes, specify `autoUpgradeRedisEnterprise: true` in your REC spec. If you don't have automatic upgrade enabled, follow the below steps for the manual upgrade.

Before beginning the upgrade of the Redis Enterprise cluster, check the K8s operator release notes to find the Redis Enterprise image tag. For example, in Redis Enterprise K8s operator release [6.0.12-5](https://github.com/RedisLabs/redis-enterprise-k8s-docs/releases/tag/v6.0.12-5), the `Images` section shows the Redis Enterprise tag is `6.0.12-57`.

After the operator upgrade is complete, you can upgrade Redis Enterprise cluster (REC).

### Upgrade an REC with an Active-Active database

We recommend upgrading all participating clusters to the same operator version.

If you are upgrading from a preview version of the Active-Active controller, you can remove the following environment variables: `ACTIVE_ACTIVE_DATABASE_CONTROLLER_ENABLED`, `REMOTE_CLUSTER_CONTROLLER_ENABLED`, and `ENABLE_ALPHA_FEATURES`.

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

1. Save the changes to apply.

### Reapply roles and role bindings

If your operator is monitoring multiple namespaces, you'll need to [reapply your role and role bindings]({{< relref "/operate/kubernetes/7.4.6/re-clusters/multi-namespace#create-role-and-role-binding-for-managed-namespaces" >}}) for each managed namespace. See [Manage databases in multiple namespaces]({{< relref "/operate/kubernetes/7.4.6/re-clusters/multi-namespace" >}}) for more details.

### Monitor the upgrade

You can view the state of the REC with `kubectl get rec`.

  During the upgrade, the state should be `Upgrade`.
  When the upgrade is complete and the cluster is ready to use, the state will change to `Running`.
  If the state is `InvalidUpgrade`, there is an error (usually relating to configuration) in the upgrade.

```sh
$ kubectl get rec
NAME   NODES   VERSION      STATE     SPEC STATUS   LICENSE STATE   SHARDS LIMIT   LICENSE EXPIRATION DATE   AGE
rec    3       6.2.10-107   Upgrade   Valid         Valid           4              2022-07-16T13:59:00Z      92m
```

To see the status of the current rolling upgrade, run:

```sh
kubectl rollout status sts <REC_name>
```

### Upgrade databases

After the cluster is upgraded, you can upgrade your databases. The process for upgrading databases is the same for both Kubernetes and non-Kubernetes deployments.

For more details on how to [upgrade a database]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-database" >}}), see the [Upgrade an existing Redis Enterprise Software deployment]({{< relref "/operate/rs/installing-upgrading/upgrading" >}}) documentation.

For Active-Active databases, see [Upgrade an Active-Active database]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-active-active">}}).

Note that if your cluster [`redisUpgradePolicy`]({{< relref "/operate/kubernetes/7.4.6/reference/redis_enterprise_cluster_api#redisupgradepolicy" >}}) or your database [`redisVersion`]({{< relref "/operate/kubernetes/7.4.6/reference/redis_enterprise_database_api#redisversion" >}}) are set to `major`, you won't be able to upgrade those databases to minor versions. See [Redis upgrade policy]({{< relref "/operate/rs/installing-upgrading/upgrading#redis-upgrade-policy" >}}) for more details.
