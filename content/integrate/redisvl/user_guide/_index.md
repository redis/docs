---
linkTitle: User guides
title: User Guides
type: integration
weight: 4
hideListLinks: true
---


User guides provide helpful resources for using RedisVL and its different components.



* [Getting Started with RedisVL](getting_started/)
  * [Define an `IndexSchema`](getting_started/#define-an-indexschema)
  * [Sample Dataset Preparation](getting_started/#sample-dataset-preparation)
  * [Create a `SearchIndex`](getting_started/#create-a-searchindex)
  * [Inspect with the `rvl` CLI](getting_started/#inspect-with-the-rvl-cli)
  * [Load Data to `SearchIndex`](getting_started/#load-data-to-searchindex)
  * [Creating `VectorQuery` Objects](getting_started/#creating-vectorquery-objects)
  * [Using an Asynchronous Redis Client](getting_started/#using-an-asynchronous-redis-client)
  * [Updating a schema](getting_started/#updating-a-schema)
  * [Check Index Stats](getting_started/#check-index-stats)
  * [Cleanup](getting_started/#cleanup)
* [Querying with RedisVL](hybrid_queries/)
  * [Hybrid Queries](hybrid_queries/#hybrid-queries)
  * [Combining Filters](hybrid_queries/#combining-filters)
  * [Non-vector Queries](hybrid_queries/#non-vector-queries)
  * [Count Queries](hybrid_queries/#count-queries)
  * [Range Queries](hybrid_queries/#range-queries)
  * [Advanced Query Modifiers](hybrid_queries/#advanced-query-modifiers)
* [Semantic Caching for LLMs](llmcache/)
  * [Initializing `SemanticCache`](llmcache/#initializing-semanticcache)
  * [Basic Cache Usage](llmcache/#basic-cache-usage)
  * [Customize the Distance Threshhold](llmcache/#customize-the-distance-threshhold)
  * [Utilize TTL](llmcache/#utilize-ttl)
  * [Simple Performance Testing](llmcache/#simple-performance-testing)
  * [Cache Access Controls, Tags & Filters](llmcache/#cache-access-controls-tags-filters)
* [Vectorizers](vectorizers/)
  * [Creating Text Embeddings](vectorizers/#creating-text-embeddings)
  * [Search with Provider Embeddings](vectorizers/#search-with-provider-embeddings)
  * [Selecting your float data type](vectorizers/#selecting-your-float-data-type)
* [Hash vs JSON Storage](hash_vs_json/)
  * [Hash or JSON – how to choose?](hash_vs_json/#hash-or-json-how-to-choose)
  * [Cleanup](hash_vs_json/#cleanup)
* [Working with nested data in JSON](hash_vs_json/#working-with-nested-data-in-json)
  * [Full JSON Path support](hash_vs_json/#full-json-path-support)
  * [As an example:](hash_vs_json/#as-an-example)
* [Cleanup](hash_vs_json/#id1)
* [Rerankers](rerankers/)
  * [Simple Reranking](rerankers/#simple-reranking)
* [LLM Session Memory](session_manager/)
  * [Managing multiple users and conversations](session_manager/#managing-multiple-users-and-conversations)
  * [Semantic conversation memory](session_manager/#semantic-conversation-memory)
  * [Conversation control](session_manager/#conversation-control)
* [Semantic Routing](semantic_router/)
  * [Define the Routes](semantic_router/#define-the-routes)
  * [Initialize the SemanticRouter](semantic_router/#initialize-the-semanticrouter)
  * [Simple routing](semantic_router/#simple-routing)
  * [Update the routing config](semantic_router/#update-the-routing-config)
  * [Router serialization](semantic_router/#router-serialization)
  * [Clean up the router](semantic_router/#clean-up-the-router)
