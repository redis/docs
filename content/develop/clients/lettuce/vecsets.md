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
embeddings). The example below shows how to generate vector embeddings and then
store and retrieve them using a vector set with `Lettuce`.

## Initialize

If you are using [Maven](https://maven.apache.org/), add the following
dependencies to your `pom.xml` file
(note that you need `Lettuce` v6.8.0 or later to use vector sets):

```xml
<dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.8.0.RELEASE</version>
</dependency>

<dependency>
    <groupId>ai.djl.huggingface</groupId>
    <artifactId>tokenizers</artifactId>
    <version>0.33.0</version>
</dependency>

<dependency>
    <groupId>ai.djl.pytorch</groupId>
    <artifactId>pytorch-model-zoo</artifactId>
    <version>0.33.0</version>
</dependency>

<dependency>
    <groupId>ai.djl</groupId>
    <artifactId>api</artifactId>
    <version>0.33.0</version>
</dependency>
```

If you are using [Gradle](https://gradle.org/), add the following
dependencies to your `build.gradle` file:

```bash
compileOnly 'io.lettuce:lettuce-core:6.8.0.RELEASE'
compileOnly 'ai.djl.huggingface:tokenizers:0.33.0'
compileOnly 'ai.djl.pytorch:pytorch-model-zoo:0.33.0'
compileOnly 'ai.djl:api:0.33.0'
```

In a new Java file, import the required classes:

{{< clients-example set="home_vecsets" step="import" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

The imports include the classes required to generate embeddings from text.
This example uses an instance of the `Predictor` class with the
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
model for the embeddings. This model generates vectors with 384 dimensions, regardless
of the length of the input text, but note that the input is truncated to 256
tokens (see
[Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6)
at the [Hugging Face](https://huggingface.co/) docs to learn more about the way tokens
are related to the original text).

{{< clients-example set="home_vecsets" step="model" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

## Create the data

The example data is contained in a `List<Person>` object with some brief
descriptions of famous people.

{{< clients-example set="home_vecsets" step="data" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

## Add the data to a vector set

The next step is to connect to Redis and add the data to a new vector set.

The `predictor.predict()` method that generates the embeddings returns a `float[]` array.
The `vadd()` method that adds the embeddings to the vector set accepts a `Double[]` array,
so it is useful to define a helper method to perform the conversion:

{{< clients-example set="home_vecsets" step="helper_method" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

The code below connects to Redis, then iterates through all the items in the `people` list,
generates embeddings for each person's description, and then
adds the appropriate elements to a vector set called `famousPeople`.
Note that the `predict()` call is in a `try`/`catch` block because it can throw
exceptions if it can't download the embedding model (you should add code to handle
the exceptions for production).

The call to `vadd()` also adds the `born` and `died` values from the
original `people` list as attribute data. You can access this during a query
or by using the [`vgetattr()`]({{< relref "/commands/vgetattr" >}}) method.

{{< clients-example set="home_vecsets" step="add_data" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

## Query the vector set

You can now query the data in the set. The basic approach is to use the
`predict()` method to generate another embedding vector for the query text.
(This is the same method used to add the elements to the set.) Then, pass
the query vector to [`vsim()`]({{< relref "/commands/vsim" >}}) to return elements
of the set, ranked in order of similarity to the query.

Start with a simple query for "actors":

{{< clients-example set="home_vecsets" step="basic_query" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

This returns the following list of elements (formatted slightly for clarity):

```
['Masako Natsume', 'Chaim Topol', 'Linus Pauling',
'Marie Fredriksson', 'Maryam Mirzakhani', 'Marie Curie',
'Freddie Mercury', 'Paul Erdos']
```

The first two people in the list are the two actors, as expected, but none of the
people from Linus Pauling onward was especially well-known for acting (and there certainly
isn't any information about that in the short description text).
As it stands, the search attempts to rank all the elements in the set, based
on the information contained in the embedding model.
You can use the `count` parameter of `vsim()` to limit the list of elements
to just the most relevant few items:

{{< clients-example set="home_vecsets" step="limited_query" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

The reason for using text embeddings rather than simple text search
is that the embeddings represent semantic information. This allows a query
to find elements with a similar meaning even if the text is
different. For example, the word "entertainer" doesn't appear in any of the
descriptions, but if you use it as a query, the actors and musicians are ranked
highest in the results list:

{{< clients-example set="home_vecsets" step="entertainer_query" lang_filter="Java-Async,Java-Reactive" >}}
{{< /clients-example >}}

Similarly, if you use "science" as a query, you get the following results:

```
['Marie Curie', 'Linus Pauling', 'Maryam Mirzakhani',
'Paul Erdos', 'Marie Fredriksson', 'Freddie Mercury', 'Masako Natsume',
'Chaim Topol']
```

The scientists are ranked highest, followed by the
mathematicians. This ranking seems reasonable given the connection between mathematics and science.

You can also use
[filter expressions]({{< relref "/develop/data-types/vector-sets/filtered-search" >}})
with `vsim()` to restrict the search further. For example,
repeat the "science" query, but this time limit the results to people
who died before the year 2000:

{{< clients-example set="home_vecsets" step="filtered_query" lang_filter="Java-Async,Java-Reactive" >}}
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
[vector search]({{< relref "/develop/clients/lettuce/vecsearch" >}}).
This is a feature of the
[Redis query engine]({{< relref "/develop/ai/search-and-query" >}})
that lets you retrieve
[JSON]({{< relref "/develop/data-types/json" >}}) and
[hash]({{< relref "/develop/data-types/hashes" >}}) documents based on
vector data stored in their fields.
