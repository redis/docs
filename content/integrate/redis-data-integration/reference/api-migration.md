---
Title: Migrate from RDI API v1 to v2
aliases:
  - /integrate/redis-data-integration/ingest/reference/api-migration/
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Migrate RDI API clients from API v1 to API v2
group: di
linkTitle: API migration
summary: Migrate existing RDI API clients from the deprecated API v1 to API v2.
type: integration
weight: 61
---

RDI API v1 is deprecated as of RDI 1.19.0. Existing v1 endpoints remain available for backward compatibility, but Redis recommends moving all integrations to API v2. API v1 will not be extended with new RDI features and may be removed in a future RDI version. See the [RDI API reference]({{< relref "/integrate/redis-data-integration/reference/api-reference" >}}) for the current request and response schemas.

## What changes in API v2

API v2 uses the pipeline resource to represent the current state of a pipeline. Operations update that resource and return its current state, so applications no longer need to poll a separate action ID. API v2 scopes related operations under a pipeline name in the request path.

{{< note >}}
RDI 1.19.0 supports only one pipeline, which must be named `default`. Support for other pipeline names will be added in a future version.
{{< /note >}}

The API version is part of the URL. Update `/api/v1` requests to use `/api/v2` where a corresponding v2 endpoint is available. Review the request and response models as well, because they can differ between versions.

## Endpoint mapping

| API v1 | API v2 |
| --- | --- |
| `GET /api/v1/pipelines` | `GET /api/v2/pipelines` |
| `POST /api/v1/pipelines` | `POST /api/v2/pipelines` |
| `PATCH /api/v1/pipelines` | `PATCH /api/v2/pipelines/{name}` |
| `GET /api/v1/status` | `GET /api/v2/pipelines/{name}/status` |
| `POST /api/v1/pipelines/start` | `POST /api/v2/pipelines/{name}/start` |
| `POST /api/v1/pipelines/stop` | `POST /api/v2/pipelines/{name}/stop` |
| `POST /api/v1/pipelines/reset` | `POST /api/v2/pipelines/{name}/reset` |
| `GET /api/v1/monitoring/statistics` | `GET /api/v2/pipelines/{name}/metric-collections/{collection_name}` |
| `GET /api/v1/pipelines/config/schemas` | `GET /api/v2/schemas/config` |
| `GET /api/v1/pipelines/config/templates/ingest/{db_type}` | `GET /api/v2/config-templates/{name}` |
| `GET /api/v1/pipelines/jobs/functions` | `GET /api/v2/functions` |
| `GET /api/v1/pipelines/jobs/schemas` | `GET /api/v2/schemas/jobs` |
| `GET /api/v1/pipelines/jobs/templates/ingest` | `GET /api/v2/job-templates/{name}` |
| `PUT /api/v1/pipelines/sources` and source subresources | `PATCH /api/v2/pipelines/{name}` with `sources` in the payload |
| `PUT /api/v1/pipelines/targets` and target subresources | `PATCH /api/v2/pipelines/{name}` with `targets` in the payload |
| `PUT /api/v1/pipelines/processors` and `PUT /api/v1/pipelines/processors/{prop}` | `PATCH /api/v2/pipelines/{name}` with `processors` in the payload |
| Secret provider endpoints | `POST`, `PUT`, or `DELETE /api/v2/pipelines/{name}/secrets[/{key}]` |
| Source metadata, schemas, databases, tables, and columns endpoints | `GET /api/v2/pipelines/{name}/source-schemas/{source_name}` with the appropriate filters |
| `POST /api/v1/pipelines/sources/dry-run` | `POST /api/v2/pipelines?dry_run=true` |
| `POST /api/v1/pipelines/targets/dry-run` | `POST /api/v2/pipelines?dry_run=true` |
| `POST /api/v1/pipelines/undeploy` | `DELETE /api/v2/pipelines/{name}` |
| `POST /api/v1/trace/start` | `POST /api/v2/pipelines/{name}/traces` |

API v2 also adds endpoints for DLQ inspection, target flushing, metric collections, and API information. See the generated [API reference]({{< relref "/integrate/redis-data-integration/reference/api-reference" >}}) for the complete list.

## v1 endpoints without a v2 equivalent

Most v1 endpoints have a v2 replacement. The following endpoints remain available under v1 because the current API v2 design does not define a corresponding endpoint:

| v1 endpoint | Notes |
| --- | --- |
| `GET /api/v1/me` | Returns the authenticated user. |
| `GET /api/v1/pipelines/strategies` | Returns pipeline strategies. |
| `POST /api/v1/login` | API v2 continues to use this endpoint for authentication. |

## Replace action polling with pipeline-status polling

In API v1, a pipeline operation returns an action ID. The client then repeatedly requests that action until it finishes:

```bash
# Start a pipeline with API v1
action=$(curl -sS -X POST "$RDI_URL/api/v1/pipelines/start" \
  -H "Authorization: Bearer $RDI_TOKEN" \
  | jq -r '.action_id')

# Poll the action until it completes
curl -sS "$RDI_URL/api/v1/actions/$action" \
  -H "Authorization: Bearer $RDI_TOKEN"
```

With API v2, include the pipeline name in the operation URL and read the pipeline status. The operation response contains the current pipeline state; if the pipeline is still changing, poll its status endpoint:

```bash
pipeline=default

# Start the pipeline with API v2
curl -sS -X POST "$RDI_URL/api/v2/pipelines/$pipeline/start" \
  -H "Authorization: Bearer $RDI_TOKEN"

# Poll the pipeline status while the operation is in progress
while true; do
  status=$(curl -sS "$RDI_URL/api/v2/pipelines/$pipeline/status" \
    -H "Authorization: Bearer $RDI_TOKEN")
  phase=$(printf '%s' "$status" | jq -r '.status')
  current=$(printf '%s' "$status" | jq -r '.current')
  printf '%s\n' "$status"

  case "$current:$phase" in
    true:started|true:error) break ;;
    *) sleep 2 ;;
  esac
done
```

For a stop operation, wait for `stopped` instead of `started`. For a reset, update, or create operation, wait for the corresponding successful state returned by the API. Only accept a terminal status when `current` is `true`; when it is `false`, the status is outdated and the client should continue polling. Always handle `error` as a failed operation. Use the status values documented by the API response for the operation you are performing; do not expect an action ID from API v2.

## Migration steps

1. Find the applications, scripts, and SDKs in your environment that use `/api/v1`.
2. Add the pipeline name to each v2 request. The only pipeline in 1.19.0 is always named `default`.
3. Check the pipeline response, or call `GET /api/v2/pipelines/{name}/status`, instead of polling an action ID.
4. Use `POST /api/v2/pipelines`, `PUT /api/v2/pipelines/{name}`, or `PATCH /api/v2/pipelines/{name}` to update source, target, processor, and secret-provider settings as needed. When using `PATCH`, omit the configuration sections that you do not want to change.
5. Use `GET /api/v2/pipelines/{name}/metric-collections/{collection_name}` for monitoring and `GET /api/v2/pipelines/{name}/source-schemas/{source_name}` for source metadata.
6. Test creating, updating, validating, starting, stopping, resetting, and deleting a pipeline on a non-production RDI 1.19.0 or later installation before updating production applications.

Authentication and the API base URL do not change. The migration requires updates to the endpoint paths, pipeline scoping, request models, and operation status handling.
