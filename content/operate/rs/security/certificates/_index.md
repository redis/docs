---
Title: Certificates
alwaysopen: false
categories:
- docs
- operate
- rs
description: An overview of certificates in Redis Enterprise Software.
hideListLinks: true
linkTitle: Certificates
weight: 60
---

Redis Enterprise Software uses self-signed certificates by default to ensure that the product is secure. If using a self-signed certificate is not the right solution for you, you can import a certificate signed by a certificate authority of your choice.

Here's the list of self-signed certificates that create secure, encrypted connections to your Redis Enterprise cluster:

| Certificate name | Description |
|------------------|-------------|
| `api` | Encrypts [REST API]({{< relref "/operate/rs/references/rest-api/" >}}) requests and responses. |
| `cm` | Secures connections to the Redis Enterprise Cluster Manager UI. |
| `ldap_client` | Secures connections between LDAP clients and LDAP servers. |
| `metrics_exporter` | Sends Redis Enterprise metrics to external [monitoring tools]({{< relref "/operate/rs/monitoring/" >}}) over a secure connection. |
| `mtls_trusted_ca` | Required to enable certificate-based authentication for secure, passwordless access to the REST API. |
| `proxy` | Creates secure, encrypted connections between clients and databases. |
| `syncer` | For [Active-Active]({{< relref "/operate/rs/databases/active-active/" >}}) or [Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of/" >}}) databases, encrypts data during the synchronization of participating clusters. |

These self-signed certificates, excluding `ldap_client` and `mtls_trusted_ca`, are generated on the first node of each Redis Enterprise Software installation and are copied to all other nodes added to the cluster.

When you use the default self-signed certificates and you connect to the Cluster Manager UI over a web browser, you'll see an untrusted connection notification.

Depending on your browser, you can allow the connection for each session or add an exception to trust the certificate for all future sessions.