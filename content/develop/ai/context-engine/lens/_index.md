---
Title: Lens
alwaysopen: false
categories:
- docs
- develop
- ai
description: Debug agent answers by tracing the context behind each turn, from retrieval to prompt.
linkTitle: Lens
hideListLinks: true
weight: 27
bannerText: Lens is currently available in preview. Features and behavior are subject to change.
bannerChildren: true
---

## What is Lens?

Lens shows why your AI agent answered the way it did. For each turn, it records what each source returned, what entered the prompt, which model and tool calls ran, how long each step took, and how the turn ended.

When an agent gives a wrong answer, Lens shows the cause. You can see that the right memory was recalled but dropped from the prompt, or that a retrieval came back empty.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card icon="images/icon_logo/icon-data-structures-64-midnight.png" title="Concepts" description="Learn how sessions, turns, steps, and fetched and used context work" url="/develop/ai/context-engine/lens/concepts" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Quickstart" description="Trace your first turn and read it back" url="/develop/ai/context-engine/lens/quickstart" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Agent integration" description="Trace agents built with LangGraph, the OpenAI Agents SDK, and more" url="/develop/ai/context-engine/lens/agent-integration" >}}
</div>

## Why use Lens?

- **See why an agent answered the way it did:** Compare what each source returned with what entered the prompt, turn by turn.
- **Iris products trace themselves:** Agent Memory, Agent Playbooks, and Context Gateway calls appear in the turn with no extra code.
- **Model calls traced automatically:** Calls through OpenAI, Anthropic, Amazon Bedrock, and LangChain clients appear with their prompts, completions, and token counts.
- **Built on OpenTelemetry:** Lens joins the tracer your application already uses, and Iris product steps reach your existing observability tools as well.
- **You control content capture:** Capture prompts and retrieved text for debugging, or keep only IDs, hashes, and counts.
- **Background export:** Your agent doesn't wait on Lens, and a failed export doesn't raise into your agent.

## How it works

1. Your agent opens a turn for each message with the Redis Iris software development kit (SDK).
1. The SDK records each step in the turn: retrievals, memory recalls, prompt assembly, model calls, tool calls, and Iris product calls.
1. Lens assembles the turn and groups it into sessions by agent.
1. You inspect the turn in the Lens user interface (UI) or query it with the read application programming interface (API).

![Your agent and the Iris products it calls record steps through the Redis Iris SDK. The SDK exports each turn to Lens, where you inspect it in the Lens UI or query it with the read API.](/images/ai/context-engine/lens-how-it-works.svg)
{width="700"}

## Get started

1. Get your Lens endpoints and keys from your administrator.
   <!-- TODO: link the operator guides for creating an instance and keys when they exist. -->
1. [Trace your first turn](/content/develop/ai/context-engine/lens/quickstart.md).

## Use Lens

- [Instrument an agent](/content/develop/ai/context-engine/lens/instrument.md): record turns, retrievals, prompt assembly, and custom steps.
- [Integrate with an agent framework](/content/develop/ai/context-engine/lens/agent-integration.md): trace LangGraph, OpenAI Agents SDK, Google Agent Development Kit (ADK), and your own loop.
- [Inspect sessions](/content/develop/ai/context-engine/lens/inspect-sessions.md): find a session and read its turns in the Lens UI.
- [Configure Lens](/content/develop/ai/context-engine/lens/configure.md): settings, keys, content capture, and OpenTelemetry.
- [Query sessions and turns](/content/develop/ai/context-engine/lens/read-api.md): read turns from code.
- [Limits and errors](/content/develop/ai/context-engine/lens/limits.md): request limits, export behavior, and troubleshooting.
- [API reference](/content/develop/ai/context-engine/lens/api-reference.md): the read API operations and data models.
