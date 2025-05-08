---
Title: Edit participating clusters for Active-Active database
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Steps to add or remove a participating cluster to an existing Active-Active
  database with Redis Enterprise for Kubernetes.
linkTitle: Edit participating clusters
weight: 40
---
{{<note>}}This feature is supported for general availability in releases 6.4.2-6 and later. Some of these features were available as a preview in 6.4.2-4 and 6.4.2-5. Please upgrade to 6.4.2-6 for the full set of general availability features and bug fixes. and later.{{</note>}}

## Add a participating cluster

Use the following steps to add a participating cluster to an existing Redis Enterprise Active-Active database (REAADB) for Kubernetes.

### Prerequisites

To prepare the Redis Enterprise cluster (REC) to participate in an Active-Active database, perform the following tasks from [Prepare participating clusters]({{< relref "/operate/kubernetes/active-active/prepare-clusters" >}}):

- Make sure the cluster meets the hardware and naming requirements.
- Enable the Active-Active controllers.
- Configure external routing.
- Configure `ValidatingWebhookConfiguration`.

### Collect REC credentials

To communicate with other clusters, all participating clusters need access to the admin credentials for all other clusters.

1. Get the REC credentials secret for the new participating cluster.

    ```sh
    kubectl get secret -o yaml <rec-name>
    ```

    This example shows an admin credentials secret for an REC named `rec-boston`:

    ```yaml
    apiVersion: v1
    data:
      password: ABcdef12345
      username: GHij56789
    kind: Secret
    metadata:
      name: rec-boston
    type: Opaque
    ```

1. Create a secret for the new participating cluster named `redis-enterprise-<rerc>` and add the username and password.

    The example below shows a secret file for a remote cluster named `rerc-logan` .

    ```yaml
    apiVersion: v1
    data:
      password: ABcdef12345
      username: GHij56789
    kind: Secret
    metadata:
      name: redis-enterprise-rerc-logan
    type: Opaque
    ```

1. Apply the file of collected secrets to every participating REC.

    ```sh
    kubectl apply -f <rec-secret-file>
    ```

 If the admin credentials for any of the clusters change, update and reapply the file to all clusters.

### Create RERC

1. From one of the existing participating clusters, create a `RedisEnterpriseRemoteCluster` (RERC) custom resource for the new participating cluster.

    This example shows an RERC custom resource for an REC named `rec-boston` in the namespace `ns-massachusetts`. 

    ```yaml
    apiVersion: app.redislabs.com/v1alpha1
    kind: RedisEnterpriseRemoteCluster
    metadata:
      name: rerc-logan
    spec:
      recName: rec-boston
      recNamespace: ns-massachusetts
      apiFqdnUrl: test-example-api-rec-boston-ns-massachusetts.example.com
      dbFqdnSuffix: -example-cluster-rec-boston-ns-massachusetts.example.com
      secretName: redis-enterprise-rerc-logan
    ```

1. Create the RERC custom resource.

    ```sh
    kubectl create -f <new-RERC-file>
    ```

1. Check the status of the newly created RERC custom resource.

    ```sh
    kubectl get rerc <RERC-name>
    ```

    The output should look like this:

    ```sh
    NAME        STATUS   SPEC STATUS   LOCAL
    rerc-logan   Active   Valid         true
    ```

### Edit REAADB spec

1. Patch the REAADB spec to add the new RERC name to the `participatingClusters`, replacing `<reaadb-name>` and `<rerc-name>` with your own values.

    ```sh
    kubectl patch reaadb <reaadb-name> < --type merge --patch '{"spec": {"participatingClusters": [{"name": "<rerc-name>"}]}}'
    ```

1. View the REAADB `participatingClusters` status to verify the cluster was added.

    ```sh
    kubectl get reaadb <reaadb-name> -o=jsonpath='{.status.participatingClusters}'
    ```

    The output should look like this:

    ```sh
    [{"id":1,"name":"rerc-ohare"},{"id":2,"name":"rerc-reagan"},{"id":3,"name":"rerc-logan"}]
    ```

## Remove a participating cluster

1. On an existing participating cluster,remove the desired cluster from the `participatingCluster` section of the REAADB spec.

    ```sh
    kubectl edit reaadb <reaadb-name>
    ```

1. On each of the other participating clusters, verify the status is `active` and the spec status is `Valid` and the cluster was removed.

   ```sh
   kubectl get reaadb <reaadb-name -o=jasonpath=`{.status}`
   ```
   
    The output should look like this:
    
    ```sh
    {... ,"participatingClusters":[{"id":1,"name":"rerc1"},{"id":2,"name":"rerc2"}],"redisEnterpriseCluster":"rec1","specStatus":"Valid","status":"active"}
    ```

1. On the removed participating cluster, list all REAADB resources on the cluster to verify they were deleted.


    ```sh
    kubectl get reaadb -o+jasonpath=`{range.items[*]}{.metadata.name}`
    ```
