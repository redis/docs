---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Trace one agent turn with the Python SDK, then find it in Lens and read it back with the read API.
hideListLinks: true
linktitle: Quickstart
title: Lens quickstart
weight: 10
---

Trace one agent turn with the Lens Python software development kit (SDK), then find it in Lens and read it back with the Lens read application programming interface (API).

## Before you begin

Get these values from your administrator:

- The Lens ingest endpoint and an ingest key, for sending turns.
- The Lens read endpoint, your instance ID, and a read key, for reading them back.
<!-- TODO: link the operator guides for creating an instance and keys when they exist. -->

You also need Python 3.11 or later. This walkthrough needs no agent framework or model provider key.

## Install the SDK

Install the Redis Iris SDK, which includes Lens instrumentation, and the Lens read client:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-iris redis-agent-lens
```

## Configure the SDK

Export these values in the shell where you run the example:

```bash
export IRIS_LENS_ENDPOINT='<lens-ingest-endpoint>'
export IRIS_LENS_API_KEY='<lens-ingest-key>'
export IRIS_LENS_AGENT_ID='lens-quickstart'

export LENS_URL='<lens-read-endpoint>'
export LENS_INSTANCE_ID='<lens-instance-id>'
export LENS_API_KEY='<lens-read-key>'
```

Setting `IRIS_LENS_ENDPOINT` turns Lens on. Use the endpoint's base address, including `https://`. The SDK sends `IRIS_LENS_API_KEY` with every export, and the read client sends `LENS_API_KEY` with every read.

Keep keys out of source control and model prompts.

## Trace one turn

Expand the example to copy the complete program. Save it as `quickstart.py`, then run `python quickstart.py`.

This turn records a memory recall that returns three memories, then a prompt assembly that uses two of them.

{{< clients-example set="lens_quickstart" step="trace_turn" description="" lang_filter="Python" footer="hide" />}}

The example prints the session ID and the turn ID. Keep both to find the turn.

Lens exports turns in the background. Before a short-lived process exits, flush the export:

{{< clients-example set="lens_quickstart" step="flush" description="" lang_filter="Python" footer="hide" />}}

`shutdown()` waits for the export to finish and returns `True` when it does. It also turns Lens off for the rest of the process, so call it only when your program is done tracing.

## Find the turn

A turn is readable a few seconds after its export.

To view it in Lens:

1. Open Lens. If Lens asks for a credential, paste your read key and select **Connect**.
1. Select the `lens-quickstart` agent.
1. Select the session that matches the printed session ID.
1. Expand the turn.

The turn shows a **Recall** step with three memories and a **Prompt** step that used two of them.

To read the same turn with the read API:

{{< clients-example set="lens_quickstart" step="find_turn" description="" lang_filter="Python" footer="hide" dft_tab_name="cURL" >}}
curl -s "$LENS_URL/v1/instances/$LENS_INSTANCE_ID/turns/<turn-id>" \
    -H "Authorization: Bearer $LENS_API_KEY"
{{< /clients-example >}}

Replace `<turn-id>` with the printed turn ID. The Python example retries until the turn is readable, then prints its outcome and one line per source. The memory recall's source is its store ID:

```
Outcome: completed
quickstart-store: fetched 3, used 2
```

## Next steps

- [Learn the concepts](/content/develop/ai/context-engine/lens/concepts.md) behind sessions, turns, and fetched and used context.
- [Instrument an agent](/content/develop/ai/context-engine/lens/instrument.md) to record retrievals, model calls, and custom steps.
- [Integrate with an agent framework](/content/develop/ai/context-engine/lens/agent-integration.md) such as LangGraph, the OpenAI Agents SDK, or Google ADK.
