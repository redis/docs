---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Watch a semantic cache answer customers' repeat questions, tune its similarity threshold, and scope answers with attributes.
hideListLinks: true
linktitle: Interactive demo
title: Redis LangCache interactive demo
weight: 5
---

Redis LangCache stores the answers your LLM generates and returns them when someone asks a similar question, so your app doesn't call the LLM again. This demo follows the help assistant of a food delivery app. You choose which questions its customers ask, and the demo shows each search, each cache hit or miss, and what the cache stores.

The demo runs in your browser and doesn't connect to a LangCache service or an LLM. Its requests and responses follow the shapes of the [LangCache API](/content/develop/ai/context-engine/langcache/api-reference.md). The similarity scores, answers, and timings are illustrative. The customers and restaurants come from the same sample data as the [Context Retriever interactive demo](/content/develop/ai/context-engine/context-retriever/interactive-demo.md).

{{< langcache-demo >}}

## What the demo shows

1. **Hits and misses.** The app searches the cache before it calls the LLM. A miss calls the LLM and stores the answer, so the next similar question is a hit.
2. **Similarity threshold.** A search is a hit when a cached prompt is at least as similar as the threshold. A higher threshold gives fewer wrong answers and more LLM calls. A lower threshold does the opposite.
3. **Attributes.** Attributes scope searches and deletes. A restaurant attribute keeps one restaurant's answers from reaching another restaurant's customers, and lets the app delete a restaurant's answers when its menu changes.

## Next steps

- Read [LangCache concepts](/content/develop/ai/context-engine/langcache/concepts.md) to learn how to choose a similarity threshold.
- [Create a LangCache service](/content/operate/iris/langcache/create-service.md) on Redis Cloud.
- Use the [LangCache API and SDK](/content/develop/ai/context-engine/langcache/api-examples.md) to search and store entries from your app.
