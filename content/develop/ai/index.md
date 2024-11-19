---
Title: Redis for AI documentation
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: An overview of the Redis for AI documentation
linkTitle: Redis for AI
weight: 40
---
Redis stores and indexes vector embeddings that semantically represent unstructured data including text passages, images, videos, or audio. Store vectors and the associated metadata within [hashes]({{< relref "/develop/data-types/hashes" >}}) or [JSON]({{< relref "/develop/data-types/json" >}}) documents for [indexing]({{< relref "/develop/interact/search-and-query/indexing" >}}) and [querying]({{< relref "/develop/interact/search-and-query/query" >}}).

| Vector | RAG | RedisVL |
| :-- | :-- | :-- |
| {{<image filename="images/ai-cube.png" alt="AI Redis icon.">}}[Redis as a vector database quick start guide]({{< relref "/develop/get-started/vector-database" >}}) |{{<image filename="images/ai-brain.png" alt="AI Redis icon.">}} [Retrieval-Augmented Generation quick start guide]({{< relref "/develop/get-started/rag" >}}) | {{<image filename="images/ai-lib.png" alt="AI Redis icon.">}}[Redis vector Python client library documentation]({{< relref "/integrate/redisvl/overview/" >}}) |

## Overview

1. [**Create a vector index**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#create-a-vector-index): Redis maintains a secondary index over your data with a defined schema (including vector fields and metadata). Redis supports [`FLAT`]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#flat-index) and [`HNSW`]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#hnsw-index) vector index types.
1. [**Store and update vectors**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#store-and-update-vectors): Redis stores vectors and metadata in hashes or JSON objects.
1. [**Search with vectors**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#search-with-vectors): Redis supports several advanced querying strategies with vector fields including k-nearest neighbor ([KNN]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#knn-vector-search)), [vector range queries]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#vector-range-queries), and [metadata filters]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#filters).
1. [**Configure vector queries at runtime**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#runtime-query-parameters). Select the best filter mode to optimize query execution.

## Concepts 

Learn to perform vector search and use gateways and semantic caching in your AI/ML projects.

| Search | AI Gateways | Semantic Caching | 
| :-- | :-- | :-- |
| {{<image filename="images/ai-search.png" alt="AI Redis icon.">}}[Vector search guide]({{< relref "/develop/interact/search-and-query/query/vector-search" >}}) | {{<image filename="images/ai-model.png" alt="AI Redis icon.">}}[Deploy an enhanced gateway with Redis](https://redis.io/blog/ai-gateways-what-are-they-how-can-you-deploy-an-enhanced-gateway-with-redis/) | {{<image filename="images/ai-brain-2.png" alt="AI Redis icon.">}}[Semantic caching for faster, smarter LLM apps](https://redis.io/blog/what-is-semantic-caching) |

## Ecosystem integrations

* [Amazon Bedrock setup guide]({{< relref "/integrate/amazon-bedrock/set-up-redis" >}})
* [LangChain Redis Package: Smarter AI apps with advanced vector storage and faster caching](https://redis.io/blog/langchain-redis-partner-package/))
* [Redis Cloud available on Vercel](https://redis.io/blog/redis-cloud-now-available-on-vercel-marketplace/)
* [Create a Redis Cloud database with the Vercel integration]({{< relref "/operate/rc/cloud-integrations/vercel/" >}})
* [Building a RAG application with Redis and Spring AI](https://redis.io/blog/building-a-rag-application-with-redis-and-spring-ai/)
* [Deploy GenAI apps faster with Redis and NVIDIA NIM](https://redis.io/blog/use-redis-with-nvidia-nim-to-deploy-genai-apps-faster/)
* [Building LLM Applications with Kernel Memory and Redis](https://redis.io/blog/building-llm-applications-with-kernel-memory-and-redis/)


## Notebooks

Get started with the following Redis Python notebooks.

* [The place to start if you are brand new to Redis](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/redis-intro/00_redis_intro.ipynb)

#### Hybrid and vector search
* [Implementing hybrid search with Redis](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/02_hybrid_search.ipynb)
* [Vector search with Redis Python client](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/00_redispy.ipynb) 
* [Vector search with Redis Vector Library](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/01_redisvl.ipynb)

#### RAG  
* [RAG from scratch with the Redis Vector Library](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/01_redisvl.ipynb) 
* [RAG using Redis and LangChain](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/02_langchain.ipynb) 
* [RAG using Redis and LlamaIndex](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/03_llamaindex.ipynb) 
* [Advanced RAG with redisvl](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/04_advanced_redisvl.ipynb) 
* [RAG using Redis and Nvidia](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/05_nvidia_ai_rag_redis.ipynb) 
* [Utilize RAGAS framework to evaluate RAG performance](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/06_ragas_evaluation.ipynb)
* [Notebook for additional tips and techniques to improve RAG quality](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/04_advanced_redisvl.ipynb) 

#### LLM session management
* [LLM session manager with semantic similarity](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/llm-session-manager/00_llm_session_manager.ipynb) 
* [Handle multiple simultaneous chats with one instance](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/llm-session-manager/01_multiple_sessions.ipynb)

#### Semantic caching  
* [Build a semantic cache using the Doc2Cache framework and Llama3.1](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/semantic-cache/doc2cache_llama3_1.ipynb) 
* [Build a semantic cache with Redis and Google Gemini](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/semantic-cache/semantic_caching_gemini.ipynb)

#### Agents
* [Notebook to get started with lang-graph and agents](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/agents/00_langgraph_redis_agentic_rag.ipynb) 
* [Notebook to get started with lang-graph and agents](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/agents/01_crewai_langgraph_redis.ipynb)

#### Recommendation systems
* [Intro content filtering example with redisvl](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/content_filtering.ipynb) 
* [Intro collaborative filtering example with redisvl](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/collaborative_filtering.ipynb) 



