---
Title: Certificate-based authentication
alwaysopen: false
categories:
- docs
- operate
- rs
description: Certificate-based authentication allows secure, passwordless access to the REST API and databases.
linkTitle: Certificate-based authentication 
weight: 70
---

You can set up certificate-based authentication for specific users to enable secure, passwordless access to the Redis Software [REST API]({{<relref "/operate/rs/references/rest-api">}}) and databases.

## Certificate-based authentication for the REST API

### Set up certificate-based authentication for the REST API

To set up certificate-based authentication:

1. Add a trusted CA certificate `mtls_trusted_ca` to the cluster using an [update cluster certificates]({{<relref "/operate/rs/references/rest-api/requests/cluster/certificates">}}) request:

    {{< multitabs id="add-mtls_trusted_ca-cert"
          tab1="Redis Software v7.22.2 and later"
          tab2="Redis Software v7.22.0 and earlier" >}}

For Redis Software versions 7.22.2 and later, use:

```sh
PUT /v1/cluster/certificates
{
  "certificates": [
    {
      "name": "mtls_trusted_ca",
      "certificate": "<content of certificate PEM file>"
    }
  ]
}
```

-tab-sep-

For Redis Software versions 7.22.0 and earlier, use:

```sh
PUT /v1/cluster/update_cert
{
  "name": "mtls_trusted_ca",
  "certificate": "<content of certificate PEM file>"
}
```

    {{< /multitabs >}}

1. [Update cluster settings]({{<relref "/operate/rs/references/rest-api/requests/cluster#put-cluster">}}) with mutual TLS (mTLS) configuration using one of the following options:

    {{< multitabs id="enable-mTLS"
          tab1="Without subject validation"
          tab2="With SAN validation"
          tab3="With Full Subject Name validation" >}}

Additional certificate validation is optional. To enable mutual TLS without subject validation, use:

```sh
PUT /v1/cluster
{
  "mtls_certificate_authentication": true,
  "mtls_client_cert_subject_validation_type": "disabled"
}
```

-tab-sep-

For certificate validation by Subject Alternative Name (SAN), use:

```sh
PUT /v1/cluster
{
  "mtls_certificate_authentication": true,
  "mtls_client_cert_subject_validation_type": "san_cn",
  "mtls_authorized_subjects": [{
    "CN": "<Subject Common Name or SAN DNS entry>"
  }]
}
```

Replace the placeholder value `<>` with your client certificate's Subject Common Name or SAN DNS entry.

**Example certificate and mTLS settings**

If a client certificate has:

- Subject: `CN=client.example.com`

- SAN: `DNS:app1.example.com, DNS:client.example.com, DNS:app1-prod.example.com`

You can use any of these values for the CN in `mtls_authorized_subjects`:

```sh
PUT /v1/cluster
{
  "mtls_certificate_authentication": true,
  "mtls_client_cert_subject_validation_type": "san_cn",
  "mtls_authorized_subjects": [
    {"CN": "client.example.com"},   // Subject CN
    {"CN": "app1.example.com"},     // SAN DNS entry
    {"CN": "app1-prod.example.com"} // Another SAN DNS entry
  ]
}
```

-tab-sep-

For certificate validation by full Subject Name, use:

```sh
PUT /v1/cluster
{
  "mtls_certificate_authentication": true,
  "mtls_client_cert_subject_validation_type": "full_subject",
  "mtls_authorized_subjects": [{
    "CN": "<Common Name>",
    "OU": [<array of Organizational Unit strings>],
    "O": "<Organization>",
    "C": "<2-letter country code>",
    "L": "<Locality (city)>",
    "ST": "<State/Province>"
  }]
}
```

Replace the placeholder values `<>` with your client certificate's subject values.

**Example certificate and mTLS settings**

If a client certificate has:

- Subject: `CN=client.example.com`

- SAN: `DNS:app1.example.com, DNS:client.example.com, DNS:app1-prod.example.com`

You can use any of these values for the CN in `mtls_authorized_subjects`:

```sh
PUT /v1/cluster
{
  "mtls_certificate_authentication": true,
  "mtls_client_cert_subject_validation_type": "san_cn",
  "mtls_authorized_subjects": [
    {"CN": "client.example.com"},   // Subject CN
    {"CN": "app1.example.com"},     // SAN DNS entry
    {"CN": "app1-prod.example.com"} // Another SAN DNS entry
  ]
}
```

    {{< /multitabs >}}

