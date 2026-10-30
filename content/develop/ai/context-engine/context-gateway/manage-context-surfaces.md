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

These tasks need the Control Plane URL and the admin token. The examples use Python, cURL, and the Iris command-line interface (CLI). Export them as shown in [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md#before-you-begin).

Your administrator registers the Redis database in the deployment's database registry under an ID, and gives the Control Plane and the Data Plane each a Redis user for it. See [Context Surface databases](/content/operate/iris/self-managed/context-gateway/configuration.md#context-surface-databases). You reference the database by that ID.

Read these limits before you create a Surface:

- Every agent with access to the Gateway can read every record of every Surface on it. Context Surfaces do not narrow results by access tags.
- Gateways whose Surfaces share a database can read each other's records. Give a Surface its own database when its records must stay separate, and never use one Redis database as both a Surface database and a Gateway database.
- Creating a Surface, changing its data model, or refreshing it starts background indexing on the Surface database. Search tools can return partial results until indexing finishes.

## Write a data model

A data model lists the entities stored in the database. Each entity has a Redis key template, its fields, the index types that make each field searchable, and its relationships to other entities.

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

A data model is at most 1 mebibyte (MiB) of JSON. The Control Plane refuses `acl_field_mappings`.

<!-- TODO: Link the Context Surface data model reference once it is published. -->

## Create a Context Surface

Create an Upstream of kind `context-surface` with the database ID and the data model. A Context Surface takes no endpoint and no credential.

*Example set `iris_gateway_surfaces`, step `gateway-surface-create`, in Python (Iris), cURL (Iris), and CLI (Iris).*

The Control Plane generates and publishes the tools in the same request. When it cannot, the response is still `201`, and `initialCatalogFailure` explains why:

| `initialCatalogFailure.status` | Meaning | What to do |
| --- | --- | --- |
| `422` | The Surface database refused the login. | Ask your administrator to fix the registry login, then refresh. |
| `424` | The Surface database was unreachable, answered an error, or refused a command. | Ask your administrator to check the database and its Redis users, then refresh. |
| `408` | Tool generation timed out. | Refresh. |
| `423` | The Gateway or its tenant was suspended. | Refresh once the suspension ends. |

A `400` response names each invalid part of the data model in `fields[]`, such as `contextSurface.dataModel.entities[0].fields`. Nothing was written.

## List the generated tools

List the Surface's tools. Agents see them under the Surface's namespace, for example `scheduling.search_provider_by_text`. Every generated tool is read-only.

*Example step `gateway-surface-tools`.*

A lookup by an ID that no record has succeeds and returns `null`. It is an answer for the agent, not a failure.

## Change the data model or refresh

Send a new data model with an Upstream update at the Upstream's current `revision`. The data model and the new tools commit together, so agents see only the new tools.

*Example step `gateway-surface-update`.*

Refresh the Surface to generate its tools again from the stored data model. A refresh also recreates any missing index. A call that runs during a change or a refresh can fail once with `upstream_error` because its index is being replaced. Retry it.

## Delete a Context Surface

Delete the Surface at its current revision. The delete also drops the Surface's indexes from its database.

*Example step `gateway-surface-delete`.*

If the delete keeps answering `503` because the indexes cannot be dropped, repeat it with `ignoreIndexSweepFailure=true`. The Surface is deleted and its indexes stay in the database, where your administrator can drop them.
