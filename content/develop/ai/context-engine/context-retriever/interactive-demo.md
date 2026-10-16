---
Title: Context Retriever interactive demo
alwaysopen: false
categories:
- docs
- develop
- ai
description: See how Context Retriever turns the keys in a Redis database into MCP tools that an agent calls to answer questions.
linkTitle: Interactive demo
weight: 20
hideListLinks: true
---

Context Retriever reads a data model that you define once, and generates the tools an agent uses to query your data. The agent calls those tools over MCP (Model Context Protocol) and never connects to Redis itself.

This demo runs in your browser with sample data from a food delivery app: customers, restaurants, and orders. It doesn't connect to a Context Retriever service, but the tool names, arguments, and responses follow the same shape a real service returns.

{{< context-retriever-demo >}}

## What the demo shows

1. **Keys in Redis.** Each business object is a JSON document, and its key name starts with the object type, such as `restaurant:r201`.
2. **Data model to tools.** A key template such as `restaurant:{id}` tells Context Retriever which keys belong to an entity. The fields you index decide which tools it generates and which arguments those tools accept.
3. **Ask over MCP.** The agent lists the tools, picks one or more for each question, and combines the results into an answer.

Try removing the index from a field in step 2, then ask a question that needs it. The server rejects the call, because the tool no longer accepts that field.

## Next steps

- [Create a Context Retriever service](/content/operate/iris/context-retriever/create-service.md) on Redis Cloud.
- Read the [Context Retriever overview](/content/develop/ai/context-engine/context-retriever/_index.md).
