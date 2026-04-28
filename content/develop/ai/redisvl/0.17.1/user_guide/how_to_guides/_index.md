---
linkTitle: How-To guides
title: How-To Guides
weight: 3
hideListLinks: true
url: '/develop/ai/redisvl/0.17.1/user_guide/how_to_guides/'
---


How-to guides are **task-oriented** recipes that help you accomplish specific goals. Each guide focuses on solving a particular problem and can be completed independently.

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">🤖 LLM Extensions</h3><ul>
<li><a href="llmcache/">Cache LLM Responses</a> — semantic caching to reduce costs and latency</li>
<li><a href="message_history/">Manage LLM Message History</a> — persistent chat history with relevancy retrieval</li>
<li><a href="semantic_router/">Route Queries with SemanticRouter</a> — classify intents and route queries</li>
</ul></div>
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">🔍 Querying</h3><ul>
<li><a href="complex_filtering/">Query and Filter Data</a> — combine tag, numeric, geo, and text filters</li>
<li><a href="advanced_queries/">Use Advanced Query Types</a> — hybrid, multi-vector, range, and text queries</li>
<li><a href="sql_to_redis_queries/">Write SQL Queries for Redis</a> — translate SQL to Redis query syntax</li>
</ul></div>
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">🧮 Embeddings</h3><ul>
<li><a href="vectorizers/">Create Embeddings with Vectorizers</a> — OpenAI, Cohere, HuggingFace, and more</li>
<li><a href="embeddings_cache/">Cache Embeddings</a> — reduce costs by caching embedding vectors</li>
</ul></div>
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">⚡ Optimization</h3><ul>
<li><a href="rerankers/">Rerank Search Results</a> — improve relevance with cross-encoders and rerankers</li>
<li><a href="svs_vamana/">Optimize Indexes with SVS-VAMANA</a> — graph-based vector search with compression</li>
</ul></div>
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">💾 Storage</h3><ul>
<li><a href="hash_vs_json/">Choose a Storage Type</a> — Hash vs JSON formats and nested data</li>
</ul></div>
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">💻 CLI Operations</h3><ul>
<li><a href="../cli/">Manage Indices with the CLI</a> — create, inspect, and delete indices from your terminal</li>
<li><a href="mcp/">Run RedisVL MCP</a> — expose an existing Redis index to MCP clients</li>
</ul></div>
</div>

## Quick Reference

| I want to... | Guide |
|--------------|-------|
| Cache LLM responses | [Cache LLM Responses](llmcache/) |
| Store chat history | [Manage LLM Message History](message_history/) |
| Route queries by intent | [Route Queries with SemanticRouter](semantic_router/) |
| Filter results by multiple criteria | [Query and Filter Data](complex_filtering/) |
| Use hybrid or multi-vector queries | [Use Advanced Query Types](advanced_queries/) |
| Translate SQL to Redis | [Write SQL Queries for Redis](sql_to_redis_queries/) |
| Choose an embedding model | [Create Embeddings with Vectorizers](vectorizers/) |
| Speed up embedding generation | [Cache Embeddings](embeddings_cache/) |
| Improve search accuracy | [Rerank Search Results](rerankers/) |
| Optimize index performance | [Optimize Indexes with SVS-VAMANA](svs_vamana/) |
| Decide on storage format | [Choose a Storage Type](hash_vs_json/) |
| Manage indices from terminal | [Manage Indices with the CLI](../cli/) |
| Expose an index through MCP | [Run RedisVL MCP](mcp/) |
