---
Title: Services requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests to list or modify Redis Enterprise services.
headerRange: '[1-2]'
hideListLinks: true
linkTitle: services
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/services/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-local-services) | `/v1/local/services` | List Redis Enterprise services on the local node |
| [POST](#post-local-services) | `/v1/local/services` | Modify or perform operations on local processes |
| [POST](#post-services) | `/v1/services` | Apply cluster-wide changes to services |

{{<warning>}}
This API is dangerous and should only be run with guidance from [Redis support](https://redis.io/support/).

Stop, start, or restart optional services only. Changing the status of required services can negatively affect cluster behavior and cause a complete loss of the cluster and its data.

For a list of optional services, see the [services configuration object reference]({{<relref "/operate/rs/7.8/references/rest-api/objects/services_configuration">}}) or use a [`GET /v1/cluster/services_configuration`]({{<relref "/operate/rs/7.8/references/rest-api/requests/cluster/services_configuration#get-cluster-services_config">}}) request.
{{</warning>}}

## Get local services {#get-local-services}

```sh
GET /v1/local/services
```

Lists all Redis Enterprise services currently running on the local node and relevant metadata.

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/local/services
```


#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


### Response {#get-response}

Returns a JSON object that describes all Redis Enterprise services currently running on the local node and relevant metadata.

Possible `status` values: 
- RESTARTING
- RUNNING
- STARTING
- STOPPED

#### Example JSON response body

```json
{
    "alert_mgr": {
        "start_time": "2024-05-13T18:38:00Z",
        "status": "RUNNING",
        "uptime": "3 days, 0:58:59"
    },
    "ccs": {
        "start_time": "2024-05-13T18:38:59Z",
        "status": "RUNNING",
        "uptime": "3 days, 0:58:00"
    },
    ...
}
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |

## Modify local services {#post-local-services}

```sh
POST /v1/local/services
```

Modify Redis Enterprise services or perform operations that directly interact with processes. For cluster-wide changes that are not node-specific, use [`POST /v1/services`](#post-services) instead.

Supported `operation_type` values:

- stop
- start
- restart

{{<warning>}}
This API is dangerous and should only be run with guidance from [Redis support](https://redis.io/support/).

Stop, start, or restart optional services only. Changing the status of required services can negatively affect cluster behavior and cause a complete loss of the cluster and its data.

For a list of optional services, see the [services configuration object reference]({{<relref "/operate/rs/7.8/references/rest-api/objects/services_configuration">}}) or use a [`GET /v1/cluster/services_configuration`]({{<relref "/operate/rs/7.8/references/rest-api/requests/cluster/services_configuration#get-cluster-services_config">}}) request.
{{</warning>}}

### Request {#post-local-request}

#### Example HTTP request

```sh
POST /v1/local/services
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Example JSON request body

```json
{
  "operation_type": "restart",
  "services": [
    "alert_mgr"
  ]
}
```

### Response {#post-local-response}

Returns a JSON object that shows whether the operation ran successfully or failed for each requested service.

#### Example JSON response body

```json
{
    "alert_mgr": true,
    "metrics_exporter": true
}
```


#### Status codes {#post-local-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |

## Apply cluster-wide service changes {#post-services}

```sh
POST /v1/services
```

Makes cluster-wide changes that are not node-specific on Redis Enterprise services. The master node handles these changes. For operations that directly interact with processes, use [`POST /v1/local/services`](#post-local-services) instead.

Supported `operation_type` values:

- stop
- start
- restart

{{<warning>}}
This API is dangerous and should only be run with guidance from [Redis support](https://redis.io/support/).

Stop, start, or restart optional services only. Changing the status of required services can negatively affect cluster behavior and cause a complete loss of the cluster and its data.

For a list of optional services, see the [services configuration object reference]({{<relref "/operate/rs/7.8/references/rest-api/objects/services_configuration">}}) or use a [`GET /v1/cluster/services_configuration`]({{<relref "/operate/rs/7.8/references/rest-api/requests/cluster/services_configuration#get-cluster-services_config">}}) request.
{{</warning>}}

### Request {#post-request}

#### Example HTTP request

```sh
POST /v1/services
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Example JSON request body

```json
{
  "operation_type": "restart",
  "services": [
    "alert_mgr"
  ]
}
```

### Response {#post-response}

Returns a JSON object that shows whether the operation ran successfully or failed for each requested service.

#### Example JSON response body

```json
{
    "alert_mgr": true,
    "metrics_exporter": true
}
```


#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |
