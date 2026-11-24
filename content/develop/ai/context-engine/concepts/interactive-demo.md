---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Step through one agent request across Intent Router, Agent Playbooks, Agent Memory, and Context Gateway, then take a service away to see what the agent loses.
hideListLinks: true
linktitle: Interactive demo
title: Redis Iris interactive demo
weight: 10
aliases:
- /develop/ai/context-engine/interactive-demo/
---

{{< iris-demo >}}

Redis Iris gives an AI agent routing, governed access to live business data, memory, and approved answers. This tour follows one customer request through four services, one step at a time, in the order described in [How Redis Iris works](/content/develop/ai/context-engine/concepts/_index.md). Lens then shows how the request ran. The last step takes one service away to show what the agent loses without it.

The tour runs in your browser and doesn't connect to any service. Each step links to that service's docs or its own interactive demo, which covers it in depth. The agent's reasoning, the reply, and the timings are illustrative.

## What each service adds

| Service | What it does in this request | Without it |
|:--|:--|:--|
| [Intent Router](/content/develop/ai/context-engine/intent-router/_index.md) | Matches the message to the `reorder` and `delivery_fee` intents in milliseconds, without a model call | The reply is the same, but a model call has to work out what the customer wants first, which adds time and tokens |
| [Context Gateway](/content/develop/ai/context-engine/context-gateway/_index.md) | Looks up delivery times, alternatives, and past orders through governed tools | The agent can't check whether the food will arrive in time |
| [Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md) | Recalls last week's order and the customer's peanut allergy | The agent can find the order, but not the allergy |
| [Agent Playbooks](/content/develop/ai/context-engine/agent-playbooks/_index.md) | Answers the general delivery fee question with the frequently asked question (FAQ) the support team published | The model doesn't know the app's fees, so it gives a vague answer, or makes one up |

[Lens](/content/develop/ai/context-engine/lens/_index.md) and [Agent Mesh](/content/develop/ai/context-engine/agent-mesh/_index.md) are in beta, and neither changes the reply. Lens records each step of the request, including which memories entered the prompt, so you can see how the agent got there. Agent Mesh isn't part of the tour. It keeps a long agent response deliverable when the client disconnects, so the client can reconnect and receive the updates it missed.

## Next steps

- See [how a request flows through Redis Iris](/content/develop/ai/context-engine/concepts/request-flow.md), capability by capability.
- Get started with [Redis Iris on Redis Cloud](/content/operate/iris/_index.md).
