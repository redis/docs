---
Title: Enable LDAP authentication
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Enable LDAP authentication for Redis Enterprise for Kubernetes.
linkTitle: Enable LDAP
weight: 95
url: '/operate/kubernetes/7.8.4/security/ldap/'
---

## LDAP support for Redis Enterprise Software

Redis Enterprise Software supports LDAP authentication and authorization through [role-based access controls]({{< relref "/operate/rs/security/access-control/" >}}) (RBAC). You can map LDAP groups to [Redis Enterprise roles]({{< relref "/operate/rs/security/access-control" >}}) to control access to your database and the Cluster Manager UI. For more details on how LDAP works with Redis Enterprise, see [LDAP authentication]({{< relref "/operate/rs/security/access-control/ldap/" >}}).

Redis Enterprise for Kubernetes supports enabling and configuring LDAP authentication using the `RedisEnterpriseCluster` (REC) custom resource. Currently, the Redis Enterprise cluster (REC) only supports configuration related to the LDAP server, such as server addresses, connection details, credentials, and query configuration.

To [map LDAP groups to Redis Enterprise access control roles]({{< relref "/operate/rs/security/access-control/ldap/enable-role-based-ldap.md" >}}), you'll need to use the Redis Enterprise [API]({{< relref "/operate/rs/references/rest-api/requests/ldap_mappings/" >}}) or [admin console]({{< relref "/operate/rs/security/access-control/ldap/enable-role-based-ldap.md" >}}).

## Enable LDAP 

To enable LDAP for your REC, use the `.spec.ldap` field in the `RedisEnterpriseCluster` custom resource.

The following `RedisEnterpriseCluster` example resource enables a basic LDAP configuration:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  ldap:
    protocol: LDAP
    servers:
    - host: openldap.openldap.svc
      port: 389
    bindCredentialsSecretName: ldap-bind-credentials
    cacheTTLSeconds: 600
    enabledForControlPlane: true
    enabledForDataPlane: true
    authenticationQuery:
      template: cn=%u,ou=default,dc=example,dc=org
    authorizationQuery:
      attribute: memberOf
```

Refer to the `RedisEnterpriseCluster` [API reference](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/redis_enterprise_cluster_api.md#ldapspec) for full details on the available fields.

### Bind credentials

For LDAP servers that require authentication for client queries, store the bind credentials in a secret and reference them in the `RedisEnterpriseCluster` custom resource.

1. Create a secret to store the bind credentials.
    
    ```sh
    kubectl -n <rec-namespace> create secret generic <bind-secret-name> \
        --from-literal=dn='<disinguished-name>' \
        --from-literal=password=<password>
    ```
    The secret must:
    - Reside within the same namespace as the `RedisEnterpriseCluster` custom resource.
    - Include a `dn` key with the distinguished name for the user performing the query (such as `cn=admin,dc=example,dc=org`).
    - Include a `password` key with the bind password.

    Replace the `<placeholders>` in the command above with your own values.

1. Reference the secret name in the `.spec.ldap.bindCredentialsSecretName` field of the `RedisEnterpriseCluster` custom resource.

    ```yaml
    spec:
      ldap:
        bindCredentialsSecretName: <bind-secret-name>
    ```

### LDAPS or STARTTLS protocols

In addition to plain LDAP protocol, Redis Enterprise Software also supports LDAPS and STARTTLS protocols for secure communication with the LDAP server.

To enable one of these protocols, edit the `spec.ldap.protocol` field in the `RedisEnterpriseCluster` custom resource:

#### Enable `LDAPS`

  ```yaml
      spec:
        ldap:
          protocol: LDAPS
  ```

  Default port: 636

#### Enable `STARTTLS`

  ```yaml
      spec:
        ldap:
          protocol: STARTTLS
  ```

  Default port: 389

### CA certificate

To use a custom CA certificate for validating the LDAP server certificate, store the CA certificate in a secret and reference the secret in the `RedisEnterpriseCluster` custom resource.

1. Create a secret to hold the CA certificate.

    ```sh
    kubectl -n <rec-namespace> create secret generic <ca-secret-name> \
        --from-file=cert=<ca-cert>.pem
    ```

    The secret must:
    - Reside within the same namespace as the `RedisEnterpriseCluster` custom resource.
    - Include a `cert` key with a PEM-encoded CA certificate (such as `cacert.pem`).

    Replace the `<placeholders>` in the command above with your own values.

1. Reference the secret name in the `spec.ldap.caCertificateSecretName` field of the `RedisEnterpriseCluster` custom resource.

    ```yaml
    spec:
      ldap:
        caCertificateSecretName: <ca-secret-name>
    ```

### Client certificates

To use an LDAP client certificate, store the certificate in a secret and reference the secret in the `RedisEnterpriseCluster` custom resource.

1. Create a secret to hold the client certificate.

    ```sh
    kubectl -n <rec-namespace> create secret generic <client-secret-name> \
      --from-literal=name=ldap_client \
      --from-file=certificate=<client-cert-file> \
      --from-file=key=<private-key-file>
    ```

    The secret must:
    - Reside within the same namespace as the `RedisEnterpriseCluster` custom resource.
    - Include a `name` key explicitly set to `ldap_client`.
    - Include a `certificate` key for the public key (such as `cert.pem`).
    - Include a `key` key for the private key (such as `key.pem`).
    

    Replace the `<placeholders>` in the command above with your own values.

1. Reference the secret name in the `.spec.certificates.ldapClientCertificateSecretName` field of the `RedisEnterpriseCluster` custom resource, substituting your own values for `<placeholders>`.

    ```yaml
    spec:
      certificates:
        ldapClientCertificateSecretName: <client-secret-name>
    ```

## Known limitations

Redis Enterprise Software can't resolve DNS names with a `.local` suffix.
  If your LDAP server is in the same Kubernetes cluster and exposed via a Service object, *avoid* addresses such as `openldap.openldap.svc.cluster.local`. Instead, *use short-form addresses* such as `openldap.openldap.svc`.

## Next steps

To [map LDAP groups to Redis Enterprise access control roles]({{< relref "/operate/rs/security/access-control/ldap/enable-role-based-ldap.md" >}}), you'll need to use the Redis Enterprise [API]({{< relref "/operate/rs/references/rest-api/requests/ldap_mappings/" >}}) or [admin console]({{< relref "/operate/rs/security/access-control/ldap/enable-role-based-ldap.md" >}}).

For more details on how LDAP works with Redis Enterprise, see [LDAP authentication]({{< relref "/operate/rs/security/access-control/ldap/" >}}).
