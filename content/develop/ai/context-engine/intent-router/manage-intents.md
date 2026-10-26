---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Create, update, replace, list, and delete intents and their example phrasings.
hideListLinks: true
linktitle: Manage intents
title: Manage intents and examples
weight: 20
---

Author the intents a Router matches against. The examples use the connection values from the [quickstart](/content/develop/ai/context-engine/intent-router/quickstart.md#save-connection-values) and an agent key with `write` access. Follow one tab throughout the page.

## Create or replace an intent

Writing an intent with `PUT` creates it, or replaces the one with that name. It is idempotent: sending the same request twice produces the same intent, although each write returns a new `revision`. It returns `201` for a new intent and `200` for a replacement, and a replaced intent keeps its place in the list.

{{< clients-example set="iris_intent_router_intents" step="intent-upsert" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

An intent takes up to 256 examples, each up to 2,048 characters. Phrasings already on the intent that your request omits are removed after the new ones are written, so a concurrent match never sees an empty intent.

## Add several intents

Add up to 100 intents in one request. They are added in the order you send them, after the intents the Router already has. An intent whose name already exists is replaced in place, and every other intent is left alone. Nothing is written if any intent is invalid.

{{< clients-example set="iris_intent_router_intents" step="intents-bulk" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Read and list intents

Reading an intent returns its configuration, `exampleCount`, timestamps, and `revision`. It doesn't include the examples, which you list separately.

Listing returns intents with their configuration and example counts, in creation order. Pass `limit` (default 50, maximum 200). When more intents follow, the response includes `nextCursor`: pass it back as `cursor` for the next page.

{{< clients-example set="iris_intent_router_intents" step="intents-list" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Update an intent's configuration

Update the description, target, `minScore`, or metadata as a merge patch, without touching or re-embedding the examples.

- An omitted field stays unchanged.
- `null` clears `description`, `target`, `minScore`, or `metadata`.
- A `metadata` map replaces the whole existing map.
- An empty body is rejected.

{{< clients-example set="iris_intent_router_intents" step="intent-patch" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Clearing `minScore` makes the intent use the Router's threshold again.

## Avoid overwriting concurrent changes

Every intent has a `revision` that changes with each write to the intent. Read the intent, then send its revision as `expectedRevision` with your change, so the write succeeds only if nobody changed the intent in between. This example changes the description and leaves the rest of the intent alone. A conditional `PUT` works the same way but replaces the whole intent.

{{< clients-example set="iris_intent_router_intents" step="intent-conditional" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

A stale revision fails with `412` and the type `/errors/revision-conflict`. Read the intent again, reapply your change, and retry. Because every write returns a new revision, a retry of a conditional write that already succeeded also fails with `412`: read the intent to check. Adding or deleting examples through the example operations doesn't change the revision.

## Manage examples

Add phrasings to an existing intent. Each request takes 1 to 256 examples and adds them after the existing ones. Repeating a phrasing keeps its place and doesn't embed it again.

{{< clients-example set="iris_intent_router_intents" step="examples-add" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The response lists each example with its `exampleId`. List an intent's examples in the order they were written, with the same `limit` and `cursor` pagination as intents.

{{< clients-example set="iris_intent_router_intents" step="examples-list" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Read or delete one example by its identifier. Reading an identifier from another intent returns `404`. Deleting an example the intent doesn't hold succeeds and changes nothing, and deleting under an intent that doesn't exist returns `404`.

{{< clients-example set="iris_intent_router_intents" step="example-delete" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Delete an intent

Deleting an intent removes it and all its examples. Deleting a missing intent succeeds.

{{< clients-example set="iris_intent_router_intents" step="intent-delete" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Clear a Router

Clearing removes every intent and example and keeps the Router. The `scope` is required, and `INTENTS` is the only value. There is no default, so a request can't empty a Router by accident. Clearing also removes the quickstart's intents, which the [Match queries](/content/develop/ai/context-engine/intent-router/match.md) examples create again before they run.

{{< clients-example set="iris_intent_router_intents" step="router-clear" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Write good examples

- **Vary the wording.** Include short and long phrasings, and the vocabulary your users really use.
- **Keep each example about one thing.** An example that mixes two requests pulls the intent toward both.
- **Separate overlapping intents.** If two intents keep matching the same queries, add examples that distinguish them, or raise their `minScore`.
- **Add examples from real misses.** When a query returns the wrong intent or none, add it as an example of the right intent.

See [Match queries](/content/develop/ai/context-engine/intent-router/match.md) for how scores and thresholds interact with examples.
