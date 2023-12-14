---
Title: Update cluster certificate requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Update cluster certificate requests
headerRange: '[1-2]'
linkTitle: update_cert
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [PUT](#put-cluster-update_cert) | `/v1/cluster/update_cert` | Update a cluster certificate |

## Update cluster certificate {#put-cluster-update_cert}

```sh
PUT /v1/cluster/update_cert
```

Replaces an existing certificate on all nodes within the cluster with a new certificate. The new certificate must pass validation before it can replace the old certificate.

See the [certificates table]({{< relref "/operate/rs/security/certificates" >}}) for the list of cluster certificates and their descriptions.

### Request {#put-request}

#### Example HTTP request

```sh
PUT /cluster/update_cert
```

#### Example JSON body

```json
{
    "name": "certificate1",
    "key": "-----BEGIN RSA PRIVATE KEY-----\n[key_content]\n-----END RSA PRIVATE KEY-----",
    "certificate": "-----BEGIN CERTIFICATE-----\n[cert_content]\n-----END CERTIFICATE-----",
}
```

Replace `[key_content]` with the content of the private key and `[cert_content]` with the content of the certificate.

### Response {#put-response}

Responds with the `200 OK` status code if the certificate replacement succeeds across the entire cluster.

Otherwise, retry the certificate update in case the failure was due to a temporary issue in the cluster.

### Status codes {#put-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Failed, invalid certificate. |
| [403 Forbidden](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4) | Failed, unknown certificate. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Failed, invalid certificate. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Failed, expired certificate. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Failed, not all nodes have been updated. |
