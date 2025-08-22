---
categories:
- docs
- operate
- kubernetes
description: Store Redis Enterprise configuration items in Kubernetes Secrets for automatic updates and secure management.
linkTitle: Configuration secrets
title: Store configuration in Kubernetes Secrets
weight: 96
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

2. Add the secret to your REDB using the `clientAuthenticationCertificates` property. See [Add client certificates]({{< relref "/operate/kubernetes/security/add-client-certificates" >}}) for details.

### Service certificates

To configure certificates for proxy, API, or other services, create secrets with certificate and key files:

```sh
kubectl create secret generic <secret-name> \
  --from-file=certificate=</PATH/TO/certificate.pem> \
  --from-file=key=</PATH/TO/key.pem> \
  --from-literal=name=<proxy | api | cm | syncer | metrics_exporter>
```

## Best practices

- Store sensitive configuration in Secrets rather than directly in YAML files.
- Use `--from-file` to avoid manual base64 encoding.
- Create secrets in the same namespace as your REC or REDB resources.
- Use descriptive secret names for easy identification.
- Regularly rotate certificates and update secrets.

## See also

- [Manage REC credentials]({{< relref "/operate/kubernetes/security/manage-rec-credentials" >}})
- [Manage REC certificates]({{< relref "/operate/kubernetes/security/manage-rec-certificates" >}})
- [Add client certificates]({{< relref "/operate/kubernetes/security/add-client-certificates" >}})
- [Redis Enterprise Cluster API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}})
