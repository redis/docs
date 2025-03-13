---
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
description: Searching and querying Redis data using the Redis Query Engine
highlighted: true
linkTitle: Redis Query Engine
stack: true
title: Redis Query Engine
weight: 10
---

The Redis Query Engine offers an enhanced Redis experience via the following search and query features:

- A rich query language
- Incremental indexing on JSON and hash documents
- Vector search
- Full-text search
- Geospatial queries
- Aggregations

You can find a complete list of features in the [reference documentation]({{< relref "/develop/interact/search-and-query/advanced-concepts/" >}}).

The Redis Query Engine features allow you to use Redis as a:

- Document database
- Vector database
- Secondary index
- Search engine

Here are the next steps to get you started:

1. Follow our [quick start guide]({{< relref "/develop/get-started/document-database" >}}) to get some initial hands-on experience.
1. Learn how to [create an index]({{< relref "/develop/interact/search-and-query/indexing/" >}}).
1. Learn how to [query your data]({{< relref "/develop/interact/search-and-query/query/" >}}).
1. [Install Redis Insight]({{< relref "/operate/redisinsight" >}}), connect it to your Redis database, and then use [Redis Copilot]({{< relref "/develop/tools/insight" >}}#redis-copilot) to help you learn how to execute complex queries against your own data using simple, plain language prompts.


## Enable the Redis Query Engine

The Redis Query Engine is available in Redis Community Edition, Redis Software, and Redis Cloud.
See
[Install Redis Community Edition]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
[Install Redis Enterprise]({{< relref "/operate/rs/installing-upgrading/install" >}})
for full installation instructions.

## License and source code

The Redis Query Engine features of Redis are available under the Source Available License 2.0 (RSALv2) or the Server Side Public License v1 (SSPLv1). Please read the [license file](https://raw.githubusercontent.com/RediSearch/RediSearch/master/LICENSE.txt) for further details. The source code and the [detailed release notes](https://github.com/RediSearch/RediSearch/releases) are available on [GitHub](https://github.com/RediSearch/RediSearch).

Do you have questions? Feel free to ask at the [RediSearch forum](https://forum.redis.com/c/modules/redisearch/).

<br/>