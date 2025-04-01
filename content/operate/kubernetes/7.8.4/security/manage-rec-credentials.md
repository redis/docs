---
Title: Manage Redis Enterprise cluster (REC) credentials
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: Manage REC credentials
weight: 93
url: '/operate/kubernetes/7.8.4/security/manage-rec-credentials/'
---
Redis Enterprise for Kubernetes uses a custom resource called [`RedisEnterpriseCluster`]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}}) to create a Redis Enterprise cluster (REC). During creation it generates random credentials for the operator to use. The credentials are saved in a Kubernetes (K8s) [secret](https://kubernetes.io/docs/concepts/configuration/secret/). The secret name defaults to the name of the cluster.

{{<note>}}
This procedure is only supported for operator versions 6.0.20-12 and above.
{{</note>}}

## Retrieve the current username and password

The credentials can be used to access the Redis Enterprise admin console or the API. Connectivity must be configured to the REC [pods](https://kubernetes.io/docs/concepts/workloads/pods/) using an appropriate service (or port forwarding).

1. Inspect the random username and password created by the operator during creation with the `kubectl get secret` command.

    ```sh
    kubectl get secret rec -o jsonpath='{.data}'
    ```

    The command outputs the encoded password and username, similar to the example below.

      ```sh
      map[password:MTIzNDU2NzgK username:ZGVtb0BleGFtcGxlLmNvbQo=]
      ```

1. Decode the password and username with the `echo` command and the password from the previous step.

    ```bash
    echo MTIzNDU2NzgK | base64 --decode
    ```

    This outputs the password and username in plain text. In this example, the plain text password is `12345678` and the username is `demo@example.com`.

## Change the Redis Enterprise cluster (REC) credentials

### Change the REC password for the current username

1. Access a [pod](https://kubernetes.io/docs/concepts/workloads/pods/) running a Redis Enterprise cluster.

```sh
kubectl exec -it <rec-resource-name>-0 bash
```

2. Add a new password for the existing user.

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

3. From outside the pod, update the REC credential secret.

3a. Save the existing username to a text file.

```sh
echo -n "<current_username>" > username 
```

3b. Save the new password to a text file.

```sh
echo -n "<new_password>" > password
```

3c. Update the REC credential secret.

```sh
kubectl create secret generic <cluster_secret_name> \
  --from-file=./username \
  --from-file=./password --dry-run \
  -o yaml | \
kubectl apply -f 
```

4. Wait five minutes for all the components to read the new password from the updated secret. If you proceed to the next step too soon, the account could get locked.

5. Access a pod running a Redis Enterprise cluster again.

```sh
kubectl exec -it <rec-resource-name>-0 bash
```

6. Remove the previous password to ensure only the new one applies.

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

{{<note>}} The username for the K8s secret is the email displayed on the Redis Enterprise admin console. {{</note>}}

### Change both the REC username and password

1. [Connect to the admin console]({{< relref "/operate/kubernetes/re-clusters/connect-to-admin-console.md" >}})

2. [Add another admin user]({{< relref "/operate/rs/security/access-control/create-users" >}}) and choose a new password.

3. Specify the new username in the `username` field of your REC custom resource spec.

4. Update the REC credential secret:

4a. Save the new username to a text file.

```sh
echo -n "<new_username>" > username
```

4b. Save the new password to a text file.

```sh
echo -n "<new_password>" > password
```

4c. Update the REC credential secret.

```sh
kubectl create secret generic <cluster_secret_name> \
  --save-config \
  --dry-run=client \
  --from-file=./username --from-file=./password \
  -o yaml | \
kubectl apply -f
```

5. Wait five minutes for all the components to read the new password from the updated secret. If you proceed to the next step too soon, the account could get locked.

6. Delete the previous admin user from the cluster.

{{<note>}}
The operator may log errors in the time between updating the username in the REC spec and the secret update.
{{</note>}}

### Update the credentials secret in Vault

If you store your secrets with Hashicorp Vault, update the secret for the REC credentials with the following key-value pairs:

```sh
username:<desired_username>, password:<desired_password>
```

For more information about Vault integration with the Redis Enterprise Cluster see [Integrating Redis Enterprise for Kubernetes with Hashicorp Vault](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/vault/README.md).
