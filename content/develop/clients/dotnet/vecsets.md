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
description: Index and query embeddings with Redis vector sets
linkTitle: Vector set embeddings
title: Vector set embeddings
weight: 40
bannerText: Vector set is a new data type that is currently in preview and may be subject to change.
bannerChildren: true
---

A Redis [vector set]({{< relref "/develop/data-types/vector-sets" >}}) lets
you store a set of unique keys, each with its own associated vector.
You can then retrieve keys from the set according to the similarity between
their stored vectors and a query vector that you specify.

You can use vector sets to store any type of numeric vector but they are
particularly optimized to work with text embedding vectors (see
[Redis for AI]({{< relref "/develop/ai" >}}) to learn more about text
embeddings). The example below shows how to use the
[`Microsoft.ML`](https://dotnet.microsoft.com/en-us/apps/ai/ml-dotnet)
library to generate vector embeddings and then
store and retrieve them using a vector set with `StackExchange.Redis`.

## Initialize

Start by installing `StackExchange.Redis` with the following
command (version 2.9.17 or later is required for vector sets):

```bash
dotnet add package StackExchange.Redis --version 2.9.17
```

Also, install `Microsoft.ML`:

```bash
dotnet add package Microsoft.ML
```

In a new C# file, import the required classes. Note that the `#pragma`
directive suppresses warnings about the experimental status of the vector set API:

{{< clients-example set="home_vecsets" step="import" lang_filter="C#" >}}
{{< /clients-example >}}

## Access the model

Use the `GetPredictionEngine()` helper function declared in the example below to load the model that creates the embeddings:

{{< clients-example set="home_vecsets" step="model" lang_filter="C#" >}}
{{< /clients-example >}}

The `GetPredictionEngine()` function uses two classes, `TextData` and `TransformedTextData`, 
to specify the `PredictionEngine` model. These have a very simple definition
and are required because the model expects the input and output to be
passed in named object fields:

{{< clients-example set="home_vecsets" step="data_classes" lang_filter="C#" >}}
{{< /clients-example >}}

Note that you must declare these classes at the end of the source file
if you are using a console app without a main class.

The `GetEmbedding()` function declared below can then use this model to
generate an embedding from a section of text and return it as a `float[]` array,
which is the format required by the vector set API:

{{< clients-example set="home_vecsets" step="get_embedding" lang_filter="C#" >}}
{{< /clients-example >}}

## Create the data

The example data is contained a `Dictionary` object with some brief
descriptions of famous people:

{{< clients-example set="home_vecsets" step="data" lang_filter="C#" >}}
{{< /clients-example >}}

## Add the data to a vector set

The next step is to connect to Redis and add the data to a new vector set.

The code below iterates through `peopleData` and adds corresponding
elements to a vector set called `famousPeople`.

Use the `GetEmbedding()` function declared above to generate the
embedding as a `byte` array that you can pass to the
[`VectorSetAdd()`]({{< relref "/commands/vadd" >}}) command to set the embedding.

The call to `VectorSetAdd()` also adds the `born` and `died` values from the
original dictionary as attribute data. You can access this during a query
or by using the [`VectorSetGetAttributesJson()`]({{< relref "/commands/vgetattr" >}}) method.

{{< clients-example set="home_vecsets" step="add_data" lang_filter="C#" >}}
{{< /clients-example >}}

## Query the vector set

You can now query the data in the set. The basic approach is to use the
`GetEmbedding()` function to generate another embedding vector for the query text.
(This is the same method used to add the elements to the set.) Then, pass
the query vector to [`VectorSetSimilaritySearch()`]({{< relref "/commands/vsim" >}}) to 
return elements of the set, ranked in order of similarity to the query.

Start with a simple query for "actors":

{{< clients-example set="home_vecsets" step="basic_query" lang_filter="C#" >}}
{{< /clients-example >}}

This returns the following list of elements (formatted slightly for clarity):

```
'actors': ['Masako Natsume', 'Chaim Topol', 'Linus Pauling',
'Marie Fredriksson', 'Maryam Mirzakhani', 'Marie Curie',
'Freddie Mercury', 'Paul Erdos']
```

The first two people in the list are the two actors, as expected, but none of the
people from Linus Pauling onward was especially well-known for acting (and there certainly
isn't any information about that in the short description text).
As it stands, the search attempts to rank all the elements in the set, based
on the information contained in the embedding model.
You can use the `Count` property of `VectorSetSimilaritySearchRequest` to limit the
list of elements to just the most relevant few items:

{{< clients-example set="home_vecsets" step="limited_query" lang_filter="C#" >}}
{{< /clients-example >}}

The reason for using text embeddings rather than simple text search
is that the embeddings represent semantic information. This allows a query
to find elements with a similar meaning even if the text is
different. For example, the word "entertainer" doesn't appear in any of the
descriptions but if you use it as a query, the actors and musicians are ranked
highest in the results list:

{{< clients-example set="home_vecsets" step="entertainer_query" lang_filter="C#" >}}
{{< /clients-example >}}

Similarly, if you use "science" as a query, you get the following results:

```
'science': ['Marie Curie', 'Linus Pauling', 'Maryam Mirzakhani',
'Paul Erdos', 'Marie Fredriksson', 'Freddie Mercury', 'Masako Natsume',
'Chaim Topol']
```

The scientists are ranked highest but they are then followed by the
mathematicians. This seems reasonable given the connection between mathematics
and science.

You can also use
[filter expressions]({{< relref "/develop/data-types/vector-sets/filtered-search" >}})
with `VectorSetSimilaritySearch()` to restrict the search further. For example,
repeat the "science" query, but this time limit the results to people
who died before the year 2000:

{{< clients-example set="home_vecsets" step="filtered_query" lang_filter="C#" >}}
{{< /clients-example >}}

Note that the boolean filter expression is applied to items in the list
before the vector distance calculation is performed. Items that don't
pass the filter test are removed from the results completely, rather
than just reduced in rank. This can help to improve the performance of the
search because there is no need to calculate the vector distance for
elements that have already been filtered out of the search.

## More information

See the [vector sets]({{< relref "/develop/data-types/vector-sets" >}})
docs for more information and code examples. See the
[Redis for AI]({{< relref "/develop/ai" >}}) section for more details
about text embeddings and other AI techniques you can use with Redis.

You may also be interested in
[vector search]({{< relref "/develop/clients/dotnet/vecsearch" >}}).
This is a feature of the
[Redis query engine]({{< relref "/develop/ai/search-and-query" >}})
that lets you retrieve
[JSON]({{< relref "/develop/data-types/json" >}}) and
[hash]({{< relref "/develop/data-types/hashes" >}}) documents based on
vector data stored in their fields.
