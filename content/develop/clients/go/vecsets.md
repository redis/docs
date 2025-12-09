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
weight: 35
bannerText: Vector set is a new data type that is currently in preview and may be subject to change.
scope: example
relatedPages:
- /develop/clients/go/vecsearch
topics:
- vector sets
- vectors
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
[`Hugot`](https://github.com/knights-analytics/hugot)
library to generate vector embeddings and then
store and retrieve them using a vector set with `go-redis`.

## Initialize

Start by [installing]({{< relref "/develop/clients/go#install" >}}) `go-redis` if you haven't already done so. Note that you need `go-redis`
[v9.10.0](https://github.com/redis/go-redis/releases/tag/v9.10.0)
or later to use vector sets.

Also, install `hugot`:

```bash
go get github.com/knights-analytics/hugot
```

In a new Go file, add the required imports:

{{< clients-example set="home_vecsets" step="import"  lang_filter="Go" >}}
{{< /clients-example >}}

These include the `Hugot` library to generate an embedding from a section of text.
This example uses an instance of the `SentenceTransformer` model
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
for the embeddings. This model generates vectors with 384 dimensions, regardless
of the length of the input text, but note that the input is truncated to 256
tokens (see
[Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6)
at the [Hugging Face](https://huggingface.co/) docs to learn more about the way tokens
are related to the original text).

{{< clients-example set="home_vecsets" step="model" lang_filter="Go" >}}
{{< /clients-example >}}

## Create the data

The example data is contained in a map with some brief
descriptions of famous people:

{{< clients-example set="home_vecsets" step="data" lang_filter="Go" >}}
{{< /clients-example >}}

## Add the data to a vector set

The next step is to connect to Redis and add the data to a new vector set.

The code below iterates through the `peopleData` map and adds corresponding
elements to a vector set called `famousPeople`.

Use the
`RunPipeline()` method of `embeddingPipeline` to generate the
embedding as an array of `float32` values, then use a loop like the one
shown below to convert the `float32` array to a `float64` array.
You can then pass this array to the
[`VAdd()`]({{< relref "/commands/vadd" >}}) command to set the embedding.

The call to `VAdd()` also adds the `born` and `died` values from the
original map as attribute data. You can access this during a query
or by using the [`VGetAttr()`]({{< relref "/commands/vgetattr" >}}) method.

{{< clients-example set="home_vecsets" step="add_data" lang_filter="Go" >}}
{{< /clients-example >}}

## Query the vector set

You can now query the data in the set. The basic approach is to use the
`RunPipeline()` method to generate another embedding vector for the query text.
(This is the same method used to add the elements to the set.) Then, pass
the query vector to [`VSim()`]({{< relref "/commands/vsim" >}}) to return elements
of the set, ranked in order of similarity to the query.

Start with a simple query for "actors":

{{< clients-example set="home_vecsets" step="basic_query" lang_filter="Go" >}}
{{< /clients-example >}}

This returns the following list of elements (formatted slightly for clarity):

```
'actors': Masako Natsume, Chaim Topol, Linus Pauling, Marie Fredriksson,
    Maryam Mirzakhani, Marie Curie, Freddie Mercury, Paul Erdos
```

The first two people in the list are the two actors, as expected, but none of the
people from Linus Pauling onward was especially well-known for acting (and there certainly
isn't any information about that in the short description text).
As it stands, the search attempts to rank all the elements in the set, based
on the information contained in the embedding model.
You can use the `Count` parameter of `VSimWithArgs()` to limit the list of elements
to just the most relevant few items:

{{< clients-example set="home_vecsets" step="limited_query" lang_filter="Go" >}}
{{< /clients-example >}}

The reason for using text embeddings rather than simple text search
is that the embeddings represent semantic information. This allows a query
to find elements with a similar meaning even if the text is
different. For example, the word "entertainer" doesn't appear in any of the
descriptions but if you use it as a query, the actors and musicians are ranked
highest in the results list:

{{< clients-example set="home_vecsets" step="entertainer_query" lang_filter="Go" >}}
{{< /clients-example >}}

Similarly, if you use "science" as a query, you get the following results:

```
'science': Marie Curie, Linus Pauling, Maryam Mirzakhani, Paul Erdos,
Marie Fredriksson, Freddie Mercury, Masako Natsume, Chaim Topol
```

The scientists are ranked highest but they are then followed by the
mathematicians. This seems reasonable given the connection between mathematics
and science.

You can also use
[filter expressions]({{< relref "/develop/data-types/vector-sets/filtered-search" >}})
with `VSimWithArgs()` to restrict the search further. For example,
repeat the "science" query, but this time limit the results to people
who died before the year 2000:

{{< clients-example set="home_vecsets" step="filtered_query" lang_filter="Go" >}}
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
[vector search]({{< relref "/develop/clients/go/vecsearch" >}}).
This is a feature of the
[Redis query engine]({{< relref "/develop/ai/search-and-query" >}})
that lets you retrieve
[JSON]({{< relref "/develop/data-types/json" >}}) and
[hash]({{< relref "/develop/data-types/hashes" >}}) documents based on
vector data stored in their fields.
