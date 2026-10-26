---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Find Router, content, and match limits, error types, and retry guidance.
hideListLinks: true
linktitle: Limits and errors
title: Service limits and errors
weight: 90
---

Check these limits when preparing intents or handling request failures. Confirm deployment overrides with your administrator.

The [API reference](/content/develop/ai/context-engine/intent-router/api-reference.md) defines field formats and operation-specific schemas.

## Router limits

| Limit | Default |
|:------|:--------|
| Routers per tenant | 128 |
| Embedding models per deployment | 1 |
| Time for a new Router to become `READY` before it fails | 10 minutes |

## Content limits

These are the defaults. A deployment can change the per-Router and per-request counts.

| Content | Default ceiling |
|:--------|:----------------|
| Intents per Router | 1,000 |
| Examples per intent | 256 |
| Intents per bulk add request | 100 |
| Examples across one bulk add request | 5,000 |
| Examples per add-examples request | 256 |
| Intent name | 128 characters: letters, digits, `.`, `_`, `-`, starting with a letter or digit |
| Example text or query | 2,048 characters |
| Description | 1,024 characters |
| `target.type` | 32 characters, no whitespace |
| `target.ref` | 512 characters |
| `target.args` | 32 top-level keys |
| `metadata` | 32 keys of up to 64 characters, each value up to 512 characters |

## Match and list limits

| Setting | Default | Notes |
|:--------|:--------|:------|
| Intents returned by a match | 5 | Set with `limit`. |
| Maximum `limit` on a match | 50 | A larger value is rejected with `400`, not clamped. |
| Minimum score | 0.7 | Applies when the request, intent, and Router set none. |
| Page size of a list | 50 | Set with `limit`, from 1 to 200. Pass `nextCursor` back as `cursor`. |

## Errors

The API reports failures as [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem documents. Match on the `type` value rather than the message.

### Data plane

| Status | Type | Meaning and recovery |
|:-------|:-----|:---------------------|
| `400` | `/errors/invalid-data` | A field is invalid, `limit` exceeds the cap, or `If-Match` and `expectedRevision` disagree. The `errors` list names each field and the rule it broke. Fix the request. |
| `400` | `/errors/invalid-cursor` | The `cursor` isn't valid for this list. Start again without a cursor. |
| `401` | `/errors/authentication-failed` | The agent key is missing, invalid, expired, or revoked. |
| `403` | `/errors/insufficient-permissions` | The key has no grant on this Router, or lacks the action the operation needs, such as `write` for authoring. |
| `404` | `/errors/resource-not-found` | The Router, intent, or example doesn't exist. Deleting a missing intent or example succeeds instead. |
| `408` | `/errors/timeout` | The request timed out. Retry with backoff. |
| `409` | `/errors/router-not-serving` | The Router is provisioning, has failed, or the data plane hasn't applied its latest configuration yet. Retry after a short wait, and check the Router's state if it persists. |
| `409` | `/errors/intent-limit-exceeded` | The Router already holds the maximum number of intents. Delete an intent or ask your administrator to raise the limit. |
| `412` | `/errors/revision-conflict` | The intent changed since the revision you sent. Read the intent, reapply your change, and retry. |
| `423` | `/errors/router-suspended` | An administrator suspended the Router. Retrying doesn't help until it resumes. |
| `424` | `/errors/dependency-unavailable` | A service the Router depends on, such as the embedding provider, is unavailable. Retry with backoff. |
| `503` | `/errors/service-unavailable` | The Router's search index is rebuilding, or its database isn't answering. Wait for the `Retry-After` interval, then retry. |
| `500` | `/errors/unexpected-error` | An unexpected internal error. Retry once, then contact support with the request details. |

### Control plane

| Status | Type | Meaning and recovery |
|:-------|:-----|:---------------------|
| `400` | `/errors/invalid-data` | A field is invalid, the `vectorSpace` or `databaseId` isn't one the deployment offers, the deployment requires a `databaseId`, or an update is empty. |
| `401` | `/errors/authentication-failed` | The admin token is missing or wrong. Agent keys are refused here. |
| `404` | `/errors/resource-not-found` | The Router doesn't exist. Deleting a Router that is already gone succeeds instead. |
| `409` | `/errors/conflict` | The tenant has reached its Router limit, the state change isn't allowed, or a request with the same `Idempotency-Key` is still running. |
| `412` | `/errors/revision-conflict` | The Router changed since the revision you sent. Read it and retry. |
| `422` | `/errors/idempotency-key-reused` | The `Idempotency-Key` was already used with a different request body. Use a new key. |
| `503` | `/errors/service-unavailable` | The control plane's storage isn't answering. Retry with backoff. |

## Retry safely

Writes are safe to retry:

- Upserting an intent is idempotent, adding a phrasing that exists doesn't duplicate it, and deleting a missing intent or example succeeds.
- Bulk add replaces intents of the same name, so repeating it produces the same state.
- Creating a Router with an `Idempotency-Key` returns the first response on a retry for 24 hours. Without one, list the Routers before you retry, or you may create a second Router.
