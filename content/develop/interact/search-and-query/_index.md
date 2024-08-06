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
description: Searching and querying Redis data
highlighted: true
linkTitle: Search and query
stack: true
title: Search and query
weight: 10
---

Redis Search offers an enhanced Redis experience via the following search and query features:

- A rich query language
- Incremental indexing on JSON and hash documents
- Vector search
- Full-text search
- Geospatial queries
- Aggregations

You can find a complete list of features in the [reference documentation]({{< relref "/develop/interact/search-and-query/advanced-concepts/" >}}).

The search and query features allow you to use Redis as a:

- Document database
- Vector database
- Secondary index
- Search engine

Here are the next steps to get you started:

1. Follow our [quick start guide]({{< relref "/develop/get-started/document-database" >}}) to get some initial hands-on experience.
1. Learn how to [create an index]({{< relref "/develop/interact/search-and-query/indexing/" >}}).
1. Learn how to [query your data]({{< relref "/develop/interact/search-and-query/query/" >}}).
1. [Install Redis Insight]({{< relref "/operate/redisinsight" >}}), connect it to your Redis database, and then use [Redis Copilot]({{< relref "/develop/connect/insight" >}}#redis-copilot) to help you learn how to execute complex queries against your own data using simple, plain language prompts.


## Enable Redis Search

Redis Search is not available by default in the basic Redis server, so you
should install Redis Stack or Redis Enterprise,
both of which include Redis Search and other useful modules.
See
[Install Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
[Install Redis Enterprise]({{< relref "/operate/rs/installing-upgrading/install" >}})
for full installation instructions.

## License and source code

The search and query features of Redis Stack are available under the Source Available License 2.0 (RSALv2) or the Server Side Public License v1 (SSPLv1). Please read the [license file](https://raw.githubusercontent.com/RediSearch/RediSearch/master/LICENSE.txt) for further details. The source code and the [detailed release notes](https://github.com/RediSearch/RediSearch/releases) are available on [GitHub](https://github.com/RediSearch/RediSearch).

Have you got questions? Feel free to ask at the [search and query forum](https://forum.redis.com/c/modules/redisearch/).

Redis Ltd. provides commercial support for Redis Stack. Please see the [Redis Ltd. website](https://redis.com/redis-enterprise/technology/redis-search/#sds) for more details and contact information.

<br/>