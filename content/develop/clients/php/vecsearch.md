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
description: Learn how to index and query vector embeddings with Redis
linkTitle: Index and query vectors
title: Index and query vectors
scope: example
relatedPages:
- /develop/clients/php/queryjson
- /develop/ai/search-and-query
topics:
- Redis Search
- JSON
- hash
- vectors
weight: 30
---

[Redis Search](/content/develop/ai/search-and-query/_index.md)
lets you index vector fields in [hash](/content/develop/data-types/hashes.md)
or [JSON](/content/develop/data-types/json/_index.md) objects (see the
[Vectors](/content/develop/ai/search-and-query/vectors/_index.md) 
reference page for more information).
Among other things, vector fields can store *text embeddings*, which are AI-generated vector
representations of the semantic information in pieces of text. The
[vector distance](/content/develop/ai/search-and-query/vectors/_index.md#distance-metrics)
between two embeddings indicates how similar they are semantically. By comparing the
similarity of an embedding generated from some query text with embeddings stored in hash
or JSON fields, Redis can retrieve documents that closely match the query in terms
of their meaning.

The example below uses the [HuggingFace](https://huggingface.co/) model
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
to generate the vector embeddings to store and index with Redis Search.
The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

> [!NOTE]
> From [v3.0.0](https://github.com/predis/predis/releases/tag/v3.0.0) onwards,
> `Predis` uses query dialect 2 by default.
> Redis Search methods such as [`ftSearch()`](/content/commands/ft.search.md)
> will explicitly request this dialect, overriding the default set for the server.
> See
> [Query dialects](/content/develop/ai/search-and-query/advanced-concepts/dialects.md)
> for more information.

## Initialize

You can use the [TransformersPHP](https://transformers.codewithkyrian.com/)
library to create the vector embeddings. Install the library with the following
command:

```bash
composer require codewithkyrian/transformers
```

## Import dependencies

Import the following classes and function in your source file:

```php
<?php

require 'vendor/autoload.php';

// TransformersPHP
use function Codewithkyrian\Transformers\Pipelines\pipeline;

// Redis client and Redis Search classes.
use Predis\Client;
use Predis\Command\Argument\Search\CreateArguments;
use Predis\Command\Argument\Search\SearchArguments;
use Predis\Command\Argument\Search\SchemaFields\TextField;
use Predis\Command\Argument\Search\SchemaFields\TagField;
use Predis\Command\Argument\Search\SchemaFields\VectorField;
```

## Create a tokenizer instance

The code below shows how to use the
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
tokenizer to generate the embeddings. The vectors that represent the
embeddings have 384 dimensions, regardless of the length of the input
text. Here, the `pipeline()` call creates the `$extractor` function that
generates embeddings from text.

The `all-MiniLM-L6-v2` model expects mean pooling followed by normalization
to unit length (see the
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
page for more information). In TransformersPHP v0.6.2, the `normalize: true`
option has no effect. The `$embed()` function below calls `$extractor()` with
mean pooling and then normalizes the vector itself:

```php
$extractor = pipeline('embeddings', 'Xenova/all-MiniLM-L6-v2');

$embed = function (string $text) use ($extractor): array {
    $emb = $extractor($text, pooling: 'mean')[0];
    $norm = sqrt(array_sum(array_map(fn($x) => $x * $x, $emb)));

    return array_map(fn($x) => $x / $norm, $emb);
};
```

## Create the index

Connect to Redis and delete any index previously created with the
name `vector_idx`. (The
[`ftdropindex()`](/content/commands/ft.dropindex.md)
call throws an exception if the index doesn't already exist, which is
why you need the `try...catch` block.)

```php
 $client = new Predis\Client([
    'host' => 'localhost',
    'port' => 6379,
]);

try {
    $client->ftdropindex("vector_idx");
} catch (Exception $e){}
```

Next, create the index.
The schema in the example below includes three fields: the text content to index, a
[tag](/content/develop/ai/search-and-query/advanced-concepts/tags.md)
field to represent the "genre" of the text, and the embedding vector generated from
the original text content. The `embedding` field specifies
[HNSW](/content/develop/ai/search-and-query/vectors/_index.md#hnsw-index) 
indexing, the
[L2](/content/develop/ai/search-and-query/vectors/_index.md#distance-metrics)
vector distance metric, `Float32` values to represent the vector's components,
and 384 dimensions, as required by the `all-MiniLM-L6-v2` embedding model.

The `CreateArguments` parameter to [`ftcreate()`](/content/commands/ft.create.md)
specifies hash objects for storage and a prefix `doc:` that identifies the hash objects
to index.

```php
$schema = [
    new TextField("content"),
    new TagField("genre"),
    new VectorField(
        "embedding",
        "HNSW",
        [
            "TYPE", "FLOAT32",
            "DIM", 384,
            "DISTANCE_METRIC", "L2"
        ]
    )   
];

$client->ftcreate("vector_idx", $schema,
    (new CreateArguments())
        ->on('HASH')
        ->prefix(["doc:"])
);
```

## Add data

You can now supply the data objects, which will be indexed automatically
when you add them with [`hmset()`](/content/commands/hset.md), as long as
you use the `doc:` prefix specified in the index definition.

Use the `$embed()` function as shown below to create the embedding that
represents the `content` field.

To add an embedding as a field of a hash object, you must encode the
vector array as a binary string. The built-in
[`pack()`](https://www.php.net/manual/en/function.pack.php) function is a convenient
way to do this in PHP, using the `g*` format specifier to denote a packed
array of `float` values. Note that if you are using
[JSON](/content/develop/data-types/json/_index.md)
objects to store your documents instead of hashes, then you should store
the `float` array directly without first converting it to a binary
string (see [Differences with JSON documents](#differences-with-json-documents)
below).

```php
$content = "That is a very happy person";
$emb = $embed($content);

$client->hmset("doc:0",[
    "content" => $content,
    "genre" => "persons",
    "embedding" => pack('g*', ...$emb)
]);

$content = "That is a happy dog";
$emb = $embed($content);

$client->hmset("doc:1",[
    "content" => $content,
    "genre" => "pets",
    "embedding" => pack('g*', ...$emb)
]);

$content = "Today is a sunny day";
$emb = $embed($content);

$client->hmset("doc:2",[
    "content" => $content,
    "genre" => "weather",
    "embedding" => pack('g*', ...$emb)
]);
```

### Bulk import with HIMPORT

From Redis Open Source 8.10, you can also add the documents with the
[`HIMPORT`](/content/commands/himport.md) command family. This creates the same
hashes as `hmset()`, but lets Redis store them as
[compact hashes](/content/develop/data-types/hashes.md#compact-hashes), which use
less memory when many keys share the same field names. Redis Search indexes
these hashes in the same way.

Declare the field names once by calling `himport()` with
[`PREPARE`](/content/commands/himport-prepare.md), then create each
document by calling it with [`SET`](/content/commands/himport-set.md), passing only
its values, in the same order as the field names. Use a
[pipeline](/content/develop/clients/php/transpipe.md) to send all the
imports in one round trip:

```php
$docs = [
    ["doc:0", "That is a very happy person", "persons"],
    ["doc:1", "That is a happy dog", "pets"],
    ["doc:2", "Today is a sunny day", "weather"],
];

$client->pipeline(function ($pipe) use ($docs, $embed) {
    $pipe->himport('PREPARE', "doc", ["content", "genre", "embedding"]);

    foreach ($docs as [$key, $content, $genre]) {
        $emb = $embed($content);

        $pipe->himport('SET', $key, "doc", [
            $content,
            $genre,
            pack('g*', ...$emb)
        ]);
    }
});
```

`HIMPORT SET` replaces any existing key, so running this code after the
`hmset()` calls leaves you with the same three documents.

> [!NOTE]
> `HIMPORT` requires `Predis` v3.6.0 or later, and `Predis` marks its
> support as experimental, so the API might change. Redis Cloud and
> Redis Software don't support `HIMPORT`.

## Run a query

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the vector distance between the query vector and each
embedding vector in the index as it runs the query. You can request the results to be
sorted to rank them in order of ascending distance.

The code below creates the query embedding using the `$embed()` function, as with
the indexing, and passes it as a parameter when the query executes (see
[Vector search](/content/develop/ai/search-and-query/query/vector-search.md)
for more information about using query parameters with embeddings).
The query is a
[K nearest neighbors (KNN)](/content/develop/ai/search-and-query/vectors/_index.md#knn-vector-search)
search that sorts the results in order of vector distance from the query vector.

The results are returned as an array with the number of results in the
first element. The remaining elements are alternating pairs with the
key of the returned document (for example, `doc:0`) first, followed by an array containing
the fields you requested (again as alternating key-value pairs).

```php
$queryText = "That is a happy person";
$queryEmb = $embed($queryText);

$result = $client->ftsearch(
    "vector_idx",
    '*=>[KNN 3 @embedding $vec AS vector_distance]',
    (new SearchArguments())
        ->addReturn(1, "vector_distance")
        ->dialect("2")
        ->params([
            "vec", pack('g*', ...$queryEmb)
        ])
        ->sortBy("vector_distance")
);

$numResults = $result[0];
echo "Number of results: $numResults" . PHP_EOL;
// >>> Number of results: 3

for ($i = 1; $i < ($numResults * 2 + 1); $i += 2) {
    $key = $result[$i];
    echo "Key: $key" . PHP_EOL;
    $fields = $result[$i + 1];
    echo "Field: {$fields[0]}, Value: {$fields[1]}" . PHP_EOL; 
}        
// >>> Key: doc:0
// >>> Field: vector_distance, Value: 0.133717402816
// >>> Key: doc:1
// >>> Field: vector_distance, Value: 0.621603608131
// >>> Key: doc:2
// >>> Field: vector_distance, Value: 1.46157670021
```

Assuming you have added the code from the steps above to your source file,
it is now ready to run, but note that it may take a while to complete when
you run it for the first time (which happens because the tokenizer must download the
`all-MiniLM-L6-v2` model data before it can
generate the embeddings). When you run the code, it outputs the following result text:

```
Number of results: 3
Key: doc:0
Field: vector_distance, Value: 0.133717402816
Key: doc:1
Field: vector_distance, Value: 0.621603608131
Key: doc:2
Field: vector_distance, Value: 1.46157670021
```

The exact distances may differ slightly on your system.

Note that the results are ordered according to the value of the `vector_distance`
field, with the lowest distance indicating the greatest similarity to the query.
As you would expect, the text *"That is a very happy person"* (from the `doc:0`
document)
is the result judged to be most similar in meaning to the query text
*"That is a happy person"*.

## Differences with JSON documents

Indexing JSON documents is similar to hash indexing, but there are some
important differences. JSON allows much richer data modeling with nested fields, so
you must supply a [path](/content/develop/data-types/json/path.md) in the schema
to identify each field you want to index. However, you can declare a short alias for each
of these paths to avoid typing it in full for
every query. Also, you must specify `JSON` with the `on()` option when you create the index.

The code below shows these differences, but the index is otherwise very similar to
the one created previously for hashes:

```php
$jsonSchema = [
    new TextField("$.content", "content"),
    new TagField("$.genre", "genre"),
    new VectorField(
        "$.embedding",
        "HNSW",
        [
            "TYPE", "FLOAT32",
            "DIM", 384,
            "DISTANCE_METRIC", "L2"
        ],
        "embedding",
    )   
];

$client->ftcreate("vector_json_idx", $jsonSchema,
    (new CreateArguments())
        ->on('JSON')
        ->prefix(["jdoc:"])
);
```

Use [`jsonset()`](/content/commands/json.set.md) to add the data
instead of [`hmset()`](/content/commands/hset.md). The arrays
that specify the fields have roughly the same structure as the ones used for
`hmset()` but you should use the standard library function
[`json_encode()`](https://www.php.net/manual/en/function.json-encode.php)
to generate a JSON string representation of the array.

An important difference with JSON indexing is that the vectors are
specified using arrays instead of binary strings. Add the
embedding as an array field without using the `pack()` function as you
would with a hash.

```php
$content = "That is a very happy person";
$emb = $embed($content);

$client->jsonset("jdoc:0", "$",
    json_encode(
        [
            "content" => $content,
            "genre" => "persons",
            "embedding" => $emb
        ],
        JSON_THROW_ON_ERROR
    )
);

$content = "That is a happy dog";
$emb = $embed($content);

$client->jsonset("jdoc:1","$", 
    json_encode(
        [
            "content" => $content,
            "genre" => "pets",
            "embedding" => $emb
        ],
        JSON_THROW_ON_ERROR
    )
);

$content = "Today is a sunny day";
$emb = $embed($content);

$client->jsonset("jdoc:2", "$",
    json_encode(
        [
            "content" => $content,
            "genre" => "weather",
            "embedding" => $emb
        ],
        JSON_THROW_ON_ERROR
    )
);
```

The query is almost identical to the one for the hash documents. This
demonstrates how the right choice of aliases for the JSON paths can
save you having to write complex queries. An important thing to notice
is that the vector parameter for the query is still specified as a
binary string (using the `pack()` function), even though the data for
the `embedding` field of the JSON was specified as an array.

```php
$queryText = "That is a happy person";
$queryEmb = $embed($queryText);

$result = $client->ftsearch(
    "vector_json_idx",
    '*=>[KNN 3 @embedding $vec AS vector_distance]',
    (new SearchArguments())
        ->addReturn(1, "vector_distance")
        ->dialect("2")
        ->params([
            "vec", pack('g*', ...$queryEmb)
        ])
        ->sortBy("vector_distance")
);
```

Apart from the `jdoc:` prefixes for the keys, the result from the JSON
query is the same as for hash:

```
Number of results: 3
Key: jdoc:0
Field: vector_distance, Value: 0.133717402816
Key: jdoc:1
Field: vector_distance, Value: 0.621603608131
Key: jdoc:2
Field: vector_distance, Value: 1.46157670021
```

## Learn more

See
[Vector search](/content/develop/ai/search-and-query/query/vector-search.md)
for more information about the indexing options, distance metrics, and query format
for vectors.

{{< embed-md "iris-for-developers.md" >}}
