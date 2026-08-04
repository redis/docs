---
Title: Manage Redis Enterprise database (REDB) passwords
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Retrieve and rotate Redis Enterprise database (REDB) passwords on Kubernetes.
linkTitle: Manage REDB passwords
weight: 15
---

Each [`RedisEnterpriseDatabase`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}) resource has a password stored under the `password` key of the secret named by `spec.databaseSecretName`. If you don't set `databaseSecretName`, the operator creates a secret named `redb-<database-name>` with a random password and updates the REDB spec to reference it.

The operator reads the `password` key on every reconciliation and applies it to the database, so you rotate the password by updating the secret.

## Retrieve the REDB password

1. Find the secret name for the database:

    ```sh
    kubectl get redb <database-name> -o jsonpath="{.spec.databaseSecretName}"
    ```

2. Decode the password:

    ```sh
    kubectl get secret <secret-name> -o jsonpath="{.data.password}" | base64 --decode
    ```

## Change the REDB password

{{<note>}}
If the REDB spec sets `defaultUser: false`, the operator does not create or update the database secret. Rotating the secret has no effect in that mode — manage credentials through [access control]({{< relref "/operate/kubernetes/security/access-control" >}}) instead, using [`RedisEnterpriseUser`]({{< relref "/operate/kubernetes/security/access-control/manage-users" >}}) resources.
{{</note>}}

1. Base64-encode the new password. Use `echo -n` to avoid encoding a trailing newline:

    ```sh
    echo -n '<new-password>' | base64
    ```

2. Patch the secret with the encoded value:

    ```sh
    kubectl patch secret <secret-name> -p='{"data":{"password":"<base64-encoded-password>"}}'
    ```

    To edit the secret interactively, use `kubectl edit secret <secret-name>` and replace the `password` value.

3. Verify that the operator applied the change. The REDB status moves to `active-change-pending` while the update is in flight and returns to `active` when complete:

    ```sh
    kubectl get redb <database-name> -o jsonpath='{.status.status}'
    ```

    Then test the new password with a Redis client:

    ```sh
    redis-cli -h <service-name> -p <port> -a '<new-password>' PING
    ```

To disable authentication for the default user, set the `password` value to an empty string.

### Impact on existing client connections

Existing client connections authenticated with the old password remain open — Redis Enterprise does not drop sessions when the password changes. New connections, and any `AUTH` commands issued on existing connections, must use the new password. Coordinate the secret update with your client configuration to avoid authentication errors.

{{<note>}}
For Active-Active databases, the database secret is not created automatically. See [Create a global database secret]({{< relref "/operate/kubernetes/active-active/global-db-secret" >}}).
{{</note>}}
