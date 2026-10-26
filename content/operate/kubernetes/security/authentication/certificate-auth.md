---
Title: Authenticate to the REST API with client certificates
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Authenticate the operator and users to the Redis Software REST API with client certificates, and optionally turn off password authentication.
linkTitle: REST API certificate auth
weight: 50
---

The operator and your users can authenticate to the Redis Software REST API with client certificates instead of usernames and passwords. After they all use certificates, you can turn off basic (username and password) authentication.

Three `RedisEnterpriseCluster` (REC) spec blocks control this:

| Spec block | What it controls |
| --- | --- |
| `apiCertificateBasedAuth` | Whether the cluster accepts client certificates on the REST API, which CA it trusts, and which certificate subjects it authorizes. |
| `operatorClientAuth` | Which credential the operator presents to the REST API: a username and password (`Basic`) or a client certificate (`Certificate`). |
| `apiBasicAuth` | Whether the cluster accepts usernames and passwords on the REST API. |

Enabling certificate-based authentication adds a way to authenticate. It doesn't remove basic authentication. Passwords keep working until you set `apiBasicAuth.enabled` to `false`. Each user and the operator authenticates with one method, so you can move them to certificates one at a time while the others keep using passwords.

For how certificate-based authentication works in Redis Software, see [Certificate-based authentication](/content/operate/rs/security/certificates/certificate-based-authentication.md) and [Disable basic authentication for the REST API](/content/operate/rs/security/access-control/disable-basic-authentication.md).

## Before you start

- Requires Redis Software for Kubernetes operator `8.2.6-21` or later.
- You need a certificate authority (CA) that signs your client certificates, and its CA certificate in PEM format.
- You need a client certificate and private key for the operator, signed by that CA.
- Disabling basic authentication requires Redis Software 8.2.0 or later.
- Create all secrets in the same namespace as the REC.

## Enable certificate-based authentication

1. Create a secret that holds the trusted CA certificate. The CA certificate must be under a key named `certificate`, `cert`, or `tls.crt`:

    ```sh
    kubectl create secret generic <ca-secret-name> \
      --from-file=cert=</path/to/ca.pem>
    ```

1. Create a secret that holds the operator's client certificate and private key. Use a [kubernetes.io/tls](https://kubernetes.io/docs/concepts/configuration/secret/#tls-secrets) secret, such as one cert-manager produces, or an opaque secret with the certificate under `tls.crt` or `cert` and the key under `tls.key` or `key`:

    ```sh
    kubectl create secret tls <client-cert-secret-name> \
      --cert=</path/to/operator-client.pem> \
      --key=</path/to/operator-client-key.pem>
    ```

1. Get the certificate's subject in RFC 2253 format:

    ```sh
    openssl x509 -in </path/to/operator-client.pem> -noout -subject -nameopt RFC2253
    ```

    You declare this subject in the next step, without the `subject=` prefix. It must match the certificate's subject exactly, or the operator rejects the spec.

1. Add `apiCertificateBasedAuth` and `operatorClientAuth` to the `spec` section of your existing REC file:

    ```yaml
    spec:
      apiCertificateBasedAuth:
        enabled: true
        trustedCASecretName: <ca-secret-name>
        clientCertSubjectValidationType: FullSubject
      operatorClientAuth:
        method: Certificate
        clientCertificateSecretName: <client-cert-secret-name>
        certificateSubjectLine: CN=<operator-common-name>,O=<organization>
    ```

    With `FullSubject`, only certificates whose full subject is listed in `authorizedSubjects` can authenticate. The operator adds its own subject for you.

1. Apply the REC. This change triggers a rolling update of the cluster, because the operator updates the Redis Software pods to present the client certificate.

    ```sh
    kubectl apply -f <rec-file>.yaml
    ```