1. When you [create new users]({{<relref "/operate/rs/references/rest-api/requests/users#post-user">}}), include `"auth_method": "certificate"` and `certificate_subject_line` in the request body:

    ```sh
    POST /v1/users
    {
      "auth_method": "certificate",
      "certificate_subject_line": "CN=<Common Name>,OU=<Organizational Unit>,O=<Organization>,L=<Locality>,ST=<State/Province>,C=<Country>"
    }
    ```

    Replace the placeholder values `<>` with your client certificate's subject values.

    {{<note>}}
The `certificate_subject_line` must:

- Follow [RFC 2253](https://www.rfc-editor.org/rfc/rfc2253) format.

- List the attributes in reverse order, starting with the Common Name (`CN`).

- Not contain spaces after the commas that separate attributes.

- Exactly match the certificate's RFC 2253 subject.

- Contain only one Organizational Unit (`OU`) value.
    {{</note>}}

### Authenticate REST API requests

To use the REST API with certificate-based authentication, you must provide a client certificate, signed by the trusted CA `mtls_trusted_ca`, and a private key.

The following example uses [cURL](https://curl.se/) to send a [REST API request]({{<relref "/operate/rs/references/rest-api/requests">}}):

```sh
curl --request <METHOD> --url https://<hostname-or-IP-address>:9443/<API-version>/<API-path> --cert client.pem --key client.key
```

## Certificate-based authentication for cluster management

Two cluster-management flows support certificate credentials when Basic and Digest authentication are disabled or unavailable: joining a node to a cluster, and managing an Active-Active database. These flows don't use JWT or LDAP.

Certificate authentication isn't automatic—you must configure each flow to use certificate credentials instead of a username and password. First complete [Set up certificate-based authentication for the REST API](#set-up-certificate-based-authentication-for-the-rest-api) so the cluster has a trusted CA (`mtls_trusted_ca`) and mutual TLS enabled (`mtls_certificate_authentication`).

### Certificate credentials

Certificate credentials consist of three values:

| Value | Required | Description |
|---|---|---|
| `client_cert` | Yes | The client certificate. |
| `client_key` | Yes | The client certificate's private key. |
| `trusted_ca` | No | The CA that validates the API certificate the peer cluster presents. If you omit it, the cluster uses the certificates in its `mtls_trusted_ca.pem` file. |

Mutual TLS applies in both directions. The client presents its certificate, which the cluster validates against its locally configured `mtls_trusted_ca`. The cluster presents its API certificate chain, which the client validates using the CA configured for that connection. Make sure the CA that signed your client certificates is present in `mtls_trusted_ca` on the cluster.

For any given cluster, use either a username and password or certificate credentials—never both. A request that includes both for the same cluster fails.

The same three values take different formats depending on the interface:

| Interface | Format |
|-----------|--------|
| Bootstrap API `credentials` | PEM strings |
| [`rladmin cluster join`]({{<relref "/operate/rs/references/cli-utilities/rladmin/cluster/join">}}) | File paths |
| Active-Active REST API `certificate_auth` | PEM strings |
| [`crdb-cli`]({{<relref "/operate/rs/references/cli-utilities/crdb-cli">}}) | PEM strings |

### Join a node to the cluster

To join a node with certificate credentials, include `client_cert`, `client_key`, and `trusted_ca` in the `credentials` object of a [bootstrap]({{<relref "/operate/rs/references/rest-api/requests/bootstrap">}}) request. These fields take PEM strings:

```sh
POST /v1/bootstrap/join_cluster
{
  "action": "join_cluster",
  "cluster": {
    "nodes": "<target-node-ip>"
  },
  "credentials": {
    "client_cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n",
    "client_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "trusted_ca": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n"
  }
}
```

[`rladmin cluster join`]({{<relref "/operate/rs/references/cli-utilities/rladmin/cluster/join">}}) accepts the same three values as file paths, not PEM strings:

```sh
rladmin cluster join nodes <target-node-ip> \
  client_cert <path-to-cert> \
  client_key <path-to-key> \
  trusted_ca <path-to-trusted-ca>
```

### Manage an Active-Active database

Each participating cluster in an Active-Active database authenticates separately. To use certificate credentials for a cluster, replace that cluster's `credentials` object with a `certificate_auth` object.

Participating clusters can use different authentication methods, so you can migrate them from passwords to certificates one at a time. In the following example, the first cluster still uses a username and password while the second uses certificate credentials:

```sh
POST /v1/crdbs
{
  "name": "cert-auth-aa",
  "guid": "<guid>",
  "default_db_config": {
    "memory_size": 104857600,
    "replication": true
  },
  "instances": [
    {
      "cluster": {
        "name": "cluster1.local",
        "url": "https://<cluster1-ip>:9443",
        "credentials": {
          "username": "<username>",
          "password": "<password>"
        }
      }
    },
    {
      "cluster": {
        "name": "cluster2.local",
        "url": "https://<cluster2-ip>:9443",
        "certificate_auth": {
          "client_cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n",
          "client_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
          "trusted_ca": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n"
        }
      }
    }
  ]
}
```

To create an Active-Active database with certificate credentials from the command line, use [`crdb-cli crdb create`]({{<relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/create">}}). The `--instance` option takes PEM strings:

```sh
crdb-cli crdb create \
  --name cert-crdb \
  --instance "fqdn=cluster1.local,username=<username>,password=<password>" \
  --instance "fqdn=cluster2.local,client_cert=<client-cert>,client_key=<client-key>,trusted_ca=<trusted-ca>"
```

To add a participating cluster to an existing Active-Active database, use [`crdb-cli crdb add-instance`]({{<relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/add-instance">}}). Its `--instance` option accepts the same fields as `crdb-cli crdb create`:

```sh
crdb-cli crdb add-instance \
  --crdb-guid <crdb-guid> \
  --instance "fqdn=cluster3.local,client_cert=<client-cert>,client_key=<client-key>,trusted_ca=<trusted-ca>"
```

To switch an existing participating cluster from a username and password to certificate credentials, use [`crdb-cli crdb update`]({{<relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/update">}}) with the instance's `id`:

```sh
crdb-cli crdb update \
  --crdb-guid <crdb-guid> \
  --credentials "id=2,client_cert=<client-cert>,client_key=<client-key>,trusted_ca=<trusted-ca>"
```

## Certificate-based authentication for databases

### Set up certificate-based authentication for databases

To set up certificate-based authentication for databases:

1. Enable mutual TLS for the relevant databases. See [Enable TLS]({{<relref "/operate/rs/security/encryption/tls/enable-tls">}}) for detailed instructions.

1. When you [create new users]({{<relref "/operate/rs/references/rest-api/requests/users#post-user">}}), include `"auth_method": "certificate"` and `certificate_subject_line` in the request body:

    ```sh
    POST /v1/users
    {
      "auth_method": "certificate",
      "certificate_subject_line": "CN=<Common Name>,OU=<Organizational Unit>,O=<Organization>,L=<Locality>,ST=<State/Province>,C=<Country>"
    }
    ```

    Replace the placeholder values `<>` with your client certificate's subject values.

    {{<note>}}
The `certificate_subject_line` must:

- Follow [RFC 2253](https://www.rfc-editor.org/rfc/rfc2253) format.

- List the attributes in reverse order, starting with the Common Name (`CN`).

- Not contain spaces after the commas that separate attributes.

- Exactly match the certificate's RFC 2253 subject.

- Contain only one Organizational Unit (`OU`) value.
    {{</note>}}

### Authenticate database connections

To connect to a database with certificate-based authentication, you must provide a client certificate, signed by a trusted CA, and a private key. The client certificate must either be one you previously added to the database to [enable mutual TLS]({{<relref "/operate/rs/security/encryption/tls/enable-tls#enable-mutual-tls">}}) (`authentication_ssl_client_certs` in the REST API), or be signed by one of these certificates.

The following example shows how to connect to a Redis database with [`redis-cli`]({{<relref "/operate/rs/references/cli-utilities/redis-cli">}}):

```sh
redis-cli -h <hostname-or-IP-address> -p <port> --tls --cacert <redis_cert>.pem --cert redis_user.crt --key redis_user_private.key
```

## Limitations

- Certificate-based authentication is not implemented for the Cluster Manager UI.
