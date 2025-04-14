---
Title: Set global database secret
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: The REAADB contains the field '.spec.globalConfigurations' to set the
  global database secret.
linkTitle: Global database secret
weight: 50
---
{{<note>}}This feature is supported for general availability in releases 6.4.2-6 and later. Some of these features were available as a preview in 6.4.2-4 and 6.4.2-5. Please upgrade to 6.4.2-6 for the full set of general availability features and bug fixes.{{</note>}}

## Set global database secret

One of the fields available for `globalConfigurations` is `databaseSecretName` which can point to a secret containing the database password. To set the database secret name and sync the data to all participating clusters, follow the steps below.

To edit other global configruations, see [global configuration]({{< relref "/operate/kubernetes/7.8.6/active-active/global-config.md" >}})

1. On an existing participating cluster, generate a YAML file containing the database secret with the database password.

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
    example-aadb-1   active   Valid
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
