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

Call `lens.init()` once at startup. It turns Lens on, traces model calls, and sets the agent ID and service name:

{{< clients-example set="iris_lens_instrument" step="init" description="" lang_filter="Python (Iris)" footer="hide" />}}

Without `lens.init()`, Lens starts at the first Lens or Iris service call when `IRIS_LENS_ENDPOINT` is set, and records everything except model calls. You can also pass Lens settings to `Iris(IrisSettings(lens=...))`. See [Configure Lens](/content/develop/ai/context-engine/lens/configure.md) for every setting.

## Open a turn

Wrap each agent exchange in `lens.turn()`. Pass the session ID, and optionally a thread ID, a user ID, and an agent ID that overrides the process default:

{{< clients-example set="iris_lens_instrument" step="open_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

Use `set_attribute()` to add your own fields to the turn, and `set_outcome()` to record how it ended. See [turn outcomes](/content/develop/ai/context-engine/lens/concepts.md#turn-outcomes) for the values.

`lens.turn()` works the same in asynchronous code: open it with `with` around the `await` calls of one exchange.

## What Iris services record

Agent Memory, Agent Playbooks, and Context Gateway calls record their own steps inside the open turn, in both their synchronous and asynchronous forms:

| Service | Steps recorded |
| ------- | -------------- |
| Agent Memory | Memory recalls, session events, and memory writes and deletes. |
| Agent Playbooks | Discovery, skill loads, skill resource reads, and proposals. |
| Context Gateway | Tool listings and each tool call, with its upstream tool name. |

These steps come from the Redis Iris service objects, such as `AgentMemory` and `AgentPlaybooks`. To record a call on a service's generated client (`.client`), wrap it in `lens.memory_recall()`, `lens.retrieval()`, or `lens.span()`.

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

Lens matches items by their text, so pass the same items you recorded as results. The turn then shows which results entered the prompt and which weren't used. See [fetched and used context](/content/develop/ai/context-engine/lens/concepts.md#fetched-and-used-context).

## Add custom steps

Wrap any operation in `lens.span()` to record it in the turn. Pass attributes as keyword arguments, or set them on the step:

{{< clients-example set="iris_lens_instrument" step="custom_span" description="" lang_filter="Python (Iris)" footer="hide" />}}

Custom steps are part of the turn's trace, and the read API returns them in the turn's `spans`.

## Include other instrumentation

Lens exports the spans other OpenTelemetry instrumentation creates inside a turn, apart from a default set of low-level scopes such as database drivers. To also export spans created outside a turn, or from an excluded scope, wrap the call in `lens.include()`. It works as a decorator or a context manager:

{{< clients-example set="iris_lens_instrument" step="include" description="" lang_filter="Python (Iris)" footer="hide" />}}

## Get the turn ID

Read the turn ID to link a turn to your own logs, or to [fetch the turn](/content/develop/ai/context-engine/lens/read-api.md#get-a-turn) with the read application programming interface (API). Inside a turn, call `lens.current_trace_id()`. After the turn, read `trace_id` from the turn handle:

{{< clients-example set="iris_lens_instrument" step="turn_id" description="" lang_filter="Python (Iris)" footer="hide" />}}

## Carry a turn across processes

When a turn continues in another process, such as a queue worker, pass its context with the work. Call `lens.inject()` to write the turn context into a dictionary, and `lens.continue_from()` on the other side to resume the turn:

{{< clients-example set="iris_lens_instrument" step="cross_process" description="" lang_filter="Python (Iris)" footer="hide" />}}

Steps recorded in the worker join the same turn. The dictionary carries the session, user, and agent IDs, so send it only to services you trust, and resume only from dictionaries your own services created.

Within one process, `lens.init()` with the `llm-tracing` extra carries the turn into threads your code starts.

## Shut down

Before a short-lived process exits, call `lens.shutdown()`:

{{< clients-example set="iris_lens_instrument" step="shutdown" description="" lang_filter="Python (Iris)" footer="hide" />}}

`shutdown()` waits for the export queue to flush and returns `True` when the flush completes. A failed export logs a warning on the `iris.lens` logger. `shutdown()` also turns Lens off for the rest of the process, so call it once, when your program is done tracing. Long-running services export continuously and call it only when they stop.
