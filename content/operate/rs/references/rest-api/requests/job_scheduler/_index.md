---
Title: Job scheduler requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests for the job scheduler
headerRange: '[1-2]'
hideListLinks: true
linkTitle: job_scheduler
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-job-scheduler) | `/v1/job_scheduler` | Get job scheduler settings |
| [PUT](#put-job-scheduler) | `/v1/job_scheduler` | Update job scheduler settings |

## Get job scheduler settings {#get-job-scheduler}

```sh
GET /v1/job_scheduler
```

Get job scheduler information.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/job_scheduler
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response}

Returns a [job_scheduler object]({{<relref "/operate/rs/references/rest-api/objects/job_scheduler">}}).

#### Example JSON body

```json
{
   "backup_job_settings": {
     "cron_expression": "0 * * * *",
     "enabled": true
   },
   "redis_cleanup_job_settings": {
     "cron_expression": "0 * * * *",
     "enabled": true
   },
   "rotate_ccs_job_settings": {
     "cron_expression": "*/5 * * * *",
     "file_suffix": "5min",
     "rotate_max_num": 24,
     "enabled": true
   },
   "node_checks_job_settings": {
     "cron_expression": "*/5 * * * *",
     "enabled": false
   }
}
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |

## Update job scheduler settings {#put-job-scheduler}

```sh
PUT /v1/job_scheduler
```

Update job scheduler settings.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) | admin |

### Request {#put-request}

#### Example HTTP request

```sh
PUT /v1/job_scheduler
```

#### Example JSON body

```json
{
   "backup_job_settings": {
     "cron_expression": "5 * * * *"
   }
}
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Body

Include a [job_scheduler object]({{<relref "/operate/rs/references/rest-api/objects/job_scheduler">}}) with updated fields in the request body.

### Response {#put-response}

Returns a [job_scheduler object]({{<relref "/operate/rs/references/rest-api/objects/job_scheduler">}}) with the updated fields.

#### Example JSON body

```json
{
   "backup_job_settings": {
     "cron_expression": "5 * * * *",
     "enabled": false,
   },
   "redis_cleanup_job_settings": {
     "cron_expression": "0 * * * *"
   },
   "rotate_ccs_job_settings": {
     "cron_expression": "*/5 * * * *",
     "file_suffix": "5min",
     "rotate_max_num": 24
   },
   "node_checks_job_settings": {
     "cron_expression": "*/5 * * * *",
     "enabled": true,
   }
}
```

#### Status codes {#put-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Bad content provided. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Attempting to configure the job_scheduler while it is busy with another configuration change. In this context, this is a temporary condition and the request should be re-attempted later. |
