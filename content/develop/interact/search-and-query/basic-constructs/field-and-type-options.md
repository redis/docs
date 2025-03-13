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
description: Available field types and options.
linkTitle: Field and type options
title: Field and type options
weight: 2
---


Redis Stack provides various field types that allow you to store and search different kinds of data in your indexes. This page explains the available field types, their characteristics, and how they can be used effectively.

## Numeric fields

Numeric fields are used to store non-textual, countable values. They can hold integer or floating-point values. Numeric fields are sortable, meaning you can perform range-based queries and retrieve documents based on specific numeric conditions. For example, you can search for documents with a price between a certain range or retrieve documents with a specific rating value.

You can add number fields to a schema in [`FT.CREATE`]({{< relref "commands/ft.create/" >}}) using this syntax:

```
FT.CREATE ... SCHEMA ... {field_name} NUMERIC [SORTABLE] [NOINDEX]
```

where:

- `SORTABLE` indicates that the field can be sorted. This is useful for performing range queries and sorting search results based on numeric values.
- `NOINDEX` indicates that the field is not indexed. This is useful for storing numeric values that you don't want to search for, but that you want to retrieve in search results.

You can search for documents with specific numeric values using the `@<field_name>:[<min> <max>]` query syntax. For example, this query finds documents with a price between 200 and 300:

```
FT.SEARCH products "@price:[200 300]"
```

You can also use the following query syntax to perform more complex numeric queries:  

