---
Title: Storage Metrics
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Metrics emitted by every Korvet storage tier under the korvet.storage.*
  namespace.
linkTitle: Storage
weight: 50
---

These metrics are emitted by every Korvet storage tier under the
`korvet.storage.*` namespace. Each verb (`read`, `write`, `ack`)
is recorded once per call and tagged with `tier=local|remote`, so the same
dashboard query works across the local Redis tier and the remote
Iceberg tier. The `read` timer additionally carries `mode=stream|group` to
distinguish standalone reads from consumer-group reads.

## Cross-Tier Verbs

### Ack

Storage acknowledgement latency.

**Name**: `korvet.storage.ack` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `result` | Operation outcome (e.g. `success`, `empty`, `error`, `timeout`). |
| `tier` | Storage tier ( `local` or `remote`). |

### Archive

Remote segment archive latency for offload attempts from local Redis segments to the remote tier.

**Name**: `korvet.storage.archive` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `result` | Operation outcome (e.g. `success`, `empty`, `error`, `timeout`). |
| `tier` | Storage tier ( `local` or `remote`). |

### Archive Bytes

Remote bytes archived successfully.

**Name**: `korvet.storage.archive.bytes` \
**Type**: `counter` \
**Base unit**: `bytes`

**Tags**

| Key | Description |
|---|---|
| `tier` | Storage tier ( `local` or `remote`). |

### Archive Failures

Remote segment archive failures by exception type.

**Name**: `korvet.storage.archive.failures` \
**Type**: `counter`

**Tags**

| Key | Description |
|---|---|
| `error_type` | Exception class simple name, or `none`. |
| `tier` | Storage tier ( `local` or `remote`). |

### Archive Lag Oldest

Age of the oldest sealed remote-enabled segment waiting for archive.

**Name**: `korvet.storage.archive.lag.oldest` \
**Type**: `gauge` \
**Base unit**: `seconds`

### Archive Lag Segments

Sealed remote-enabled segments waiting for archive.

**Name**: `korvet.storage.archive.lag.segments` \
**Type**: `gauge` \
**Base unit**: `segments`

### Archive Segments

Remote segments archived successfully.

**Name**: `korvet.storage.archive.segments` \
**Type**: `counter` \
**Base unit**: `segments`

**Tags**

| Key | Description |
|---|---|
| `tier` | Storage tier ( `local` or `remote`). |

### Read

Storage read latency. Tagged by `mode=stream|group` to distinguish direct stream reads from consumer-group reads (XREADGROUP, pending claims, autoclaim).

**Name**: `korvet.storage.read` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `mode` | Read mode ( `stream` for direct stream reads, `group` for consumer-group reads). |
| `result` | Operation outcome (e.g. `success`, `empty`, `error`, `timeout`). |
| `tier` | Storage tier ( `local` or `remote`). |

### Read Messages

Messages returned per read call. Tagged by `mode=stream|group`.

**Name**: `korvet.storage.read.messages` \
**Type**: `distribution summary` \
**Base unit**: `messages`

**Tags**

| Key | Description |
|---|---|
| `mode` | Read mode ( `stream` for direct stream reads, `group` for consumer-group reads). |
| `tier` | Storage tier ( `local` or `remote`). |

### Write

Storage write latency (writes, deletes, group admin).

**Name**: `korvet.storage.write` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `result` | Operation outcome (e.g. `success`, `empty`, `error`, `timeout`). |
| `tier` | Storage tier ( `local` or `remote`). |

### Write Messages

Messages written per write call.

**Name**: `korvet.storage.write.messages` \
**Type**: `distribution summary` \
**Base unit**: `messages`

**Tags**

| Key | Description |
|---|---|
| `tier` | Storage tier ( `local` or `remote`). |

## Local Tier (Redis)

### Pool Acquire

Local Redis pool acquisition latency by result.

**Name**: `korvet.storage.local.pool.acquire` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `result` | Pool acquisition outcome ( `success`, `timeout`, `error`). |

### Pool Pending

Current number of pending waiters on the local Redis connection pool.

**Name**: `korvet.storage.local.pool.pending` \
**Type**: `gauge`

## Remote Tier (Iceberg And S3)

Remote-tier reads and writes flow through the shared cross-tier verbs above
with `tier=remote`. The cold tier also emits Iceberg scan/commit reports
and S3 SDK call metrics when `korvet.storage.remote.metrics.enabled=true`
and a Micrometer registry is available.

### Commit Added Files

