---
Title: Redis for AI and search
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: An overview of Redis for AI and search documentation
linkTitle: Redis for AI and search
weight: 40
hideListLinks: true
---
Redis stores and indexes vector embeddings that semantically represent unstructured data including text passages, images, videos, or audio. Store vectors and the associated metadata within [hashes]({{< relref "/develop/data-types/hashes" >}}) or [JSON]({{< relref "/develop/data-types/json" >}}) documents for [indexing]({{< relref "/develop/ai/search-and-query/indexing" >}}) and [querying]({{< relref "/develop/ai/search-and-query/query" >}}).

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< image-card image="images/ai-lib.svg" alt="AI Redis icon" title="Redis vector Python client library documentation" url="/develop/ai/redisvl/" >}}
  {{< image-card image="images/ai-cube.svg" alt="AI Redis icon" title="Use Redis Query Engine to search data" url="/develop/ai/search-and-query/" >}}
  {{< image-card image="images/ai-brain.svg" alt="AI Redis icon" title="Use LangCache to store LLM responses" url="/develop/ai/langcache/" >}}
</div>

#### Overview

This page is organized into a few sections depending on what you're trying to do:
* **How to's** - The comprehensive reference section for every feature, API, and setting. It's your source for detailed, technical information to support any level of development.
* **Concepts** - Explanations of foundational ideas and core principles to help you understand the reason behind the product's features and design.
* **Quickstarts** - Short, focused guides to get you started with key features or workflows in minutes.
* **Tutorials** - In-depth walkthroughs that dive deeper into specific use cases or processes. These step-by-step guides help you master essential tasks and workflows.
* **Integrations** - Guides and resources to help you connect and use the product with popular tools, frameworks, or platforms.
* **Video tutorials** - Watch our AI video collection featuring practical tutorials and demonstrations.
* **Benchmarks** - Performance comparisons and metrics to demonstrate how the product performs under various scenarios. This helps you understand its efficiency and capabilities.
* **Best practices** - Recommendations and guidelines for maximizing effectiveness and avoiding common pitfalls. This section equips you to use the product effectively and efficiently.

## How to's

1. [**Create a vector index**]({{< relref "develop/ai/search-and-query/vectors#create-a-vector-index" >}}): Redis maintains a secondary index over your data with a defined schema (including vector fields and metadata). Redis supports [`FLAT`]({{< relref "develop/ai/search-and-query/vectors#flat-index" >}}) and [`HNSW`]({{< relref "develop/ai/search-and-query/vectors#hnsw-index" >}}) vector index types.
1. [**Store and update vectors**]({{< relref "develop/ai/search-and-query/vectors#store-and-update-vectors" >}}): Redis stores vectors and metadata in hashes or JSON objects.
1. [**Search with vectors**]({{< relref "develop/ai/search-and-query/vectors#search-with-vectors" >}}): Redis supports several advanced querying strategies with vector fields including k-nearest neighbor ([KNN]({{< relref "develop/ai/search-and-query/vectors#knn-vector-search" >}})), [vector range queries]({{< relref "develop/ai/search-and-query/vectors#vector-range-queries" >}}), and [metadata filters]({{< relref "develop/ai/search-and-query/vectors#filters" >}}).
1. [**Configure vector queries at runtime**]({{< relref "develop/ai/search-and-query/vectors#runtime-query-parameters" >}}). Select the best filter mode to optimize query execution.

#### Learn how to index and query vector embeddings
* [redis-py (Python)]({{< relref "/develop/clients/redis-py/vecsearch" >}})
* [NRedisStack (C#/.NET)]({{< relref "/develop/clients/dotnet/vecsearch" >}})
* [node-redis (JavaScript)]({{< relref "/develop/clients/nodejs/vecsearch" >}})
* [Jedis (Java)]({{< relref "/develop/clients/jedis/vecsearch" >}})
* [go-redis (Go)]({{< relref "/develop/clients/go/vecsearch" >}})

## Concepts

Learn to perform vector search and use gateways and semantic caching in your AI/ML projects.

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 my-8">
  {{< image-card image="images/ai-search.svg" alt="AI Redis icon" title="Vector search guide" url="/develop/ai/search-and-query/query/vector-search" >}}
  {{< image-card image="images/ai-LLM-memory.svg" alt="LLM memory icon" title="Store memory for LLMs" url="https://redis.io/blog/level-up-rag-apps-with-redis-vector-library/" >}}
  {{< image-card image="images/ai-brain-2.svg" alt="AI Redis icon" title="Semantic caching for faster, smarter LLM apps" url="https://redis.io/blog/what-is-semantic-caching" >}}
  {{< image-card image="images/ai-semantic-routing.svg" alt="Semantic routing icon" title="Semantic routing chooses the best tool" url="https://redis.io/blog/level-up-rag-apps-with-redis-vector-library/" >}}
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
* [Redis Notebooks for LangGraph](https://github.com/redis-developer/langgraph-redis/tree/main/examples)

## Tutorials
Need a deeper-dive through different use cases and topics?

#### RAG
* [Agentic RAG](https://github.com/redis-developer/agentic-rag) - A tutorial focused on agentic RAG with LlamaIndex and Amazon Bedrock
* [RAG on Vertex AI](https://github.com/redis-developer/gcp-redis-llm-stack/tree/main) - A RAG tutorial featuring Redis with Vertex AI
* [RAG workbench](https://github.com/redis-developer/redis-rag-workbench) - A development playground for exploring RAG techniques with Redis
* [ArXiv Chat](https://github.com/redis-developer/ArxivChatGuru) - Streamlit demo of RAG over ArXiv documents with Redis & OpenAI

#### Recommendations and search
* [Recommendation systems w/ NVIDIA Merlin & Redis](https://github.com/redis-developer/redis-nvidia-recsys) - Three examples, each escalating in complexity, showcasing the process of building a realtime recsys with NVIDIA and Redis
* [Redis product search](https://github.com/redis-developer/redis-product-search) - Build a real-time product search engine using features like full-text search, vector similarity, and real-time data updates
* [ArXiv Search](https://github.com/redis-developer/redis-arxiv-search) - Full stack implementation of Redis with React FE

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
See how leaders in the industry are building their RAG apps.
* [Get better RAG responses with Ragas](https://redis.io/blog/get-better-rag-responses-with-ragas/)
