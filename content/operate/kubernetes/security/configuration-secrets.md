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

When using Redis Enterprise for Kubernetes, you can store certain configuration items in Kubernetes Secrets. This approach has the advantage that updates to these Secrets, once configured, are read immediately by the Operator and propagated to the Redis Enterprise Cluster (REC).

## License configuration

Redis Enterprise clusters require a valid license to operate. You can apply licenses using Kubernetes Secrets or by embedding them directly in the cluster specification. This section covers how to determine your cluster's FQDN for licensing purposes and demonstrates both methods for license configuration.

### Determine your cluster FQDN

For licensing purposes, you need to know your Redis Enterprise cluster's fully qualified domain name (FQDN). In Kubernetes, the REC's FQDN is the fully qualified name of the REC API service and follows this format:

```
<REC name>.<namespace>.svc.cluster.local
```

For example, if a REC is named `my-rec` and is deployed in the namespace `my-ns`, the FQDN will be `my-rec.my-ns.svc.cluster.local`.

### Method 1: Using a Kubernetes Secret (Recommended)

You can set the license in the REC through the `licenseSecretName` YAML property.

1. Add your raw license to a text file (for example, `license.txt`).

2. Execute the following command to create the Secret (in this example called `rec-license`) with a key called `license`:

    ```sh
    kubectl -n <namespace> create secret generic rec-license --from-file=license=./license.txt
    ```

3. Edit the REC definition and add the property `licenseSecretName: rec-license`. This will be immediately read by the Operator.

    ```sh
    kubectl edit rec <rec-name>
    ```

    Add the following to the spec:

    ```yaml
    spec:
      licenseSecretName: rec-license
    ```

### Method 2: Direct license in REC specification

Alternatively, you can specify the license key string directly in the REC YAML:

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
Pay attention to the indentation and spaces in the file and make sure the pipe symbol (`|`) is included after `license:`.
{{</note>}}

## TLS certificate configuration

TLS certificates are essential for securing communication between clients and Redis Enterprise databases, as well as between internal cluster components. This section explains how to store client certificates for mutual TLS authentication and how to configure certificates for different Redis Enterprise services using Kubernetes Secrets.

### Client certificates for mTLS

Here's how to set a client certificate for mutual TLS (mTLS).

1. Create a Secret called `client-cert-secret` with a property named `cert` using the following command:

    ```sh
    kubectl -n <namespace> create secret generic client-cert-secret --from-file=cert=<path-to-cert>
    ```

2. Add this secret to the relevant Redis Enterprise Database (REDB) using the `clientAuthenticationCertificates` property as documented in [Add client certificates]({{< relref "/operate/kubernetes/security/add-client-certificates" >}}).

{{<note>}}
At the time of writing (November 14, 2023), the public documentation describes creating the secret directly in YAML. This approach has the disadvantage that it requires the user to ensure the certificate is correctly encoded to base64. This can be done using a command like `cat my-cert.pem | openssl base64`. Then paste the output into the YAML source file.
{{</note>}}

### Certificates for different services

The notes above were valid for a client certificate. If you want to create a secret for proxy, API, or other services, they expect different keys:

```sh
kubectl create secret generic <secret-name> \
  --from-file=certificate=</PATH/TO/certificate.pem> \
  --from-file=key=</PATH/TO/key.pem> \
  --from-literal=name=<proxy | api | cm | syncer | metrics_exporter>
```

## Best practices

- Store sensitive configuration items like licenses and certificates in Secrets rather than directly in YAML files
- Use the `--from-file` option when creating secrets to avoid manual base64 encoding
- Ensure secrets are created in the same namespace as your REC or REDB resources
- Use descriptive names for your secrets to make them easy to identify and manage
- Regularly rotate certificates and update the corresponding secrets

## See also

- [Manage REC credentials]({{< relref "/operate/kubernetes/security/manage-rec-credentials" >}})
- [Manage REC certificates]({{< relref "/operate/kubernetes/security/manage-rec-certificates" >}})
- [Add client certificates]({{< relref "/operate/kubernetes/security/add-client-certificates" >}})
- [Redis Enterprise Cluster API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}})
