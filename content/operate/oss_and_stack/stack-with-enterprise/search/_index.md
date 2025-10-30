---
Title: Search and query
alwaysopen: false
categories:
- docs
- operate
- stack
description: null
hideListLinks: true
linkTitle: Search and query
weight: 20
---
The [RediSearch 2.x module](https://redis.com/blog/introducing-redisearch-2-0/) is a source-available project that lets you build powerful search queries for open source Redis databases.
When combined with Redis Enterprise Software, you can use the same protocols and [commands]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/commands" >}})
to run geo-replicated queries and full-text searches over efficient in-memory indexes.

## Index documents

The search and query engine indexes documents, which are objects that represent data as field-value pairs. You can index more than one field per document, and these fields can represent text, numeric, or geospatial data types.

As the documents in your database change, the index automatically processes these changes to keep the search results up to date.

With indexes, you can do:
- Language-aware [fuzzy matching]({{< relref "develop/ai/search-and-query/advanced-concepts/query_syntax#fuzzy-matching" >}})
- Fast [auto-complete]({{< relref "develop/ai/search-and-query/administration/overview#auto-complete" >}})
- [Exact phrase matching]({{< relref "develop/ai/search-and-query/advanced-concepts/query_syntax" >}})
- [Numeric filtering]({{< relref "develop/ai/search-and-query/advanced-concepts/query_syntax#numeric-filters-in-query" >}})
- [Geo-radius queries]({{< relref "develop/ai/search-and-query/advanced-concepts/query_syntax#geo-filters" >}})

## Supported document types

You can store documents as Redis [hashes]({{< relref "/develop/data-types/hashes" >}}) or [JSON]({{< relref "/develop/data-types/json" >}}). To search and query JSON documents, you also need to enable [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}}) in your database.

### Hash documents

With Redis [hashes]({{< relref "/develop/data-types/hashes" >}}), each document is assigned to a single key and uses field-value pairs to represent the document's contents.

You can run [`HGETALL`]({{< relref "/commands/hgetall" >}}) to retrieve the entire hash document.

### JSON documents

You can index, search, and query JSON documents stored in your database.

For more information about how to search and query JSON documents, see the [quick start]({{< relref "/develop/get-started/document-database" >}}).

## Search features

For full-text searches, you can customize the field queries and ranking of the search results.
When querying, you can use multiple predicates that query text, numeric, and geospatial fields in one query.
You can also sort by a specific field and limit the results with an offset to produce customized results pages.

Redis Open Source supports [over 15 natural languages]({{< relref "/develop/ai/search-and-query/advanced-concepts/stemming" >}}) for stemming and includes auto-complete engines with specific commands that can provide real-time [interactive search suggestions]({{< relref "/commands/ft.sugadd" >}}).

## Search and query Active-Active databases

As a result of the new RediSearch architecture and methodology, [RediSearch 2.x supports Active-Active databases]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/search-active-active" >}}).
You can now serve your index information from geo-distributed database instances.

## Resharding indexed data

By moving the index out of the keyspace and structuring the data as hashes, RediSearch 2.x makes it possible to reshard the database.
When half of the data moves to the new shard, the index related to that data is created synchronously and Redis removes the keys from the index when it detects that the keys were deleted.
Because the index on the new shard is created synchronously though, it's expected that the resharding process will take longer than resharding of a database without search and query enabled.

## Limitations

- You cannot use search and query capabilities with the [OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}). This limitation was fixed in Redis Enterprise Software version 8.0.

## More info

- [Getting Started with RediSearch 2.0](https://redis.com/blog/getting-started-with-redisearch-2-0/)
- [Search and query quick start]({{< relref "/develop/get-started/document-database" >}})
- [Search and query configuration]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/config" >}})
- [Search and query commands]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/commands" >}})
- [Search and query references]({{< relref "/develop/ai/search-and-query/advanced-concepts/" >}})
- [RediSearch source](https://github.com/RediSearch/RediSearch)
