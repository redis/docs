---
Title: License requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: License requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: license
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/license/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-license) | `/v1/license` | Get license details |
| [PUT](#put-license) | `/v1/license` | Update the license |

## Get license {#get-license}

	GET /v1/license

Returns the license details, including license string, expiration,
and supported features.

#### Required permissions

| Permission name |
|-----------------|
| [view_license]({{< relref "/operate/rs/7.8/references/rest-api/permissions#view_license" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/license 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response} 

Returns a JSON object that contains the license details:

| Name | Type/Value | Description |
|------|------------|-------------|
| license | string | License data |
| cluster_name | string | The cluster name (FQDN) |
| expired | boolean | If the cluster key is expired (`true` or `false`) |
| activation_date | string | The date of the cluster key activation |
| expiration_date | string | The date of the cluster key expiration |
| key | string | License key |
| features | array of strings | Features supported by the cluster |
| owner | string | License owner |
| shards_limit | integer | The total number of shards allowed by the cluster key |
| ram_shards_limit | integer | The number of RAM shards allowed by the cluster key (as of v7.2) |
| ram_shards_in_use | integer | The number of RAM shards in use |
| flash_shards_limit | integer | The number of flash shards (Auto Tiering) allowed by the cluster key (as of v7.2) |
| flash_shards_in_use | integer | The number of flash shards in use |

#### Example JSON body

```json
{
    "license": "----- LICENSE START -----\\ndi+iK...KniI9\\n----- LICENSE END -----\\n",
    "expired": true,
    "activation_date":"2018-12-31T00:00:00Z",
    "expiration_date":"2019-12-31T00:00:00Z",
    "ram_shards_in_use": 0,
    "ram_shards_limit": 300,
    "flash_shards_in_use": 0,
    "flash_shards_limit": 100,
    "shards_limit": 400,
    "features": ["bigstore"],
    "owner": "Redis",
    "cluster_name": "mycluster.local",
    "key": "----- LICENSE START -----\\ndi+iK...KniI9\\n----- LICENSE END -----\\n"
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | License is returned in the response body. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | No license is installed. |

## Update license {#put-license}

	PUT /v1/license

Validate and install a new license string.

If you do not provide a valid license, the cluster behaves as if the license was deleted. See [Expired cluster license]({{< relref "/operate/rs/7.8/clusters/configure/license-keys#expired-cluster-license" >}}) for a list of available actions and restrictions.

#### Required permissions

| Permission name |
|-----------------|
| [install_new_license]({{< relref "/operate/rs/7.8/references/rest-api/permissions#install_new_license" >}}) |

### Request {#put-request} 

The request must be a JSON object with a single key named "license".

#### Example HTTP request

	PUT /v1/license 

#### Example JSON body

```json
{
    "license": "----- LICENSE START -----\ndi+iK...KniI9\n----- LICENSE END -----\n"
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Accept | application/json | Accepted media type |


#### Request body

Include a JSON object that contains the new `license` string in the request body.

### Response {#put-response} 

Returns an error if the new license is not valid.

### Status codes {#put-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | License installed successfully. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Invalid request, either bad JSON object or corrupted license was supplied. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | License violation. A response body provides more details on the specific cause. |