Number of Iceberg data files added by each cold-tier commit.

**Name**: `iceberg.commit.added.files` \
**Type**: `distribution summary` \
**Base unit**: `files`

**Tags**

| Key | Description |
|---|---|
| `operation` | Iceberg operation, such as `scan`, `append`, or `delete`. |
| `table` | Fully qualified Iceberg table name. |

### Commit Added Records

Number of records added by each Iceberg cold-tier commit.

**Name**: `iceberg.commit.added.records` \
**Type**: `distribution summary` \
**Base unit**: `records`

**Tags**

| Key | Description |
|---|---|
| `operation` | Iceberg operation, such as `scan`, `append`, or `delete`. |
| `table` | Fully qualified Iceberg table name. |

### Commit Attempts

Number of attempts Iceberg needed for each cold-tier commit.

**Name**: `iceberg.commit.attempts` \
**Type**: `distribution summary` \
**Base unit**: `attempts`

**Tags**

| Key | Description |
|---|---|
| `operation` | Iceberg operation, such as `scan`, `append`, or `delete`. |
| `table` | Fully qualified Iceberg table name. |

### Commit Duration

Time spent committing Iceberg metadata changes for cold-tier writes and deletes.

**Name**: `iceberg.commit.duration` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `operation` | Iceberg operation, such as `scan`, `append`, or `delete`. |
| `table` | Fully qualified Iceberg table name. |

### Commit Removed Files

Number of Iceberg data files removed by each cold-tier commit.

**Name**: `iceberg.commit.removed.files` \
**Type**: `distribution summary` \
**Base unit**: `files`

**Tags**

| Key | Description |
|---|---|
| `operation` | Iceberg operation, such as `scan`, `append`, or `delete`. |
| `table` | Fully qualified Iceberg table name. |

### S3 Api Call Count

AWS SDK S3 API call count tagged by operation and error outcome.

**Name**: `aws.s3.api.call.count` \
**Type**: `counter`

**Tags**

| Key | Description |
|---|---|
| `error` | Whether the AWS SDK call ended with an error. |
| `operation` | AWS SDK operation name. |

### S3 Api Call Duration

AWS SDK S3 API call duration for object-store operations issued by Iceberg.

**Name**: `aws.s3.api.call.duration` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `operation` | AWS SDK operation name. |

### S3 Api Call Retry Count

AWS SDK retry count for S3 API calls issued by Iceberg.

**Name**: `aws.s3.api.call.retry.count` \
**Type**: `counter`

**Tags**

| Key | Description |
|---|---|
| `operation` | AWS SDK operation name. |

### S3 Http Client Acquire Duration

Time the AWS SDK S3 HTTP client spent acquiring concurrency for a request.

**Name**: `aws.s3.http.client.acquire.duration` \
**Type**: `timer` \
**Base unit**: `seconds`

### Scan Bytes Scanned

Bytes in data files included in each Iceberg cold-tier scan result.

**Name**: `iceberg.scan.bytes.scanned` \
**Type**: `distribution summary` \
**Base unit**: `bytes`

**Tags**

| Key | Description |
|---|---|
| `operation` | Iceberg operation, such as `scan`, `append`, or `delete`. |
| `table` | Fully qualified Iceberg table name. |

### Scan Files Scanned

Number of data files included in each Iceberg cold-tier scan result.

**Name**: `iceberg.scan.files.scanned` \
**Type**: `distribution summary` \
**Base unit**: `files`

**Tags**

| Key | Description |
|---|---|
| `operation` | Iceberg operation, such as `scan`, `append`, or `delete`. |
| `table` | Fully qualified Iceberg table name. |

### Scan Files Skipped

Number of data files skipped by each Iceberg cold-tier scan.

**Name**: `iceberg.scan.files.skipped` \
**Type**: `distribution summary` \
**Base unit**: `files`

**Tags**

| Key | Description |
|---|---|
| `operation` | Iceberg operation, such as `scan`, `append`, or `delete`. |
| `table` | Fully qualified Iceberg table name. |

### Scan Planning Duration

Time spent by Iceberg planning a scan against the cold tier.

**Name**: `iceberg.scan.planning.duration` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `operation` | Iceberg operation, such as `scan`, `append`, or `delete`. |
| `table` | Fully qualified Iceberg table name. |

See [Storage Worker Metrics]({{< relref "/integrate/korvet/reference/metrics/storage-worker" >}}) for
offload and retention activity against the remote tier.
