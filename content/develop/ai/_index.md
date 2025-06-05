---
Title: Redis for AI documentation
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: An overview of Redis for AI documentation
linkTitle: Redis for AI
weight: 40
hideListLinks: true
---
Redis stores and indexes vector embeddings that semantically represent unstructured data including text passages, images, videos, or audio. Store vectors and the associated metadata within [hashes]({{< relref "/develop/data-types/hashes" >}}) or [JSON]({{< relref "/develop/data-types/json" >}}) documents for [indexing]({{< relref "/develop/interact/search-and-query/indexing" >}}) and [querying]({{< relref "/develop/interact/search-and-query/query" >}}).

| Vector | RAG | RedisVL |
| :-- | :-- | :-- |
| {{<image filename="images/ai-cube.svg" alt="AI Redis icon.">}}[Redis vector database quick start guide]({{< relref "/develop/get-started/vector-database" >}}) |{{<image filename="images/ai-brain.svg" alt="AI Redis icon.">}} [Retrieval-Augmented Generation quick start guide]({{< relref "/develop/get-started/rag" >}}) | {{<image filename="images/ai-lib.svg" alt="AI Redis icon.">}}[Redis vector Python client library documentation]({{< relref "/integrate/redisvl/" >}}) |

#### Overview

This page is organized into a few sections depending on what you're trying to do:
* **How to's** - The comprehensive reference section for every feature, API, and setting. It's your source for detailed, technical information to support any level of development.
* **Concepts** - Explanations of foundational ideas and core principles to help you understand the reason behind the product's features and design.
* **Quickstarts** - Short, focused guides to get you started with key features or workflows in minutes.
* **Tutorials** - In-depth walkthroughs that dive deeper into specific use cases or processes. These step-by-step guides help you master essential tasks and workflows.
* **Integrations** - Guides and resources to help you connect and use the product with popular tools, frameworks, or platforms.
* **Benchmarks** - Performance comparisons and metrics to demonstrate how the product performs under various scenarios. This helps you understand its efficiency and capabilities.
* **Best practices** - Recommendations and guidelines for maximizing effectiveness and avoiding common pitfalls. This section equips you to use the product effectively and efficiently.

## How to's

1. [**Create a vector index**]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors#create-a-vector-index" >}}): Redis maintains a secondary index over your data with a defined schema (including vector fields and metadata). Redis supports [`FLAT`]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors#flat-index" >}}) and [`HNSW`]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors#hnsw-index" >}}) vector index types.
1. [**Store and update vectors**]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors#store-and-update-vectors" >}}): Redis stores vectors and metadata in hashes or JSON objects.
1. [**Search with vectors**]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors#search-with-vectors" >}}): Redis supports several advanced querying strategies with vector fields including k-nearest neighbor ([KNN]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors#knn-vector-search" >}})), [vector range queries]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors#vector-range-queries" >}}), and [metadata filters]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors#filters" >}}).
1. [**Configure vector queries at runtime**]({{< relref "develop/interact/search-and-query/advanced-concepts/vectors#runtime-query-parameters" >}}). Select the best filter mode to optimize query execution.

#### Learn how to index and query vector embeddings
* [redis-py (Python)]({{< relref "/develop/clients/redis-py/vecsearch" >}})
* [NRedisStack (C#/.NET)]({{< relref "/develop/clients/dotnet/vecsearch" >}})
* [node-redis (JavaScript)]({{< relref "/develop/clients/nodejs/vecsearch" >}})
* [Jedis (Java)]({{< relref "/develop/clients/jedis/vecsearch" >}})
* [go-redis (Go)]({{< relref "/develop/clients/go/vecsearch" >}})

## Concepts

Learn to perform vector search and use gateways and semantic caching in your AI/ML projects.

| Search | LLM memory | Semantic caching | Semantic routing | AI Gateways |
| :-- | :-- | :-- | :-- | :-- |
| {{<image filename="images/ai-search.svg" alt="AI Redis icon.">}}[Vector search guide]({{< relref "/develop/interact/search-and-query/query/vector-search" >}}) | {{<image filename="images/ai-LLM-memory.svg" alt="LLM memory icon.">}}[Store memory for LLMs](https://redis.io/blog/level-up-rag-apps-with-redis-vector-library/) | {{<image filename="images/ai-brain-2.svg" alt="AI Redis icon.">}}[Semantic caching for faster, smarter LLM apps](https://redis.io/blog/what-is-semantic-caching) | {{<image filename="images/ai-semantic-routing.svg" alt="Semantic routing icon.">}}[Semantic routing chooses the best tool](https://redis.io/blog/level-up-rag-apps-with-redis-vector-library/) | {{<image filename="images/ai-model.svg" alt="AI Redis icon.">}}[Deploy an enhanced gateway with Redis](https://redis.io/blog/ai-gateways-what-are-they-how-can-you-deploy-an-enhanced-gateway-with-redis/) | {{<image filename="images/ai-brain-2.svg" alt="AI Redis icon.">}}[Semantic caching for faster, smarter LLM apps](https://redis.io/blog/what-is-semantic-caching) |

## Quickstarts

Quickstarts or recipes are useful when you are trying to build specific functionality. For example, you might want to do RAG with LangChain or set up LLM memory for your AI agent.

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

## Benchmarks
See how we stack up against the competition.
* [Redis vector benchmark results](https://redis.io/blog/benchmarking-results-for-vector-databases/)
* [1 billion vectors](https://redis.io/blog/redis-8-0-m02-the-fastest-redis-ever/)

## Best practices
See how leaders in the industry are building their RAG apps.
* [Get better RAG responses with Ragas](https://redis.io/blog/get-better-rag-responses-with-ragas/)
