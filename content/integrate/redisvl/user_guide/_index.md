---
linkTitle: User Guides
title: User Guides
type: integration
weight: 4
---


User guides provide helpful resources for using RedisVL and its different components.



* [Getting Started with RedisVL](01_getting_started/)
  * [Define an `IndexSchema`](01_getting_started/#define-an-indexschema)
  * [Sample Dataset Preparation](01_getting_started/#sample-dataset-preparation)
  * [Create a `SearchIndex`](01_getting_started/#create-a-searchindex)
  * [Inspect with the `rvl` CLI](01_getting_started/#inspect-with-the-rvl-cli)
  * [Load Data to `SearchIndex`](01_getting_started/#load-data-to-searchindex)
  * [Creating `VectorQuery` Objects](01_getting_started/#creating-vectorquery-objects)
  * [Using an Asynchronous Redis Client](01_getting_started/#using-an-asynchronous-redis-client)
  * [Updating a schema](01_getting_started/#updating-a-schema)
  * [Check Index Stats](01_getting_started/#check-index-stats)
  * [Cleanup](01_getting_started/#cleanup)
* [Querying with RedisVL](02_hybrid_queries/)
  * [Hybrid Queries](02_hybrid_queries/#hybrid-queries)
  * [Combining Filters](02_hybrid_queries/#combining-filters)
  * [Non-vector Queries](02_hybrid_queries/#non-vector-queries)
  * [Count Queries](02_hybrid_queries/#count-queries)
  * [Range Queries](02_hybrid_queries/#range-queries)
  * [Advanced Query Modifiers](02_hybrid_queries/#advanced-query-modifiers)
* [Semantic Caching for LLMs](03_llmcache/)
  * [Initializing `SemanticCache`](03_llmcache/#initializing-semanticcache)
  * [Basic Cache Usage](03_llmcache/#basic-cache-usage)
  * [Customize the Distance Threshhold](03_llmcache/#customize-the-distance-threshhold)
  * [Utilize TTL](03_llmcache/#utilize-ttl)
  * [Simple Performance Testing](03_llmcache/#simple-performance-testing)
  * [Cache Access Controls, Tags & Filters](03_llmcache/#cache-access-controls-tags-filters)
* [Vectorizers](04_vectorizers/)
  * [Creating Text Embeddings](04_vectorizers/#creating-text-embeddings)
  * [Search with Provider Embeddings](04_vectorizers/#search-with-provider-embeddings)
  * [Selecting your float data type](04_vectorizers/#selecting-your-float-data-type)
* [Hash vs JSON Storage](05_hash_vs_json/)
  * [Hash or JSON – how to choose?](05_hash_vs_json/#hash-or-json-how-to-choose)
  * [Cleanup](05_hash_vs_json/#cleanup)
* [Rerankers](06_rerankers/)
  * [Simple Reranking](06_rerankers/#simple-reranking)
* [LLM Session Memory](07_session_manager/)
  * [Managing multiple users and conversations](07_session_manager/#managing-multiple-users-and-conversations)
  * [Semantic conversation memory](07_session_manager/#semantic-conversation-memory)
  * [Conversation control](07_session_manager/#conversation-control)
* [Semantic Routing](08_semantic_router/)
  * [Define the Routes](08_semantic_router/#define-the-routes)
  * [Initialize the SemanticRouter](08_semantic_router/#initialize-the-semanticrouter)
  * [Simple routing](08_semantic_router/#simple-routing)
  * [Update the routing config](08_semantic_router/#update-the-routing-config)
  * [Router serialization](08_semantic_router/#router-serialization)
  * [Clean up the router](08_semantic_router/#clean-up-the-router)
