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
hideListLinks: true
weight: 40
---
Redis stores and indexes vector embeddings that semantically represent unstructured data including text passages, images, videos, or audio. Store vectors and the associated metadata within [hashes]({{< relref "/develop/data-types/hashes" >}}) or [JSON]({{< relref "/develop/data-types/json" >}}) documents for [indexing]({{< relref "/develop/interact/search-and-query/indexing" >}}) and [querying]({{< relref "/develop/interact/search-and-query/query" >}}). Use the [vector sets]({{< relref "/develop/data-types/vector-sets" >}}) preview data type to add items to a set, and retrieve a subset of items that are the most similar to a specified vector. 

| Vector | RAG | RedisVL |
| :-- | :-- | :-- |
| {{<image filename="images/ai-cube.png" alt="AI Redis icon.">}}[Redis vector database quick start guide]({{< relref "/develop/ai/vector-database" >}}) |{{<image filename="images/ai-brain.png" alt="AI Redis icon.">}} [Retrieval-Augmented Generation quick start guide]({{< relref "/develop/ai/rag" >}}) | {{<image filename="images/ai-lib.png" alt="AI Redis icon.">}}[Redis vector Python client library documentation]({{< relref "/integrate/redisvl/" >}}) |

#### Overview

This page organized into a few sections depending on what you’re trying to do:
* **How to's** - The comprehensive reference section for every feature, API, and setting. It’s your source for detailed, technical information to support any level of development.
* **Concepts** - Explanations of foundational ideas and core principles to help you understand the reason behind the product’s features and design.
* **Quickstarts** - Short, focused guides to get you started with key features or workflows in minutes. 
* **Tutorials** - In-depth walkthroughs that dive deeper into specific use cases or processes. These step-by-step guides help you master essential tasks and workflows.
* **Integrations** - Guides and resources to help you connect and use the product with popular tools, frameworks, or platforms.
* **Benchmarks** - Performance comparisons and metrics to demonstrate how the product performs under various scenarios. This helps you understand its efficiency and capabilities.
* **Best practices** - Recommendations and guidelines for maximizing effectiveness and avoiding common pitfalls. This section equips you to use the product effectively and efficiently.

## How to's

