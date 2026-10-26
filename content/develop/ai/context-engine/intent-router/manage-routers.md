---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Choose an embedding model, create a Router, wait for it to be ready, and update, suspend, or delete it.
hideListLinks: true
linktitle: Manage Routers
title: Manage Routers
weight: 15
---

Use the control plane to create the Routers that applications author intents in and match against. A Router is the configuration and authorization boundary for a set of intents. See [Redis Intent Router concepts](/content/develop/ai/context-engine/intent-router/concepts.md#routers).

## Before you begin

These tasks need the control-plane URL and its admin token, which a platform team holds. See [Authentication and authorization](/content/operate/iris/intent-router/self-managed/authentication.md). The admin token manages every Router in the deployment, so keep it out of agent and application configuration.

Export these values in the shell where you run the examples:

```bash
export IRIS_INTENT_ROUTER_SERVICE_URL='<control-plane-url>'
export IRIS_INTENT_ROUTER_SERVICE_TOKEN='<admin-token>'
```

The examples use Python (`IntentRouter.from_env().service`), TypeScript (`IntentRouterService`), cURL, and the `iris intent-router service` commands, which all read these variables. Follow one tab throughout the page. To choose a client, see the [developer guide](/content/develop/ai/context-engine/intent-router/developer-guide.md#choose-a-client).

## Choose an embedding model

A Router's embedding model decides how well matching understands wording, and it can't change after you create the Router. List the models your deployment offers. Embedding models have the `purpose` `EMBEDDING`, and you can filter the list with `purpose=EMBEDDING`.

{{< clients-example set="iris_intent_router_service" step="models-list" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Each model reports its `provider`, `model`, and `dimensions`. Pass the same three values as the Router's `vectorSpace`. A self-managed deployment offers one embedding model, configured by your administrator, and holds its provider credentials itself, so `authorization` is `NONE`. Creating a Router with a model that isn't listed fails with `400`.

The model's `dimensions` also set the Router's memory use. See [Size memory](/content/operate/iris/intent-router/self-managed/prerequisites.md#size-memory).

## Create a Router

Create a Router with a name and a `vectorSpace`. Optional fields set a description, a `template`, and a default `minScore`.

{{< clients-example set="iris_intent_router_service" step="router-create" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Save the `routerId`. The new Router starts in `PROVISIONING` while the data plane builds its search index. The response carries a `Retry-After` header that suggests when to check again.

A tenant can hold up to 128 Routers by default. Router names don't have to be unique: the `routerId` identifies a Router.

| Field | Meaning |
| ----- | ------- |
| `name` | A display name, 1 to 128 characters. |
| `vectorSpace` | The embedding model: `provider`, `model`, and `dimensions`. Required and immutable. |
| `description` | What the Router is for, up to 1,024 characters. |
| `template` | A label for people and tooling: `CUSTOM`, `MODEL`, `GUARDRAILS`, or `AGENT`. Every template serves the same way. |
| `minScore` | The Router's minimum score, above 0 and up to 1. Omit it, or send `0`, to use the default, 0.7. |
| `databaseId` | The customer database that holds the Router's intents, examples, and index. Omit it to use the deployment's default database. Your administrator names the available databases, and a deployment can require one. It can't change after creation. |

To retry a create safely, send an `Idempotency-Key` header of the form `<client-id>:<hex SHA-256 of the request body>`, with the body's object keys sorted and no extra whitespace. A retry with the same key and body returns the first response with `Idempotent-Replayed: true`, for 24 hours. Reusing the key with a different body fails with `422`. Only a successful response is kept, so a retry after a failure runs the create again. A retry that arrives while the first request is still running gets `409`.

## Wait for the Router to be ready

Poll the Router until it leaves `PROVISIONING`. Data requests to a Router that is still `PROVISIONING`, or has `FAILED`, return `409`.

{{< clients-example set="iris_intent_router_service" step="router-wait" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

A `FAILED` Router reports why in `failureReason`, for example a database without vector search. A Router that isn't ready within the deployment's provisioning deadline, 10 minutes by default, also fails. A failed Router can't be resumed: delete it and create it again after you fix the cause.

## List and inspect Routers

List the deployment's Routers, or read one by ID. Every read returns the current `revision`, which conditional updates need. Lists return `nextCursor` when more Routers follow.

{{< clients-example set="iris_intent_router_service" step="router-list" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Update a Router

Change a Router's name, description, template, or default `minScore` as a merge patch. An omitted field is unchanged, a `null` description clears it, and a `null` `minScore` resets it to the default. A new `minScore` must be above `0`. The embedding model and `databaseId` can't change. You can update a Router only while it is `READY` or `SUSPENDED`; any other state returns `409`. Changes apply once the data plane has applied the Router's new configuration, usually within seconds.

Send `expectedRevision`, or the revision as a quoted `If-Match` header, to make the update conditional: it fails with `412` if the Router changed since you read it.

{{< clients-example set="iris_intent_router_service" step="router-update" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Suspend and resume a Router

Suspend a Router to stop it serving without deleting its intents. Data requests return `423` while it is suspended. Setting the state back to `READY` resumes it.

{{< clients-example set="iris_intent_router_service" step="router-suspend" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

`SUSPENDED` and `READY` are the only states you can request: asking for another fails with `400`. Only a `READY` or `SUSPENDED` Router can change between them, and any other Router returns `409`. The control plane sets the other states.

## Delete a Router

Deleting a Router permanently removes it, its intents, its examples, and its search index. You can delete a Router in any state. Revoke the Router's agent keys before you delete it.

{{< clients-example set="iris_intent_router_service" step="router-delete" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The delete returns `202` with the Router in `DELETING`, and the data plane finishes the removal. Repeating the delete returns `202` while the removal runs and `204` once the Router is gone, so you can repeat a delete that timed out.

## Issue agent keys

The control plane doesn't issue agent keys. Your platform team issues them with the Redis Iris Identity Service, with a grant on the Router. See [Create a Router and an agent key](/content/operate/iris/intent-router/self-managed/api-examples.md).

| Action | What it allows |
| ------ | -------------- |
| `read` | Match queries, read intents and examples, and check the Router's health. |
| `write` | Create, change, and delete intents and examples, and clear the Router. Includes `read`. |
| `full` | Includes `write`. No operation needs more than `write` today. |

No agent-key action can create, change, or delete the Router itself. That stays with the admin token. Give an application that only classifies queries a `read` key. Give a curation tool or an authoring pipeline a `write` key.

## Next steps

- [Manage intents and examples](/content/develop/ai/context-engine/intent-router/manage-intents.md) to author the Router's intents.
- [Match queries](/content/develop/ai/context-engine/intent-router/match.md) to classify text.
