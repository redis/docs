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
  {{< image-card image="images/ai-lib.svg" alt="Python SDK quickstart icon" title="Python SDK quickstart — Connect to Agent Memory and make your first SDK requests" url="/develop/ai/context-engine/agent-memory/python-sdk-quickstart" >}}
  {{< image-card image="images/ai-lib.svg" alt="TypeScript SDK quickstart icon" title="TypeScript SDK quickstart — Connect to Agent Memory and make your first SDK requests" url="/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart" >}}
</div>

## What you can build

Redis Agent Memory gives your agents a two-tier memory layer available through the REST API, Python SDK, and TypeScript SDK.

### Session memory

<ul class="my-4 space-y-2">
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Conversation history</strong>: Store each conversation as a sequence of events and retrieve it by session ID, so the agent can continue with context from previous turns.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Configurable retention</strong>: Set a TTL for session memory, so conversation data follows your retention requirements and expires when it is no longer needed.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Automatic summarization</strong>: Summarize older session events after a configurable threshold while retaining the most recent events in full, so long conversations remain usable without retrieving the complete history for every turn.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Event attribution and metadata</strong>: Record the actor, message role, timestamp, and application metadata for each session event, so conversations retain their participants, ordering, and application context.</span></li>
</ul>

### Long-term memory

<ul class="my-4 space-y-2">
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Automatic memory extraction</strong>: Extract and persist important facts, preferences, and patterns from session events, so the agent can use relevant information after the original conversation has ended.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Configurable extraction cadence</strong>: Control when session events are processed, so long-term memory updates can match the needs and activity level of your application.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Custom memory types</strong>: Define memory types with their own descriptions and extraction prompts, so the agent captures information specific to your application and domain.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Structured memory fields</strong>: Add typed fields using strings, integers, floats, booleans, lists, and objects, so extracted memories have a consistent structure that applications can validate and use.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Direct memory writes</strong>: Create long-term memories in bulk from external sources without processing them through a session, so existing user data and application knowledge can be imported directly.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Configurable retention</strong>: Set a TTL for long-term memory, so persisted information follows your retention requirements.</span></li>
</ul>

### Memory retrieval and management

<ul class="my-4 space-y-2">
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Memory classification</strong>: Organize long-term memories as semantic, episodic, or message memories and associate them with owners, sessions, namespaces, and topics, so retrieval can be scoped to the current application context.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Semantic recall</strong>: Search long-term memories by meaning, so the agent can retrieve relevant information without relying on exact keyword matches.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Multi-session recall</strong>: Retrieve memories across sessions and users, so the agent can use relevant information from more than one conversation.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Filtered retrieval</strong>: Filter results by session, owner, namespace, topic, and memory type, so applications can control which memories are available in each context.</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Multiple client options</strong>: Access session and long-term memory through the REST API, Python SDK, or TypeScript SDK, so the same memory service can be used across different application stacks.</span></li>
</ul>

## Quickstarts

Choose a client and make your first session-memory and long-term-memory requests:

- [REST API]({{< relref "/operate/rc/context-engine/agent-memory/use-agent-memory" >}})
- [Python SDK]({{< relref "/develop/ai/context-engine/agent-memory/python-sdk-quickstart" >}})
- [TypeScript SDK]({{< relref "/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart" >}})

For complete endpoint and schema details, see the [Agent Memory API examples]({{< relref "/develop/ai/context-engine/agent-memory/api-examples" >}}) and [API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}).

## Language guides

{{< note >}}
The guides below show how to implement agent memory patterns **directly using Redis client libraries** without the managed Agent Memory service.

Use these guides if you prefer to self-host, want full control over the implementation, or use a language that doesn't have an Agent Memory SDK.

For the managed service, use the REST API, Python SDK, or TypeScript SDK quickstart above.
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

Redis Cloud Agent Memory API requests require an Agent Memory API key and a Store ID. Send the key as a bearer token in the `Authorization` header, and include the Store ID in the request path.

The [Redis Cloud Agent Memory REST quickstart]({{< relref "/operate/rc/context-engine/agent-memory/use-agent-memory" >}}) shows how to get these values and use them in a request.
