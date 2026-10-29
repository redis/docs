---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Watch session memory and long-term memory change as a customer talks to an AI assistant, then see what the assistant recalls in a later conversation.
hideListLinks: true
linktitle: Interactive demo
title: Redis Agent Memory interactive demo
weight: 9
---

Redis Agent Memory gives an AI agent two tiers of memory. Session memory holds the current conversation, and long-term memory holds what the agent should remember across conversations. This demo follows one customer of a food delivery app through two conversations. You choose what she says, and the demo shows what each tier stores, when it changes, and how long it lasts.

The demo runs in your browser and doesn't connect to an Agent Memory service. Its requests and responses follow the shapes of the [Agent Memory API](/content/develop/ai/context-engine/agent-memory/api-reference.md). The customer, restaurants, and order come from the same sample data as the [Context Retriever interactive demo](/content/develop/ai/context-engine/context-retriever/interactive-demo.md).

{{< agent-memory-demo >}}

Try different messages to see how they change what the service remembers. Open **Service settings** to change how the service behaves. For example, have the customer share her gate code, then set sensitive-data exclusions to **Off** and see where the code ends up.

## Session memory and long-term memory compared

| | Session memory | Long-term memory |
|:--|:--|:--|
| **What it stores** | Every event in a conversation, as sent and in order | Standalone facts and events that may be useful in later conversations |
| **When it's written** | When your application adds an event | In the background on the extraction cadence, or when your application creates memories directly |
| **How your application reads it** | Fetches the session by its ID | Searches by meaning, filtered by owner, session, namespace, topic, or memory type |
| **How long it's kept** | The short-term TTL, 1 hour by default | The long-term TTL, 365 days by default |
| **How it stays compact** | Automatic summarization condenses older events | Extraction keeps only the information worth remembering |
| **Sensitive-data exclusions** | Not applied. Events and summaries are kept as sent | Applied when memories are extracted from a session |

## Next steps

- [Create an Agent Memory service](/content/operate/iris/agent-memory/create-service.md) on Redis Cloud.
- Follow the [REST API quickstart](/content/develop/ai/context-engine/agent-memory/rest-api-quickstart.md) or the [Python SDK quickstart](/content/develop/ai/context-engine/agent-memory/python-sdk-quickstart.md) to try the same flow with a real service.
