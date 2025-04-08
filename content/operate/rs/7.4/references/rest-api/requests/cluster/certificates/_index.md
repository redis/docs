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
aliases: 
    - /operate/rs/references/rest-api/requests/cluster/update-cert
url: '/operate/rs/7.4/references/rest-api/requests/cluster/certificates/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster-certificates) | `/v1/cluster/certificates` | Get cluster certificates |
| [PUT](#put-cluster-update_cert) | `/v1/cluster/update_cert` | Update a cluster certificate |
| [DELETE](#delete-cluster-certificate) | `/v1/cluster/certificates/{certificate_name}` | Delete cluster certificate |

## Get cluster certificates {#get-cluster-certificates}

	GET /v1/cluster/certificates

Get the cluster's certificates.

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_info]({{< relref "/operate/rs/7.4/references/rest-api/permissions#view_cluster_info" >}}) |

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
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |


## Update cluster certificate {#put-cluster-update_cert}

```sh
PUT /v1/cluster/update_cert
```

Replaces an existing certificate on all nodes within the cluster with a new certificate. The new certificate must pass validation before it can replace the old certificate.

See the [certificates table]({{< relref "/operate/rs/7.4/security/certificates" >}}) for the list of cluster certificates and their descriptions.

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
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Failed, invalid certificate. |
| [403 Forbidden](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4) | Failed, unknown certificate. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Failed, invalid certificate. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Failed, expired certificate. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Failed, not all nodes have been updated. |


## Delete cluster certificate {#delete-cluster-certificate}

	DELETE /v1/cluster/certificates/{string: certificate_name}

Removes the specified cluster certificate from both CCS and disk
across all nodes. Only optional certificates can be deleted through
this endpoint. See the [certificates table]({{< relref "/operate/rs/7.4/security/certificates" >}}) for the list of cluster certificates and their descriptions.

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
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Operation successful |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Failed, requested deletion of an unknown certificate |
| [403 Forbidden](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4) | Failed, requested deletion of a required certificate |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Failed, error while deleting certificate from disk |
