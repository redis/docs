---
Title: Enable internode encryption
categories:
- docs
- operate
- kubernetes
description: Enable encryption for communication between REC nodes and configure custom certificates.
linkTitle: Internode encryption
weight: 99
url: '/operate/kubernetes/7.22/security/internode-encryption/'
---

Internode encryption provides added security by encrypting communication between nodes in your Redis Enterprise cluster (REC).

## Enable internode encryption

Enable internode encryption in the `spec` section of your REC custom resource file.

```yaml
spec:
    dataInternodeEncryption: true
```

This change will apply to all databases created in the REC. You can override the cluster-wide setting for individual databases.

Edit your Redis Enterprise database (REDB) custom resource file to disable internode encryption for only that database.

```yaml
spec:
    dataInternodeEncryption: false
```

To learn more about internode encryption, see [Internode encryption for Redis Enterprise Software]({{< relref "/operate/rs/security/encryption/internode-encryption.md" >}}).

## Use custom certificates for internode encryption

By default, Redis Enterprise uses self-signed certificates for internode encryption. You can provide your own certificates for both control plane and data plane internode encryption by storing them in Kubernetes secrets and referencing them in your REC specification.

### Prerequisites

- Internode encryption must be enabled (`dataInternodeEncryption: true`)
- Certificates must be in PEM format
- You must create the Kubernetes secrets before referencing them in the REC spec
- Certificates should include the full certificate chain if using a certificate authority

### Create secrets for internode encryption certificates

Create Kubernetes secrets to store your internode encryption certificates. You need separate secrets for control plane and data plane encryption.

1. Create a secret for control plane internode encryption:

    ```sh
    kubectl create secret generic cp-internode-cert \
      --from-file=certificate=</path/to/cp-certificate.pem> \
      --from-file=key=</path/to/cp-key.pem> \
      --from-literal=name=cp_internode_encryption
    ```

2. Create a secret for data plane internode encryption:

    ```sh
    kubectl create secret generic dp-internode-cert \
      --from-file=certificate=</path/to/dp-certificate.pem> \
      --from-file=key=</path/to/dp-key.pem> \
      --from-literal=name=dp_internode_encryption
    ```

### Configure certificates in REC spec

Add the certificate secret names to the `certificates` section of your REC specification:

```yaml
spec:
  dataInternodeEncryption: true
  certificates:
    cpInternodeEncryptionCertificateSecretName: cp-internode-cert
    dpInternodeEncryptionCertificateSecretName: dp-internode-cert
```

You can configure one or both certificate types. If you don't specify a certificate secret name, the cluster uses a self-signed certificate for that encryption type.

Apply the updated REC specification:

```sh
kubectl apply -f <rec-file>.yaml
```

### Certificate rotation

You can rotate internode encryption certificates using either of these methods:

#### Method 1: Update the existing secret

Edit the certificate data in the existing Kubernetes secret. The operator automatically detects the change and applies the new certificate.

```sh
kubectl create secret generic cp-internode-cert \
  --from-file=certificate=</path/to/new-cp-certificate.pem> \
  --from-file=key=</path/to/new-cp-key.pem> \
  --from-literal=name=cp_internode_encryption \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### Method 2: Create a new secret and update the REC spec

1. Create a new secret with the updated certificate:

    ```sh
    kubectl create secret generic cp-internode-cert-new \
      --from-file=certificate=</path/to/new-cp-certificate.pem> \
      --from-file=key=</path/to/new-cp-key.pem> \
      --from-literal=name=cp_internode_encryption
    ```

2. Update the REC specification to reference the new secret:

    ```yaml
    spec:
      certificates:
        cpInternodeEncryptionCertificateSecretName: cp-internode-cert-new
    ```

3. Apply the updated REC specification:

    ```sh
    kubectl apply -f <rec-file>.yaml
    ```

### Certificate lifecycle

When you remove a certificate secret reference from the REC specification, the operator does not delete the certificate from the Redis Enterprise cluster. The cluster continues to use the previously configured certificate until you explicitly replace it or the cluster reverts to using a self-signed certificate.

## More info

- [Manage REC certificates]({{< relref "/operate/kubernetes/7.22/security/manage-rec-certificates" >}}) - General certificate management for Redis Enterprise clusters
- [Configuration secrets]({{< relref "/operate/kubernetes/7.22/security/configuration-secrets" >}}) - Best practices for storing configuration in Kubernetes secrets
- [Internode encryption for Redis Enterprise Software]({{< relref "/operate/rs/security/encryption/internode-encryption.md" >}}) - Detailed information about how internode encryption works
