---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Classify a query into intents, read scores and targets, and tune thresholds and result limits.
hideListLinks: true
linktitle: Match queries
title: Match queries to intents
weight: 30
---

Use `match` to classify text at runtime. The examples use the connection values from the [quickstart](/content/develop/ai/context-engine/intent-router/quickstart.md#save-connection-values) and match against its `track_order` and `refund` intents. Each complete program creates those intents first, so it needs an agent key with `write` access; matching on its own needs only `read`. Follow one tab throughout the page.

## Send a query

A match request takes a query and returns the closest intents, best first.

{{< clients-example set="iris_intent_router_match" step="match-options" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

| Field | Required | Meaning |
| ----- | -------- | ------- |
| `query` | Yes | The text to classify, 1 to 2,048 characters. |
| `limit` | No | The most intents to return. Defaults to the deployment default, which is 5. |
| `minScore` | No | The minimum score for every returned intent, from 0 to 1. Overrides each intent's own and the Router's `minScore`. |

Each item in the response has:

| Field | Meaning |
| ----- | ------- |
| `name` | The intent's name. |
| `score` | How close the query is to the intent, from 0 to 1. Higher is closer. |
| `description` | The intent's description, when it has one. |
| `target` | The intent's target, when it has one. |
| `metadata` | The intent's metadata, when it has any. |

A query with no close intent returns `200` with an empty list.

## Act on the result

The Router returns the target and leaves the action to your application. A typical handler takes the top item, checks that one exists, and dispatches on `target.type`.

{{< clients-example set="iris_intent_router_match" step="match-dispatch" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Decide in advance what your application does when the list is empty, such as asking a clarifying question or using a general-purpose agent. When two items score close together, the query may be ambiguous: consider asking the user instead of picking the first.

## Control relevance and result count

By default an intent's score is the similarity of its closest example to the query. The data plane reads the nearest examples, 50 by default, groups them by intent, and scores each group.

The minimum score for each intent comes from the first of these that is set:

1. The `minScore` in the match request, which applies to every intent.
1. The intent's own `minScore`, when it is above `0`.
1. The Router's `minScore`, which is `0.7` unless you set another.

Higher scores are stricter. Raise a threshold to reduce wrong matches and lower it to reduce misses.

| Goal | Adjust |
| ---- | ------ |
| One intent matches too easily | Raise that intent's `minScore`. |
| One intent misses real queries | Add examples that use the missed wording. Lower `minScore` only if examples don't help. |
| Every intent is too strict or too loose | Change the Router's `minScore`. |
| Compare scores while tuning | Match with `minScore` set to `0` to see the closest intents regardless of threshold, then pick thresholds. |

{{< clients-example set="iris_intent_router_match" step="match-tune" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

`limit` can't exceed the deployment cap, which defaults to 50. A request above the cap is rejected with `400` rather than clamped, so you never silently receive fewer ranked results than you asked for.

Scores aren't comparable across embedding models. A Router's model can't change, so recheck thresholds when you move to a Router with a different model.

## Handle errors

Match is a data-plane request, so it fails when its Router can't serve:

- `400`: the query is empty or too long, or `limit` exceeds the cap.
- `401`: the key is invalid, expired, or revoked.
- `403`: the key has no `read` grant on the Router.
- `409`: the Router is provisioning or not serving. Retry after a short wait.
- `423`: an administrator suspended the Router.
- `424`: the embedding provider is unavailable. Retry with backoff.
- `503` with `Retry-After`: the Router's search index is rebuilding, or its database isn't answering. Retry after the interval. A Router that can't search never returns an empty list in place of an error.

See [service limits and errors](/content/develop/ai/context-engine/intent-router/limits.md) for all error types and retry guidance.
