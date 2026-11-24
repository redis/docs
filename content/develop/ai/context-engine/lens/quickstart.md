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

Get these values. On Redis Cloud, [create Lens and its keys](/content/operate/iris/lens/create-lens.md). Self-managed, get them from your administrator, who [hands them off](/content/operate/iris/lens/self-managed/deploy.md#hand-off-to-developers) after deploying Lens.

- The Iris host, such as `https://iris.example.com`. The SDK sends turns there, and the read client reads them back from there.
- An ingest key, for sending turns.
- Your instance ID and a read key, for reading turns back.

You also need Python 3.11 or later. The cURL example uses Bash and jq. The example calls OpenAI, so it also needs the `openai` package and an `OPENAI_API_KEY`. Any model client that the `llm-tracing` extra supports works the same way. For the configuration `redis-iris` reads across services, see [SDK and CLI setup](/content/develop/ai/context-engine/sdk-and-cli.md).

## Install the SDK

Install the Redis Iris SDK, which includes Lens instrumentation, and the Lens read client:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install 'redis-iris[llm-tracing]>=1.0.0'
python -m pip install 'redis-agent-lens>=1.0.0'
```

The `llm-tracing` extra traces OpenAI, Anthropic, Amazon Bedrock, and LangChain model calls automatically. `redis-agent-lens` is the read client the last step uses.

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

This turn wraps one OpenAI call. The `llm-tracing` extra records the call as a step in the turn.

{{< clients-example set="iris_lens_quickstart" step="trace_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

The example prints the session ID and the turn ID. Keep both to find the turn.

## Find the turn

A turn is readable a few seconds after its export.

To view it in Lens:

1. Open Lens. On Redis Cloud, select **Lens** under **Iris** in the console menu; Lens uses your console sign-in. Self-managed, Lens asks for a credential: paste your read key and select **Connect**. Your administrator [connects Lens to the console](/content/operate/iris/lens/self-managed/operations.md#connect-the-console).
1. Select the `lens-quickstart` agent.
1. Select the session that matches the printed session ID.
1. Expand the turn.

The turn shows the model call as a step, with its prompt, completion, and token counts.

To read the same turn with the read API, set `TURN_ID` for the cURL example first:

```bash
export TURN_ID='<printed-turn-id>'
```

{{< clients-example set="iris_lens_quickstart" step="find_turn" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

The Python example retries until the turn is readable, then prints its outcome and token count:

```
Outcome: COMPLETED
Tokens: <total-tokens>
```

## Next steps

- [Learn the concepts](/content/develop/ai/context-engine/lens/concepts.md) behind sessions, turns, and steps.
- [Instrument an agent](/content/develop/ai/context-engine/lens/instrument.md) to record retrievals, model calls, and custom steps.
- [Integrate with an agent framework](/content/develop/ai/context-engine/lens/agent-integration.md) such as LangGraph, the OpenAI Agents SDK, or the Google Agent Development Kit (ADK).
