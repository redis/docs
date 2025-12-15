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

You can set up certificate-based authentication for specific users to enable secure, passwordless access to the Redis Enterprise Software [REST API]({{<relref "/operate/rs/references/rest-api">}}) and databases.

## Set up certificate-based authentication

To set up certificate-based authentication:

1. [Add the `mtls_trusted_ca` certificate.](#add-cert) 

1. [Configure cluster settings.](#config-cluster)

1. If you want to enable certificate-based authentication for databases, you must [enable mutual TLS for the relevant databases](#enable-mtls-dbs). Otherwise, you can skip this step.

1. [Create certificate auth_method users.](#create-cert-users)

### Add mtls_trusted_ca certificate {#add-cert}

To add a trusted CA certificate `mtls_trusted_ca` to the cluster, use an [update cluster certificates]({{<relref "/operate/rs/references/rest-api/requests/cluster/certificates">}}) request.

For Redis Enterprise Software versions 7.22.2 and later, use:

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

For Redis Enterprise Software versions 7.22.0 and earlier, use:

```sh
PUT /v1/cluster/update_cert
{
  "name": "mtls_trusted_ca",
  "certificate": "<content of certificate PEM file>"
}
```

### Configure cluster settings {#config-cluster}

[Update cluster settings]({{<relref "/operate/rs/references/rest-api/requests/cluster#put-cluster">}}) with mutual TLS (mTLS) configuration using one of the following options:

- [Enable mTLS without subject validation](#enable-mtls-without-subject-validation).

- [Enable mTLS with SAN validation](#enable-mtls-with-san-validation).

- [Enable mTLS with Full Subject Name validation](#enable-mtls-with-full-subject-name-validation).

#### Enable mTLS without subject validation

Additional certificate validation is optional. To enable mutual TLS without subject validation, use:

```sh
PUT /v1/cluster
{
  "mtls_certificate_authentication": true,
  "mtls_client_cert_subject_validation_type": "disabled"
}
```

#### Enable mTLS with SAN validation

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

#### Enable mTLS with Full Subject Name validation

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

#### Example certificate and mTLS settings

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

### Enable mutual TLS for databases {#enable-mtls-dbs}

Before you can connect to a database using certificate-based authentication, you must enable mutual TLS (mTLS). See [Enable TLS]({{<relref "/operate/rs/security/encryption/tls/enable-tls">}}) for detailed instructions.

### Create certificate auth_method users {#create-cert-users}

When you [create new users]({{<relref "/operate/rs/references/rest-api/requests/users#post-user">}}), include `"auth_method": "certificate"` and `certificate_subject_line` in the request body :

```sh
POST /v1/users
{
  "auth_method": "certificate",
  "certificate_subject_line": "CN=<Common Name>, OU=<Organization Unit>, O=<Organization>, L=<Locality>, ST=<State/Province>, C=<Country>"
}
```

Replace the placeholder values `<>` with your client certificate's subject values.

## Authenticate REST API requests

To use the REST API with certificate-based authentication, you must provide a client certificate, signed by the trusted CA `mtls_trusted_ca`, and a private key.

The following example uses [cURL](https://curl.se/) to send a [REST API request]({{<relref "/operate/rs/references/rest-api/requests">}}):

```sh
curl --request <METHOD> --url https://<hostname-or-IP-address>:9443/<API-version>/<API-path> --cert client.pem --key client.key
```

## Authenticate database connections

To connect to a database with certificate-based authentication, you must provide a client certificate, signed by the trusted CA `mtls_trusted_ca`, and a private key.

The following example shows how to connect to a Redis database with [`redis-cli`]({{<relref "/operate/rs/references/cli-utilities/redis-cli">}}):

```sh
redis-cli -h <hostname-or-IP-address> -p <port> --tls --cacert <redis_cert>.pem --cert redis_user.crt --key redis_user_private.key
```

## Limitations

- Certificate-based authentication is not implemented for the Cluster Manager UI.