| **Comparison operator** | **Query string**              | **Comment**              |
|-------------------------|-------------------------------|--------------------------|
| min &lt;= x &lt;= max   | @field:[min max]              | Fully inclusive range    |
|                         | "@field>=min @field<=max"     | Fully inclusive range \* |
| min &lt; x &lt; max     | @field:[(min (max]            | Fully exclusive range    |
|                         | "@field>min @field<max"       | Fully exclusive range \* |
|                         |                               |   grouping with a space denotes AND relationship |
| x >= min                | @field:[min +inf]             | Upper open range         |
|                         | @field>=min                   | Upper open range \*      |
| x &lt;= max             | @field:[-inf max]             | Lower open range         |
|                         | @field<=max                   | Lower open range \*      |
| x == val                | @field:[val val]              | Equal                    |
|                         | @field:[val]                  | Equal \*                 |
|                         | @field==val                   | Equal \*                 |
| x != val                | -@field:[val val]             | Not equal                |
|                         | @field!=val                   | Not equal \*             |
| x == val1 or x == val2  | "@field==val1 \| @field==val2" | Grouping with a bar denotes OR relationship \* |

\* New syntax as of RediSearch v2.10. Requires [`DIALECT 2`]({{< relref "/develop/interact/search-and-query/advanced-concepts/dialects" >}}#dialect-2). 


## Geo fields

Geo fields are used to store geographical coordinates such as longitude and latitude. They enable geospatial radius queries, which allow you to implement location-based search functionality in your applications such as finding nearby restaurants, stores, or any other points of interest.

Redis Query Engine also supports [geoshape fields](#geoshape-fields) for more advanced
geospatial queries. See the
[Geospatial]({{< relref "/develop/interact/search-and-query/advanced-concepts/geo" >}})
reference page for an introduction to the format and usage of both schema types.

You can add geo fields to the schema in [`FT.CREATE`]({{< relref "commands/ft.create/" >}}) using this syntax:

```
FT.CREATE ... SCHEMA ... {field_name} GEO [SORTABLE] [NOINDEX]
```

Where:
- `SORTABLE` indicates that the field can be sorted. This is useful for performing range queries and sorting search results based on coordinates.
- `NOINDEX` indicates that the field is not indexed. This is useful for storing coordinates that you don't want to search for, but that you still want to retrieve in search results.

You can query geo fields using the `@<field_name>:[<lon> <lat> <radius> <unit>]` query syntax. For example, this query finds documents within 1000 kilometers from the point `2.34, 48.86`:

```
FT.SEARCH cities "@coords:[2.34 48.86 1000 km]"
```

See
[Geospatial queries]({{< relref "/develop/interact/search-and-query/query/geo-spatial" >}})
for more information and code examples.

## Geoshape fields

Geoshape fields provide more advanced functionality than [Geo](#geo-fields).
You can use them to represent locations as points but also to define
shapes and query the interactions between points and shapes (for example,
to find all points that are contained within an enclosing shape). You can
also choose between geographical coordinates (on the surface of a sphere)
or standard Cartesian coordinates. Use geoshape fields for spatial queries
such as finding all office locations in a specified region or finding
all rooms in a building that fall within range of a wi-fi router.

See the
[Geospatial]({{< relref "/develop/interact/search-and-query/advanced-concepts/geo" >}})
reference page for an introduction to the format and usage of both the
geoshape and geo schema types.

Add geoshape fields to the schema in
[`FT.CREATE`]({{< relref "commands/ft.create/" >}}) using the following syntax:

```
FT.CREATE ... SCHEMA ... {field_name} GEOSHAPE [FLAT|SPHERICAL] [NOINDEX]
```

Where:
-   `FLAT` indicates Cartesian (planar) coordinates.
-   `SPHERICAL` indicates spherical (geographical) coordinates. This is the
    default option if you don't specify one explicitly.
-   `NOINDEX` indicates that the field is not indexed. This is useful for storing
    coordinates that you don't want to search for, but that you still want to retrieve
    in search results.

Note that unlike geo fields, geoshape fields don't support the `SORTABLE` option.

Query geoshape fields using the syntax `@<field_name>:[<OPERATION> <shape>]`
where `<operation>` is one of `WITHIN`, `CONTAINS`, `INTERSECTS`, or `DISJOINT`,
and `<shape>` is the shape of interest, specified in the
[Well-known text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)
format. For example, the query below finds shapes that contain the point (2, 2):

```
FT.SEARCH idx "(@geom:[CONTAINS $qshape])" PARAMS 2 qshape "POINT (2 2)" RETURN 1 name DIALECT 2
```

See
[Geospatial queries]({{< relref "/develop/interact/search-and-query/query/geo-spatial" >}})
for more information and code examples.

## Vector fields

Vector fields are floating-point vectors that are typically generated by external machine learning models. These vectors represent unstructured data such as text, images, or other complex features. Redis Stack allows you to search for similar vectors using vector search algorithms like cosine similarity, Euclidean distance, and inner product. This enables you to build advanced search applications, recommendation systems, or content similarity analysis.

You can add vector fields to the schema in [`FT.CREATE`]({{< relref "commands/ft.create/" >}}) using this syntax:

```
FT.CREATE ... SCHEMA ... {field_name} VECTOR {algorithm} {count} [{attribute_name} {attribute_value} ...]
```

Where:

* `{algorithm}` must be specified and be a supported vector similarity index algorithm. The supported algorithms are:

    - `FLAT`: brute force algorithm.
    - `HNSW`: hierarchical, navigable, small world algorithm.

    The `{algorithm}` attribute specifies the algorithm to use when searching `k` most similar vectors in the index or filtering vectors by range.

* `{count}` specifies the number of attributes for the index and it must be present. 
Notice that `{count}` represents the total number of attribute pairs passed in the command. Algorithm parameters should be submitted as named arguments. 

    For example:

    ```
    FT.CREATE my_idx SCHEMA vec_field VECTOR FLAT 6 TYPE FLOAT32 DIM 128 DISTANCE_METRIC L2
    ```

    Here, three parameters are passed for the index ([`TYPE`]({{< relref "/commands/type" >}}), `DIM`, `DISTANCE_METRIC`), and `count` is the total number of attributes (6).

* `{attribute_name} {attribute_value}` are algorithm attributes for the creation of the vector index. Every algorithm has its own mandatory and optional attributes.

For more information about vector fields, see [vector fields]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}}).

## Tag fields

Tag fields are used to store textual data that represents a collection of data tags or labels. Tag fields are characterized by their low cardinality, meaning they typically have a limited number of distinct values. Unlike text fields, tag fields are stored as-is without tokenization or stemming. They are useful for organizing and categorizing data, making it easier to filter and retrieve documents based on specific tags.

Tag fields can be added to the schema with the following syntax:

```
FT.CREATE ... SCHEMA ... {field_name} TAG [SEPARATOR {sep}] [CASESENSITIVE]
```

where

- `SEPARATOR` defaults to a comma (`,`), and can be any printable ASCII character. It is used to separate tags in the field value. For example, if the field value is `hello,world`, the tags are `hello` and `world`.

- `CASESENSITIVE` indicates that the field is case-sensitive. By default, tag fields are case-insensitive.

You can search for documents with specific tags using the `@<field_name>:{<tag>}` query syntax. For example, this query finds documents with the tag `blue`:

```
FT.SEARCH idx "@tags:{blue}"
```

For more information about tag fields, see [Tag Fields]({{< relref "/develop/interact/search-and-query/advanced-concepts/tags" >}}).

## Text fields

Text fields are specifically designed for storing human language text. When indexing text fields, Redis Stack performs several transformations to optimize search capabilities. The text is transformed to lowercase, allowing case-insensitive searches. The data is tokenized, meaning it is split into individual words or tokens, which enables efficient full-text search functionality. Text fields can be weighted to assign different levels of importance to specific fields during search operations. Additionally, text fields can be sorted based on their values, enabling the sorting of search results by relevance or other criteria.

Text fields can be added to the schema with the following syntax:

```
FT.CREATE ... SCHEMA ... {field_name} TEXT [WEIGHT] [NOSTEM] [PHONETIC {matcher}] [SORTABLE] [NOINDEX] [WITHSUFFIXTRIE]
```

where

- `WEIGHT` indicates that the field is weighted. This is useful for assigning different levels of importance to specific fields during search operations.
- `NOSTEM` indicates that the field is not stemmed. This is useful for storing text that you don't want to be tokenized, such as URLs or email addresses.
- `PHONETIC {matcher}` Declaring a text attribute as `PHONETIC` will perform phonetic matching on it in searches by default. The obligatory matcher argument specifies the phonetic algorithm and language used. The following matchers are supported:

   - `dm:en` - double metaphone for English
   - `dm:fr` - double metaphone for French
   - `dm:pt` - double metaphone for Portuguese
   - `dm:es` - double metaphone for Spanish

    For more information, see [Phonetic Matching]({{< relref "/develop/interact/search-and-query/advanced-concepts/phonetic_matching" >}}).
- `SORTABLE` indicates that the field can be sorted. This is useful for performing range queries and sorting search results based on text values.
- `NOINDEX` indicates that the field is not indexed. This is useful for storing text that you don't want to search for, but that you still want to retrieve in search results.
- `WITHSUFFIXTRIE` indicates that the field will be indexed with a suffix trie. The index will keep a suffix trie with all terms which match the suffix. It is used to optimize `contains (*foo*)` and `suffix (*foo)` queries. Otherwise, a brute-force search on the trie is performed. If a suffix trie exists for some fields, these queries will be disabled for other fields.

You can search for documents with specific text values using the `<term>` or the `@<field_name>:{<term>}` query syntax. Here are a couple of examples:

- Search for a term in every text attribute:
    ```
    FT.SEARCH books-idx "wizard"
    ```

- Search for a term only in the `title` attribute
    ```
    FT.SEARCH books-idx "@title:dogs"
    ```

## Unicode considerations

Redis Query Engine only supports Unicode characters in the [basic multilingual plane](https://en.wikipedia.org/wiki/Plane_(Unicode)#Basic_Multilingual_Plane); U+0000 to U+FFFF. Unicode characters beyond U+FFFF, such as Emojis, are not supported and would not be retrieved by queries including such characters in the following use cases:

* Querying TEXT fields with Prefix/Suffix/Infix
* Querying TEXT fields with fuzzy

Examples:

```
redis> FT.CREATE idx SCHEMA tag TAG text TEXT
OK
redis> HSET doc:1 tag '😀😁🙂' text '😀😁🙂'
(integer) 2
redis> HSET doc:2 tag '😀😁🙂abc' text '😀😁🙂abc'
(integer) 2
redis> FT.SEARCH idx '@text:(*😀😁🙂)' NOCONTENT
1) (integer) 0
redis> FT.SEARCH idx '@text:(*😀😁🙂*)' NOCONTENT
1) (integer) 0
redis> FT.SEARCH idx '@text:(😀😁🙂*)' NOCONTENT
1) (integer) 0

redis> FT.SEARCH idx '@text:(%😀😁🙃%)' NOCONTENT
1) (integer) 0
```