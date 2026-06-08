---
Title: Manage Redis Enterprise credentials
aliases: [/operate/kubernetes/security/manage-rec-credentials/]
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Retrieve and rotate Redis Enterprise cluster (REC) admin credentials and Redis Enterprise database (REDB) passwords on Kubernetes.
linkTitle: Manage credentials
weight: 93
---

Redis Enterprise for Kubernetes stores both cluster admin credentials and database passwords in Kubernetes [secrets](https://kubernetes.io/docs/concepts/configuration/secret/). The operator reconciles changes to these secrets and applies them to the cluster, so you rotate credentials by updating the secret rather than calling the cluster API directly.

{{<note>}}
The procedures on this page are supported for operator versions 6.0.20-12 and later.
{{</note>}}

## Redis Enterprise cluster (REC) credentials

The [`RedisEnterpriseCluster`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}) custom resource generates random admin credentials during cluster creation. The credentials are stored in a Kubernetes secret named by the `clusterCredentialSecretName` field (defaults to the cluster name).

### Retrieve the REC username and password

REC credentials authenticate to the Redis Enterprise admin console or REST API. You need cluster connectivity through a service or port forwarding.

1. Read the secret created by the operator:

    ```sh
    kubectl get secret rec -o jsonpath='{.data}'
    ```

    The command outputs the base64-encoded password and username:

    ```sh
    map[password:MTIzNDU2NzgK username:ZGVtb0BleGFtcGxlLmNvbQo=]
    ```

1. Decode each value:

    ```sh
    echo MTIzNDU2NzgK | base64 --decode
    ```

    In this example, the plain text password is `12345678` and the username is `demo@example.com`.

### Change the REC password for the current username

1. Open a shell in a Redis Enterprise [pod](https://kubernetes.io/docs/concepts/workloads/pods/):

    ```sh
    kubectl exec -it <rec-resource-name>-0 -c redis-enterprise-node -- /bin/bash
    ```

2. Add a new password for the existing user:

    ```bash
    REC_USER="`cat /opt/redislabs/credentials/username`" \
    REC_PASSWORD="`cat /opt/redislabs/credentials/password`" \
    curl -k --request POST \
      --url https://localhost:9443/v1/users/password \
      -u "$REC_USER:$REC_PASSWORD" \
      --header 'Content-Type: application/json' \
      --data "{\"username\":\"$REC_USER\", \
      \"old_password\":\"$REC_PASSWORD\", \
      \"new_password\":\"<NEW PASSWORD>\"}"
    ```

3. From outside the pod, update the REC credential secret:

    ```sh
    kubectl create secret generic <cluster_secret_name> \
      --save-config \
      --dry-run=client \
      --from-literal=username=<current-username> \
      --from-literal=password=<new-password> \
      -o yaml | \
    kubectl apply -f -
    ```

4. Wait five minutes for all components to read the new password. Proceeding too soon can lock the account.

5. Open a shell in the pod again:

    ```sh
    kubectl exec -it <rec-resource-name>-0 -c redis-enterprise-node -- /bin/bash
    ```

6. Remove the previous password so only the new one applies:

    ```sh
    REC_USER="`cat /opt/redislabs/credentials/username`"; \
    REC_PASSWORD="`cat /opt/redislabs/credentials/password`"; \
    curl -k --request DELETE \
      --url https://localhost:9443/v1/users/password \
      -u "$REC_USER:$REC_PASSWORD" \
      --header 'Content-Type: application/json' \
      --data "{\"username\":\"$REC_USER\", \
      \"old_password\":\"<OLD PASSWORD\"}"
    ```

{{<note>}}
The username in the K8s secret is the email displayed in the Redis Enterprise admin console.
{{</note>}}

### Change both the REC username and password

1. [Connect to the admin console]({{< relref "/operate/kubernetes/re-clusters/connect-to-admin-console.md" >}}).

2. [Add another admin user]({{< relref "/operate/rs/security/access-control/create-users" >}}) and choose a new password.

3. Set the new username in the `username` field of your REC custom resource spec.

4. Update the REC credential secret:

    ```sh
    kubectl create secret generic <cluster_secret_name> \
      --save-config \
      --dry-run=client \
      --from-literal=username=<new-username> \
      --from-literal=password=<new-password> \
      -o yaml | \
    kubectl apply -f -
    ```

5. Wait five minutes for all components to read the new password. Proceeding too soon can lock the account.

6. Delete the previous admin user from the cluster.

{{<note>}}
The operator may log errors between updating the username in the REC spec and updating the secret.
{{</note>}}

### Update the REC credentials secret in Vault

If you store secrets in HashiCorp Vault, update the REC credential secret with these key-value pairs:

```sh
username:<desired_username>, password:<desired_password>
```

For more details, see [Integrate Redis Enterprise for Kubernetes with HashiCorp Vault](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/vault/README.md).

## Redis Enterprise database (REDB) password

Each [`RedisEnterpriseDatabase`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}) resource has a password stored under the `password` key of the secret named by `spec.databaseSecretName`. If you don't set `databaseSecretName`, the operator creates a secret named `redb-<database-name>` with a random password and updates the REDB spec to reference it.

The operator reads the `password` key on every reconciliation and applies it to the database, so you rotate the password by updating the secret.

### Retrieve the REDB password

1. Find the secret name for the database:

    ```sh
    kubectl get redb <database-name> -o jsonpath="{.spec.databaseSecretName}"
    ```

2. Decode the password:

    ```sh
    kubectl get secret <secret-name> -o jsonpath="{.data.password}" | base64 --decode
    ```

### Change the REDB password

{{<note>}}
If the REDB spec sets `defaultUser: false`, the operator does not create or update the database secret. Rotating the secret has no effect in that mode — manage credentials through [Redis ACLs]({{< relref "/operate/rs/security/access-control/create-roles" >}}) instead.
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

#### Impact on existing client connections

Existing client connections authenticated with the old password remain open — Redis Enterprise does not drop sessions when the password changes. New connections, and any `AUTH` commands issued on existing connections, must use the new password. Coordinate the secret update with your client configuration to avoid authentication errors.

{{<note>}}
For Active-Active databases, the database secret is not created automatically. See [Create a global database secret]({{< relref "/operate/kubernetes/active-active/global-db-secret" >}}).
{{</note>}}
