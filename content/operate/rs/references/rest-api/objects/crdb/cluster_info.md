---
Title: CRDB cluster info object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents Active-Active cluster info
linkTitle: cluster_info
weight: $weight
---

Configuration details for a cluster that is part of an Active-Active database.

| Name | Type/Value | Description |
|------|------------|-------------|
| certificate_auth | {{<code>}}
{
  "client_cert": string,
  "client_key": string,
  "trusted_ca": string
} {{</code>}} | Certificate credentials for cluster access, as PEM strings. Required unless you use `credentials`; a request that includes both for the same cluster fails.<br />**client_cert**: Client certificate (required)<br />**client_key**: Client certificate's private key (required)<br />**trusted_ca**: CA that validates the API certificate the peer cluster presents. If omitted, the cluster uses the certificates in its `mtls_trusted_ca.pem` file.<br /><br />See [Certificate-based authentication for cluster management]({{<relref "/operate/rs/security/certificates/certificate-based-authentication#certificate-based-authentication-for-cluster-management">}}). |
| credentials | {{<code>}}
{
  "username": string,
  "password": string
} {{</code>}} | Cluster access credentials. Required unless you use `certificate_auth`; a request that includes both for the same cluster fails. |
| name | string | Cluster fully qualified name, used to uniquely identify the cluster. Typically this is the same as the hostname used in the URL, although in some configruations the URL may point to a different name/address. (required) |
| replication_endpoint | string | Address to use for peer replication. If not specified, it is assumed that standard cluster naming conventions apply. |
| replication_tls_sni | string | Cluster SNI for TLS connections |
| url | string | Cluster access URL (required) |
