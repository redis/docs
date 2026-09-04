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
topics:
- vector sets
- vectors
---

A Redis [vector set](/content/develop/data-types/vector-sets/_index.md) lets
you store a set of unique keys, each with its own associated vector.
You can then retrieve keys from the set according to the similarity between
their stored vectors and a query vector that you specify.

You can use vector sets to store any type of numeric vector but they are
particularly optimized to work with text embedding vectors (see
[Redis for AI](/content/develop/ai/_index.md) to learn more about text
embeddings). The example below shows how to use the
[`fastembed`](https://crates.io/crates/fastembed) crate to generate vector
embeddings and then store and retrieve them using a vector set with
`redis-rs`.

Vector set support in `redis-rs` is gated behind the opt-in `vector-sets`
Cargo feature:

```toml
[dependencies]
redis = { version = "1.6", features = ["vector-sets"] }
fastembed = "4"
```

## Initialize

Import the required crates:

{{< clients-example set="home_vecsets" step="import" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Import required libraries for vector sets, embeddings, and Redis operations" difficulty="beginner" >}}
{{< /clients-example >}}

`fastembed` runs the ONNX-exported
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
model locally. This model generates vectors with 384 dimensions, regardless
of the length of the input text, but note that the input is truncated to 256
tokens (see
[Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6)
at the [Hugging Face](https://huggingface.co/) docs to learn more about the
way tokens are related to the original text).

{{< clients-example set="home_vecsets" step="model" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Initialize an embedding model to generate vector embeddings from text" difficulty="beginner" >}}
{{< /clients-example >}}

## Create the data

The example data is a list of famous people with brief descriptions:

{{< clients-example set="home_vecsets" step="data" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Define sample data with text descriptions for vector embedding and storage" difficulty="beginner" >}}
{{< /clients-example >}}

## Add the data to a vector set

The next step is to connect to Redis and add the data to a new vector set.

The code below iterates through the list and adds a corresponding element to
a vector set called `famousPeople` for each entry.

`TextEmbedding::embed()` returns already mean-pooled, L2-normalized 384-element
`Vec<f32>` embeddings, matching the pooling and normalization
`sentence-transformers` applies by default in the other client examples on
this page. Pass the embedding directly to
[`vadd_options()`](/content/commands/vadd.md) along with the `born` and
`died` values as attribute data, using
[`VAddOptions::set_attributes()`](/content/commands/vadd.md). You can access
this attribute data during a query or with the
[`vgetattr()`](/content/commands/vgetattr.md) method.

{{< clients-example set="home_vecsets" step="add_data" lang_filter="Rust-Sync,Rust-Async" description="Foundational: Add vector embeddings and attributes to a vector set using VADD command" difficulty="beginner" >}}
{{< /clients-example >}}

## Query the vector set

You can now query the data in the set. The basic approach is to embed the
query text and pass the resulting vector to
[`vsim()`](/content/commands/vsim.md), which returns elements of the set,
ranked in order of similarity to the query.

Start with a simple query for "actors":

{{< clients-example set="home_vecsets" step="basic_query" lang_filter="Rust-Sync,Rust-Async" description="Vector similarity search: Find semantically similar items in a vector set using VSIM command" difficulty="intermediate" >}}
{{< /clients-example >}}

This returns the following list of elements:

```
'actors': ["Masako Natsume", "Chaim Topol", "Linus Pauling",
"Marie Fredriksson", "Maryam Mirzakhani", "Marie Curie",
"Freddie Mercury", "Paul Erdos"]
```

The first two people in the list are the two actors, as expected, but none of
the people from Linus Pauling onward was especially well-known for acting
(and there certainly isn't any information about that in the short
description text). As it stands, the search attempts to rank all the
elements in the set, based on the information contained in the embedding
model. You can use [`VSimOptions::set_count()`](/content/commands/vsim.md)
to limit the list of elements to just the most relevant few items:

{{< clients-example set="home_vecsets" step="limited_query" lang_filter="Rust-Sync,Rust-Async" description="Vector similarity search with limits: Restrict results to the top K most similar items using the count parameter" difficulty="intermediate" >}}
{{< /clients-example >}}

The reason for using text embeddings rather than simple text search is that
the embeddings represent semantic information. This allows a query to find
elements with a similar meaning even if the text is different. For example,
the word "entertainer" doesn't appear in any of the descriptions but if you
use it as a query, the actors and musicians are ranked highest in the results
list:

{{< clients-example set="home_vecsets" step="entertainer_query" lang_filter="Rust-Sync,Rust-Async" description="Semantic search: Leverage text embeddings to find semantically similar items even when exact keywords don't match" difficulty="intermediate" >}}
{{< /clients-example >}}

Similarly, if you use "science" as a query, you get the following results:

```
'science': ["Marie Curie", "Linus Pauling", "Maryam Mirzakhani",
"Paul Erdos", "Marie Fredriksson", "Freddie Mercury", "Masako Natsume",
"Chaim Topol"]
```

The scientists are ranked highest but they are then followed by the
mathematicians. This seems reasonable given the connection between
mathematics and science.

You can also use
[filter expressions](/content/develop/data-types/vector-sets/filtered-search.md)
with [`VSimOptions::set_filter_expression()`](/content/commands/vsim.md) to
restrict the search further. For example, repeat the "science" query, but
this time limit the results to people who died before the year 2000:

{{< clients-example set="home_vecsets" step="filtered_query" lang_filter="Rust-Sync,Rust-Async" description="Filtered vector search: Combine vector similarity with attribute filters to narrow results based on metadata conditions" difficulty="advanced" >}}
{{< /clients-example >}}

Note that the boolean filter expression is applied to items in the list
before the vector distance calculation is performed. Items that don't pass
the filter test are removed from the results completely, rather than just
reduced in rank. This can help to improve the performance of the search
because there is no need to calculate the vector distance for elements that
have already been filtered out of the search.

## More information

See the [vector sets](/content/develop/data-types/vector-sets/_index.md)
docs for more information and code examples. See the
[Redis for AI](/content/develop/ai/_index.md) section for more details about
text embeddings and other AI techniques you can use with Redis.