1. Confirm that the cluster accepts certificates and that the operator's certificate is valid:

    ```sh
    kubectl get rec <rec-name> -o jsonpath='{.status.apiCertificateBasedAuthActive}{"\n"}{.status.operatorClientCertStatus}{"\n"}'
    ```

    The first line is `true`, and `operatorClientCertStatus.state` is `Valid`.

### `apiCertificateBasedAuth` fields

| Field | Description |
| --- | --- |
| `enabled` | Whether the REST API accepts client certificates. Setting it to `true` requires `trustedCASecretName`. |
| `trustedCASecretName` | Secret that holds the CA certificate used to validate client certificates. |
| `clientCertSubjectValidationType` | How the cluster validates a client certificate's subject: `Disabled` (no subject validation), `SanCn` (the Subject Alternative Name or Common Name), or `FullSubject` (the full subject). |
| `authorizedSubjects` | Certificate subjects allowed to authenticate. Each entry takes `CN` (required), `O`, `OU` (a list), `L`, `ST`, and `C`. The operator adds its own subject from `operatorClientAuth.certificateSubjectLine`, so you don't need to list it. |

After you set `apiCertificateBasedAuth` for the first time, `status.managedAPIs.apiCertificateBasedAuth` is `true` and the operator keeps managing the setting. If you remove the block later, the operator turns certificate-based authentication off on the cluster.

### `operatorClientAuth` fields

| Field | Description |
| --- | --- |
| `method` | `Basic` (the default) or `Certificate`. `Certificate` requires `clientCertificateSecretName`, `certificateSubjectLine`, and `apiCertificateBasedAuth.enabled: true`. |
| `clientCertificateSecretName` | Secret that holds the operator's client certificate and private key. |
| `certificateSubjectLine` | The certificate's subject in RFC 2253 format, with no spaces after commas, for example `CN=operator,O=example`. Only `CN`, `O`, `OU`, `L`, `ST`, and `C` attributes are allowed, and `CN` is required. |

With the `Certificate` method, the operator creates a `RedisEnterpriseUser`, a `RedisEnterpriseClusterRole` with the Admin management role, and a `RedisEnterpriseClusterRoleBinding`, all named `<rec-name>-operator-cert-auth`. This is the identity the operator authenticates as. The operator owns these resources and reverts changes to them. If a resource with that name already exists and the REC doesn't own it, the operator reports an error instead of taking it over.

## Add certificate-based users

To let a person or an app authenticate with a client certificate:

1. Get a client certificate for the user, signed by the CA in `trustedCASecretName`. Get its subject in RFC 2253 format:

    ```sh
    openssl x509 -in </path/to/user-client.pem> -noout -subject -nameopt RFC2253
    ```