[**Create a vector index**]({{< relref "/develop/ai/vector-fields/" >}}): Redis maintains a secondary index over your data with a defined schema (including vector fields and metadata). Redis supports `FLAT` and `HNSW` vector index types. Redis stores vectors and metadata in hashes or JSON objects. Redis supports several advanced querying strategies with vector fields including k-nearest neighbor KNN, vector range queries, and metadata filters.

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
| {{<image filename="images/ai-search.png" alt="AI Redis icon.">}}[Vector search guide]({{< relref "/develop/interact/search-and-query/query/vector-search" >}}) | {{<image filename="images/ai-LLM-memory.png" alt="LLM memory icon.">}}[Store memory for LLMs](https://redis.io/blog/level-up-rag-apps-with-redis-vector-library/) | {{<image filename="images/ai-brain-2.png" alt="AI Redis icon.">}}[Semantic caching for faster, smarter LLM apps](https://redis.io/blog/what-is-semantic-caching) | {{<image filename="images/ai-semantic-routing.png" alt="Semantic routing icon.">}}[Semantic routing chooses the best tool](https://redis.io/blog/level-up-rag-apps-with-redis-vector-library/) | {{<image filename="images/ai-model.png" alt="AI Redis icon.">}}[Deploy an enhanced gateway with Redis](https://redis.io/blog/ai-gateways-what-are-they-how-can-you-deploy-an-enhanced-gateway-with-redis/) | {{<image filename="images/ai-brain-2.png" alt="AI Redis icon.">}}[Semantic caching for faster, smarter LLM apps](https://redis.io/blog/what-is-semantic-caching) |

## Quickstarts

Get started with the following Redis Python notebook.

* [The place to start if you are brand new to Redis](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/redis-intro/00_redis_intro.ipynb). See the [Redis AI notebooks collection]({{< relref "/develop/ai/notebooks-collection" >}}) for the complete list.

#### Computer vision
Build a facial recognition system using the Facenet embedding model and RedisVL.
* [Facial recognition](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/computer-vision/00_facial_recognition_facenet.ipynb)

#### Recommendation systems
* [Intro content filtering example with redisvl](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/00_content_filtering.ipynb) 
* [Intro collaborative filtering example with redisvl](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/01_collaborative_filtering.ipynb) 

## Tutorials
Need a deeper-dive through different use cases and topics?

#### RAG
* [Agentic RAG](https://github.com/redis-developer/agentic-rag) - A tutorial focused on agentic RAG with LlamaIndex and Amazon Bedrock
* [RAG on Vertex AI](https://github.com/redis-developer/gcp-redis-llm-stack/tree/main) - A RAG tutorial featuring Redis with Vertex AI
* [RAG workbench](https://github.com/redis-developer/redis-rag-workbench) - A development playground for exploring RAG techniques with Redis
* [Vector search with Azure](https://techcommunity.microsoft.com/blog/azuredevcommunityblog/vector-similarity-search-with-azure-cache-for-redis-enterprise/3822059)
* [RAG with Spring AI](https://redis.io/blog/building-a-rag-application-with-redis-and-spring-ai/)
* [RAG with Vertex AI](https://github.com/redis-developer/gcp-redis-llm-stack/tree/main)

#### Recommendation system
* [Intro content filtering example with redisvl](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/00_content_filtering.ipynb) 
* [Intro collaborative filtering example with redisvl](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/01_collaborative_filtering.ipynb) 
* [Recommendation systems w/ NVIDIA Merlin & Redis](https://github.com/redis-developer/redis-nvidia-recsys) - Three examples, each escalating in complexity, showcasing the process of building a realtime recsys with NVIDIA and Redis
* [Redis product search](https://github.com/redis-developer/redis-product-search) - Build a real-time product search engine using features like full-text search, vector similarity, and real-time data updates

## Ecosystem integrations

* [Amazon Bedrock setup guide]({{< relref "/integrate/amazon-bedrock/set-up-redis" >}})
* [LangChain Redis Package: Smarter AI apps with advanced vector storage and faster caching](https://redis.io/blog/langchain-redis-partner-package/)
* [LlamaIndex integration for Redis as a vector store](https://gpt-index.readthedocs.io/en/latest/examples/vector_stores/RedisIndexDemo.html)
* [Redis Cloud available on Vercel](https://redis.io/blog/redis-cloud-now-available-on-vercel-marketplace/)
* [Create a Redis Cloud database with the Vercel integration]({{< relref "/operate/rc/cloud-integrations/vercel" >}})
* [Building a RAG application with Redis and Spring AI](https://redis.io/blog/building-a-rag-application-with-redis-and-spring-ai/)
* [Deploy GenAI apps faster with Redis and NVIDIA NIM](https://redis.io/blog/use-redis-with-nvidia-nim-to-deploy-genai-apps-faster/)
* [Building LLM Applications with Kernel Memory and Redis](https://redis.io/blog/building-llm-applications-with-kernel-memory-and-redis/)
* [DocArray integration of Redis as a vector database by Jina AI](https://docs.docarray.org/user_guide/storing/index_redis/)

## Benchmarks
See how we stack up against the competition.
* [Redis vector benchmark results](https://redis.io/blog/benchmarking-results-for-vector-databases/)
* [1 billion vectors](https://redis.io/blog/redis-8-0-m02-the-fastest-redis-ever/)

## Best practices
See how leaders in the industry are building their RAG apps.
* [Advanced RAG example](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/04_advanced_redisvl.ipynb)
* [Get better RAG responses with Ragas](https://redis.io/blog/get-better-rag-responses-with-ragas/)
