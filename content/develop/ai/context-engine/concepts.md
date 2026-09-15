---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Learn how familiar Redis patterns work differently in Redis Iris, and what's new for building AI agents.
hideListLinks: true
linktitle: Concepts
title: Redis Iris concepts
weight: 5
---

Redis Iris reuses Redis primitives you likely already know, but not all of your existing assumptions carry over. This page covers the shifts that apply across all three services. Each service also has its own concepts page for what's specific to it: [LangCache](/content/develop/ai/context-engine/langcache/concepts.md), [Agent Memory](/content/develop/ai/context-engine/agent-memory/concepts.md), and [Context Retriever](/content/develop/ai/context-engine/context-retriever/concepts.md).

## Context is a budget, not a store

Every service in Iris exists to manage a resource that's smaller than it looks: the model's context window. Agent Memory decides what's worth keeping and summarizes the rest. LangCache avoids spending a model call at all when a similar one already ran. Context Retriever returns exactly the data a tool call needs, not a raw query result. Treat "what goes into the next model call" as a budget you're actively managing at every layer, not something that takes care of itself once you've wired up the right service.

## State isolation is semantic, not just structural

If you've built concurrent systems before, you're used to races being structural — two writers touching the same key, resolved with a lock or a transaction. When multiple agents or multiple users share Redis Iris services, the races that matter are often semantic instead: two agents writing similar-but-different memories about the same user, or two near-duplicate cache entries competing to answer the same class of question. Locking a key doesn't prevent this — scoping by user, namespace, and memory or entry type does. Design your scoping keys (owner ID, namespace, session ID) as carefully as you'd design a lock strategy in a traditional concurrent system.

## Trust boundaries move to where the agent acts, not where data is stored

In a traditional application, the trust boundary is usually the database: application code is trusted, external input is not, and the database enforces permissions at the boundary between them. An agent complicates this, because the agent's next action can be influenced by content it's processing — a retrieved document, a summarized conversation, a tool's own output — that you don't fully control. Context Retriever's governed tool-calling model exists specifically because "trusted code, untrusted data" breaks down once the code's next step is chosen by a model reading that data. Assume anything an agent reads can shape what it does next, and design the tools and memory it can reach accordingly.

## Further reading

- [Long-horizon AI agents: memory & state infrastructure](https://redis.io/blog/long-horizon-ai-agents-memory-state-infrastructure/) — failure modes specific to agents that run longer than a single request.
- [Agent memory as a moat: how context compounds](https://redis.io/blog/compounding-context-memory-as-the-moat/) — governance and retention tradeoffs as context accumulates across services.
- [AI agent context engine FAQ](https://redis.io/blog/faq-real-time-context-engine-agent-memory-and-retrieval/) — build-vs-buy, vendor-comparison, and "isn't this overkill" questions this page doesn't cover.

## Next steps

See the [Getting Started with Redis Iris](https://redis.io/tutorials/getting-started-with-redis-iris/) tutorial for a hands-on walkthrough of LangCache, Agent Memory, and Context Retriever, or go directly to a service's own concepts page and quickstart.
