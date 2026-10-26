---
Title: Redis Intent Router
alwaysopen: false
categories:
- docs
- develop
- ai
description: Classify a user's message into a named intent and get back the target your application should dispatch to.
linkTitle: Intent Router
hideListLinks: true
weight: 27
bannerText: Documentation review draft.
bannerChildren: true
---

## What is Redis Intent Router?

Redis Intent Router classifies text into **intents** that you define. Each intent is a name, a few example phrasings, and an optional **target** that says what your application should do when the intent matches. Send a query to a **Router** and it returns the closest intents, best first, with a score for each.

It works like a semantic cache, but returns a structured intent instead of a cached response. Redis embeds the query, finds the nearest examples, groups them by intent, and applies a score threshold. No LLM call is involved at match time.

For example, a support application can route "where is my package?" to a `track_order` intent that points at an order-tracking tool, and "I want my money back" to a `refund` intent that points at a refund workflow.

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
  {{< tile-card icon="images/icon_logo/icon-data-structures-64-midnight.png" title="Concepts" description="Learn how Routers, intents, examples, targets, and scores work" url="/develop/ai/context-engine/intent-router/concepts" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Quickstart" description="Define two intents and match your first queries" url="/develop/ai/context-engine/intent-router/quickstart" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-insight-64-duotone.png" title="Manage Routers" description="Create Routers, choose an embedding model, and control access" url="/develop/ai/context-engine/intent-router/manage-routers" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-insight-64-duotone.png" title="Match queries" description="Tune thresholds and result limits for accurate routing" url="/develop/ai/context-engine/intent-router/match" >}}
</div>

## Why use Redis Intent Router?

- **Fast, predictable routing:** Matching embeds the query and runs a vector search over your examples, with no LLM call.
- **Routing you can edit:** Add an example or change a threshold and the change applies to the next query. You don't retrain or redeploy anything.
- **Dispatch data stays with the intent:** A target carries the tool, pipeline, or agent to call, so your application doesn't keep a separate lookup table.
- **Tunable strictness:** Set a minimum score on the Router, on each intent, or on a single request.
- **Safe updates:** Replacing an intent never leaves it empty while queries are in flight, and conditional writes prevent lost updates.
- **Governed access:** Each Router is its own authorization boundary, with separate `read`, `write`, and `full` grants.
- **Flexible integration:** Use Python, TypeScript, the `iris` command-line interface (CLI), or REST.

## Choose how to use it

| Use case | How an intent helps |
| -------- | ------------------- |
| Agent routing | Send each request to the specialist agent or tool that handles it. |
| Model selection | Send simple requests to a small model and complex ones to a larger model. |
| Guardrails | Detect off-topic or disallowed requests before they reach the agent. |
| Workflow dispatch | Start a pipeline or handler from a natural-language request. |

The Router doesn't run the target. It returns the target, and your application decides how and whether to act on it.

## Quick example

Install the Redis Iris Python package, which includes the `iris` CLI:

```bash
pip install redis-iris
```

With a Router's endpoint, ID, and an agent key in your environment, define intents:

{{< clients-example set="iris_intent_router_quickstart" step="intents-create" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The [redis-iris package](https://pypi.org/project/redis-iris/) covers matching, intent authoring, and Router administration in Python and the CLI. For TypeScript, the generated client [@redis-iris/intent-router](https://www.npmjs.com/package/@redis-iris/intent-router) covers the data plane and the control plane. See the [developer guide](/content/develop/ai/context-engine/intent-router/developer-guide.md) to choose a client.

## Get started

Redis Intent Router is available for self-managed deployment on Kubernetes. See [Self-managed Intent Router](/content/operate/iris/intent-router/self-managed/_index.md), then [create a Router and an agent key](/content/operate/iris/intent-router/self-managed/api-examples.md).

You need a license key to deploy: [contact Redis](https://redis.io/contact/) to request access.

Then [define intents and match your first queries](/content/develop/ai/context-engine/intent-router/quickstart.md).

## Manage Routers and intents

- [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md): choose an embedding model, create a Router, and suspend, update, or delete it.
- [Manage intents and examples](/content/develop/ai/context-engine/intent-router/manage-intents.md): create, update, replace, and delete intents and their example phrasings.

## Route at runtime

- [Developer guide](/content/develop/ai/context-engine/intent-router/developer-guide.md): choose a client and connect.
- [Match queries](/content/develop/ai/context-engine/intent-router/match.md): classify text and tune thresholds.

Use the [API reference](/content/develop/ai/context-engine/intent-router/api-reference.md) for operations and schemas, and [service limits and errors](/content/develop/ai/context-engine/intent-router/limits.md) for constraints and recovery guidance.
