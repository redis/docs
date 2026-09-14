---
aliases:
- /develop/interact/search-and-query
- /develop/interact/search-and-query/
- /interact/search-and-query/
- /search/
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Searching and querying Redis data using Redis Search
highlighted: true
linkTitle: Redis Search
stack: true
title: Redis Search
weight: 10
---

Redis Search offers an enhanced Redis experience via the following search and query features:

- A rich query language
- Incremental indexing on JSON and hash documents
- Vector search
- Full-text search
- Geospatial queries
- Aggregations

You can find a complete list of features in the [reference documentation](/content/develop/ai/search-and-query/advanced-concepts/_index.md).

Redis Search features allow you to use Redis as a:

- Document database
- Vector database
- Secondary index
- Search engine

Here are the next steps to get you started:

1. Follow our [quick start guide](/content/develop/get-started/search-tutorial/_index.md) to get some initial hands-on experience.
1. Learn how to [create an index](/content/develop/ai/search-and-query/indexing/_index.md).
1. Learn how to [query your data](/content/develop/ai/search-and-query/query/_index.md).
1. [Install Redis Insight](/content/operate/redisinsight/_index.md), connect it to your Redis database, and then use [Redis Copilot](/content/develop/tools/insight/_index.md#redis-copilot) to help you learn how to execute complex queries against your own data using simple, plain language prompts.
1. Open the [AI agent builder](/content/develop/ai/agent-builder/_index.md) and choose the **Knowledge Assistant** template to generate a working RAG agent built on Redis vector search.

> [!TIP]
> See Redis vector search in a real workflow: [Redis Repo Memory](https://github.com/marketplace/actions/redis-repo-memory) is a GitHub Action that surfaces related past PRs, issues, and commits on every pull request. Add it to any repository in a few minutes.

## Enable Redis Search

Redis Search is available in Redis Open Source, Redis Software, and Redis Cloud.
See
[Install Redis Open Source](/content/operate/oss_and_stack/install/install-stack/_index.md) or
[Install Redis Software](/content/operate/rs/installing-upgrading/install/_index.md)
for full installation instructions.

> [!NOTE] Try it out
> Experiment with Redis Search interactively in the [Redis playground](https://redis.io/try/sandbox) — no installation required.

## License and source code

The Redis Search features of Redis are available under the Source Available License 2.0 (RSALv2), the Server Side Public License v1 (SSPLv1), or the GNU Affero General Public License version 3 (AGPLv3). Please read the [license file](https://raw.githubusercontent.com/RediSearch/RediSearch/master/LICENSE.txt) for further details. The source code and the [detailed release notes](https://github.com/RediSearch/RediSearch/releases) are available on [GitHub](https://github.com/RediSearch/RediSearch).

Do you have questions? Feel free to ask at the [RediSearch forum](https://forum.redis.com/c/modules/redisearch/).

<br/>
