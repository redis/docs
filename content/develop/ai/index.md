---
Title: Redis for AI documentation
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: An overivew of the Redis for AI documentation
linkTitle: Redis for AI
weight: 40
---
Redis stores and indexes vector embeddings that semantically represent unstructured data including text passages, images, videos, or audio. Store vectors and the associated metadata within hashes or JSON documents for indexing and search.

| Vector | RAG |
| :-- | :-- |
| {{<image filename="images/ai-cube.png" alt="AI Redis icon.">}}[Redis as a vector database quick start guide]({{< relref "/develop/get-started/vector-database" >}}) |{{<image filename="images/ai-brain.png" alt="AI Redis icon.">}} [Retrieval-Augmented Generation quick start guide]({{< relref "/develop/get-started/rag" >}}) |


## Overview

1. [**Create a vector index**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#create-a-vector-index): Redis maintains a secondary index over your data with a defined schema (including vector fields and metadata). Redis supports [`FLAT`]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#flat-index) and [`HNSW`]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#hnsw-index) vector index types.
1. [**Store and update vectors**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#store-and-update-vectors): Redis stores vectors and metadata in hashes or JSON objects.
1. [**Search with vectors**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#search-with-vectors): Redis supports several advanced querying strategies with vector fields including k-nearest neighbor ([KNN]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#knn-vector-search)), [vector range queries]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#vector-range-queries), and [metadata filters]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#filters).
1. [**Configure vector queries at runtime**]({{< baseurl >}}/develop/interact/search-and-query/advanced-concepts/vectors#runtime-query-parameters).

## Resources 

Learn to perform vector search and use Redis integrations in your AI/ML projects.

| Search | Cloud Model Integration | Python Vector Library | 
| :-- | :-- | :-- |
| [Vector search guide]({{< relref "/develop/interact/search-and-query/query/vector-search/" >}}) | [Amazon Bedrock setup guide]({{< relref "/integrate/amazon-bedrock/set-up-redis/ " >}}) |[Redis vector python library documentation]({{< relref "/integrate/redisvl/overview/ " >}})

## Next steps

Get started with the following Redis python notebooks.

* [The place to start if you are brand new to Redis](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/redis-intro/00_redis_intro.ipynb)

**Hybrid and vector search notebooks**
* [Implementing hybrid search with Redis](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/02_hybrid_search.ipynb)
* [Vector search with Redis python client](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/00_redispy.ipynb) 
* [Vector search with Redis Vector Library](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/01_redisvl.ipynb)

**RAG notebooks**  
* [RAG from scratch with the Redis Vector Library](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/01_redisvl.ipynb) 
* [RAG using Redis and LangChain](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/02_langchain.ipynb) 
* [RAG using Redis and LlamaIndex](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/03_llamaindex.ipynb) 
* [Advanced RAG with redisvl](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/04_advanced_redisvl.ipynb) 
* [RAG using Redis and Nvidia](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/05_nvidia_ai_rag_redis.ipynb) 
* [Utilize RAGAS framework to evaluate RAG performance](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/06_ragas_evaluation.ipynb)
* [Notebook for additional tips and techniques to improve RAG quality](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/04_advanced_redisvl.ipynb) 

**LLM session management notebooks**
* [LLM session manager with semantic similarity](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/llm-session-manager/00_llm_session_manager.ipynb) 
* [Handle multiple simultaneous chats with one instance](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/llm-session-manager/01_multiple_sessions.ipynb)

**Semantic caching notebooks**  
* [Build a semantic cache using the Doc2Cache framework and Llama3.1](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/semantic-cache/doc2cache_llama3_1.ipynb) 
* [Build a semantic cache with Redis and Google Gemini](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/semantic-cache/semantic_caching_gemini.ipynb)

**Agent notebooks**
* [Notebook to get started with lang-graph and agents](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/agents/00_langgraph_redis_agentic_rag.ipynb) 
* [Notebook to get started with lang-graph and agents](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/agents/01_crewai_langgraph_redis.ipynb)

**Recommendation systems notebooks**
* [Intro content filtering example with redisvl](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/content_filtering.ipynb) 
* [Intro collaborative filtering example with redisvl](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/collaborative_filtering.ipynb) 



