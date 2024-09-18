---
Title: Remove an unresponsive participating cluster
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: 
linkTitle: Remove RERC
weight: 98
---
  
When a RedisEnterpriseRemoteCluster (RERC) isn't communicating with other participating clusters, the RedisEnterpriseActiveActiveDatabase(REAADB) will enter an error state. To remedy this, you can remove the unresponsive RERC from the Active-Active database configuration.

## Prerequisites

We strongly recommend backing up your cluster before proceeding with the following steps.

{{<warning>}}Proceed with caution. Ensure you are running the following commands from the correct instance. Verify the status of the RERCs and REAADB before and after each step.{{</warning>}}

The followings steps use these example values. Remember to substitute these with your own values.

- RERCs: `new-york-1` (cluster name `rec1`), `new-york-2` (`rec2`) and `boston-1` (`rec3`)
- `<REAADB_NAME>`: `example-aadb-1`
- `<INSTANCE_ID>`: `3`
-`<REAADB_GUID>`: `968d586c-e12d-4b8f-8473-42eb88d0a3a2`

## Identify unresponsive RERC

1. From a functioning cluster, check the status of all your RERCs.

  ```sh
  kubectl get rerc
  ```

  The unresponsive RERC will show an `Error` status (`new-york-2` in this example).

  ```sh
  NAME          STATUS   SPEC STATUS   LOCAL
  new-york-1     Active   Valid         true
  new-york-2     Error    Valid         false
  boston-1       Active   Valid         false
  ```

2. Find the `guid` of the REAADB and the instance `id` of the unresponsive cluster in the REAADB YAML file.

  ```sh
  kubectl get reaadb <REAADB_NAME> -o yaml
  ```
  
  <pre><code>
  apiVersion: app.redislabs.com/v1alpha1
  kind: RedisEnterpriseActiveActiveDatabase
  metadata:
  ....
      name: example-aadb-1
      namespace: ns1
  ....
  spec:
      ....
      participatingClusters:
      - name: new-york-1
      - name: new-york-2
      - name: boston-1
      redisEnterpriseCluster:
        name: rec1
    status:
      <b>guid: 968d586c-e12d-4b8f-8473-42eb88d0a3a2</b>
      participatingClusters:
     - id: 1
        name: new-york-1
      - <b>id: 3</b>
          name: new-york-2
          replicationStatus: up
      - id: 2
          name: boston-1
          replicationStatus: up
      ....
      status: error
    </code></pre>

## Remove RERC

3. From a working cluster, remove the unresponsive RERC from the Active-Active database.

  {{<warning>}}Verify you are removing the correct instance before running this command.{{</warning>}}

  ```sh
  crdb-cli crdb remove-instance --crdb-guid <REAADB_GUID> --instance-id <INSTANCE_ID> --force
  ```

4. Wait a few minutes until the REAADB status remains `active` consistently.

  ```sh
  kubectl get reaadb example-aadb-1
  NAME              STATUS   SPEC STATUS   LINKED REDBS   REPLICATION STATUS
  example-aadb-1    active   Valid                        up
  ```

5. Edit the REAADB to remove the unresponsive RERC from the `spec.particpatingClusters` section.

  ```sh
  kubectl edit reaadb <REAADB_NAME>
  ```

6. Wait a few minutes until the REAADB status remains `active` consistently.

  ```sh
  kubectl get reaadb example-aadb-1
  NAME              STATUS   SPEC STATUS   LINKED REDBS   REPLICATION STATUS
  example-aadb-1    active   Valid  
  ```

7. From each working participating cluster, repeat steps 5 and 6 to remove the RERC from the REAADB.

## Optional: Purge local data

If you want to delete REAADB data from the unresponsive cluster, you can run the `crdb-cli purge-instance` command from the unresponsive cluster.

{{<warning>}}Use with caution and verify you are purging the correct instance.{{</warning>}}

```sh
crdb-cli crdb purge-instance --crdb-guid  <REAADB_GUID> --instance-id <INSTANCE_ID>
```

## Next steps

After the communication issue on the cluster is resolved, you can add it back to the REAADB configuration by following the steps for [Add a participating cluster]({{<relref "operate/kubernetes/active-active/edit-clusters#add-a-participating-cluster">}}).