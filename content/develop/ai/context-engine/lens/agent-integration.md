---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Trace LangGraph, OpenAI Agents SDK, Google ADK, and your own agent loop with Lens, across Agent Memory, Agent Playbooks, and Context Gateway.
hideListLinks: true
linktitle: Agent integration
title: Integrate Lens with agent frameworks
weight: 20
---

To trace an agent run in Lens, open a turn around it. Each step the agent takes inside the run, such as a memory recall or a model call, is recorded in that turn. For more about turns and steps, see [Lens concepts](/content/develop/ai/context-engine/lens/concepts.md).

Before you start, get the Lens connection values from the [quickstart](/content/develop/ai/context-engine/lens/quickstart.md#configure-the-sdk). The framework examples also need a model provider key, such as `OPENAI_API_KEY`.

## Where the turn opens

| Framework | Open the turn around |
| --------- | -------------------- |
| LangGraph | `app.invoke()` or `app.ainvoke()`. With an Iris service attached, `attach()` opens the turn for you. |
| OpenAI Agents SDK | `Runner.run()` |
| Google Agent Development Kit (ADK) | `runner.run_async()` |
| Your own loop | The handler for one message |

To trace model calls inside the turn, install `redis-iris[llm-tracing]` and call `lens.init()` at startup. See [Trace model calls](/content/develop/ai/context-engine/lens/instrument.md#trace-model-calls).

## Trace one turn across Iris services

When your agent uses Agent Memory, Agent Playbooks, and Context Gateway, a single Lens turn shows how each Iris service contributed to the agent's response. This example needs the connection values for each Iris service.

`workflows.turn()` runs each service's context step before the model and its write-back after. Every service call joins the turn:

{{< clients-example set="iris_lens_iris_products" step="iris_products_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

The turn shows the memory recall and the Agent Playbooks discovery, then any Context Gateway tool calls your agent makes, and the write-back. In asynchronous code, `workflows.aturn()` runs the services' context steps at the same time. The outer `lens.turn()` sets the outcome. When a turn is already open, `workflows.turn()` and `attach()` add their steps to it rather than starting another.

## LangGraph

Install LangGraph and the LangChain OpenAI integration:

```bash
python -m pip install 'redis-iris[llm-tracing]' langgraph langchain-openai
```

Wrap the graph run in `lens.turn()`. LangGraph's thread ID identifies the conversation, so pass it as the Lens session ID:

{{< clients-example set="iris_lens_langgraph" step="langgraph_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

Each model call in the graph joins the turn with its token counts.

### Attach an Iris service

When the graph uses Agent Memory or Agent Playbooks, `attach()` adds the service's context before your first node and its write-back after your last. With Lens on, every run of an attached graph is one turn. The session comes from `thread_id` and the user from `user_id` in the run's configuration:

{{< clients-example set="iris_lens_langgraph_attach" step="langgraph_attach" description="" lang_filter="Python (Iris)" footer="hide" />}}

`attach()` needs the `langgraph` extra: `python -m pip install 'redis-iris[langgraph]'`.

## OpenAI Agents SDK

Install the OpenAI Agents SDK:

```bash
python -m pip install 'redis-iris[llm-tracing]' openai-agents
```

Wrap `Runner.run()` in `lens.turn()`:

{{< clients-example set="iris_lens_openai_agents" step="openai_agents_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

The OpenAI Agents SDK calls models through the OpenAI client, so each model call joins the turn with its token counts.

## Google ADK

Install the Google ADK:

```bash
python -m pip install redis-iris google-adk
```

Wrap the `runner.run_async()` loop in `lens.turn()`:

{{< clients-example set="iris_lens_google_adk" step="google_adk_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

The turn records the agent run, its outcome, and every Iris service call the agent makes. The example uses a Gemini model and needs `GOOGLE_API_KEY`.

## Your own agent loop

Wrap the handler for one message in `lens.turn()`, and set the outcome on each path:

{{< clients-example set="iris_lens_own_loop" step="own_loop_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

Each call to `handle()` records one turn under the session and user IDs you pass. The turn is marked `completed` when the model answers, or `failed` when the call raises. Record your retrievals and prompt assembly inside the same turn to see which context reached the model.

## Next steps

- [Instrument an agent](/content/develop/ai/context-engine/lens/instrument.md): record retrievals, memory recalls, prompt assembly, and custom steps.
- [Inspect sessions](/content/develop/ai/context-engine/lens/inspect-sessions.md): read the turns you traced in the Lens user interface (UI).
- [Query sessions and turns](/content/develop/ai/context-engine/lens/read-api.md): read turns from code.
