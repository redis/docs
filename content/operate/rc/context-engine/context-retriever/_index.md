---
alwaysopen: false
categories:
- docs
- operate
- rc
description: Expose schema-first retrieval tools from your Redis Cloud data to AI agents.
hideListLinks: true
linktitle: Context Retriever
title: Redis Context Retriever on Redis Cloud
weight: 37
bannerText: Redis Context Retriever on Redis Cloud is currently available in preview. Features and behavior are subject to change.
bannerChildren: true
---

Redis Context Retriever helps teams expose operational context to AI agents through schema-first retrieval. It models the entities, fields, keys, and relationships that matter to an agent workflow, then presents that context through a governed tool surface the agent can call at runtime. Context Retriever helps an AI agent understand what business objects exist, how they connect, and which paths are safe to use.

When you set up Redis Context Retriever, you model the objects that matter to your agent workflow and connect the relationships between them. You can do this through the UI, the [Context Surfaces Python Client](https://pypi.org/project/context-surfaces/), or the `ctxctl` CLI (available when you install the Python client). Context Retriever uses those relationships to automatically create and deploy retrieval tools from your entity model.

When an agent needs context during execution, it calls the MCP tools Context Retriever exposes. Instead of guessing which tool to use or generating SQL, the agent follows the defined entity paths and gets back structured, live, operational context.

For more details, see the [Redis Context Retriever overview]({{< relref "/develop/ai/context-engine/context-retriever" >}}).

## Get started with Context Retriever on Redis Cloud

{{< embed-md "rc-context-retriever-get-started.md" >}}
