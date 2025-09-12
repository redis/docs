---
Title: Cluster certificates requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Cluster certificates requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: certificates
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster-certificates) | `/v1/cluster/certificates` | Get cluster certificates |
| [PUT](#put-cluster-certificates) | `/v1/cluster/certificates` | Update cluster certificates |
| [PUT](#put-cluster-update_cert) | `/v1/cluster/update_cert` | Update a cluster certificate (deprecated as of Redis Enterprise Software version 7.22.2) |
| [DELETE](#delete-cluster-certificate) | `/v1/cluster/certificates/{certificate_name}` | Delete cluster certificate |

## Get cluster certificates {#get-cluster-certificates}

	GET /v1/cluster/certificates

Get the cluster's certificates.

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/cluster/certificates 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response} 

Returns a JSON object that contains the cluster's certificates and keys.

#### Example JSON body

```json
{
    "api_cert": "-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----",
    "api_key": "-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----"
    "// additional certificates..."
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |


## Update cluster certificates {#put-cluster-certificates}

```sh
PUT /v1/cluster/certificates
```

Replaces multiple cluster certificates with the provided certificates on all nodes within the cluster. This endpoint validates all provided certificates before actually updating the cluster.

See the [certificates table]({{< relref "/operate/rs/security/certificates" >}}) for the list of cluster certificates and their descriptions.

### Request {#put-certificates-request}

#### Example HTTP request

```sh
PUT /v1/cluster/certificates
```

#### Example JSON body

```json
{
  "certificates": [
    {
      "name": "proxy",
      "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
      "key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
    },
    {
      "name": "api",
      "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
      "key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
    }
  ]
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

Include an array of [certificate objects]({{<relref "/operate/rs/references/rest-api/objects/certificates">}}) in the request body.

### Response {#put-certificates-response}

Returns a `200 OK` status code if all certificates are successfully replaced across the entire cluster.

If the response returns a failed status code, you should retry updating the certificates in case the cluster is no longer in an optimal state.

### Status codes {#put-certificates-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Failed, invalid certificate(s) |
| [403 Forbidden](https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden) | Failed, unknown certificate(s) |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Failed, expired certificate(s) |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Failed, not all nodes have been updated |

## Update cluster certificate {#put-cluster-update_cert}

```sh
PUT /v1/cluster/update_cert
```

{{<note>}}
This REST API path is deprecated as of Redis Enterprise Software 7.22.2 and will be removed in a future version. Use [`PUT /v1/cluster/certificates`](#put-cluster-certificates) instead.
{{</note>}}

Replaces an existing certificate on all nodes within the cluster with a new certificate. The new certificate must pass validation before it can replace the old certificate.

See the [certificates table]({{< relref "/operate/rs/security/certificates" >}}) for the list of cluster certificates and their descriptions.

### Request {#put-request}

#### Example HTTP request

```sh
PUT /v1/cluster/update_cert
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
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Failed, invalid certificate. |
| [403 Forbidden](https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden) | Failed, unknown certificate. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Failed, invalid certificate. |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Failed, expired certificate. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Failed, not all nodes have been updated. |


## Delete cluster certificate {#delete-cluster-certificate}

	DELETE /v1/cluster/certificates/{string: certificate_name}

Removes the specified cluster certificate from both CCS and disk
across all nodes. Only optional certificates can be deleted through
this endpoint. See the [certificates table]({{< relref "/operate/rs/security/certificates" >}}) for the list of cluster certificates and their descriptions.

### Request {#delete-request} 

#### Example HTTP request

	DELETE /v1/cluster/certificates/<certificate_name>


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#delete-response} 

Returns a status code that indicates the certificate deletion success or failure.

### Status codes {#delete-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Operation successful |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Failed, requested deletion of an unknown certificate |
| [403 Forbidden](https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden) | Failed, requested deletion of a required certificate |
| [500 Internal Server Error](https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error) | Failed, error while deleting certificate from disk |
