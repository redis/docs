---
Title: Redis for AI and search
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: An overview of Redis for AI and search documentation, including vector search, AI agents, and the Context Engine (Redis Iris) managed services.
linkTitle: Redis for AI and search
weight: 40
hideListLinks: true
---
Redis stores and indexes vector embeddings that semantically represent unstructured data including text passages, images, videos, or audio. Store vectors and the associated metadata within [hashes]({{< relref "/develop/data-types/hashes" >}}) or [JSON]({{< relref "/develop/data-types/json" >}}) documents for [indexing]({{< relref "/develop/ai/search-and-query/indexing" >}}) and [querying]({{< relref "/develop/ai/search-and-query/query" >}}).

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< image-card image="images/ai-lib.svg" alt="AI Redis icon" title="Redis vector Python client library documentation" url="/develop/ai/redisvl/" >}}
  {{< image-card image="images/ai-cube.svg" alt="AI Redis icon" title="Use Redis Search to search data" url="/develop/ai/search-and-query/" >}}
  {{< image-card image="images/ai-brain.svg" alt="AI Redis icon" title="Give AI agents the context engine they need with Redis Iris." url="/develop/ai/context-engine/" >}}
</div>

## What is Redis for AI and search?

Redis is an in-memory data platform purpose-built for the speed and structure that AI applications demand. It stores and indexes vector embeddings alongside structured metadata, enabling semantic search, real-time retrieval, and agent memory at millisecond latency — at any scale.

<ul class="my-4 space-y-2">
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Vector search</strong> — Store and query vector embeddings using KNN and range queries with metadata filters, across hashes and JSON documents</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Semantic caching</strong> — Reduce LLM API costs by reusing cached responses for semantically similar prompts with LangCache</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Agent memory</strong> — Give agents short-term session memory and long-term persistent memory that survives across interactions</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Structured data access</strong> — Turn your business data into governed tools agents can reliably query with Context Retriever</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Live data sync</strong> — Stream changes from relational databases into Redis in near real time so agents always work with current information</span></li>
</ul>

## Why use Redis for AI and search?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Sub-millisecond vector search at production scale</li>
      <li>Agents that remember context across sessions and users</li>
      <li>Lower LLM costs through semantic caching of repeated queries</li>
      <li>Reliable access to fresh, structured business data for every agent step</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For developers</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Redis Search available in Python, JavaScript, Java, Go, .NET, and PHP client libraries</li>
      <li>Managed Context Engine services — no infrastructure to build or maintain</li>
      <li>Works with LangChain, LlamaIndex, LangGraph, and other AI frameworks</li>
      <li>From local development to Redis Cloud with the same API</li>
    </ul>
  </div>
</div>

## Redis Feature Form

Use [Redis Feature Form]({{< relref "/develop/ai/featureform/" >}}) to define, manage, and serve machine learning features on top of your existing data systems. The Feature Form docs cover the Python SDK workflow from provider registration through feature serving.

## AI agents

AI agents are autonomous systems that combine LLMs with memory, tools, and planning to accomplish complex, multi-step tasks. Redis powers the core capabilities agents need: fast vector search, persistent memory, real-time data streaming, and structured access to business data.

- [AI agent builder]({{< relref "/develop/ai/agent-builder" >}}) — Use the interactive code generator to create a working agent in your preferred language with your choice of LLM.
- [How agents work]({{< relref "/develop/ai/agent-builder/agent-concepts" >}}) — Learn the agent processing cycle, memory architecture, and why Redis is the foundation for production agents.
- [Context Engine]({{< relref "/develop/ai/context-engine" >}}) — The managed service suite that gives agents what they need: semantic caching, persistent memory, structured data access, and live data integration.

### Context Engine services

The [Context Engine]({{< relref "/develop/ai/context-engine" >}}) (Redis Iris) includes four fully-managed services available on Redis Cloud:

- [LangCache]({{< relref "/develop/ai/context-engine/langcache" >}}) — Semantic caching that reduces LLM API costs and improves response times by reusing cached responses for similar queries.
- [Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}}) — Two-tier persistent memory (session and long-term) for agents, available as a REST API and Python SDK.
- [Context Retriever]({{< relref "/develop/ai/context-engine/context-retriever" >}}) — Turns your business data into structured, governed tools that agents can reliably use, defined once and reused across all agents.
- [Data Integration]({{< relref "/develop/ai/context-engine/data-integration" >}}) — Keeps your Redis Cloud database in sync with relational databases in near real time using Change Data Capture.

