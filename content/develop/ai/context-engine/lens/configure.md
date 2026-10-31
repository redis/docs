---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Configure the Lens SDK settings, API keys, content capture, OpenTelemetry integration, and TLS.
hideListLinks: true
linktitle: Configure
title: Configure Lens
weight: 30
---

Configure the Lens module of the Redis Iris software development kit (SDK) with environment variables, `lens.init()`, or `LensSettings`. Lens reads its environment variables once, at the first Lens or Iris service call. To apply a variable you set later, call `lens.init()`.

## Settings

| Variable | `LensSettings` field | Description |
| -------- | -------------------- | ----------- |
| `IRIS_LENS_ENDPOINT` | `endpoint` | The Iris host, such as `https://iris.example.com`. The SDK sends turns to `/iris/data/v1beta1/lens/v1/traces` on it. Setting it turns Lens on. |
| `IRIS_LENS_API_KEY` | `api_key` (read from the environment only) | The ingest key, sent with every export. |
| `IRIS_LENS_AGENT_ID` | `agent_id` | The default agent ID for this process. `lens.turn(agent_id=...)` overrides it. |
| `IRIS_LENS_SERVICE_NAME` | `service_name` | The service name recorded on every step. |
| `IRIS_LENS_ENABLED` | `enabled` | `false` keeps Lens off, even when an endpoint is set. |
| `IRIS_LENS_CAPTURE_CONTENT` | `capture_content` | Whether Lens captures prompts, completions, and retrieved text. Default `true`. |

To configure Lens in code, pass `LensSettings` to `Iris`. The key still comes from `IRIS_LENS_API_KEY`:

```python
from redis_iris import Iris, IrisSettings
from redis_iris.lens import LensSettings

settings = LensSettings(endpoint="<iris-host>", agent_id="support-bot")
iris = Iris(IrisSettings(lens=settings))
```

A blank variable counts as unset, so its default applies. `IRIS_LENS_CAPTURE_CONTENT` is the exception: a blank value turns capture off.

## Advanced settings

| Variable | Description |
| -------- | ----------- |
| `IRIS_LENS_HOST_SPANS` | `false` keeps Iris service steps out of your own tracer while Lens is off. Default `true`. |
| `IRIS_LENS_HOST_CAPTURE_CONTENT` | Whether Iris service steps sent to your own tracer include text. Default `false`. |
| `IRIS_LENS_AUTO_INSTRUMENT` | `false` turns off Iris service steps and keeps `lens.init()` from tracing model calls. |
| `IRIS_LENS_INSTRUMENT_AGENT_MEMORY` | `false` turns off Agent Memory steps. |
| `IRIS_LENS_INSTRUMENT_PLAYBOOK` | `false` turns off Agent Playbooks steps. |
| `IRIS_LENS_INSTRUMENT_THREADS` | `false` keeps `lens.init()` from carrying turns across Python threads. |
| `IRIS_LENS_OWN_PROVIDER` | `false` keeps Lens from installing a global OpenTelemetry tracer provider. |
| `IRIS_LENS_DROP_SCOPES` | A comma-separated list of OpenTelemetry instrumentation scope names that Lens never exports. It replaces the default list, so include any defaults you want to keep. |
| `IRIS_LENS_DROP_REDIS_COMMANDS` | A comma-separated list of Redis commands Lens never exports. |
| `IRIS_LENS_STRICT` | `true` makes `lens.turn()` raise an error when it has no session ID. |
| `IRIS_LENS_AUTH_HEADER` | The header that carries the ingest key. Default `Authorization`, as `Bearer <key>`. |
| `IRIS_LENS_ALLOW_INSECURE` | `true` permits an `http://` endpoint that isn't a loopback address. |

Lens uses its own exporter. It reads no `OTEL_EXPORTER_OTLP_*` variables. Proxies and certificate bundles come from `HTTPS_PROXY`, `NO_PROXY`, and `SSL_CERT_FILE`.

## API keys and scopes

Lens keys have one of three scopes:

| Scope | Use it for |
| ----- | ---------- |
| `ingest` | Agents that send turns to Lens. |
| `read` | People and tools that read turns, in the Lens user interface (UI) or with the read application programming interface (API). |
| `full` | Both. |

Agents send their key as `IRIS_LENS_API_KEY`. The read client reads its key from `LENS_API_KEY`. Give each agent an ingest key and each reader a read key, so an agent's key can't read other agents' turns. On Redis Cloud, [create keys in the console](/content/operate/iris/lens/create-lens.md#create-api-keys). Self-managed, your administrator creates them.
<!-- TODO: link the self-managed operator guide for creating Lens keys when it exists. -->

## Control content capture

Set `IRIS_LENS_CAPTURE_CONTENT=false` to send no text to Lens. Lens also removes prompt and completion text that other instrumentation added, before export. See [content capture](/content/develop/ai/context-engine/lens/concepts.md#content-capture) for what Lens keeps.

## Use Lens with your existing OpenTelemetry setup

Lens is built on OpenTelemetry and works with the tracing your application already has:

- If your application has a tracer provider, Lens adds its processor to it. Steps your application records inside a turn are exported to Lens as well.
- If your application has no tracer provider, Lens installs one. To prevent that, set `IRIS_LENS_OWN_PROVIDER=false`.
- Lens steps also reach your provider's other processors, so they appear in your existing observability tools.
- While Lens is off, Iris service steps still go to your own tracer, without text. Your existing tools see Iris latency and errors with no Lens endpoint configured.

## Connect over TLS

Lens sends turns over Transport Layer Security (TLS), so use an `https://` endpoint. Lens verifies the server certificate and never follows redirects, so the key and captured content go only to the endpoint you set.

For local testing, `http://` works with loopback addresses such as `localhost`. To permit `http://` elsewhere, set `IRIS_LENS_ALLOW_INSECURE=true`.
