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
scope: example
relatedPages:
- /develop/clients/php/vecsearch
topics:
- vector sets
- vectors
---

A Redis [vector set]({{< relref "/develop/data-types/vector-sets" >}}) lets
you store a set of unique keys, each with its own associated vector.
You can then retrieve keys from the set according to the similarity between
their stored vectors and a query vector that you specify.

You can use vector sets to store any type of numeric vector but they are
particularly optimized to work with text embedding vectors (see
[Redis for AI]({{< relref "/develop/ai" >}}) to learn more about text
embeddings). The example below shows how to use the
[TransformersPHP](https://transformers.codewithkyrian.com/) library to
generate text embeddings and then store and retrieve them using a vector set
with [`Predis`]({{< relref "/develop/clients/php" >}}).

## Initialize

Install `Predis` and `TransformersPHP` with Composer:

```bash
composer require predis/predis codewithkyrian/transformers
```

In a new PHP file, import the required classes and function:

{{< clients-example set="home_vecsets" step="import" lang_filter="PHP" description="Foundational: Import required libraries for vector sets, embeddings, and Redis operations" difficulty="beginner" >}}
{{< /clients-example >}}

The `pipeline()` function below creates an embedding generator for the
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
model. This model generates vectors with 384 dimensions, regardless of the
length of the input text:

{{< clients-example set="home_vecsets" step="model" lang_filter="PHP" description="Foundational: Initialize a TransformersPHP embedding pipeline to generate vectors from text" difficulty="beginner" >}}
{{< /clients-example >}}

## Create the data

The example data is an array containing brief descriptions of famous people:

{{< clients-example set="home_vecsets" step="data" lang_filter="PHP" description="Foundational: Define sample data with text descriptions and metadata for vector embedding and storage" difficulty="beginner" >}}
{{< /clients-example >}}

## Add the data to a vector set

The next step is to connect to Redis and add the data to a new vector set.

The code below iterates through the array, uses the embedding pipeline to
generate a `float` vector from each description, and then adds the result to a
vector set called `famousPeople` with [`vadd()`]({{< relref "/commands/vadd" >}}).
It then stores the `born` and `died` values as element attributes using
[`vsetattr()`]({{< relref "/commands/vsetattr" >}}), so you can use the metadata
later during queries.

{{< clients-example set="home_vecsets" step="add_data" lang_filter="PHP" description="Foundational: Add embedding vectors to a vector set and attach metadata attributes for later filtering" difficulty="beginner" >}}
{{< /clients-example >}}

## Query the vector set

You can now query the data in the set. The basic approach is to generate
another embedding vector from the query text and pass it to
[`vsim()`]({{< relref "/commands/vsim" >}}), which returns elements ranked in
order of similarity to that query vector.

Start with a simple query for "actors":

{{< clients-example set="home_vecsets" step="basic_query" lang_filter="PHP" description="Vector similarity search: Find semantically similar items in a vector set using VSIM" difficulty="intermediate" >}}
{{< /clients-example >}}

This returns the following list of elements:

```
'actors': ["Masako Natsume","Chaim Topol","Linus Pauling",
"Marie Fredriksson","Maryam Mirzakhani","Freddie Mercury",
"Marie Curie","Paul Erdos"]
```

The first two people in the list are the two actors, as expected, but the
remaining results are less directly related. By default, the search attempts
to rank all the elements in the set. You can use the `count` parameter of
`vsim()` to limit the list to the most relevant few results:

{{< clients-example set="home_vecsets" step="limited_query" lang_filter="PHP" description="Vector similarity search with limits: Restrict results to the top K most similar items using the count parameter" difficulty="intermediate" >}}
{{< /clients-example >}}

The reason for using text embeddings rather than simple text search is that
the embeddings capture semantic information. This allows a query to find
elements with a similar meaning even if the text is different. For example, the
word "entertainer" doesn't appear in any of the descriptions but if you use it
as a query, the actors and musicians rank highly in the results:

{{< clients-example set="home_vecsets" step="entertainer_query" lang_filter="PHP" description="Semantic search: Use text embeddings to find related concepts even when exact keywords do not appear in the source text" difficulty="intermediate" >}}
{{< /clients-example >}}

Similarly, if you use "science" as a query, you get the scientists first,
followed by the mathematicians:

```text
'science': ["Linus Pauling","Marie Curie","Maryam Mirzakhani",
"Paul Erdos","Marie Fredriksson","Masako Natsume",
"Freddie Mercury","Chaim Topol"]
```

You can also use
[filter expressions]({{< relref "/develop/data-types/vector-sets/filtered-search" >}})
with `vsim()` to restrict the search further. For example, repeat the
"science" query, but this time limit the results to people who died before the
year 2000:

{{< clients-example set="home_vecsets" step="filtered_query" lang_filter="PHP" description="Filtered vector search: Combine vector similarity with attribute filters to narrow results based on metadata conditions" difficulty="advanced" >}}
{{< /clients-example >}}

## More information

See the [vector sets]({{< relref "/develop/data-types/vector-sets" >}})
docs for more information and code examples. See the
[Redis for AI]({{< relref "/develop/ai" >}}) section for more details
about text embeddings and other AI techniques you can use with Redis.

You may also be interested in
[vector search]({{< relref "/develop/clients/php/vecsearch" >}}).
This is a feature of
[Redis Search]({{< relref "/develop/ai/search-and-query" >}})
that lets you retrieve
[JSON]({{< relref "/develop/data-types/json" >}}) and
[hash]({{< relref "/develop/data-types/hashes" >}}) documents based on
vector data stored in their fields.
