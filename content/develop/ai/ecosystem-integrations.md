---
Title: Redis AI ecosystem integrations
alwaysopen: false
categories:
- docs
- develop
- ai
description: Explore key integrations between Redis and popular AI frameworks, platforms, and tools.
linkTitle: Ecosystem integrations
weight: 50
---

Redis integrates with a wide range of AI frameworks, platforms, and tools to enhance your AI applications. This page highlights key ecosystem integrations that can help you build more powerful, efficient, and scalable AI solutions with Redis.

| | | |
|---|---|---|
| [**Kong AI Gateway & Redis**](https://redis.io/blog/kong-ai-gateway-and-redis/) | [**Unstructured & Redis**](https://redis.io/blog/faster-ai-workflows-with-unstructured-redis/) | [**Mem0 & Redis**](https://redis.io/blog/smarter-memory-management-for-ai-agents-with-mem0-and-redis/) |
| Combine Kong's AI Gateway with Redis for efficient AI request routing, caching, and rate limiting to optimize your AI infrastructure. | Accelerate AI workflows by using Redis to cache document processing results from Unstructured, reducing processing time and costs. | Implement smarter memory management for AI agents with Mem0's integration with Redis, providing persistent, queryable memory for LLMs. |
| [**LiteLLM & Redis**](https://docs.litellm.ai/docs/caching/all_caches#initialize-cache---in-memory-redis-s3-bucket-redis-semantic-disk-cache-qdrant-semantic) | [**LangGraph & Redis**](https://redis.io/blog/langgraph-redis-build-smarter-ai-agents-with-memory-persistence/) | [**LangChain & Redis**](https://redis.io/blog/langchain-redis-partner-package/) |
| Optimize LLM performance with LiteLLM's Redis caching capabilities, supporting both traditional and semantic caching to reduce costs and latency. | Build smarter AI agents with LangGraph's Redis integration for memory persistence, state management, and multi-agent coordination. | Leverage LangChain's Redis integration for vector storage, memory, and caching to create more capable AI applications with improved performance. |
| [**LlamaIndex & Redis**](https://docs.llamaindex.ai/en/stable/examples/vector_stores/RedisIndexDemo/) | [**Amazon Bedrock & Redis**]({{< relref "/integrate/amazon-bedrock/set-up-redis" >}}) | [**NVIDIA NIM & Redis**](https://redis.io/blog/use-redis-with-nvidia-nim-to-deploy-genai-apps-faster/) |
| Use LlamaIndex with Redis as a vector store for efficient document indexing, retrieval, and querying in RAG applications. | Integrate Redis with Amazon Bedrock to enhance your generative AI applications with persistent memory and efficient vector search. | Deploy GenAI applications faster by combining NVIDIA NIM's inference optimization with Redis for vector search, caching, and data management. |

## Additional integrations

- [**Microsoft Semantic Kernel**](https://learn.microsoft.com/en-us/semantic-kernel/concepts/vector-store-connectors/out-of-the-box-connectors/redis-connector?pivots=programming-language-csharp): Use Redis as a vector store connector with Microsoft's Semantic Kernel framework.
- [**DocArray**](https://docs.docarray.org/user_guide/storing/index_redis/): Leverage Redis as a document store and vector database with Jina AI's DocArray.
- [**Redis Cloud on Vercel**](https://redis.io/blog/redis-cloud-now-available-on-vercel-marketplace/): Deploy and manage Redis databases directly from your Vercel dashboard with the Redis Cloud integration. Refer to the [setup guide]({{< relref "/operate/rc/cloud-integrations/vercel" >}}) for more details.
- [**Spring AI & Redis**](https://redis.io/blog/building-a-rag-application-with-redis-and-spring-ai/): Build powerful RAG applications by combining Spring AI's framework with Redis for vector storage and retrieval.
- [**Kernel Memory & Redis**](https://redis.io/blog/building-llm-applications-with-kernel-memory-and-redis/): Create memory-enabled LLM applications using Microsoft's Kernel Memory with Redis for efficient storage and retrieval.

## Getting started

To learn more about using Redis with AI frameworks and tools, check out our [AI notebooks collection]({{< relref "/develop/ai/notebook-collection" >}}) and [RAG quickstart guide]({{< relref "/develop/get-started/rag" >}}).
