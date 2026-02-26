---
Title: Import database action requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Import database requests
headerRange: '[1-2]'
linkTitle: import
weight: $weight
url: '/operate/rs/7.22/references/rest-api/requests/bdbs/actions/import/'
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-bdbs-actions-import) | `/v1/bdbs/{uid}/actions/import` | Initiate manual dataset import |

## Initiate manual dataset import {#post-bdbs-actions-import}

```sh
POST /v1/bdbs/{int: uid}/actions/import
```

Initiate a manual import process.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [start_bdb_import]({{< relref "/operate/rs/7.22/references/rest-api/permissions#start_bdb_import" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-request}

#### Example HTTP request

```sh
POST /v1/bdbs/1/actions/import
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |
| Content-Length | 0 | Length of the request body in octets |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database |

#### Body

The request _may_ contain a subset of the [BDB JSON object]({{< relref "/operate/rs/7.22/references/rest-api/objects/bdb" >}}), which includes the following import-related attributes:

| Field | Type | Description |
|-------|------|-------------|
| dataset_import_sources | array of [dataset_import_sources]({{< relref "/operate/rs/7.22/references/rest-api/objects/bdb/dataset_import_sources" >}}) objects | Details for the import sources. Call [`GET /v1/jsonschema`]({{< relref "/operate/rs/7.22/references/rest-api/requests/jsonschema#get-jsonschema" >}}) on the bdb object and review the `dataset_import_sources` field to retrieve the object's structure.  |
| email_notification | boolean | Enable/disable an email notification on import failure/ completion. (optional) |

{{<note>}}
Other attributes are not allowed and will cause the request to fail.
{{</note>}}

##### Example JSON body

General example:

```json
{
    "dataset_import_sources": [
        {
            "type": "url",
            "url": "http://..."
        },
        {
            "type": "url",
            "url": "redis://..."
        }
    ],
    "email_notification": true
}
```

This request initiates an import process using `dataset_import_sources` values that were previously configured for the database.

FTP example:

```json
{
  "dataset_import_sources": [
    {
      "type": "url",
      "url": "ftp://<ftp_user>:<ftp_password>@example.com/<path>/<filename>.rdb.gz"
    }
  ]
}
```

SFTP example:

```json
{
  "dataset_import_sources": [
    {
      "type": "sftp",
      "sftp_url": "sftp://<sftp_user>@example.com/<path>/<filename>.rdb"
    }
  ]
}
```

AWS S3 example:

```json
{
  "dataset_import_sources": [
    {
      "type": "s3",
      "bucket_name": "backups",
      "subdir": "test-db",
      "filename": "<filename>.rdb",
      "access_key_id": "XXXXXXXXXXXXX",
      "secret_access_key": "XXXXXXXXXXXXXXXX"
    }
  ]
}
```

Google Cloud Storage example:

```json
{
  "dataset_import_sources": [
    {
      "type": "gs",
      "bucket_name": "backups",
      "client_id": "XXXXXXXX",
      "client_email": "cloud-storage-client@my-project-id.iam.gserviceaccount.com",
      "subdir": "test-db",
      "filename": "<filename>.rdb",
      "private_key_id": "XXXXXXXXXXXXX",
      "private_key": "XXXXXXXXXXXXXXXX"
    }
  ]
}
```

Azure Blob Storage example:

```json
{
  "dataset_import_sources": [
    {
      "type": "abs",
      "container": "backups",
      "subdir": "test-db",
      "filename": "<filename>.rdb",
      "account_name": "name",
      "account_key": "XXXXXXXXXXXXXXXX" // Or you can use "sas_token": "XXXXXXXXXXXXXXXXXX" instead
    }
  ]
}
```

### Response {#post-response}

Returns a status code.

### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The request is accepted and is being processed. In order to monitor progress, the `import_status`, `import_progress`, and `import_failure_reason` attributes can be consulted. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to perform an action on a nonexistent database. |
| [406&nbsp;Not&nbsp;Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Not all the modules loaded to the database support 'backup_restore' capability. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Database is currently busy with another action. In this context, this is a temporary condition and the request should be reattempted later. |