## How to's

1. [**Create a vector index**]({{< relref "develop/ai/search-and-query/vectors#create-a-vector-index" >}}): Redis maintains a secondary index over your data with a defined schema (including vector fields and metadata). Redis supports [`FLAT`]({{< relref "develop/ai/search-and-query/vectors#flat-index" >}}) and [`HNSW`]({{< relref "develop/ai/search-and-query/vectors#hnsw-index" >}}) vector index types.
1. [**Store and update vectors**]({{< relref "develop/ai/search-and-query/vectors#store-and-update-vectors" >}}): Redis stores vectors and metadata in hashes or JSON objects.
1. [**Search with vectors**]({{< relref "develop/ai/search-and-query/vectors#search-with-vectors" >}}): Redis supports several advanced querying strategies with vector fields including k-nearest neighbor ([KNN]({{< relref "develop/ai/search-and-query/vectors#knn-vector-search" >}})), [vector range queries]({{< relref "develop/ai/search-and-query/vectors#vector-range-queries" >}}), and [metadata filters]({{< relref "develop/ai/search-and-query/vectors#filters" >}}).
1. [**Configure vector queries at runtime**]({{< relref "develop/ai/search-and-query/vectors#runtime-query-parameters" >}}): Select the best filter mode to optimize query execution.
1. [**Build an AI agent**]({{< relref "/develop/ai/agent-builder" >}}): Use the interactive agent builder to generate complete working code for conversational assistants and recommendation engines.
1. [**Add semantic caching**]({{< relref "/develop/ai/context-engine/langcache" >}}): Reduce LLM API calls by caching and reusing responses for semantically similar queries.
1. [**Add agent memory**]({{< relref "/develop/ai/context-engine/agent-memory" >}}): Give your agent persistent session and long-term memory using the Agent Memory REST API.
1. [**Access structured business data**]({{< relref "/develop/ai/context-engine/context-retriever" >}}): Use Context Retriever to define your business data as governed tools that any agent can query reliably.
1. [**Sync live data to Redis**]({{< relref "/develop/ai/context-engine/data-integration" >}}): Use Data Integration to keep your Redis Cloud database in sync with your primary relational database using Change Data Capture.