1. [Create a `RedisEnterpriseUser`](/content/operate/kubernetes/security/access-control/manage-users.md#create-a-user) with `authMethod: Certificate` and the subject, without the `subject=` prefix, in `certificateSubjectLine`. Certificate-based users have no password, so leave out `passwordSecrets`:

    ```yaml
    spec:
      authMethod: Certificate
      certificateSubjectLine: CN=<user-common-name>,O=<organization>
    ```

1. If `clientCertSubjectValidationType` is `SanCn` or `FullSubject`, add the user's subject to `apiCertificateBasedAuth.authorizedSubjects` in the REC.

1. Grant the user permissions with a role binding. See [Manage role bindings](/content/operate/kubernetes/security/access-control/manage-bindings.md).

For all user fields, see the [RedisEnterpriseUser API reference](/content/operate/kubernetes/reference/api/redis_enterprise_user_api.md).

## Disable basic authentication

Set `apiBasicAuth.enabled` to `false` after the operator authenticates with a certificate. The cluster then rejects usernames and passwords on every REST API request and accepts only client certificates and JSON Web Token (JWT) authentication.

This setting applies only to the REST API. It doesn't change how clients authenticate to databases.

> [!WARNING]
> Every script, tool, and user that calls the REST API with a username and password loses access when you turn off basic authentication. Move each one to certificate or JWT authentication first.

1. While basic authentication is still on, confirm that each client's certificate works. Forward the REST API port to your machine:

    ```sh
    kubectl port-forward service/<rec-name> 9443:9443
    ```

    Then, in a second terminal, call the API with the client's certificate:

    ```sh
    curl --cacert </path/to/api-ca.pem> --cert </path/to/client.pem> --key </path/to/client-key.pem> \
      https://localhost:9443/v1/cluster
    ```

    A successful request returns the cluster object. For `--cacert`, use the CA that signed the cluster's API certificate. It can differ from the CA that signs client certificates.

1. If the cluster participates in Active-Active databases, update the local RERC secrets. See [Active-Active databases](#active-active-databases).

1. Add `apiBasicAuth` to the `spec` section of your REC file, and keep the `apiCertificateBasedAuth` and `operatorClientAuth` settings from [Enable certificate-based authentication](#enable-certificate-based-authentication):

    ```yaml
    spec:
      apiBasicAuth:
        enabled: false
    ```

1. Apply the REC:

    ```sh
    kubectl apply -f <rec-file>.yaml
    ```

1. Confirm that the cluster rejects passwords. With the port forward still running, call the API with a username and password:

    ```sh
    curl --cacert </path/to/api-ca.pem> -u <username>:<password> \
      -o /dev/null -w '%{http_code}\n' https://localhost:9443/v1/cluster
    ```

    The request returns `401`. If it returns `200`, the operator hasn't turned off basic authentication yet. Wait for the rolling update to finish, then try again.

The operator rejects `apiBasicAuth.enabled: false` unless `operatorClientAuth.method` is `Certificate`.

The operator doesn't turn off basic authentication right away. It waits until every component it manages authenticates with the client certificate, including the rolled-out Redis Software pods and, if usage reporting is enabled, the call-home client. Until then, the cluster keeps accepting passwords.

If you leave `apiBasicAuth` unset, the operator doesn't manage the setting. Removing `apiBasicAuth.enabled` from the spec leaves basic authentication in its current state on the cluster. It doesn't turn passwords back on.

New nodes join the cluster with the operator's client certificate, so you can scale the cluster while basic authentication is off.

### Active-Active databases

Participating clusters connect to this cluster's REST API with the credentials in the local `RedisEnterpriseRemoteCluster` (RERC) secret. Before you turn off basic authentication, the local RERC secret for every `RedisEnterpriseActiveActiveDatabase` (REAADB) must hold a client certificate and private key instead of a username and password.

Update the local RERC secret to hold the certificate and key of a certificate-based user. Use the same key names as the operator's client certificate secret. Optionally, add the CA bundle that verifies this cluster's API certificate under a key named `trusted_ca`:

```sh
kubectl create secret generic <rerc-secret-name> \
  --from-file=cert=</path/to/user-client.pem> \
  --from-file=key=</path/to/user-client-key.pem> \
  --from-file=trusted_ca=</path/to/ca.pem> \
  --dry-run=client -o yaml | kubectl apply -f -
```

A secret with both a username and password and certificate material is invalid. After you update the secret, return to step 3 in [Disable basic authentication](#disable-basic-authentication).

The operator rejects `apiBasicAuth.enabled: false` if an REAADB has no local RERC, or if a local RERC secret still holds a username and password. It waits to turn off basic authentication until the new credentials reach every Active-Active database. While basic authentication is off, the operator also rejects a new or updated RERC or REAADB whose local RERC secret holds a username and password.

For how certificate-based authentication works with Active-Active databases in Redis Software, see [Manage an Active-Active database](/content/operate/rs/security/certificates/certificate-based-authentication.md#manage-an-active-active-database).

## Re-enable basic authentication

Set `apiBasicAuth.enabled` to `true`. The operator applies the change right away. Deleting `apiBasicAuth.enabled` from the spec doesn't turn passwords back on.

```yaml
spec:
  apiBasicAuth:
    enabled: true
```

To move the operator back to passwords and turn off certificate-based authentication, follow this order:

1. Set `apiBasicAuth.enabled` to `true`, and apply the REC.
1. Set `operatorClientAuth.method` to `Basic`, and apply the REC.
1. Set `apiCertificateBasedAuth.enabled` to `false`, and apply the REC.

The operator keeps certificate-based authentication on while basic authentication is off, because turning both off would leave no way to authenticate.

## Monitor and rotate the client certificate

`status.operatorClientCertStatus` reports the operator's client certificate:

| Field | Description |
| --- | --- |
| `state` | `Valid`, `ExpiringSoon` (30 days or less until expiry), or `Expired`. |
| `expirationDate` | When the certificate expires, in RFC 3339 format. |
| `secretName` | The secret named in `operatorClientAuth.clientCertificateSecretName`. |

From 30 days before expiry, the operator records a `ClientCertificateExpiringSoon` warning event on the REC. After expiry, it records `ClientCertificateExpired`. To list them:

```sh
kubectl get events --field-selector involvedObject.name=<rec-name>,type=Warning
```

Rotate the certificate before it expires. If it expires while basic authentication is off, the operator loses access to the cluster until you replace the certificate or [re-enable basic authentication from a cluster node](#troubleshoot).

To rotate the certificate, get a new certificate and key signed by the trusted CA. Then:

- **Same subject:** replace the contents of the existing secret:

    ```sh
    kubectl create secret tls <client-cert-secret-name> \
      --cert=</path/to/new-operator-client.pem> \
      --key=</path/to/new-operator-client-key.pem> \
      --dry-run=client -o yaml | kubectl apply -f -
    ```

- **Different subject:** create a new secret, then update `clientCertificateSecretName` and `certificateSubjectLine` together in one change. The operator rejects the spec whenever the subject line doesn't match the certificate in the secret, so updating one without the other leaves the REC invalid.

## Use HashiCorp Vault

When the REC uses [HashiCorp Vault](/content/operate/kubernetes/security/vault.md) for secrets (`clusterCredentialSecretType: vault`), set `clientCertificateSecretName` and `trustedCASecretName` to Vault KV paths instead of Kubernetes secret names. The operator delivers the client certificate to the components that need it through the Vault Agent Injector.

## Troubleshoot

**The operator can't authenticate (HTTP 401).** If basic authentication is off and `operatorClientAuth.method` is no longer `Certificate`, the REC events report that the cluster rejected the operator's credentials with HTTP 401. To recover, do one of the following:

- Restore `operatorClientAuth.method: Certificate` with the previous client certificate secret.
- Re-enable basic authentication from a cluster node:

    ```sh
    rladmin tune cluster control_plane_basic_authentication enabled
    ```

**The REC's `status.specStatus` is `Invalid`.** The operator applies no changes until you fix the spec. Check the REC events for the reason. The operator rejects:

- `apiCertificateBasedAuth.enabled: true` without `trustedCASecretName`.
- `operatorClientAuth.method: Certificate` without `clientCertificateSecretName`, `certificateSubjectLine`, or `apiCertificateBasedAuth.enabled: true`.
- A `certificateSubjectLine` that isn't a valid RFC 2253 subject, or that doesn't exactly match the subject of the certificate in `clientCertificateSecretName`.
- A `trustedCASecretName` secret that doesn't exist or doesn't hold a CA certificate.
- A `clientCertificateSecretName` secret that doesn't exist or doesn't hold a valid certificate and private key.
- `apiBasicAuth.enabled` on Redis Software earlier than 8.2.0.

## Related topics

- [Manage REC certificates](/content/operate/kubernetes/security/certificates/manage-rec-certificates.md)
- [Manage users](/content/operate/kubernetes/security/access-control/manage-users.md)
- [RedisEnterpriseCluster API reference](/content/operate/kubernetes/reference/api/redis_enterprise_cluster_api.md)
- [Certificate-based authentication in Redis Software](/content/operate/rs/security/certificates/certificate-based-authentication.md)
