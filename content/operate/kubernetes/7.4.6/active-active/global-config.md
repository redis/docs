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
{{<note>}}This feature is supported for general availability in releases 6.4.2-6 and later. Some of these features were available as a preview in 6.4.2-4 and 6.4.2-5. Please upgrade to 6.4.2-6 for the full set of general availability features and bug fixes.{{</note>}}

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

    ``sh
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