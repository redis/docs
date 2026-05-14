---
Title: Manage Redis Enterprise cluster (REC) certificates
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Install your own certificates to replace the self-signed certificates used by a Redis Enterprise cluster on Kubernetes.
linkTitle: Manage REC certificates
weight: 94
---

Redis Software for Kubernetes generates self-signed TLS certificates for each new cluster. You can replace any of those certificates with your own.

You can manage REC certificates in two ways:

- **[Method 1: Manage certificates with the REC custom resource](#method-1-manage-certificates-with-the-rec-custom-resource)** (recommended). Store each certificate in a Kubernetes secret and reference the secret from the REC custom resource. The operator applies the certificate and keeps the cluster in sync with the secret. Use this method whenever the certificate type is exposed in `spec.certificates`.
- **[Method 2: Manage certificates with the Redis Software REST API](#method-2-manage-certificates-with-the-redis-software-rest-api)**. Call the cluster's REST API directly, bypassing the operator. Use this method only when you need to follow the Redis Software procedure for a cluster that does not define the certificate in `spec.certificates`. The operator overwrites changes made this way if the same certificate is also defined in the REC custom resource.

For the list of certificates and what each one encrypts, see the [certificates table]({{< relref "/operate/rs/security/certificates" >}}).

## Method 1: Manage certificates with the REC custom resource

This is the Kubernetes-native method. The operator detects changes to a referenced secret and rotates the certificate without manual intervention. You can create the secret manually with `kubectl`, or have [cert-manager]({{< relref "/operate/kubernetes/security/cert-manager" >}}) issue and renew it automatically.

### Supported certificates

The REC custom resource lets you replace these certificates through `spec.certificates`:

| Certificate                        | REC custom resource field                     | Secret `name` value        |
| ---------------------------------- | --------------------------------------------- | -------------------------- |
| API                                | `apiCertificateSecretName`                    | `api`                      |
| Cluster Manager UI                 | `cmCertificateSecretName`                     | `cm`                       |
| Control plane internode encryption | `cpInternodeEncryptionCertificateSecretName`  | `cp_internode_encryption`  |
| Data plane internode encryption    | `dpInternodeEncryptionCertificateSecretName`  | `dp_internode_encryption`  |
| LDAP client                        | `ldapClientCertificateSecretName`             | `ldap_client`              |
| Metrics exporter                   | `metricsExporterCertificateSecretName`        | `metrics_exporter`         |
| Proxy                              | `proxyCertificateSecretName`                  | `proxy`                    |
| SSO issuer (SAML IdP)              | `ssoIssuerCertificateSecretName`              | `sso_issuer`               |
| SSO service (SAML SP)              | `ssoServiceCertificateSecretName`             | `sso_service`              |
| Syncer                             | `syncerCertificateSecretName`                 | `syncer`                   |

Rotating any of these certificates does not restart REC pods.

### Step 1: Create a secret for the certificate

Create a Kubernetes [secret](https://kubernetes.io/docs/concepts/configuration/secret/) that holds the PEM-encoded certificate and key:

```sh
kubectl create secret generic <secret-name> \
  --from-file=certificate=</path/to/certificate.pem> \
  --from-file=key=</path/to/key.pem> \
  --from-literal=name=<certificate-name>
```

Replace the placeholders:

- `<secret-name>`: any name you choose. You'll reference it from `spec.certificates` in [Step 2](#step-2-reference-the-secret-in-the-rec-custom-resource).
- `<certificate-name>`: the value from the **Secret `name` value** column in the [supported certificates](#supported-certificates) table.

{{<note>}}For internode encryption certificates, use the secret format described in [Internode encryption]({{< relref "/operate/kubernetes/security/internode-encryption" >}}). The rest of this procedure applies.{{</note>}}

### Step 2: Reference the secret in the REC custom resource

Edit the REC custom resource and add a `certificates` section under `spec`. Include only the fields for the certificates you are replacing:

```yaml
spec:
  certificates:
    # See the supported certificates table for the full list of fields.
    apiCertificateSecretName: <apicert-secret-name>
    cmCertificateSecretName: <cmcert-secret-name>
    cpInternodeEncryptionCertificateSecretName: <cpine-secret-name>
    dpInternodeEncryptionCertificateSecretName: <dpine-secret-name>
    metricsExporterCertificateSecretName: <metricscert-secret-name>
    proxyCertificateSecretName: <proxycert-secret-name>
    syncerCertificateSecretName: <syncercert-secret-name>
```

Apply the updated REC custom resource:

```sh
kubectl apply -f <rec-file>.yaml
```

The operator detects the change and rotates the certificate on the cluster. New client connections use the new certificate; existing connections continue with the old one until they reconnect.

### Step 3: Verify the rotation

Check the operator logs and the REC status:

```sh
kubectl logs deployment/redis-enterprise-operator
kubectl describe rec <rec-name>
```

To list the active certificates on the cluster, call the Redis Software REST API:

```http
GET /v1/cluster/certificates
```

## Method 2: Manage certificates with the Redis Software REST API

Use the Redis Software REST API or `rladmin` directly against the cluster, bypassing the operator.

{{<warning>}}If `spec.certificates` in the REC custom resource defines the same certificate, the operator overwrites your API change. Before you update a certificate through the REST API, remove the corresponding field from `spec.certificates`, or apply the same change in both places.{{</warning>}}

For the procedure, including the `rladmin` and REST API examples, see [Update certificates]({{< relref "/operate/rs/security/certificates/updating-certificates" >}}).

After the update, verify the rotation as described in [Step 3](#step-3-verify-the-rotation).

## Active-Active database certificate updates

The operator automates certificate updates for [Active-Active]({{< relref "/operate/kubernetes/active-active" >}}) databases. When you update the proxy or syncer certificate secret referenced by the REC, the operator detects the change and propagates the new certificate to all participating clusters.

This automation applies whether you manage the secret directly or with [cert-manager]({{< relref "/operate/kubernetes/security/cert-manager#active-active-databases-with-automatic-certificate-sync" >}}).

## More info

- [Update certificates]({{< relref "/operate/rs/security/certificates/updating-certificates" >}})
- [Install your own certificates]({{< relref "/operate/rs/security/certificates/create-certificates" >}})
- [Certificates table]({{< relref "/operate/rs/security/certificates" >}})
- [Glossary/Transport Layer Security (TLS)]({{< relref "/glossary#letter-t" >}})
