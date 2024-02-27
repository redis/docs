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

	GET /cluster/certificates 


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

## Delete cluster certificate {#delete-cluster-certificate}

	DELETE /v1/cluster/certificates/{string: certificate_name}

Removes the specified cluster certificate from both CCS and disk
across all nodes. Only optional certificates can be deleted through
this endpoint. See the [certificates table]({{< relref "/operate/rs/security/certificates" >}}) for the list of cluster certificates and their descriptions.

### Request {#delete-request} 

#### Example HTTP request

	DELETE /cluster/certificates/<certificate_name>


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
