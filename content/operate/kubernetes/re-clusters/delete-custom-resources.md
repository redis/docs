---
Title: Delete custom resources
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This article explains how to delete Redis Enterprise clusters and Redis
  Enterprise databases from your Kubernetes environment.
linkTitle: Delete custom resources
weight: 70
aliases: [/operate/kubernetes/delete-custom-resources/]
---

## Multi-namespace management

Before you can delete a namespace, you must remove the Redis custom resources ([REDB](#delete-a-database-redb), [REC](#delete-a-redis-enterprise-cluster-rec), and [operator](#delete-operator-from-one-namespace)) residing within a namespace before you can delete that namespace. Deleting namespace containing an REDB may cause errors or data loss.

## Delete a database (REDB)

To delete a database managed by the Redis Enterprise Kubernetes operator, run `kubectl delete redb <your-db-name>` from your K8s cluster.

When you delete a database, your data and the REDB custom resource are also deleted.

## Delete a Redis Enterprise cluster (REC)

To delete a Redis Enterprise cluster managed by the operator:

1. Delete all the databases in your cluster.

2. Run `kubectl delete rec <your-rec-name>` from your K8s cluster.

When you delete your cluster, your databases and the REC custom resource are also deleted. However, persistent volume claims (PVCs) for your cluster are not deleted in the process. If you want to delete your PVCs, you'll have to delete them manually.

## Delete the operator

There are two ways to delete the operator. You can delete the entire operator bundle, but this will also delete any cluster-wide resources created by the operator. To only delete resources within a specific namespace and leave other cluster-wide resources intact, you need to delete each resource manually.

Whether you decide to delete the entire bundle or just resources from a specific namespace, it's important to delete the operator ConfigMap (`operator-environment-config`).

```sh
kubectl delete cm operator-environment-config
```

### Delete operator bundle

To delete the operator from your K8s cluster, you can delete the operator bundle with:

- `kubectl delete -f bundle.yaml` for non-OpenShift K8s deployments
- `kubectl delete -f openshift.bundle.yaml` for OpenShift deployments 

This will remove the operator and its custom resource definitions (CRDs) from your K8s cluster.

{{< warning >}} The Redis Enterprise CRDs are non-namespaced resources, meaning they are shared across your entire K8s cluster. Deleting CRDs in one namespace will delete custom resources in every other namespace across the K8s cluster.{{</warning>}}

### Delete operator from one namespace

If you have Redis Enterprise clusters running in different namespaces on the same K8s cluster, deleting the entire operator bundle might cause data loss.

To safely delete the operator from one namespace without affecting the others, delete the operator files individually, excluding the CRD files:

```sh
kubectl delete -f role.yaml
kubectl delete -f role_binding.yaml
kubectl delete -f service_account.yaml
kubectl delete -f admission-service.yaml
kubectl delete -f operator.yaml
```

You will also need to remove [the `namespaceSelector` section from the validating webhook]({{< relref "/operate/kubernetes/deployment/quick-start#webhook" >}}).

## Delete an Active-Active database (REAADB)

1. On one of the existing participating clusters, delete the REEADB (substituting `<reaadb-name>` with your database name).

  ```sh
  kubectl delete reaadb <reaadb-name>
  ```

2. Verify the REAADB no longer exists. 

  ```sh
  kubectl get reaadb -o=jsonpath='{range .items[*]}{.metadata.name}'
  ```

## Delete a remote cluster (RERC)

1. Verify the RERC you want to delete isn't listed as a participating cluster in any REAADB resources.

    If an RERC is still listed as a participating cluster in any database, the deletion will be blocked.

2. On one of the existing participating clusters, delete the RERC (substituting `<rerc-name>` with your database name).

  ```sh
  kubectl delete rerc <rerc-name>
  ```

3. Verify the RERC no longer exists.

  ```sh
  kubectl get rerc -o=jsonpath='{range .items[*]}{.metadata.name}'
  ```

## Troubleshoot REDB deletion

The operator attaches a finalizer to the Redis Enterprise database (REDB) object. This makes sure the database is deleted before the REDB custom resource is removed from the K8s cluster.

If the operator isn't running, or some other fatal error occurs, the finalizer isn't removed automatically by the operator. In this case, you won't be able to delete your REDB resource.

If this happens, you can remove the finalizer manually.

{{<warning>}} If you remove the finalizer manually, there is no guarantee that the underlying REDB has been deleted. This may cause resource issues and require manual intervention. {{</warning>}}

```sh
kubectl patch redb <your-db-name> --type=json -p \
    '[{"op":"remove","path":"/metadata/finalizers","value":"finalizer.redisenterprisedatabases.app.redislabs.com"}]'
```

## Troubleshoot REC deletion

The operator attaches a finalizer to the Redis Enterprise cluster (REC) object. This makes sure the Redis cluster is deleted before the REC custom resource is removed from the K8s cluster.

If the operator isn't running, or some other fatal error occurs, the finalizer isn't removed automatically by the operator. In this case, you won't be able to delete your REC resource.

If this happens, you can remove the finalizer manually.

{{<warning>}} If you remove the finalizer manually, there is no guarantee that the underlying REC has been deleted. This may cause resource issues and require manual intervention. {{</warning>}}

```sh
kubectl patch rec <your-rec-name> --type=json -p \
    '[{"op":"remove","path":"/metadata/finalizers","value":"redbfinalizer.redisenterpriseclusters.app.redislabs.com"}]'
```
