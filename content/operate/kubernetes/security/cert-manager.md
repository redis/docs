---
Title: Integrate cert-manager with Redis for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Automate TLS certificate management for Redis for Kubernetes using cert-manager.
linkTitle: cert-manager
weight: 89
---

[cert-manager](https://cert-manager.io/) is a Kubernetes add-on that automates the management and issuance of TLS certificates. The Redis operator integrates with cert-manager, so you can use automatically managed certificates for:

- Redis Enterprise cluster (REC) components (API, CM, proxy, syncer, and others)
- Database replication with TLS
- LDAP client authentication
- SSO/SAML certificates

Benefits of using cert-manager include:

- **Automatic certificate renewal**: cert-manager handles certificate rotation before expiration.
- **Standardized management**: Use the same certificate management approach across your Kubernetes infrastructure.
- **Multiple certificate authorities**: Support for Let's Encrypt, private CAs, Vault, and more.
- **Automatic propagation**: For Active-Active databases, certificate changes automatically sync across all participating clusters.

{{<warning>}}The cert-manager integration uses Kubernetes secrets. It is not compatible with Vault-based secret management (when `clusterCredentialSecretType: vault`). See [HashiCorp Vault integration]({{< relref "/operate/kubernetes/security/vault" >}}) for details.{{</warning>}}

## Prerequisites

- Kubernetes cluster with Redis Enterprise operator installed
- cert-manager v1.19.0 or later installed

If cert-manager is not already installed, see the [cert-manager installation documentation](https://cert-manager.io/docs/installation/).

## How it works

cert-manager creates standard Kubernetes TLS secrets with the following fields:

- `tls.crt`: The certificate in PEM format
- `tls.key`: The private key in PEM format
- `ca.crt`: The root CA certificate

The Redis Enterprise operator automatically recognizes these secrets and can use them interchangeably with manually created secrets.

{{<note>}}If you currently use opaque secrets for your certificates, you can switch to cert-manager's TLS secrets without any additional configuration changes to your Redis resources.{{</note>}}

### Supported secret formats

The operator supports multiple field names for backward compatibility:

| Purpose | Accepted field names |
|---------|---------------------|
| Certificate | `tls.crt`, `cert`, `certificate` |
| Private key | `tls.key`, `key` |
| CA certificate | `ca.crt` |

{{<note>}}The `ca.crt` field is automatically appended to the certificate chain when present. cert-manager typically populates this field when it has access to the root certificate.{{</note>}}

## Quick start

After you install cert-manager and configure an [`Issuer` or `ClusterIssuer`](https://cert-manager.io/docs/concepts/issuer/), create a `Certificate` resource to generate TLS secrets, then reference the secret name in your Redis custom resources.

### Create a certificate and configure your REC

The following example creates a certificate and references the generated secret in a `RedisEnterpriseCluster` resource:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: redis-api-cert
  namespace: redis-namespace
spec:
  secretName: redis-api-tls
  duration: 2160h # 90 days
  renewBefore: 360h # 15 days before expiration
  issuerRef:
    name: my-issuer
    kind: ClusterIssuer
---
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
  namespace: redis-namespace
spec:
  nodes: 3
  certificates:
    apiCertificateSecretName: redis-api-tls
```

The operator automatically reads the certificate from the `redis-api-tls` secret created by cert-manager. No additional configuration is needed, even if you are migrating from manually created opaque secrets.

## Secure all cluster components

Request certificates for each component and reference them in the REC:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  certificates:
    apiCertificateSecretName: api-tls
    cmCertificateSecretName: cm-tls
    proxyCertificateSecretName: proxy-tls
    syncerCertificateSecretName: syncer-tls
    metricsExporterCertificateSecretName: metrics-tls
```

Each secret name corresponds to a `Certificate` resource managed by cert-manager. For details on these fields, see the [RedisEnterpriseCluster API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}).

## Database replication with TLS

For database replication with client certificates:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: replication-client-cert
  namespace: redis-namespace
spec:
  secretName: replication-client-tls
  issuerRef:
    name: my-ca-issuer
    kind: ClusterIssuer
  commonName: replication-client
---
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseDatabase
metadata:
  name: target-db
spec:
  replicaSources:
    - replicaSourceType: SECRET
      replicaSourceName: source-uri-secret
      clientKeySecret: replication-client-tls
```

## LDAP client authentication

When using LDAP with client certificate authentication:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ldap-client-cert
  namespace: redis-namespace
spec:
  secretName: ldap-client-tls
  issuerRef:
    name: ldap-ca-issuer
    kind: ClusterIssuer
  commonName: redis-ldap-client
---
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  certificates:
    ldapClientCertificateSecretName: ldap-client-tls
  ldap:
    protocol: LDAPS
    servers:
      - host: ldap.example.com
        port: 636
```

For more details on LDAP configuration, see [Enable LDAP authentication]({{< relref "/operate/kubernetes/security/ldap" >}}).

## Active-Active databases with automatic certificate sync

For Active-Active databases, certificate updates to proxy or syncer certificates automatically trigger synchronization across all participating clusters:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  certificates:
    proxyCertificateSecretName: proxy-tls
    syncerCertificateSecretName: syncer-tls
```

When cert-manager renews these certificates, the operator:

1. Detects the secret change.
1. Updates the certificate generation counter.
1. Triggers a CRDB force update automatically.
1. Synchronizes the new certificates to all participating clusters.

No manual intervention is required.

## Use production certificate authorities

### Let's Encrypt

For production environments, you can use Let's Encrypt:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

Then reference this issuer in your `Certificate` resources:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: redis-api-cert
spec:
  secretName: redis-api-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - redis-api.example.com
```

### Private CA

For internal deployments with a private certificate authority:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: private-ca-issuer
spec:
  ca:
    secretName: ca-key-pair
```

The `ca-key-pair` secret must contain your CA's certificate and private key.

## Migrate from manual certificate management

If you currently use manually created secrets, you can migrate to cert-manager without downtime.

1. Install cert-manager and create issuers (as shown in previous examples).

1. Create `Certificate` resources with **different secret names** than your current secrets:

    ```yaml
    apiVersion: cert-manager.io/v1
    kind: Certificate
    metadata:
      name: new-api-cert
    spec:
      secretName: api-tls-new
      issuerRef:
        name: my-issuer
        kind: ClusterIssuer
    ```

1. Update your REC to reference the new secrets:

    ```yaml
    apiVersion: app.redislabs.com/v1
    kind: RedisEnterpriseCluster
    metadata:
      name: rec
    spec:
      certificates:
        apiCertificateSecretName: api-tls-new
    ```

    The operator updates the cluster with the new certificates. For Active-Active databases, the changes automatically sync to all clusters.

1. After verifying the new certificates work correctly, delete the old manually created secrets:

    ```bash
    kubectl delete secret old-api-tls -n redis-namespace
    ```

## Certificate renewal and monitoring

### Automatic renewal

cert-manager automatically renews certificates before they expire based on the `renewBefore` setting in the `Certificate` spec:

```yaml
spec:
  duration: 2160h    # 90 days
  renewBefore: 360h  # Renew 15 days before expiration
```

### Monitor certificate status

Check certificate status:

```bash
kubectl get certificate -n redis-namespace
```

View detailed certificate information:

```bash
kubectl describe certificate redis-api-cert -n redis-namespace
```

## Troubleshooting

### Certificate not issued

Check the certificate status and cert-manager logs:

```bash
kubectl describe certificate <certificate-name> -n <namespace>
kubectl logs -n cert-manager deployment/cert-manager
```

Common issues:

- **Issuer not ready**: Verify your `Issuer` or `ClusterIssuer` is configured correctly.
- **DNS validation failure**: For ACME issuers, ensure DNS records are correctly configured.
- **Rate limits**: Let's Encrypt has rate limits. Use the staging environment for testing.

### Operator not detecting certificate changes

Verify the secret exists and has the correct format:

```bash
kubectl get secret <secret-name> -n <namespace> -o yaml
```

Confirm the secret contains `tls.crt` and `tls.key` fields. Check operator logs:

```bash
kubectl logs -n <operator-namespace> deployment/redis-enterprise-operator
```

### Certificate chain issues

If you encounter certificate chain validation errors:

1. Verify the `ca.crt` field is present in the secret (cert-manager populates this automatically when it has access to the root CA).
1. If `ca.crt` is not present, ensure the certificate in `tls.crt` includes the full chain inline.
1. Confirm the certificate chain is in the correct order: leaf certificate first, then intermediates, then root.

## Best practices

- **Use appropriate certificate lifetimes**: 90 days with a 15-day renewal window for production. Use shorter lifetimes in development to test renewal.
- **Configure proper DNS names**: Include all necessary DNS names and SANs in your `Certificate` spec.
- **Monitor certificate expiration**: Set up alerts for certificate expiration, even with automatic renewal.
- **Use `ClusterIssuers` for shared issuers**: If multiple namespaces need certificates from the same CA, use `ClusterIssuers` instead of namespace-scoped `Issuers`.
- **Back up CA private keys**: If using a private CA, ensure the CA private key secret is backed up.

## See also

- [cert-manager documentation](https://cert-manager.io/docs/)
- [Manage REC certificates]({{< relref "/operate/kubernetes/security/manage-rec-certificates" >}})
- [RedisEnterpriseCluster API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}})
- [RedisEnterpriseDatabase API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}})
- [HashiCorp Vault integration]({{< relref "/operate/kubernetes/security/vault" >}})
