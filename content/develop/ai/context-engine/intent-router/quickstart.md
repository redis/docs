---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Define two intents, match queries against them, and update an intent with Python, TypeScript, HTTP, or the Iris CLI.
hideListLinks: true
linktitle: Quickstart
title: Redis Intent Router quickstart
weight: 10
---

Use Redis Intent Router to define a `track_order` intent and a `refund` intent, then match three queries against them.

## Before you begin

You need a Router in the `READY` state and an agent key with `write` access to it. `write` includes `read`. To create a Router yourself, see [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md).

This walkthrough needs no agent framework or model-provider key.

Follow one tab throughout the page. The Python package and the command-line interface (CLI) require Python 3.11 or later. The TypeScript client requires Node.js 22 or later. The cURL and CLI examples use Bash and jq. To choose a client, see the [developer guide](/content/develop/ai/context-engine/intent-router/developer-guide.md#choose-a-client).

**Python and CLI**

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-iris
```

**TypeScript**

```bash
npm install @redis-iris/intent-router
```

**HTTP**

```bash
curl --version
jq --version
```

## Save connection values

Export these values in the shell where you run the examples. Use the data plane's base address, including `https://`, without the `/iris/v2/...` path.

```bash
export INTENT_ROUTER_URL='<data-plane-endpoint>'
export ROUTER_ID='<router-id>'
export INTENT_ROUTER_API_KEY='<agent-key>'
```

Keep keys out of source control and model prompts.

The Python examples use `IntentRouter` from the unified `redis-iris` package. Its `client` property exposes the generated data-plane client, which the examples call. The TypeScript examples use the generated `@redis-iris/intent-router` client. The CLI tab runs `iris intent-router` commands and reads the standard `IRIS_INTENT_ROUTER_*` variables. Commands use `--json` when saving a response or processing it with jq.

## Connect to the Router

Expand an example to copy the complete program. Save it as `quickstart.py`, `quickstart.mts`, `quickstart.sh` (cURL), or `quickstart.cli.sh`, then run `python quickstart.py`, `npx tsx quickstart.mts`, `bash quickstart.sh`, or `bash quickstart.cli.sh`.

{{< clients-example set="iris_intent_router_quickstart" step="router-connect" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The health check reports `ok: true` when the Router can serve. Each entry in `checks` covers one part: the Router's state, the embedding provider, the intent store, and the search index. When `ok` is `false`, the failing check's `message` says why, for example that the Router is still provisioning. Wait and retry.

## Create intents

Writing an intent with `PUT` creates it or replaces the one with the same name, so you can rerun this step. This example defines `track_order` with a description, a target, and three examples, and `refund` with examples only.

{{< clients-example set="iris_intent_router_quickstart" step="intents-create" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The first request returns `201` because the intent is new. It reports `exampleCount: 3` and a `revision`. Repeating the request returns `200` and the same state.

## Match a query

Send three queries. The response lists the closest intents, best first.

{{< clients-example set="iris_intent_router_quickstart" step="match-query" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The first query matches `track_order` and returns the target you stored. Your application reads `target.type` and `target.ref` to decide what to call. The second matches `refund`. The third, nonsense text, returns an empty list because no intent is close enough. An empty list is a successful `200` response.

Scores vary with the Router's embedding model. If a query you expect to match returns nothing, add an example rather than lowering the threshold.

## Add an example

Add a phrasing to an existing intent.

{{< clients-example set="iris_intent_router_quickstart" step="examples-add" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The next match uses the new example. Adding a phrasing that already exists is harmless.

## Change an intent's threshold

Updating an intent with `PATCH` changes its configuration without touching or re-embedding its examples. An omitted field is unchanged, and `null` clears a field.

{{< clients-example set="iris_intent_router_quickstart" step="intent-update" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The intent now matches only queries that score at least `0.8`. Higher scores are stricter.

## Clean up

Delete the intents when you finish. Deleting a missing intent succeeds. To remove every intent at once and keep the Router, [clear the Router](/content/develop/ai/context-engine/intent-router/manage-intents.md#clear-a-router).

{{< clients-example set="iris_intent_router_quickstart_delete" step="intents-delete" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Next steps

- [Manage intents and examples](/content/develop/ai/context-engine/intent-router/manage-intents.md) to author intents in bulk and update them safely.
- [Match queries](/content/develop/ai/context-engine/intent-router/match.md) to tune thresholds and result limits.
- [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md) to create Routers and choose an embedding model.
