---
aliases:
- /develop/interact/search-and-query/query/vector-search
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
description: Query for data based on vector embeddings
linkTitle: Vector
title: Vector search
weight: 5
---

This article gives you a good overview of how to perform vector search queries with the Redis Query Engine, which is part of Redis Open Source. See the [Redis as a vector database quick start guide]({{< relref "/develop/get-started/vector-database" >}}) for more information about Redis as a vector database. You can also find more detailed information about all the parameters in the [vector reference documentation]({{< relref "/develop/ai/search-and-query/vectors" >}}).

A vector search query on a vector field allows you to find all vectors in a vector space that are close to a given vector. You can query for the k-nearest neighbors or vectors within a given radius.

The examples in this article use a schema with the following fields:

| JSON field               | Field alias | Field type  | Description |
| ------------------------ | ----------- | ----------- | ----------- |
| `$.description`            | `description` | `TEXT`        | The description of a bicycle as unstructured text |
| `$.description_embeddings` | `vector`      | `VECTOR`      | The vector that a machine learning model derived from the description text | 

## K-neareast neighbours (KNN)

The Redis command [FT.SEARCH]({{< relref "commands/ft.search" >}}) takes the index name, the query string, and additional query parameters as arguments. You need to pass the number of nearest neighbors, the vector field name, and the vector's binary representation in the following way:

```
FT.SEARCH index "(*)=>[KNN num_neighbours @field $vector]" PARAMS 2 vector "binary_data" DIALECT 2
```

Here is a more detailed explanation of this query:

1. **Pre-filter**: The first expression within the round brackets is a filter. It allows you to decide which vectors should be taken into account before the vector search is performed. The expression `(*)` means that all vectors are considered.
2. **Next step**: The `=>` arrow indicates that the pre-filtering happens before the vector search.
3. **KNN query**: The expression `[KNN num_neighbours @field $vector]` is a parameterized query expression. A parameter name is indicated by the `$` prefix within the query string.
4. **Vector binary data**: You need to use the `PARAMS` argument to substitute `$vector` with the binary representation of the vector. The value `2` indicates that `PARAMS` is followed by two arguments, the parameter name `vector` and the parameter value.
5. **Dialect**: The vector search feature has been available since version two of the query dialect.

You can read more about the `PARAMS` argument in the [FT.SEARCH]({{< relref "commands/ft.search" >}}) command reference.

The following example shows you how to query for three bikes based on their description embeddings, and by using the field alias `vector`. The result is returned in ascending order based on the distance. You can see that the query only returns the fields `__vector_score` and `description`. The field `__vector_score` is present by default. Because you can have multiple vector fields in your schema, the vector score field name depends on the name of the vector field. If you change the field name `@vector` to `@foo`, the score field name changes to `__foo_score`.

{{< clients-example set="query_vector" step="vector1" description="K-nearest neighbors: Find the k closest vectors to a query vector using KNN when you need to retrieve similar items based on embeddings" difficulty="beginner" >}}
FT.SEARCH idx:bikes_vss "(*)=>[KNN 3 @vector $query_vector]" PARAMS 2 "query_vector" "Z\xf8\x15:\xf23\xa1\xbfZ\x1dI>\r\xca9..." SORTBY "__vector_score" ASC RETURN 2 "__vector_score" "description" DIALECT 2
{{< /clients-example >}}

<!-- Python query>
query = (
    Query('(*)=>[KNN 3 @vector $query_vector]')
     .sort_by('__vector_score')
     .return_fields('__vector_score', 'description')
     .dialect(2)
)
</!-->

{{% alert title="Note" color="warning" %}}
The binary value of the query vector is significantly shortened in the CLI example above.
{{% /alert  %}}


## Radius

Instead of the number of nearest neighbors, you need to pass the radius along with the index name, the vector field name, and the vector's binary value:

```
FT.SEARCH index "@field:[VECTOR_RANGE radius $vector]" PARAMS 2 vector "binary_data" DIALECT 2
```

If you want to sort by distance, then you must yield the distance via the range query parameter `$YIELD_DISTANCE_AS`:

```
FT.SEARCH index "@field:[VECTOR_RANGE radius $vector]=>{$YIELD_DISTANCE_AS: dist_field}" PARAMS 2 vector "binary_data" SORTBY dist_field DIALECT 2
```

