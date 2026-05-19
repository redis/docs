---
categories:
- docs
- operate
- kubernetes
description: Store Redis Enterprise configuration items in Kubernetes Secrets for automatic updates and secure management.
linkTitle: Configuration secrets
title: Store configuration in Kubernetes Secrets
weight: 96
url: '/operate/kubernetes/7.22/security/configuration-secrets/'
---

You can store Redis Enterprise configuration items in Kubernetes Secrets for automatic updates and secure management. When you update these Secrets, the operator immediately reads the changes and propagates them to the Redis Enterprise Cluster (REC).

## License configuration

Redis Enterprise clusters require a valid license. You can apply licenses using Kubernetes Secrets (recommended) or embed them directly in the cluster specification.

### Determine your cluster FQDN

To configure licensing, you need your Redis Enterprise cluster's fully qualified domain name (FQDN). Use this format: `<REC-name>.<namespace>.svc.cluster.local`

For example: `my-rec.my-ns.svc.cluster.local`

### Use a Kubernetes Secret (recommended)

1. Create a secret from your license file:

    ```sh
    kubectl -n <namespace> create secret generic rec-license --from-file=license=./license.txt
    ```

2. Add the secret reference to your REC specification:

    ```yaml
    spec:
      licenseSecretName: rec-license
    ```

### Embed license directly in REC specification

Alternatively, you can embed the license directly in the REC YAML:

```yaml
spec:
  nodes: 3
  license: |
    ----- LICENSE START -----
    eai14c/y6XNVykffDQSPUsHKcmpgOFUlmyTBDUEZEz+GLbXAgQFOmxcdbR9J
    ...remaining license key content...
    ----- LICENSE END -----
```

{{<note>}}
You must include the pipe symbol (`|`) after `license:` and maintain proper indentation.
{{</note>}}

## TLS certificate configuration

You can store TLS certificates in Kubernetes Secrets to secure communication between clients and Redis Enterprise databases.

### Client certificates for mTLS

1. Create a secret with your client certificate:

    ```sh
    kubectl -n <namespace> create secret generic client-cert-secret --from-file=cert=<path-to-cert>
    ```

2. Add the secret to your REDB using the `clientAuthenticationCertificates` property. See [Add client certificates]({{< relref "/operate/kubernetes/7.22/security/add-client-certificates" >}}) for details.

### Service certificates

To configure certificates for proxy, API, or other services, create secrets with certificate and key files:

```sh
kubectl create secret generic <secret-name> \
  --from-file=certificate=</PATH/TO/certificate.pem> \
  --from-file=key=</PATH/TO/key.pem> \
  --from-literal=name=<proxy | api | cm | syncer | metrics_exporter>
```

### Internode encryption certificates

You can provide custom certificates for control plane and data plane internode encryption. Create separate secrets for each encryption type:

```sh
kubectl create secret generic cp-internode-cert \
  --from-file=certificate=</path/to/cp-certificate.pem> \
  --from-file=key=</path/to/cp-key.pem> \
  --from-literal=name=cp_internode_encryption
```

```sh
kubectl create secret generic dp-internode-cert \
  --from-file=certificate=</path/to/dp-certificate.pem> \
  --from-file=key=</path/to/dp-key.pem> \
  --from-literal=name=dp_internode_encryption
```

Reference these secrets in your REC specification under `spec.certificates`. See [Internode encryption]({{< relref "/operate/kubernetes/7.22/security/internode-encryption" >}}) for complete configuration details.

## Secrets and PEM files in Redis Enterprise pods

Redis Enterprise pods use Kubernetes Secrets and PEM-encoded certificates and keys for cluster formation, node identity, encrypted communication, and automated recovery. Their presence is expected — not a sign of compromise.

You create the Secrets. The operator references them and manages their lifecycle (for example, when you rename the credential Secret). TLS, license, and client authentication Secrets are always user-supplied.

### What you'll see in the pod

- **Mounted Secret volumes** at operator-managed paths such as:
  - `/opt/redislabs/credentials` — cluster admin credential Secret.
  - `/opt/redislabs/proxy` — call-home proxy credentials, when configured.
- **PEM-encoded certificates and keys** for TLS, internode encryption, and proxy or database endpoints. The operator applies these certificates through the cluster's REST API rather than as Secret volume mounts, and Redis Enterprise writes them to the pod filesystem. Exact paths vary by version and component.

### What the Secrets contain

Field names vary by deployment.

- **Cluster admin credentials** — `username` and `password` in the Secret named by `clusterCredentialSecretName`.
- **License** — `license` field in the Secret named by `licenseSecretName`.
- **Cluster Certificate Authority (CA)** — `ca.crt` or `ca.pem`. Validates peer certificates for mutual TLS. Optional.
- **Service TLS certificates and keys** for API, Cluster Manager (CM), metrics exporter, proxy, syncer, and LDAP. Fields: `certificate`, `cert`, or `tls.crt`, plus `key` or `tls.key`. See [Service certificates](#service-certificates).
- **Client authentication certificates** for databases. Set in the Redis Enterprise database (REDB) `clientAuthenticationCertificates` field.

## Best practices

- Store sensitive configuration in Secrets rather than directly in YAML files.
- Use `--from-file` to avoid manual base64 encoding.
- Create secrets in the same namespace as your REC or REDB resources.
- Use descriptive secret names for easy identification.
- Regularly rotate certificates and update secrets.

## See also

- [Manage REC credentials]({{< relref "/operate/kubernetes/7.22/security/manage-rec-credentials" >}})
- [Manage REC certificates]({{< relref "/operate/kubernetes/7.22/security/manage-rec-certificates" >}})
- [Add client certificates]({{< relref "/operate/kubernetes/7.22/security/add-client-certificates" >}})
- [Redis Enterprise Cluster API reference]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api" >}})
