---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Understand Routers, intents, examples, targets, scores, and access grants.
hideListLinks: true
linktitle: Concepts
title: Redis Intent Router concepts
weight: 3
---

## Routers

A **Router** is the unit you create, configure, and secure. It holds a set of intents and their examples, an embedding model, and a default minimum score. Each Router has its own access grants, so use separate Routers for workloads that must not share intents.

A Router has an opaque identifier that starts with `rtr_`. Its embedding model is fixed when you create it and can't change afterward, because every stored example is embedded with it.

A Router is in one of these states:

| State | Meaning |
| ----- | ------- |
| `PROVISIONING` | The data plane is building the Router's search index. Data requests return `409` until it is ready. |
| `READY` | The Router serves requests. You can suspend or delete it. |
| `FAILED` | Provisioning failed. `failureReason` explains why. A failed Router can only be deleted. |
| `SUSPENDED` | An administrator paused the Router. Data requests return `423` until it is resumed to `READY`. |
| `DELETING` | The data plane is removing the Router and its data. |

Administrators manage Routers through the **control plane**. Applications use the **data plane** to author intents and match queries. The two planes don't call each other, and a Router serves only after the data plane has applied its current configuration. See [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md) to create one, and [service limits and errors](/content/develop/ai/context-engine/intent-router/limits.md) for the errors a Router returns when it isn't serving.

## Intents

An **intent** is a named classification. Its name is unique within the Router and can contain letters, digits, `.`, `_`, and `-`, starting with a letter or digit. An intent has:

- **Examples**: phrasings that should match the intent.
- A **description**: when the intent should win, in your words. Optional.
- A **target**: what a match dispatches to. Optional.
- A **minimum score**: how close a query must be for this intent to match. Optional.
- **Metadata**: labels such as an owner or tags. Optional.

An intent without examples never matches.

Intents and examples are ordered lists. Redis Intent Router returns them in the order you created them, not sorted by name.

### Examples

An **example** is one phrasing of an intent, such as "where is my order" for `track_order`. Redis embeds each example when you write it.

Add several varied phrasings per intent. Matching compares a query with every example, so more varied examples cover more of the ways people ask. An example identifier starts with `exm_` and is derived from the text, so adding the same phrasing twice keeps one example.

### Targets

A **target** tells your application what to do when an intent matches:

| Field | Meaning |
| ----- | ------- |
| `type` | The dispatch mechanism, such as `tool`, `pipeline`, `handler`, `prompt`, or `agent`. The set is open: use any identifier without whitespace. |
| `ref` | The callee within that type's namespace, such as `orders.track`. |
| `args` | Optional dispatch arguments, as a JSON object. |

The Router checks that `args` is valid JSON and passes it through untouched. It knows how an intent is dispatched, never what the target does.

Metadata is for descriptive labels. Put dispatch data in the target: metadata rejects the keys `type`, `ref`, `target`, and `args`.

### Revisions

Every intent has a `revision` that changes whenever you write its configuration. Adding or removing examples doesn't change it. Send the revision back as `expectedRevision` to make a write conditional: the write fails with `412 Precondition Failed` if someone else changed the intent first.

## Matching

To **match** a query, Redis Intent Router embeds the text, finds the nearest examples in the Router's vector index, and groups them by intent. By default an intent scores as its closest example, so one good example is enough for a match. Then it drops intents below their minimum score and returns the rest, best first.

A score is the cosine similarity between the query and the example, from 0 to 1, and higher is closer. Every threshold in the API points the same way: **higher is stricter**.

The minimum score that applies to an intent, from highest to lowest precedence:

1. The `minScore` in the match request.
1. The intent's own `minScore`.
1. The Router's `minScore`.
1. The deployment default, `0.7`.

A `minScore` of `0` on an intent or a Router means "use the next level", never "match everything". Only the match request can lower the threshold to `0`.

A query with no sufficiently close intent returns `200` with an empty list. That is a normal result, not an error.

See [Match queries](/content/develop/ai/context-engine/intent-router/match.md) to tune thresholds and result limits.

## Authoring and consistency

Writes keep matching available. When you replace an intent, Redis writes the new examples first and removes the old ones afterward, so a concurrent match never sees an empty intent. Writing the same intent twice produces the same state.

A write that adds several intents validates all of them first, and writes nothing if any is invalid.

## Access

Two credentials guard the service:

- An **admin token** manages Routers on the control plane. Platform teams hold it.
- An **agent key** authenticates every data-plane request as a bearer token. It carries a grant for each Router it can use. Redis Iris issues agent keys through its Identity Service, not through the Intent Router API.

A grant lists one or more actions on one Router. A key without the action an operation needs gets `403`.

| Action | What it allows |
| ------ | -------------- |
| `read` | Match queries, and read intents and examples. |
| `write` | Create, change, and delete intents and examples, and clear the Router. Includes `read`. |
| `full` | Everything on the Router. Includes `write`. |

Grants apply to a whole Router. Don't rely on intent names or metadata to separate audiences. Use a separate Router instead.
