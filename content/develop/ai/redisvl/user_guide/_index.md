---
linkTitle: Guides
title: Guides
aliases:
- /integrate/redisvl/user_guide
hideListLinks: true
---


Welcome to the RedisVL guides! Whether you’re just getting started or building advanced AI applications, these guides will help you make the most of Redis as your vector database.

**Set up RedisVL.** Install the library and configure your Redis instance for vector search.

pip install • Redis Cloud • Docker

**New to RedisVL?** Start here to learn the basics and build your first vector search application in minutes.

Schema → Index → Load → Query

**Solve specific problems.** Task-oriented recipes for LLM extensions, querying, embeddings, optimization, and storage.

LLM Caching • Filtering • MCP • Reranking

**Expose Redis through MCP.** Run the RedisVL MCP server, configure one existing index, and use search or optional upsert tools.

stdio, HTTP, SSE • One index • Search and upsert

**Command-line tools.** Manage indices, inspect stats, and work with schemas using the `rvl` CLI.

rvl index • rvl stats • Schema YAML

**Apply RedisVL to real-world problems.** See which guides map to your use case.

Agent Context • Agent Optimization • Search • RecSys

* [Installation](installation/)
  * [Install RedisVL with Pip](installation/#install-redisvl-with-pip)
  * [Install RedisVL from Source](installation/#install-redisvl-from-source)
  * [Development Installation](installation/#development-installation)
  * [Installing Redis](installation/#installing-redis)
* [Getting Started](getting_started/)
  * [Prerequisites](getting_started/#prerequisites)
  * [What You’ll Learn](getting_started/#what-you-ll-learn)
  * [Define an `IndexSchema`](getting_started/#define-an-indexschema)
  * [Sample Dataset Preparation](getting_started/#sample-dataset-preparation)
  * [Create a `SearchIndex`](getting_started/#create-a-searchindex)
  * [Inspect with the `rvl` CLI](getting_started/#inspect-with-the-rvl-cli)
  * [Load Data to `SearchIndex`](getting_started/#load-data-to-searchindex)
  * [Fetch and Manage Records](getting_started/#fetch-and-manage-records)
  * [Creating `VectorQuery` Objects](getting_started/#creating-vectorquery-objects)
  * [Using an Asynchronous Redis Client](getting_started/#using-an-asynchronous-redis-client)
  * [Updating a schema](getting_started/#updating-a-schema)
  * [Check Index Stats](getting_started/#check-index-stats)
  * [Next Steps](getting_started/#next-steps)
  * [Cleanup](getting_started/#cleanup)
* [How-To Guides](how_to_guides/)
  * [Quick Reference](how_to_guides/#quick-reference)
* [CLI Reference](cli/)
  * [Commands](cli/#commands)
  * [Index](cli/#index)
  * [Stats](cli/#stats)
  * [Optional arguments](cli/#optional-arguments)
* [Use Cases](use_cases/)
