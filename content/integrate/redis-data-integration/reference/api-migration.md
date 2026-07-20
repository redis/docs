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

RDI API v1 is deprecated as of RDI 1.19.0. Existing v1 endpoints remain available for compatibility, but Redis recommends migrating all clients to API v2. Use the [RDI API reference]({{< relref "/integrate/redis-data-integration/reference/api-reference" >}}) for the current request and response schemas.

## What changes in API v2

API v2 uses the pipeline resource as the source of truth. Pipeline operations update that resource and return its current state instead of returning an action ID that clients must poll. API v2 also supports named pipelines and groups related operations under a pipeline path.

The API version is part of the URL. Change `/api/v1` to `/api/v2` only where an equivalent v2 endpoint exists; the request and response models can also differ.

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
| `PUT /api/v1/pipelines/sources` and source subresources | `PATCH /api/v2/pipelines/{name}` with `sources` in the payload |
| `PUT /api/v1/pipelines/targets` and target subresources | `PATCH /api/v2/pipelines/{name}` with `targets` in the payload |
| Secret provider endpoints | `POST`, `PUT`, or `DELETE /api/v2/pipelines/{name}/secrets[/{key}]` |
| Source metadata, schemas, databases, tables, and columns endpoints | `GET /api/v2/pipelines/{name}/source-schemas/{source_name}` with the appropriate filters |
| `POST /api/v1/pipelines/sources/dry-run` | `POST /api/v2/pipelines/{name}?dry_run=true` |
| `POST /api/v1/pipelines/targets/dry-run` | `POST /api/v2/pipelines/{name}?dry_run=true` |
| `GET /api/v1/actions/{action_id}` | No replacement. v2 operations return pipeline state; do not poll action IDs. |

API v2 also adds endpoints for DLQ inspection, target flushing, metric collections, and API information. See the generated [API reference]({{< relref "/integrate/redis-data-integration/reference/api-reference" >}}) for the complete list.

## Migration steps

1. Inventory clients that call `/api/v1`, including custom scripts and generated SDKs.
2. Add the pipeline name to v2 requests. The default installation pipeline is named `default` unless your installation uses another supported name.
3. Replace action polling with checks of the pipeline response or `GET /api/v2/pipelines/{name}/status`.
4. Combine source, target, processor, and secret-provider changes into the v2 pipeline request where appropriate. Preserve the existing configuration sections that are not being changed when using `PATCH`.
5. Replace v1 monitoring and source-introspection calls with the v2 metric-collection and source-schema endpoints.
6. Test create, update, dry-run, start, stop, reset, and delete flows against a non-production RDI 1.19.0 or later installation before switching production clients.

Authentication and the API base URL are unchanged. Only the versioned endpoint paths, resource scoping, request models, and operation-status handling need to be updated.
