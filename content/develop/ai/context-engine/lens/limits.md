---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Lens request limits, how the SDK exports turns, error responses, and how to find a missing turn.
hideListLinks: true
linktitle: Limits and errors
title: Lens limits and errors
weight: 40
---

Check these limits when you design session IDs and read large sessions, and use the error tables to handle failed requests.

## Request limits

| Limit | Value |
| ----- | ----- |
| Session, thread, user, and agent IDs | Up to 256 bytes each. The SDK shortens longer IDs and logs a warning. |
| Results per retrieval step | Up to 100. The fetched count keeps the true total. |
| Ingest request size | Up to 8 mebibytes (MiB) by default. |
| Sessions per page | Up to 200. Default 50. |
| Sessions per listed range | Up to 10,000. Narrow the range or add filters to list more. |
| Turns per session read | Up to 10,000. |

A mebibyte (MiB) is 1,024 kibibytes. Your administrator can change the ingest request size and sets the retention windows.
<!-- TODO: link the operator guide for Lens limits and retention when it exists. -->

## How Lens exports

The SDK exports turns in the background, so your agent never waits on Lens:

- Each export has a 10-second deadline.
- The SDK retries rate limits, timeouts, server errors, and connection errors within that deadline. A rate-limited export waits for the server's `Retry-After` value.
- When an export fails, the SDK logs a warning and keeps running. A Lens error never raises into your agent, unless you set `IRIS_LENS_STRICT=true`.

`lens.shutdown()` waits for in-flight exports before your process exits. See [Shut down](/content/develop/ai/context-engine/lens/instrument.md#shut-down).

## Ingest errors

The SDK handles these responses from the ingest endpoint and logs a warning for each:

| Status | Meaning | Action |
| ------ | ------- | ------ |
| `400` | The export body isn't a valid OpenTelemetry request. | Check that you export with the Redis Iris SDK. |
| `401` | The ingest key is missing or invalid. | Check `IRIS_LENS_API_KEY`. |
| `403` | The key can't ingest for this instance. | Use a key with the `ingest` or `full` scope. |
| `413` | The export exceeds the ingest request size. | Turn content capture off, or ask your administrator to raise the limit. |
| `429` | The instance is at capacity. | The SDK retries. Sustained `429` responses mean the instance needs more capacity. |
| `503` | Ingest is temporarily unavailable. | The SDK retries. |

## Read errors

Read API errors return a problem details body with a `type` and a `title`:

| Status | `type` | Action |
| ------ | ------ | ------ |
| `400` | `/errors/invalid-data` | Correct the request parameters. The body lists each invalid field. |
| `401` | `/errors/authentication-failed` | Check `LENS_API_KEY`. |
| `403` | `/errors/insufficient-permissions` | Use a key with the `read` or `full` scope. |
| `404` | `/errors/resource-not-found` | Check the ID. A new turn becomes readable a few seconds after export. |
| `500` | `/errors/unexpected-error` | Retry the request. |
| `503` | `/errors/service-unavailable` | Retry after a short wait. |

## Troubleshoot a missing turn

If a turn doesn't appear in Lens, check these in order:

1. **Lens is on.** `IRIS_LENS_ENDPOINT` is set in the process, and `IRIS_LENS_ENABLED` isn't `false`. With no endpoint, every Lens call does nothing. `lens.init()` returns `True` when Lens is on.
1. **The export finished.** A short-lived process calls `lens.shutdown()` before it exits.
1. **The key works.** The SDK logs a warning that names the status when an export fails.
1. **The endpoint uses Transport Layer Security (TLS).** Lens refuses an `http://` endpoint that isn't a loopback address. See [Connect over TLS](/content/develop/ai/context-engine/lens/configure.md#connect-over-tls).
1. **You're looking in the right place.** Select the agent ID the turn used, and a time range that includes it.
1. **The turn has a session ID.** Pass a session ID to every `lens.turn()`. To catch a missing ID during development, set `IRIS_LENS_STRICT=true`.
