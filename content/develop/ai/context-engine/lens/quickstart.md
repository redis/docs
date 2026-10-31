---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Trace one agent turn with the Redis Iris SDK, then find it in Lens and read it back with the read API.
hideListLinks: true
linktitle: Quickstart
title: Lens quickstart
weight: 10
---

Trace one agent turn with the Redis Iris software development kit (SDK), then find it in Lens and read it back with the Lens read application programming interface (API).

## Before you begin

Get these values. On Redis Cloud, [create Lens and its keys](/content/operate/iris/lens/create-lens.md). Self-managed, get them from your administrator.

- The Iris host, such as `https://iris.example.com`. The SDK sends turns there, and the read client reads them back from there.
- An ingest key, for sending turns.
- Your instance ID and a read key, for reading turns back.
<!-- TODO: link the operator guides for creating an instance and keys when they exist. -->

You also need Python 3.11 or later. The cURL example uses Bash and jq. This walkthrough needs no agent framework or model provider key. For the configuration `redis-iris` reads across services, see [SDK and CLI setup](/content/develop/ai/context-engine/sdk-and-cli.md).

## Install the SDK

Install the Redis Iris SDK, which includes Lens instrumentation, and the Lens read client:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-iris 'redis-agent-lens>=0.1.0a4'
```
<!-- TODO: confirm the install command; the console uses pip install --pre "redis-iris[llm-tracing]" -->

## Configure the SDK

Export these values in the shell where you run the example:

```bash
export IRIS_LENS_ENDPOINT='<iris-host>'
export IRIS_LENS_API_KEY='<lens-ingest-key>'
export IRIS_LENS_AGENT_ID='lens-quickstart'

export LENS_URL='<iris-host>'
export LENS_INSTANCE_ID='<lens-instance-id>'
export LENS_API_KEY='<lens-read-key>'
```

Setting `IRIS_LENS_ENDPOINT` turns Lens on. Use the host only, including `https://`. The SDK adds the Lens path. The SDK sends `IRIS_LENS_API_KEY` with every export, and the read client sends `LENS_API_KEY` with every read.

Keep keys out of source control and model prompts.

## Trace one turn

Expand the example to copy the complete program. Save it as `quickstart.py`, then run `python quickstart.py`.

This turn records a memory recall that returns three memories, then a prompt assembly that uses two of them.

{{< clients-example set="iris_lens_quickstart" step="trace_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

The example prints the session ID and the turn ID. Keep both to find the turn.

Lens exports turns in the background. Before a short-lived process exits, flush the export:

{{< clients-example set="iris_lens_quickstart" step="flush" description="" lang_filter="Python (Iris)" footer="hide" />}}

`shutdown()` returns `True` when the flush completes. If an export fails, the SDK logs a warning on the `iris.lens` logger. `shutdown()` also turns Lens off for the rest of the process, so call it only when your program is done tracing.

## Find the turn

A turn is readable a few seconds after its export.

To view it in Lens:

1. Open Lens. On Redis Cloud, select **Lens** under **Iris** in the console menu; Lens uses your console sign-in. Self-managed, Lens asks for a credential: paste your read key and select **Connect**.
   <!-- TODO: describe where to open Lens self-managed when the operator pages exist. -->
1. Select the `lens-quickstart` agent.
1. Select the session that matches the printed session ID.
1. Expand the turn.

The turn shows an **Agent Memory** step with three memories: two marked **Entered prompt** and one marked **Not used**.

To read the same turn with the read API, set `TURN_ID` for the cURL example first:

```bash
export TURN_ID='<printed-turn-id>'
```

{{< clients-example set="iris_lens_quickstart" step="find_turn" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

The Python example retries until the turn is readable, then prints its outcome and one line per source. The memory recall's source is its store ID:

```
Outcome: completed
quickstart-store: fetched 3, used 2
```

## Next steps

- [Learn the concepts](/content/develop/ai/context-engine/lens/concepts.md) behind sessions, turns, and fetched and used context.
- [Instrument an agent](/content/develop/ai/context-engine/lens/instrument.md) to record retrievals, model calls, and custom steps.
- [Integrate with an agent framework](/content/develop/ai/context-engine/lens/agent-integration.md) such as LangGraph, the OpenAI Agents SDK, or the Google Agent Development Kit (ADK).
