---
Title: Notebooks collection
alwaysopen: false
categories:
- docs
- develop
- stack
- oss
- rc
- rs
description: This collection showcases how Redis can be integrated into AI workflows to enhance performance, reduce latency, and enable real-time AI applications. Each notebook comes with complete code examples, explanations, and integration guides.
linkTitle: Notebooks collection
weight: 40
---


| Notebook | Category | Description |  |
|----------|----------|-------------|--|
| The place to start if you are brand new to Redis | Introduction | Great for Redis beginners looking for a guided Colab experience. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/redis-intro/00_redis_intro.ipynb) |
| Implementing hybrid search with Redis | Hybrid and Vector Search | Combines vector similarity with keyword filters. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/02_hybrid_search.ipynb) |
| Vector search with Redis Python client | Hybrid and Vector Search | Demonstrates pure vector search using the Redis Python client. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/00_redispy.ipynb) |
| Vector search with Redis Vector Library | Hybrid and Vector Search | Uses RedisVL for advanced vector indexing and querying. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/01_redisvl.ipynb) |
| Shows how to convert a float32 index to float16 or integer data types | Hybrid and Vector Search | Demonstrates data type optimization for vector indices. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/vector-search/03_dtype_support.ipynb) |
| RAG from scratch with Redis Vector Library | RAG | Basic RAG implementation using RedisVL. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/01_redisvl.ipynb) |
| RAG using Redis and LangChain | RAG | Shows integration between Redis and LangChain for RAG. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/02_langchain.ipynb) |
| RAG using Redis and LlamaIndex | RAG | Walkthrough of RAG with Redis and LlamaIndex. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/03_llamaindex.ipynb) |
| Advanced RAG with RedisVL | RAG | Advanced concepts and techniques using RedisVL. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/04_advanced_redisvl.ipynb) |
| RAG using Redis and Nvidia | RAG | NVIDIA + Redis for LLM context retrieval. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/05_nvidia_ai_rag_redis.ipynb) |
| Utilize RAGAS framework to evaluate RAG performance | RAG | Evaluation of RAG apps using the RAGAS framework. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/06_ragas_evaluation.ipynb) |
| Implement a simple RBAC policy with vector search using Redis | RAG | Role-based access control implementation for RAG systems. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/RAG/07_user_role_based_rag.ipynb) |
| LangGraph and agents | Agents | Getting started with agent workflows. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/agents/00_langgraph_redis_agentic_rag.ipynb) |
| Movie recommendation system | Agents | Collaborative agent-based movie recommender. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/agents/01_crewai_langgraph_redis.ipynb) |
| Full-Featured Agent Architecture | Agents | Comprehensive agent implementation with advanced features. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/agents/02_full_featured_agent.ipynb) |
| Optimize semantic cache threshold with RedisVL | Semantic Cache | Performance optimization for semantic caching systems. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/semantic-cache/02_semantic_cache_optimization.ipynb) |
| Simple examples of how to build an allow/block list router in addition to a multi-topic router | Semantic Router | Basic routing patterns and access control mechanisms. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/semantic-router/00_semantic_routing.ipynb) |
| Use RouterThresholdOptimizer from redisvl to setup best router config | Semantic Router | Router configuration optimization using RedisVL. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/semantic-router/01_routing_optimization.ipynb) |
| Facial recognition | Computer Vision | Face matching using Facenet and RedisVL. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/computer-vision/00_facial_recognition_facenet.ipynb) |
| Content filtering with RedisVL | Recommendation Systems | Introduction to content-based filtering. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/00_content_filtering.ipynb) |
| Collaborative filtering with RedisVL | Recommendation Systems | Intro to collaborative filtering with RedisVL. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/01_collaborative_filtering.ipynb) |
| Intro deep learning two tower example with redisvl | Recommendation Systems | Deep learning approach to recommendation systems. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/recommendation-systems/02_two_towers.ipynb) |
| Credit scoring system using Feast with Redis as the online store | Feature Store | Feature store implementation for ML model serving. | [Open in Colab](https://colab.research.google.com/github/redis-developer/redis-ai-resources/blob/main/python-recipes/feature-store/00_feast_credit_score.ipynb) |


## Additional resources

Looking for more ways to learn about Redis for AI? Check out our:

* [AI video collection]({{< relref "/develop/ai/ai-videos" >}}) - Video tutorials and demonstrations covering Redis AI concepts
* [Ecosystem integrations]({{< relref "/develop/ai/ecosystem-integrations" >}}) - Learn how Redis works with popular AI frameworks and tools