Here is a more detailed explanation of this query:

1. **Range query**: the syntax of a radius query is very similar to the regular range query, except for the keyword `VECTOR_RANGE`. You can also combine a vector radius query with other queries in the same way as regular range queries.  See [combined queries article]({{< relref "/develop/ai/search-and-query/query/combined" >}}) for more details.
2. **Additional step**: the `=>` arrow means that the range query is followed by evaluating additional parameters.
3. **Range query parameters**: parameters such as `$YIELD_DISTANCE_AS` can be found in the [vectors reference documentation]({{< relref "/develop/ai/search-and-query/vectors" >}}).
4. **Vector binary data**: you need to use `PARAMS` to pass the binary representation of the vector.
5. **Dialect**: vector search has been available since version two of the query dialect.


{{% alert title="Note" color="warning" %}}
By default, [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) returns only the first ten results. The [range query article]({{< relref "/develop/ai/search-and-query/query/range" >}}) explains to you how to scroll through the result set.
{{% /alert  %}}

The example below shows a radius query that returns the description and the distance within a radius of `0.5`. The result is sorted by the distance.

{{< clients-example set="query_vector" step="vector2" description="Radius search: Find all vectors within a specified distance threshold using VECTOR_RANGE when you need to retrieve similar items with a distance constraint" difficulty="intermediate" >}}
FT.SEARCH idx:bikes_vss "@vector:[VECTOR_RANGE 0.5 $query_vector]=>{$YIELD_DISTANCE_AS: vector_dist}" PARAMS 2 "query_vector" "Z\xf8\x15:\xf23\xa1\xbfZ\x1dI>\r\xca9..." SORTBY vector_dist ASC RETURN 2 vector_dist description DIALECT 2
{{< /clients-example >}}

<!-- Python query>
query = (
    Query('@vector:[VECTOR_RANGE 0.5 $query_vector]=>{$YIELD_DISTANCE_AS: vector_dist}')
     .sort_by('vector_dist')
     .return_fields('vector_dist', 'description')
     .dialect(2)
)
</!-->

## Cluster optimization

In Redis cluster environments, you can optimize vector search performance using the `$SHARD_K_RATIO` query attribute. This parameter controls how many results each shard retrieves relative to the requested `top_k`, creating a tunable trade-off between accuracy and performance.

### Basic cluster optimization

Retrieve 100 nearest neighbors with each shard providing 60% of the requested results:

{{< clients-example set="query_vector" step="vector3" description="Cluster optimization: Optimize KNN queries in cluster environments using SHARD_K_RATIO to balance accuracy and performance when you need efficient distributed vector search" difficulty="advanced" >}}
FT.SEARCH idx:bikes_vss "(*)=>[KNN 100 @vector $query_vector]=>{$SHARD_K_RATIO: 0.6; $YIELD_DISTANCE_AS: vector_distance}" PARAMS 2 "query_vector" "Z\xf8\x15:\xf23\xa1\xbfZ\x1dI>\r\xca9..." SORTBY vector_distance ASC RETURN 2 "vector_distance" "description" DIALECT 2
{{< /clients-example >}}

### Combined with filtering

You can combine `$SHARD_K_RATIO` with pre-filtering to optimize searches on specific subsets of data:

{{< clients-example set="query_vector" step="vector4" description="Filtered vector search: Combine pre-filtering with KNN and cluster optimization to search within a subset of data when you need to find similar items matching specific criteria" difficulty="advanced" >}}
FT.SEARCH idx:bikes_vss "(@brand:trek)=>[KNN 50 @vector $query_vector]=>{$SHARD_K_RATIO: 0.4; $YIELD_DISTANCE_AS: similarity}" PARAMS 2 "query_vector" "Z\xf8\x15:\xf23\xa1\xbfZ\x1dI>\r\xca9..." SORTBY similarity ASC RETURN 2 "similarity" "description" DIALECT 2
{{< /clients-example >}}

{{% alert title="Note" color="warning" %}}
The `$SHARD_K_RATIO` parameter is only applicable in Redis cluster environments and has no effect in standalone Redis instances.
{{% /alert  %}}