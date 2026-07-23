---
alwaysopen: false
categories:
- docs
- develop
- ai
description: API reference, SDK examples, and language-specific guides for building with Redis Agent Memory.
hideListLinks: true
linktitle: Developer guide
title: Build with Redis Agent Memory
weight: 5
---

Everything you need to start building with Redis Agent Memory — REST API reference, SDK examples, and language-specific guides.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< image-card image="images/ai-brain.svg" alt="REST quickstart icon" title="REST quickstart — Create a service on Redis Cloud and make your first API requests" url="/operate/rc/context-engine/agent-memory/use-agent-memory" >}}
  {{< image-card image="images/ai-cube.svg" alt="API reference icon" title="API Reference — Full OpenAPI reference for all Agent Memory endpoints" url="/develop/ai/context-engine/agent-memory/api-reference" >}}
  {{< image-card image="images/ai-lib.svg" alt="Language guides icon" title="Build Your Own — Self-hosted agent memory using Redis client libraries (Python, Node.js, Go, Java, .NET, and more)" url="/develop/use-cases/agent-memory" >}}
</div>

## What you can build

Redis Agent Memory gives your agents a two-tier memory layer available via REST API and Python SDK:

<ul class="my-4 space-y-2">
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Session memory</strong> — Store the current conversation as a sequence of events. Query by session ID to reconstruct context for the next agent turn.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Long-term memory</strong> — Automatically extract and persist important facts, preferences, and patterns from session events. Search semantically to retrieve what's relevant.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Multi-session recall</strong> — Retrieve memories across sessions and users using semantic search, with filtering by session, owner, namespace, topic, and memory type.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Direct memory writes</strong> — Bulk-create long-term memories from external sources without going through a session, for importing existing knowledge.</span></li>
</ul>

## REST quickstart

Follow the [Redis Cloud Agent Memory REST quickstart]({{< relref "/operate/rc/context-engine/agent-memory/use-agent-memory" >}}) to create a service and run complete `curl` commands for session memory and long-term memory.

After you finish the quickstart, review the [Agent Memory API examples]({{< relref "/develop/ai/context-engine/agent-memory/api-examples" >}}) and [API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}).

## Language guides

{{< note >}}
The guides below show how to implement agent memory patterns **directly using Redis client libraries** without the managed Agent Memory service.

Use these guides if you prefer to self-host, want full control over the implementation, or use a language that doesn't have an Agent Memory SDK.

For the managed service, follow the [Redis Cloud REST quickstart]({{< relref "/operate/rc/context-engine/agent-memory/use-agent-memory" >}}).
{{< /note >}}

Step-by-step examples for building agent memory into your application using your preferred Redis client library:

- [Python (redis-py)]({{< relref "/develop/use-cases/agent-memory/redis-py" >}})
- [Node.js (node-redis)]({{< relref "/develop/use-cases/agent-memory/nodejs" >}})
- [Go]({{< relref "/develop/use-cases/agent-memory/go" >}})
- [Java (Jedis)]({{< relref "/develop/use-cases/agent-memory/java-jedis" >}})
- [Java (Lettuce)]({{< relref "/develop/use-cases/agent-memory/java-lettuce" >}})
- [.NET]({{< relref "/develop/use-cases/agent-memory/dotnet" >}})
- [PHP]({{< relref "/develop/use-cases/agent-memory/php" >}})
- [Ruby]({{< relref "/develop/use-cases/agent-memory/ruby" >}})
- [Rust]({{< relref "/develop/use-cases/agent-memory/rust" >}})

## Set up authentication

Redis Cloud API requests require an Agent Memory API key and a Store ID. Send the key as a bearer token in the `Authorization` header, and include the Store ID in the request path.

The [Redis Cloud REST quickstart]({{< relref "/operate/rc/context-engine/agent-memory/use-agent-memory" >}}) shows how to get these values and use them in a request.