#### Learn how to index and query vector embeddings
* [redis-py (Python)]({{< relref "/develop/clients/redis-py/vecsearch" >}})
* [NRedisStack (C#/.NET)]({{< relref "/develop/clients/dotnet/nredisstack/vecsearch" >}})
* [node-redis (JavaScript)]({{< relref "/develop/clients/nodejs/vecsearch" >}})
* [Jedis (Java)]({{< relref "/develop/clients/jedis/vecsearch" >}})
* [go-redis (Go)]({{< relref "/develop/clients/go/vecsearch" >}})

## Concepts

Learn to perform vector search, build AI agents, and use semantic caching and memory in your AI/ML projects.

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 my-8">
  {{< image-card image="images/ai-search.svg" alt="AI Redis icon" title="Vector search guide" url="/develop/ai/search-and-query/query/vector-search" >}}
  {{< image-card image="images/ai-brain.svg" alt="AI agent icon" title="How AI agents work with Redis" url="/develop/ai/agent-builder/agent-concepts" >}}
  {{< image-card image="images/ai-LLM-memory.svg" alt="LLM memory icon" title="Store memory for LLMs" url="https://redis.io/blog/level-up-rag-apps-with-redis-vector-library/" >}}
  {{< image-card image="images/ai-brain-2.svg" alt="AI Redis icon" title="Semantic caching for faster, smarter LLM apps" url="https://redis.io/blog/what-is-semantic-caching" >}}
  {{< image-card image="images/ai-model.svg" alt="AI Redis icon" title="Deploy an enhanced gateway with Redis" url="https://redis.io/blog/ai-gateways-what-are-they-how-can-you-deploy-an-enhanced-gateway-with-redis/" >}}
</div>

## Quickstarts

Quickstarts or recipes are useful when you are trying to build specific functionality. For example, you might want to do RAG with LangChain or set up LLM memory for your AI agent.

Get started with these foundational guides:

* [Redis vector database quick start guide]({{< relref "/develop/get-started/vector-database" >}})
* [Retrieval-Augmented Generation quick start guide]({{< relref "/develop/get-started/rag" >}})

#### RAG
Retrieval Augmented Generation (aka RAG) is a technique to enhance the ability of an LLM to respond to user queries. The retrieval part of RAG is supported by a vector database, which can return semantically relevant results to a user's query, serving as contextual information to augment the generative capabilities of an LLM.

Explore our [AI notebooks collection]({{< relref "/develop/ai/notebook-collection" >}}) for comprehensive RAG examples including:

* RAG implementations with RedisVL, LangChain, and LlamaIndex
* Advanced RAG techniques and optimizations
* RAG evaluation with the RAGAS framework
* Integration with cloud platforms like Azure and Vertex AI

Additional resources:
* [Vector search with Azure](https://techcommunity.microsoft.com/blog/azuredevcommunityblog/vector-similarity-search-with-azure-cache-for-redis-enterprise/3822059)
* [RAG with Vertex AI](https://github.com/redis-developer/gcp-redis-llm-stack/tree/main)

#### Agents
AI agents can act autonomously to plan and execute tasks for the user.

* [Build your first AI agent]({{< relref "/develop/ai/agent-builder" >}}) — Use the interactive agent builder to generate production-ready agent code.
* [How agents work]({{< relref "/develop/ai/agent-builder/agent-concepts" >}}) — Learn the agent processing cycle, memory architecture, and Redis data structures for agents.
* [Redis Notebooks for LangGraph](https://github.com/redis-developer/langgraph-redis/tree/main/examples) — End-to-end agent examples using LangGraph and Redis.

#### Context Engine
The Context Engine provides managed services for agent memory and data access.

* [Get started with LangCache]({{< relref "/develop/ai/context-engine/langcache" >}}) — Add semantic caching to reduce LLM costs in minutes.
* [Get started with Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}}) — Add persistent two-tier memory to any agent using the REST API.
* [Get started with Context Retriever]({{< relref "/develop/ai/context-engine/context-retriever" >}}) — Expose your business data as governed tools that agents can reliably query.
* [Get started with Data Integration]({{< relref "/develop/ai/context-engine/data-integration" >}}) — Keep Redis in sync with your primary database so agents always have fresh data.

## Tutorials
Need a deeper-dive through different use cases and topics?

#### Agents
* [Agentic RAG](https://github.com/redis-developer/agentic-rag) - A tutorial focused on agentic RAG with LlamaIndex and Amazon Bedrock
* [Redis Notebooks for LangGraph](https://github.com/redis-developer/langgraph-redis/tree/main/examples) - Working with LangGraph agents and Redis memory
* [Build a LangGraph travel agent with Redis Agent Memory](https://redis.io/tutorials/redis-agent-memory-with-langgraph/) - Build a LangGraph agent with short-term session memory and long-term persistent memory using Redis Agent Memory
* [Build a real-time AI agent with Redis Iris](https://redis.io/tutorials/redis-iris-call-agent/) - Combine Redis Agent Memory and Context Retriever to build a wealth advisor agent with persistent memory and structured data access
* [Build a car dealership agent with Google ADK and Redis Agent Memory](https://redis.io/tutorials/build-a-car-dealership-agent-with-google-adk-and-redis-agent-memory/) - Build a persistent AI agent using Google ADK and Redis Agent Memory Server with working and long-term memory
* [Build Google ADK agents with persistent, real-time memory on Redis](https://redis.io/en/blog/build-google-adk-agents-with-persistent-real-time-memory-on-redis/) - Use the `adk-redis` package to integrate Google ADK with Redis for persistent memory, sessions, and semantic caching in production agents

#### Context Engine
* [Semantic caching with Redis LangCache](https://redis.io/tutorials/semantic-caching-with-redis-langcache/) - Build a FastAPI app with semantic caching using LangCache to reduce LLM costs and improve response times

#### RAG
* [RAG on Vertex AI](https://github.com/redis-developer/gcp-redis-llm-stack/tree/main) - A RAG tutorial featuring Redis with Vertex AI
* [RAG workbench](https://github.com/redis-developer/redis-rag-workbench) - A development playground for exploring RAG techniques with Redis
* [ArXiv Chat](https://github.com/redis-developer/ArxivChatGuru) - Streamlit demo of RAG over ArXiv documents with Redis & OpenAI

#### Recommendations and search
* [Recommendation systems w/ NVIDIA Merlin & Redis](https://github.com/redis-developer/redis-nvidia-recsys) - Three examples, each escalating in complexity, showcasing the process of building a realtime recsys with NVIDIA and Redis
* [Redis product search](https://github.com/redis-developer/redis-product-search) - Build a real-time product search engine using features like full-text search, vector similarity, and real-time data updates
* [ArXiv Search](https://github.com/redis-developer/redis-arxiv-search) - Full stack implementation of Redis with React FE

#### Vector sets
* [Getting started with vector sets](https://redis.io/tutorials/howtos/vector-sets-basics/) - Learn the fundamentals of Redis vector sets for similarity search using the `VADD` and `VSIM` commands
* [Face similarity search with Redis vector sets](https://redis.io/tutorials/face-similarity-search-with-redis-vector-sets/) - Build a celebrity lookalike app using Redis vector sets and a Vision Transformer model for face embedding and similarity search

## Ecosystem integrations

Explore our comprehensive [ecosystem integrations page]({{< relref "/develop/ai/ecosystem-integrations" >}}) to discover how Redis works with popular AI frameworks, platforms, and tools including:

* LangGraph, LangChain, and LlamaIndex for building advanced AI applications
* Amazon Bedrock and NVIDIA NIM for enhanced AI infrastructure
* Microsoft Semantic Kernel and Kernel Memory for LLM applications
* And many more integrations to power your AI solutions

## Video tutorials

Watch our [AI video collection]({{< relref "/develop/ai/ai-videos" >}}) featuring practical tutorials and demonstrations on:

* Building RAG applications and implementing vector search
* Working with LangGraph for AI agents with memory
* Semantic caching and search techniques
* Redis integrations with popular AI frameworks
* Real-world AI application examples and best practices

## Benchmarks
See how we stack up against the competition.
* [Redis vector benchmark results](https://redis.io/blog/benchmarking-results-for-vector-databases/)
* [1 billion vectors](https://redis.io/blog/redis-8-0-m02-the-fastest-redis-ever/)

## Best practices
See how leaders in the industry are building their AI apps.

#### Agents and architecture
* [AI Agent vs Chatbot: Key Differences Explained](https://redis.io/en/blog/ai-agent-vs-chatbot/) — Understand the architectural differences between chatbots and agents and when to use each based on task complexity, cost, and latency.
* [Agentic AI Architecture: 5 Patterns Explained](https://redis.io/en/blog/agentic-ai-architecture-examples/) — Learn five production agentic patterns and the data layer requirements needed to support them.
* [AI Agents vs Workflows: When to Use Each](https://redis.io/en/blog/agents-vs-workflows/) — Understand the distinction between deterministic workflows and autonomous agents and how to combine them in production.
* [How agents work]({{< relref "/develop/ai/agent-builder/agent-concepts" >}}) — Agent memory patterns, data structure selection, and production deployment considerations.

#### Memory and context
* [Context Engineering for AI: What It Is & How to Build It](https://redis.io/en/blog/context-engineering-ai/) — Learn the discipline of designing what an LLM receives at inference time, including the four core operations and how Redis provides the infrastructure.
* [Long-Term Memory Architectures for AI Agents](https://redis.io/en/blog/long-term-memory-architectures-ai-agents/) — Design persistent memory systems that retain information across sessions, with guidance on memory types and design tradeoffs.
* [Context Pruning: Cut LLM Tokens Without Losing Quality](https://redis.io/en/blog/context-pruning-llm-tokens/) — Selectively remove low-value tokens from LLM input to reduce costs and improve quality, with benchmarks and failure modes.

#### Performance
* [What is semantic caching](https://redis.io/blog/what-is-semantic-caching) — When and how to apply semantic caching in your AI applications.
* [Streaming LLM Responses: Make Your AI App Feel Fast](https://redis.io/en/blog/streaming-llm-responses/) — Deliver tokens incrementally via Server-Sent Events and combine streaming with caching and context optimization in production.

#### RAG
* [Get better RAG responses with Ragas](https://redis.io/blog/get-better-rag-responses-with-ragas/)

## Continue learning with Redis University

* [Context Engineering with Redis & LangChain](https://university.redis.io/course/vsgabnbkd3f5cd?tab=details)
* [Vector Search with RedisVL](https://university.redis.io/course/1npvvtfft2agew?tab=details)
* [Build a RAG Chatbot](https://university.redis.io/course/ihjs7iip0gpkrw?tab=details)
