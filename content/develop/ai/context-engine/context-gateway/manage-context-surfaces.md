---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Serve the records of a Redis database as tools with a Context Surface, write its data model, and change, refresh, or delete it.
hideListLinks: true
linktitle: Manage Context Surfaces
title: Manage Context Surfaces
weight: 30
---

A Context Surface is an Upstream that serves the records of a Redis database as tools. You describe the records in a data model, and the Control Plane generates read-only tools from it, such as a text search, a filter, and a lookup by ID for each entity.

## Before you begin

These tasks need the Control Plane URL and the admin token. The examples use cURL and jq. Export the connection values as shown in [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md#before-you-begin).

Your administrator registers the Redis database in the deployment's database registry under an ID, and gives the Control Plane and the Data Plane each a Redis user for it. See [Context Surface databases](/content/operate/iris/context-gateway/self-managed/configuration.md#context-surface-databases). You reference the database by that ID.

Read these limits before you create a Surface:

- Every agent with access to the Gateway can read every record of every Surface on it. Context Surfaces do not narrow results by access tags.
- Gateways whose Surfaces share a database can read each other's records. Give a Surface its own database when its records must stay separate, and never use one Redis database as both a Surface database and a Gateway database.
- Creating a Surface, changing its data model, or refreshing it starts background indexing on the Surface database. Search tools can return partial results until indexing finishes.

## Write a data model

A data model lists the entities stored in the database. Each entity has a Redis key template, its fields, the index type that makes each field searchable, and its relationships to other entities. Save this model as `clinic-model.json`:

```json
{
  "title": "Healthcare scheduling",
  "description": "Clinics and the providers who work at them",
  "entities": [
    {
      "name": "Location",
      "description": "A medical facility where providers see patients",
      "redis_key_template": "location:{id}",
      "fields": [
        {"name": "id", "type": "str", "description": "Location ID", "is_key_component": true, "redis_indices": []},
        {"name": "name", "type": "str", "description": "Facility name", "redis_indices": [{"type": "text", "weight": 1.0}]},
        {"name": "city", "type": "str", "description": "City", "redis_indices": [{"type": "tag"}]}
      ],
      "relationships": []
    },
    {
      "name": "Provider",
      "description": "A clinician who sees patients at one location",
      "redis_key_template": "provider:{id}",
      "fields": [
        {"name": "id", "type": "str", "description": "Provider ID", "is_key_component": true, "redis_indices": []},
        {"name": "specialty", "type": "str", "description": "Specialty", "redis_indices": [{"type": "tag"}]},
        {"name": "location_id", "type": "str", "description": "Home location", "redis_indices": [{"type": "tag"}]}
      ],
      "relationships": [
        {"name": "works_at", "target": "Location", "description": "The provider's home location", "source_field": "location_id"}
      ]
    }
  ],
  "entity_count": 2
}
```

A data model is at most 1 mebibyte (MiB) of JSON. The Control Plane refuses `acl_field_mappings` and more than one Redis index on a field. If the same value needs both TAG and TEXT search, store it in two fields and give each field one index.

Normalize line breaks in TEXT-indexed values to spaces before loading records. Redis TEXT tokenization does not reliably turn every line-break form into a word boundary. Apply normalization in your importer, including CRLF, LF, CR, vertical tab, form feed, U+0085, U+2028, and U+2029. Existing records must be rewritten with normalized values. Refreshing the catalog or rebuilding an index alone does not change the stored text.

Do not assume every punctuation-containing phrase has literal phrase-search semantics. Validate your application's representative queries against its indexed data.

The [self-managed API examples](/content/operate/iris/context-gateway/self-managed/api-examples.md) show how to load the clinic records used by the quickstart.

## Create a Context Surface

Create an Upstream of kind `CONTEXT_SURFACE` with a `contextSurface` object that holds the `databaseId` and the `dataModel`. A Context Surface takes no endpoint and no credential.

On a self-managed deployment, you may leave out `contextSurface.databaseId` when your administrator set a default Surface database. An explicit ID always wins. An ID sent as an empty string or `null` returns `400`, and so does an omitted ID when no default is set, in both cases on `contextSurface.databaseId`. The response returns `contextSurface.databaseBinding` with the resolved `databaseId` and the database's `name`. The `name` is absent when the lookup fails. Redis Cloud always requires the ID. See [Default databases](/content/operate/iris/context-gateway/self-managed/configuration.md#default-databases).

Set the Gateway ID returned by create and the Surface database ID supplied by your administrator. The database must already contain records matching `clinic-model.json`.

```bash
export GATEWAY_ID='<gateway-id>'
export SURFACE_DATABASE_ID='<surface-database-id>'
export SURFACE_GATEWAY_API="$IRIS_CONTEXT_GATEWAY_SERVICE_URL/iris/v1/context-gateway/gateways/$GATEWAY_ID"

jq -n --arg database "$SURFACE_DATABASE_ID" --slurpfile model clinic-model.json \
  '{name: "Healthcare scheduling", namespace: "scheduling", kind: "CONTEXT_SURFACE",
    contextSurface: {databaseId: $database, dataModel: $model[0]}}' > surface-create.json

curl --fail-with-body --silent --show-error \
  -X POST "$SURFACE_GATEWAY_API/upstreams" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @surface-create.json > surface.json
export SURFACE_ID="$(jq -er '.upstreamId' surface.json)"
jq '{upstreamId, revision, initialCatalogFailure}' surface.json
```

The Control Plane generates and publishes the tools in the same request. When it cannot, the response is still `201`, and `initialCatalogFailure` explains why:

| `initialCatalogFailure.status` | Meaning | What to do |
| --- | --- | --- |
| `422` | The Surface database refused the login. | Ask your administrator to fix the registry login, then refresh. |
| `424` | The Surface database was unreachable, answered an error, or refused a command. | Ask your administrator to check the database and its Redis users, then refresh. |
| `408` | Tool generation timed out. | Refresh. |
| `423` | The Gateway or its tenant was suspended. | Refresh once the suspension ends. |

A `400` response identifies invalid members in `errors[]`. A body member uses a JSON Pointer in `pointer`, such as `/contextSurface/dataModel`, and a human-readable `detail`. The response does not echo rejected credentials or database addresses. Nothing was written.

## List the generated tools

List the Surface's tools. Agents see them under the Surface's namespace, for example `scheduling__filter_provider`. Every generated tool is read-only.

```bash
curl --fail-with-body --silent --show-error \
  "$SURFACE_GATEWAY_API/upstreams/$SURFACE_ID/tools" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" | jq .
```

Use MCP discovery to read each tool's input schema before calling it, as shown in the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md). The Provider model has TAG indexes for filtering. Text-search tools require a TEXT-indexed field, such as the Location model's `name`.

A lookup by an ID that no record has succeeds and returns `null`. It is an answer for the agent, not a failure.

## Change the data model or refresh

Send a new data model with an Upstream update using the Upstream's current `revision` as `expectedRevision`. The data model and the new tools commit together, so agents see only the new tools.

After editing `clinic-model.json`, read the current revision and submit the complete replacement model:

```bash
curl --fail-with-body --silent --show-error \
  "$SURFACE_GATEWAY_API/upstreams/$SURFACE_ID" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" > surface.json

jq -n --arg revision "$(jq -er '.revision' surface.json)" \
  --slurpfile model clinic-model.json \
  '{expectedRevision: $revision, contextSurface: {dataModel: $model[0]}}' > surface-update.json

curl --fail-with-body --silent --show-error \
  -X PATCH "$SURFACE_GATEWAY_API/upstreams/$SURFACE_ID" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @surface-update.json > surface.json
```

A stale revision returns `412`. Read the resource again and reconcile your change before retrying.

Refresh the Surface to generate its tools again from the stored data model. A refresh also recreates any missing index. A call that runs during a change or a refresh can fail once with `upstream_error` because its index is being replaced. Retry it.

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$SURFACE_GATEWAY_API/upstreams/$SURFACE_ID/refresh" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
  > surface-refresh-response.json
```

## Delete a Context Surface

Delete the Surface at its current revision. The delete also drops the Surface's indexes from its database.

Read the current revision before deleting:

```bash
curl --fail-with-body --silent --show-error \
  "$SURFACE_GATEWAY_API/upstreams/$SURFACE_ID" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" > surface.json

curl --fail-with-body --silent --show-error \
  -X DELETE "$SURFACE_GATEWAY_API/upstreams/$SURFACE_ID?expectedRevision=$(jq -er '.revision | @uri' surface.json)" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN"
```

If the delete keeps answering `503` because the indexes cannot be dropped, repeat it with `ignoreIndexSweepFailure=true`. The Surface is deleted and its indexes stay in the database, where your administrator can drop them.
