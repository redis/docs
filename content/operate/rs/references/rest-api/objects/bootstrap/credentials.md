---
Title: Credentials object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the credentials object used with Redis Software
  REST API calls.
linkTitle: credentials
weight: $weight
---

| Name | Type/Value | Description |
|------|------------|-------------|
| client_cert | string      | Client certificate as a PEM string. Use certificate credentials instead of a username and password to join a node to a cluster. Required with `client_key`. See [Certificate-based authentication for cluster management]({{<relref "/operate/rs/security/certificates/certificate-based-authentication#certificate-based-authentication-for-cluster-management">}}). |
| client_key | string       | The client certificate's private key as a PEM string. Required with `client_cert`. |
| password   | string       | Admin password. Required unless you use certificate credentials. |
| trusted_ca | string       | CA that validates the API certificate the cluster presents, as a PEM string. If you omit it, the cluster uses the certificates in its `mtls_trusted_ca.pem` file. |
| username   | string       | Admin username (pattern does not allow special characters &,\<,>,"). Required unless you use certificate credentials. |
