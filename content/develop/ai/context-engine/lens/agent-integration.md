---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Trace LangGraph, OpenAI Agents SDK, Google ADK, and your own agent loop with Lens.
hideListLinks: true
linktitle: Agent integration
title: Integrate Lens with agent frameworks
weight: 20
---

Open one Lens turn around each agent run, and everything the framework does inside it joins the turn. These examples need the Lens connection values from the [quickstart](/content/develop/ai/context-engine/lens/quickstart.md#configure-the-sdk). The framework examples also need a model provider key, such as `OPENAI_API_KEY`.

## Where the turn opens

| Framework | Open the turn around |
| --------- | -------------------- |
| LangGraph | `app.invoke()` or `app.ainvoke()`. With an Iris product attached, `attach()` opens the turn for you. |
| OpenAI Agents SDK | `Runner.run()` |
| Google Agent Development Kit (ADK) | `runner.run_async()` |
| Your own loop | The handler for one message |

To trace model calls inside the turn, install `redis-iris[llm-tracing]` and call `lens.init()` at startup. See [Trace model calls](/content/develop/ai/context-engine/lens/instrument.md#trace-model-calls).

## LangGraph

Install LangGraph and the LangChain OpenAI integration:

```bash
python -m pip install 'redis-iris[llm-tracing]' langgraph langchain-openai
```

Wrap the graph run in `lens.turn()`, and use the LangGraph thread ID as the session ID:

{{< clients-example set="iris_lens_langgraph" step="langgraph_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

The turn includes the graph run, each node, and each model call, with its token counts.

### Attach an Iris product

When the graph uses Agent Memory or Agent Playbooks, `attach()` adds the product's context before your first node and its write-back after your last. With Lens on, every run of an attached graph is one turn. The session comes from `thread_id` and the user from `user_id` in the run's configuration:

{{< clients-example set="iris_lens_langgraph_attach" step="langgraph_attach" description="" lang_filter="Python (Iris)" footer="hide" />}}

`attach()` needs the `langgraph` extra: `python -m pip install 'redis-iris[langgraph]'`.

## OpenAI Agents SDK

Install the OpenAI Agents SDK:

```bash
python -m pip install 'redis-iris[llm-tracing]' openai-agents
```

Wrap `Runner.run()` in `lens.turn()`:

{{< clients-example set="iris_lens_openai_agents" step="openai_agents_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

The OpenAI Agents SDK calls models through the OpenAI client, so each model call joins the turn.

## Google ADK

Install the Google ADK:

```bash
python -m pip install redis-iris google-adk
```

Wrap the `runner.run_async()` loop in `lens.turn()`:

{{< clients-example set="iris_lens_google_adk" step="google_adk_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

The ADK example uses a Gemini model and needs `GOOGLE_API_KEY`.

## Your own agent loop

Wrap the handler for one message in `lens.turn()`, and set the outcome on each path:

{{< clients-example set="iris_lens_own_loop" step="own_loop_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

## Example: one turn across Iris products

This handler uses Agent Memory, Agent Playbooks, and Context Gateway in one turn. `workflows.turn()` runs each product's context step before the model and its write-back after, and every product call joins the turn:

{{< clients-example set="iris_lens_iris_products" step="iris_products_turn" description="" lang_filter="Python (Iris)" footer="hide" />}}

The outer `lens.turn()` sets the outcome. When a turn is already open, `workflows.turn()` and `attach()` add their steps to it rather than starting another. This example needs the connection values for each Iris product.
