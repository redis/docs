---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Lens request limits, how the SDK exports turns, error responses, and troubleshooting.
hideListLinks: true
linktitle: Limits and errors
title: Lens limits and errors
weight: 40
---

Check these limits when you design IDs and read large sessions, and use the error tables to handle failed requests.

## Request limits

| Limit | Value |
| ----- | ----- |
| Session, thread, user, and agent IDs | Up to 256 bytes each. The software development kit (SDK) shortens longer IDs and logs a warning. |
| Results per retrieval step | Up to 100. The fetched count keeps the true total. |
| Ingest request size | Up to 8 mebibytes (MiB) by default. |
| Sessions per page | Up to 200. Default 50. |
| Sessions per listed range | Up to 10,000. Narrow the range or add filters to list more. |
| Turns per session read | Up to 10,000. |

Your administrator can change the ingest request size and sets the retention windows.
<!-- TODO: link the operator guide for Lens limits and retention when it exists. -->

## How Lens exports

The SDK exports turns in the background, so your agent doesn't wait on Lens:

- Each export has a 10-second deadline.
- The SDK retries rate limits, timeouts, server errors, and connection errors within that deadline. A rate-limited export waits for the server's `Retry-After` value, up to 30 seconds.
- When an export fails, the SDK logs a warning on the `iris.lens` logger and keeps running. Export errors never raise into your agent.

To see the SDK's warnings, configure Python `logging` to show `WARNING` messages, for example with `logging.basicConfig(level=logging.WARNING)`.

## Ingest errors

The ingest endpoint returns these statuses. The SDK names `401`, `403`, `413`, and `429` in its warnings:

| Status | Meaning | Action |
| ------ | ------- | ------ |
| `400` | The export body isn't a valid OpenTelemetry request. | Export with the Redis Iris SDK. |
| `401` | The ingest key is missing or invalid. | Check `IRIS_LENS_API_KEY`. |
| `403` | The key can't ingest for this instance. | Use a key with the `ingest` or `full` scope. |
| `413` | The export exceeds the ingest request size. | Set `OTEL_BSP_MAX_EXPORT_BATCH_SIZE` below 64 to send smaller batches, or turn content capture off. |
| `429` | The instance is at capacity. | The SDK retries. Sustained `429` responses mean the instance needs more capacity. |
| `503` | Ingest is unavailable or not enabled for this instance. | The SDK retries. If it persists, ask your administrator to check that ingest is enabled. |

## Read errors

Read application programming interface (API) errors return a problem details body with a `type` and a `title`:

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

1. **Lens is configured.** `IRIS_LENS_ENDPOINT` is set in the process, and `IRIS_LENS_ENABLED` isn't `false`. `lens.init()` returns `True` when both are true. With no endpoint, every Lens call does nothing.
1. **The turn has an agent ID.** Set `IRIS_LENS_AGENT_ID`, pass `agent_id` to `lens.init()`, or pass it to `lens.turn()`. Lens groups every turn by agent.
1. **The export succeeded.** A short-lived process calls `lens.shutdown()` before it exits. Check the `iris.lens` warnings for a failed export, such as a rejected key.
1. **The endpoint uses Transport Layer Security (TLS).** Lens refuses an `http://` endpoint that isn't a loopback address. See [Connect over TLS](/content/develop/ai/context-engine/lens/configure.md#connect-over-tls).
1. **You're looking in the right place.** Select the agent ID the turn used, and a time range that includes it. A turn opened without a session ID appears under the session `unassigned`.

## Troubleshoot missing steps

| Symptom | Check |
| ------- | ----- |
| Model calls don't appear in the turn. | Install `redis-iris[llm-tracing]` and call `lens.init()` at startup. Lens traces the OpenAI, Anthropic, Amazon Bedrock, and LangChain clients. |
| A source shows `not-instrumented`. | Record prompt assembly, and pass `fetched()` and `used()` the same items, with their text, that you recorded as results. |
| Iris service calls don't appear. | Make the calls inside `lens.turn()`, through the service objects such as `AgentMemory`, not their generated `.client`. |
