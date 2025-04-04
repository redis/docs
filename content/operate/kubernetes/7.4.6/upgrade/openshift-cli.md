---
Title: Upgrade Redis Enterprise with OpenShift CLI
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This task describes how to upgrade a Redis Enterprise cluster via OpenShift
  CLI.
linkTitle: OpenShift CLI
weight: 20
url: '/operate/kubernetes/7.4.6/upgrade/openshift-cli/'
---

Redis implements rolling updates for software upgrades in Kubernetes deployments. The upgrade process includes updating three components:

  1. [Upgrade the Redis Enterprise operator](#upgrade-the-operator)
  2. [Upgrade the Redis Enterprise cluster (REC)](#upgrade-the-redisenterprisecluster-rec)
  3. [Upgrade Redis Enterprise databases (REDB)](#upgrade-databases)

## Before upgrading

1. Check [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/7.4.6/reference/supported_k8s_distributions" >}}) to make sure your Kubernetes distribution is supported.

2. Use `oc get rec` and verify the `LICENSE STATE` is valid on your REC before you start the upgrade process.

3. Verify you are upgrading from Redis Enterprise operator version 6.2.10-45 or later. If you are not, you must upgrade to 6.2.10-45 before upgrading to versions 6.2.18 or later.

4. When upgrading existing clusters running on RHEL7-based images, make sure to select a RHEL7-based image for the new version. See [release notes]({{< relref "/operate/kubernetes/release-notes/" >}}) for more info.

5. If you want to migrate from RHEL7-based images to RHEL8-based images, you'll need to upgrade to version 7.2.4-2 with a RHEL7-based image, then you'll be able to migrate to a RHEL8-based image when upgrading to 7.2.4-**TBD**.

## Upgrade the operator

### Download the bundle

Make sure you pull the correct version of the bundle. You can find the version tags
by checking the [operator releases on GitHub](https://github.com/RedisLabs/redis-enterprise-k8s-docs/releases)
or by [using the GitHub API](https://docs.github.com/en/rest/reference/repos#releases).

For OpenShift environments, the name of the bundle is `openshift.bundle.yaml`, and so the `curl` command to run is:

```sh
curl --silent -O https://raw.githubusercontent.com/RedisLabs/redis-enterprise-k8s-docs/$VERSION/openshift.bundle.yaml
```

If you need a different release, replace `VERSION` in the above with a specific release tag.

### Apply the bundle

Apply the bundle to deploy the new operator binary. This will also apply any changes in the new release to custom resource definitions, roles, role binding, or operator service accounts.

{{< note >}}
If you are not pulling images from Docker Hub, update the operator image spec to point to your private repository.
If you have made changes to the role, role binding, RBAC, or custom resource definition (CRD) in the previous version, merge them with the updated declarations in the new version files.
{{< /note >}}

If you are using OpenShift, run this instead:

```sh
oc apply -f openshift.bundle.yaml
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
oc get deployment/redis-enterprise-operator
```

You should see a result similar to this:

```sh
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
redis-enterprise-operator   1/1     1            1           0m36s
```

{{< warning >}}
 We recommend upgrading the REC as soon as possible after updating the operator. After the operator upgrade completes, the operator suspends the management of the REC and its associated REDBs, until the REC upgrade completes.
 {{< /warning >}}

### Reapply the SCC

If you are using OpenShift, you will also need to manually reapply the [security context constraints](https://docs.openshift.com/container-platform/4.8/authentication/managing-security-context-constraints.html) file ([`scc.yaml`]({{< relref "/operate/kubernetes/7.4.6/deployment/openshift/openshift-cli#deploy-the-operator" >}})) and bind it to your service account.

```sh
oc apply -f openshift/scc.yaml
```

```sh
oc adm policy add-scc-to-user redis-enterprise-scc-v2 \
  system:serviceaccount:<my-project>:<rec-name>
```

If you are upgrading from operator version 6.4.2-6 or before, see the ["after upgrading"](#after-upgrading) section to delete the old SCC and role binding after all clusters are running 6.4.2-6 or later.

## Upgrade the RedisEnterpriseCluster (REC)


{{<warning>}}
Verify your license is valid before upgrading. Invalid licenses will cause the upgrade to fail.

Use `oc get rec` and verify the `LICENSE STATE` is valid on your REC before you start the upgrade process.
{{</warning>}}

The Redis Enterprise cluster (REC) can be updated automatically or manually. To trigger automatic upgrade of the REC after the operator upgrade completes, specify `autoUpgradeRedisEnterprise: true` in your REC spec. If you don't have automatic upgrade enabled, follow the below steps for the manual upgrade.

Before beginning the upgrade of the Redis Enterprise cluster, check the K8s operator release notes to find the Redis Enterprise image tag. For example, in Redis Enterprise K8s operator release [6.0.12-5](https://github.com/RedisLabs/redis-enterprise-k8s-docs/releases/tag/v6.0.12-5), the `Images` section shows the Redis Enterprise tag is `6.0.12-57`.

After the operator upgrade is complete, you can upgrade Redis Enterprise cluster (REC).

### Edit `redisEnterpriseImageSpec` in the REC spec

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

If your operator is monitoring multiple namespaces, you'll need to [reapply your role and role bindings]({{< relref "/operate/kubernetes/7.4.6/re-clusters/multi-namespace#create-role-and-role-binding-for-managed-namespaces" >}}) for each managed namespace. See [Manage databases in multiple namespaces]({{< relref "/operate/kubernetes/7.4.6/re-clusters/multi-namespace" >}}) for more details.

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

## After upgrading

For OpenShift users, operator version 6.4.2-6 introduced a new SCC (`redis-enterprise-scc-v2`). If any of your OpenShift RedisEnterpriseClusters are running versions earlier than 6.2.4-6, you need to keep both the new and old versions of the SCC.

If all of your clusters have been upgraded to operator version 6.4.2-6 or later, you can delete the old version of the SCC (`redis-enterprise-scc`) and remove the binding to your service account.

1. Delete the old version of the SCC

   ```sh
   oc delete scc redis-enterprise-scc
   ```

   The output should look similar to the following:

   ```sh
   securitycontextconstraints.security.openshift.io "redis-enterprise-scc" deleted
   ```

1. Remove the binding to your service account.

   ```sh
   oc adm policy remove-scc-from-user redis-enterprise-scc system:serviceaccount:<my-project>:<rec-name>
   ```


## Upgrade databases

{{<warning>}}In version 7.2.4, old module versions and manually uploaded modules are not persisted. If databases are not upgraded after cluster upgrade, and require cluster recovery afterwards, you'll need to contact Redis support. This issue will be fixed in the next maintenance release by moving the stored location of the modules.{{</warning>}}

After the cluster is upgraded, you can upgrade your databases. The process for upgrading databases is the same for both Kubernetes and non-Kubernetes deployments. For more details on how to [upgrade a database]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-database" >}}), see the [Upgrade an existing Redis Enterprise Software deployment]({{< relref "/operate/rs/installing-upgrading/upgrading" >}}) documentation.

Note that if your cluster [`redisUpgradePolicy`]({{< relref "/operate/kubernetes/7.4.6/reference/redis_enterprise_cluster_api#redisupgradepolicy" >}}) or your database [`redisVersion`]({{< relref "/operate/kubernetes/7.4.6/reference/redis_enterprise_database_api#redisversion" >}}) are set to `major`, you won't be able to upgrade those databases to minor versions. See [Redis upgrade policy]({{< relref "/operate/rs/installing-upgrading/upgrading#redis-upgrade-policy" >}}) for more details.



