---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Record turns, retrievals, memory recalls, prompt assembly, model calls, and custom steps with the Redis Iris SDK.
hideListLinks: true
linktitle: Instrument an agent
title: Instrument an agent
weight: 15
---

Record each agent turn and the steps inside it with `redis_iris.lens`, the Lens module of the Redis Iris software development kit (SDK). These examples need the Lens connection values from the [quickstart](/content/develop/ai/context-engine/lens/quickstart.md#configure-the-sdk).

## Turn Lens on

Lens starts when `IRIS_LENS_ENDPOINT` is set, from the first Lens or Iris product call. Call `lens.init()` at startup to also trace model calls, and to set the agent ID and service name in code:

{{< clients-example set="iris_lens_instrument" step="init" description="" lang_filter="Python (Iris)" footer="hide" />}}

`lens.init()` returns `True` when Lens is on. You can also pass Lens settings to `Iris(IrisSettings(lens=...))`. See [Configure Lens](/content/develop/ai/context-engine/lens/configure.md) for every setting.

## Open a turn

Wrap each agent exchange in `lens.turn()`. Pass the session ID, and optionally a thread ID, a user ID, and an agent ID that overrides the process default:

{{< clients-example set="iris_lens_instrument" step="open_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

Use `set_attribute()` to add your own fields to the turn, and `set_outcome()` to record how it ended. See [turn outcomes](/content/develop/ai/context-engine/lens/concepts.md#turn-outcomes) for the values.

## What Iris products record

Agent Memory, Agent Playbooks, and Context Gateway calls record their own steps inside the open turn, in both their synchronous and asynchronous forms:

| Product | Steps recorded |
| ------- | -------------- |
| Agent Memory | Memory recalls, session events, and memory writes and deletes. |
| Agent Playbooks | Discovery, skill loads, skill resource reads, and proposals. |
| Context Gateway | Tool listings and each tool call, with its upstream tool name. |

These steps come from the Redis Iris product objects, such as `AgentMemory` and `AgentPlaybooks`. Calls you make on a product's generated client (`.client`) aren't recorded; wrap them in `lens.memory_recall()`, `lens.retrieval()`, or `lens.span()`.

## Trace model calls

Install the `llm-tracing` extra, then call `lens.init()` at startup:

```bash
python -m pip install 'redis-iris[llm-tracing]'
```

Lens then records calls made through the OpenAI, Anthropic, Amazon Bedrock, and LangChain client libraries, including LangGraph. Each model call records its prompt, completion, and token counts, and the turn records its token totals.

## Record retrievals

Wrap your own retrieval in `lens.retrieval()` and record its results as `(id, score, text)` tuples:

{{< clients-example set="iris_lens_instrument" step="retrieval" description="" lang_filter="Python (Iris)" footer="hide" />}}

Pass `None` as the score for a source that doesn't return one. Lens records it as no score rather than a score of zero.

## Record memory recalls

Wrap a recall from a long-term memory store in `lens.memory_recall()`. The store ID becomes the recall's source:

{{< clients-example set="iris_lens_instrument" step="memory_recall" description="" lang_filter="Python (Iris)" footer="hide" />}}

## Record prompt assembly

Record which retrieved items entered the prompt. Pass everything you fetched to `fetched()` and the items you kept to `used()`:

{{< clients-example set="iris_lens_instrument" step="prompt_assembly" description="" lang_filter="Python (Iris)" footer="hide" />}}

Lens matches items by their text, so pass the same items you recorded as results. The turn then shows which results entered the prompt and which were dropped. See [fetched and used context](/content/develop/ai/context-engine/lens/concepts.md#fetched-and-used-context).

## Add custom steps

Wrap any operation in `lens.span()` to record it as a step. Pass attributes as keyword arguments, or set them on the step:

{{< clients-example set="iris_lens_instrument" step="custom_span" description="" lang_filter="Python (Iris)" footer="hide" />}}

## Include other instrumentation

Lens exports its own steps and the steps of supported libraries. To also export steps that another OpenTelemetry (OTel) instrumentation creates, such as a vector store client, wrap the call in `lens.include()`. It works as a decorator or a context manager:

{{< clients-example set="iris_lens_instrument" step="include" description="" lang_filter="Python (Iris)" footer="hide" />}}

## Get the turn ID

Read the turn ID to link a turn to your own logs or to open it in Lens. Inside a turn, call `lens.current_trace_id()`. After the turn, read `trace_id` from the turn handle:

{{< clients-example set="iris_lens_instrument" step="turn_id" description="" lang_filter="Python (Iris)" footer="hide" />}}

## Carry a turn across processes

When a turn continues in another process, such as a queue worker, pass its context with the work. Call `lens.inject()` to write the turn context into a dictionary, and `lens.continue_from()` on the other side to resume the turn:

{{< clients-example set="iris_lens_instrument" step="cross_process" description="" lang_filter="Python (Iris)" footer="hide" />}}

Steps recorded in the worker join the same turn. The dictionary carries the session, user, and agent IDs, so send it only to services you trust, and resume only from dictionaries your own services created.

## Shut down

Before a short-lived process exits, call `lens.shutdown()`. It waits for the export to finish and returns `True` when it does:

{{< clients-example set="iris_lens_instrument" step="shutdown" description="" lang_filter="Python (Iris)" footer="hide" />}}

`shutdown()` also turns Lens off for the rest of the process. Call it once, when your program is done tracing. Long-running services export continuously and don't need it until they stop.
