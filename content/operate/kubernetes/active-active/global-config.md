---
Title: Set global database configurations
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: The REAADB contains the field '.spec.globalConfigurations' and through
  this the database configurations are set.
linkTitle: Global configuration
weight: 50
---


The Redis Enterprise Active-Active database (REAADB) custom resource contains the field `.spec.globalConfigurations`. This field sets configurations for the Active-Active database across all participating clusters, such as memory size, shard count, and the global database secrets.

The [REAADB API reference]({{<relref "/operate/kubernetes/reference/redis_enterprise_active_active_database_api">}}) contains a full list of available fields.

## Edit global configurations

1. Edit or patch the REAADB custom resource with your global configuration changes.

    The example command below patches the REAADB named `reaadb-boeing` to set the global memory size to 200MB:

    ```sh
    kubectl patch reaadb reaadb-boeing --type merge --patch \
    '{"spec": {"globalConfigurations": {"memorySize": "200mb"}}}'
    ```

1. Verify the status is `active` and the spec status is `Valid`.

    This example shows the status for the `reaadb-boeing` database.

    ```sh
    kubectl get reaadb reaadb-boeing

    NAME             STATUS   SPEC STATUS   GLOBAL CONFIGURATIONS REDB   LINKED REDBS
    reaadb-boeing   active   Valid    
    ```

1. View the global configurations on each participating cluster to verify they are synced.

    ```sh
    kubectl get reaadb <reaadb-name> -o yaml
    ```

## Edit global configuration secrets

This section edits the secrets under the REAADB `.spec.globalConfigurations` section. For more information and all available fields, see the [REAADB API reference]({{<relref "/operate/kubernetes/reference/redis_enterprise_active_active_database_api">}}).

1. On an existing participating cluster, generate a YAML file containing the database secret with the relevant data.

    This example shoes a secret named `my-db-secret` with the password `my-password` encoded in base 64.

    ```yaml
    apiVersion: v1
     data:
      password: bXktcGFzcw
    kind: Secret
    metadata:
      name: my-db-secret
    type: Opaque
    ```

1. Apply the secret file from the previous step, substituting your own value for `<db-secret-file>`.

    ```sh
    kubectl apply -f <db-secret-file>
    ```

1. Patch the REAADB custom resource to specify the database secret, substituting your own values for `<reaadb-name>` and `<secret-name>`.

    ```sh
    kubectl patch reaadb <reaadb-name> --type merge --patch \
    '{"spec": {"globalConfigurations": {"databaseSecretName": "secret-name"}}}'
    ```

1. Check the REAADB status for an `active` status and `Valid` spec status.

    ```sh
    kubectl get reaadb <reaadb-name>

    NAME             STATUS   SPEC STATUS   GLOBAL CONFIGURATIONS REDB   LINKED REDBS
    reaadb-boeing   active   Valid
    ```

1. On each other participating cluster, check the secret status.

    ```sh
    kubectl get reaadb <reaadb-name> -o=jsonpath='{.status.secretsStatus}'
    ```

    The output should show the status as `Invalid`.

    ```sh
    [{"name":"my-db-secret","status":"Invalid"}]
    ```

1. Sync the secret on each participating cluster.

    ```sh
    kubectl apply -f <db-secret-file>
    ```

1. Repeat the previous two steps on every participating cluster.

## Configure role permissions

You can configure role-based access control (RBAC) permissions for Active-Active databases using the `rolesPermissions` field in the REAADB `.spec.globalConfigurations` section. The role permissions configuration is propagated across all participating clusters, but the underlying roles and Redis ACLs must be manually created on each cluster.

{{<note>}}You must manually create the specified roles and Redis ACLs on all participating clusters before configuring role permissions. The operator only propagates the role permissions configuration—it does not create the underlying roles and ACLs. If roles or ACLs are missing on any cluster, the operator will log errors and dispatch an Event associated with the REAADB object until they are manually created.{{</note>}}

### Prerequisites

Before configuring role permissions:

1. Manually create the required roles and Redis ACLs on all participating clusters using the Redis Enterprise admin console or REST API.
2. Ensure role and ACL names match exactly across all clusters (names are case-sensitive).
3. Verify that roles and ACLs are properly configured on each cluster.

{{<warning>}}The operator does not automatically create or synchronize roles and ACLs across clusters. You are responsible for manually creating identical roles and ACLs on each participating cluster.{{</warning>}}

### Add role permissions to REAADB

1. Create or update your REAADB custom resource to include `rolesPermissions` in the global configurations.

    Example REAADB with role permissions:

    ```yaml
    apiVersion: app.redislabs.com/v1alpha1
    kind: RedisEnterpriseActiveActiveDatabase
    metadata:
      name: reaadb-boeing
    spec:
      globalConfigurations:
        databaseSecretName: <my-secret>
        memorySize: 200MB
        shardCount: 3
        rolesPermissions:
          - role: <role-name>
            acl: <acl-name>
            type: redis-enterprise
      participatingClusters:
        - name: rerc-ohare
        - name: rerc-reagan
    ```

    Replace `<role-name>` and `<acl-name>` with the exact names of your Redis Enterprise role and ACL.

2. Apply the REAADB custom resource:

    ```sh
    kubectl apply -f <reaadb-file>
    ```

    Alternatively, patch an existing REAADB to add role permissions:

    ```sh
    kubectl patch reaadb <reaadb-name> --type merge --patch \
    '{"spec": {"globalConfigurations": {"rolesPermissions": [{"role": "<role-name>", "acl": "<acl-name>", "type": "redis-enterprise"}]}}}'
    ```

3. After the REAADB is active and its replication status is "Up", verify role permissions are applied to the local database using the Redis Enterprise REST API. See [Database requests]({{<relref "/operate/rs/references/rest-api/requests/bdbs#get-bdbs">}}) for details.

### Troubleshooting role permissions

If you encounter issues with role permissions:

- **Missing role or ACL errors**: Manually create the specified roles and ACLs on all participating clusters with exact name matches. The operator cannot create these automatically.
- **Permission propagation failures**: Verify that the roles and ACLs are properly configured and accessible on each cluster. Remember that you must manually create identical roles and ACLs on every participating cluster.
- **Case sensitivity issues**: Verify that role and ACL names match exactly, including capitalization, across all clusters.

For more details on the `rolesPermissions` field structure, see the [REAADB API reference]({{<relref "/operate/kubernetes/reference/redis_enterprise_active_active_database_api#specglobalconfigurationsrolespermissions">}}).