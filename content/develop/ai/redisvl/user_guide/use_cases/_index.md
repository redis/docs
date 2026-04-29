---
linkTitle: Use cases
title: Use Cases
aliases:
- /integrate/redisvl/user_guide/use_cases
weight: 5
hideListLinks: true
---


RedisVL powers a wide range of AI applications. Here's how to apply its features to common use cases.

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">🧠 Agent Context</h3><p>Provide agents with the right information at the right time.</p>
<ul>
<li><strong>RAG</strong> — Retrieval-Augmented Generation with <a href="../getting_started/">vector search</a> and <a href="../how_to_guides/advanced_queries/">hybrid queries</a></li>
<li><strong>Memory</strong> — Persistent <a href="../how_to_guides/message_history/">message history</a> across sessions</li>
<li><strong>Context Engineering</strong> — Combine <a href="../how_to_guides/complex_filtering/">filtering</a>, <a href="../how_to_guides/rerankers/">reranking</a>, and <a href="../how_to_guides/vectorizers/">embeddings</a> to curate the optimal context window</li>
</ul></div>
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">⚡ Agent Optimization</h3><p>Reduce latency and cost for AI workloads.</p>
<ul>
<li><strong>Semantic Caching</strong> — Cache LLM responses by meaning with <a href="../how_to_guides/llmcache/">SemanticCache</a></li>
<li><strong>Embeddings Caching</strong> — Avoid redundant embedding calls with <a href="../how_to_guides/embeddings_cache/">EmbeddingsCache</a></li>
<li><strong>Semantic Routing</strong> — Route queries to the right handler with <a href="../how_to_guides/semantic_router/">SemanticRouter</a></li>
</ul></div>
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">🔍 General Search</h3><p>Build search experiences that understand meaning, not just keywords.</p>
<ul>
<li><strong>Semantic Search</strong> — <a href="../getting_started/">Vector queries</a> with <a href="../how_to_guides/complex_filtering/">complex filtering</a></li>
<li><strong>Hybrid Search</strong> — Combine keyword and vector search with <a href="../how_to_guides/advanced_queries/">advanced query types</a></li>
<li><strong>SQL Translation</strong> — Use familiar SQL syntax with <a href="../how_to_guides/sql_to_redis_queries/">SQLQuery</a></li>
</ul></div>
<div class="p-5 border border-redis-pen-300 rounded-lg"><h3 class="mt-0 mb-2">🎯 Personalization & RecSys</h3><p>Drive engagement with personalized recommendations.</p>
<ul>
<li><strong>User Similarity</strong> — Find similar users or items using <a href="../getting_started/">vector search</a></li>
<li><strong>Real-Time Ranking</strong> — Combine vector similarity with <a href="../how_to_guides/complex_filtering/">metadata filtering</a> and <a href="../how_to_guides/rerankers/">reranking</a></li>
<li><strong>Multi-Signal Matching</strong> — Search across multiple embedding fields with <a href="../how_to_guides/advanced_queries/">MultiVectorQuery</a></li>
</ul></div>
</div>
