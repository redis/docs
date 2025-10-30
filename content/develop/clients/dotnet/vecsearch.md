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
weight: 40
---

[Redis Query Engine]({{< relref "/develop/ai/search-and-query" >}})
lets you index vector fields in [hash]({{< relref "/develop/data-types/hashes" >}})
or [JSON]({{< relref "/develop/data-types/json" >}}) objects (see the
[Vectors]({{< relref "/develop/ai/search-and-query/vectors" >}}) 
reference page for more information).
Among other things, vector fields can store *text embeddings*, which are AI-generated vector
representations of the semantic information in pieces of text. The
[vector distance]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
between two embeddings indicates how similar they are semantically. By comparing the
similarity of an embedding generated from some query text with embeddings stored in hash
or JSON fields, Redis can retrieve documents that closely match the query in terms
of their meaning.

In the example below, we use [Microsoft.ML](https://dotnet.microsoft.com/en-us/apps/ai/ml-dotnet)
to generate the vector embeddings to store and index with Redis Query Engine.
We also show how to adapt the code to use
[Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/embeddings?tabs=csharp)
for the embeddings. The code is first demonstrated for hash documents with a
separate section to explain the
[differences with JSON documents](#differences-with-json-documents).

{{< note >}}From [v1.0.0](https://github.com/redis/NRedisStack/releases/tag/v1.0.0)
onwards, `NRedisStack` uses query dialect 2 by default.
Redis query engine methods such as [`FT().Search()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}
## Initialize

The example is probably easiest to follow if you start with a new
console app, which you can create using the following command:

```bash
dotnet new console -n VecQueryExample
```

In the app's project folder, add
[`NRedisStack`]({{< relref "/develop/clients/dotnet" >}}`):

```bash
dotnet add package NRedisStack
```

Then, add the `Microsoft.ML` package.

```bash
dotnet add package Microsoft.ML
```

If you want to try the optional
[Azure embedding](#generate-an-embedding-from-azure-openai)
described below, you should also add `Azure.AI.OpenAI`:

```
dotnet add package Azure.AI.OpenAI --prerelease
```

## Import dependencies

Add the following imports to your source file:

```csharp
// Redis connection and Query Engine.
using NRedisStack.RedisStackCommands;
using StackExchange.Redis;
using NRedisStack.Search;
using static NRedisStack.Search.Schema;
using NRedisStack.Search.Literals.Enums;

// Text embeddings.
using Microsoft.ML;
using Microsoft.ML.Transforms.Text;
```

If you are using the Azure embeddings, also add:

```csharp
// Azure embeddings.
using Azure;
using Azure.AI.OpenAI;
```

## Define a function to obtain the embedding model

{{< note >}}Ignore this step if you are using an Azure OpenAI
embedding model.
{{< /note >}}

A few steps are involved in initializing the embedding model
(known as a `PredictionEngine`, in Microsoft terminology), so
we declare a function to contain those steps together.
(See the Microsoft.ML docs for more information about the
[`ApplyWordEmbedding`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.ml.textcatalog.applywordembedding?view=ml-dotnet)
method, including example code.)

Note that we use two classes, `TextData` and `TransformedTextData`, to
specify the `PredictionEngine` model. C# syntax requires us to place these
classes after the main code in a console app source file. The section
[Declare `TextData` and `TransformedTextData`](#declare-textdata-and-transformedtextdata)
below shows how to declare them.

```csharp
static PredictionEngine<TextData, TransformedTextData> GetPredictionEngine(){
    // Create a new ML context, for ML.NET operations. It can be used for
    // exception tracking and logging, as well as the source of randomness.
    var mlContext = new MLContext();

    // Create an empty list as the dataset
    var emptySamples = new List<TextData>();

    // Convert sample list to an empty IDataView.
    var emptyDataView = mlContext.Data.LoadFromEnumerable(emptySamples);

    // A pipeline for converting text into a 150-dimension embedding vector
    var textPipeline = mlContext.Transforms.Text.NormalizeText("Text")
        .Append(mlContext.Transforms.Text.TokenizeIntoWords("Tokens",
            "Text"))
        .Append(mlContext.Transforms.Text.ApplyWordEmbedding("Features",
            "Tokens", WordEmbeddingEstimator.PretrainedModelKind
            .SentimentSpecificWordEmbedding));

    // Fit to data.
    var textTransformer = textPipeline.Fit(emptyDataView);

    // Create the prediction engine to get the embedding vector from the input text/string.
    var predictionEngine = mlContext.Model.CreatePredictionEngine<TextData,
        TransformedTextData>(textTransformer);

    return predictionEngine;
}
```

## Define a function to generate an embedding

{{< note >}}Ignore this step if you are using an Azure OpenAI
embedding model.
{{< /note >}}

Our embedding model represents the vectors as an array of `float` values,
but when you store vectors in a Redis hash object, you must encode the vector
array as a `byte` string. To simplify this, we declare a
`GetEmbedding()` function that applies the `PredictionEngine` model described
[above](#define-a-function-to-obtain-the-embedding-model), and
then encodes the returned `float` array as a `byte` string. If you are
storing your documents as JSON objects instead of hashes, then you should
use the `float` array for the embedding directly, without first converting
it to a `byte` string (see [Differences with JSON documents](#differences-with-json-documents)
below).


```csharp
static byte[] GetEmbedding(
    PredictionEngine<TextData, TransformedTextData> model, string sentence
)
{
    // Call the prediction API to convert the text into embedding vector.
    var data = new TextData()
    {
        Text = sentence
    };

    var prediction = model.Predict(data);

    // Convert prediction.Features to a binary blob
    float[] floatArray = Array.ConvertAll(prediction.Features, x => (float)x);
    byte[] byteArray = new byte[floatArray.Length * sizeof(float)];
    Buffer.BlockCopy(floatArray, 0, byteArray, 0, byteArray.Length);

    return byteArray;
}
```

## Generate an embedding from Azure OpenAI

{{< note >}}Ignore this step if you are using a Microsoft.ML
embedding model.
{{< /note >}}

Azure OpenAI can be a convenient way to access an embedding model, because
you don't need to manage and scale the server infrastructure yourself.

You can create an Azure OpenAI service and deployment to serve embeddings of
whatever type you need. Select your region, note the service endpoint and key,
and add them where you see placeholders in the function below.
See
[Learn how to generate embeddings with Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/embeddings?tabs=csharp)
for more information.

```csharp
private static byte[] GetEmbeddingFromAzure(string sentence){
	Uri oaiEndpoint = new ("your-azure-openai-endpoint");
	string oaiKey = "your-openai-key";

	AzureKeyCredential credentials = new (oaiKey);
	OpenAIClient openAIClient = new (oaiEndpoint, credentials);

	EmbeddingsOptions embeddingOptions = new() {
    	     DeploymentName = "your-deployment-name",
    	     Input = { sentence },
	};

	// Generate the vector embedding
	var returnValue = openAIClient.GetEmbeddings(embeddingOptions);

	// Convert the array of floats to binary blob
	float[] floatArray = Array.ConvertAll(returnValue.Value.Data[0].Embedding.ToArray(), x => (float)x);
	byte[] byteArray = new byte[floatArray.Length * sizeof(float)];
	Buffer.BlockCopy(floatArray, 0, byteArray, 0, byteArray.Length);
	return byteArray;
}
```

## Create the index

Connect to Redis and delete any index previously created with the
name `vector_idx`. (The `DropIndex()` call throws an exception if
the index doesn't already exist, which is why you need the
`try...catch` block.)

```csharp
var muxer = ConnectionMultiplexer.Connect("localhost:6379");
var db = muxer.GetDatabase();

try { db.FT().DropIndex("vector_idx");} catch {}
```

Next, create the index.
The schema in the example below includes three fields: the text content to index, a
[tag]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags" >}})
field to represent the "genre" of the text, and the embedding vector generated from
the original text content. The `embedding` field specifies
[HNSW]({{< relref "/develop/ai/search-and-query/vectors#hnsw-index" >}}) 
indexing, the
[L2]({{< relref "/develop/ai/search-and-query/vectors#distance-metrics" >}})
vector distance metric, `Float32` values to represent the vector's components,
and 150 dimensions, as required by our embedding model.

The `FTCreateParams` object specifies hash objects for storage and a
prefix `doc:` that identifies the hash objects we want to index.

```csharp
var schema = new Schema()
    .AddTextField(new FieldName("content", "content"))
    .AddTagField(new FieldName("genre", "genre"))
    .AddVectorField("embedding", VectorField.VectorAlgo.HNSW,
        new Dictionary<string, object>()
        {
            ["TYPE"] = "FLOAT32",
            ["DIM"] = "150",
            ["DISTANCE_METRIC"] = "L2"
        }
    );

db.FT().Create(
    "vector_idx",
    new FTCreateParams()
        .On(IndexDataType.HASH)
        .Prefix("doc:"),
    schema
);
```

## Add data

You can now supply the data objects, which will be indexed automatically
when you add them with [`HashSet()`]({{< relref "/commands/hset" >}}), as long as
you use the `doc:` prefix specified in the index definition.

Firstly, create an instance of the `PredictionEngine` model using our
`GetPredictionEngine()` function.
You can then pass this to the `GetEmbedding()` function
to create the embedding that represents the `content` field, as shown below .

(If you are using an Azure OpenAI model for the embeddings, then
use `GetEmbeddingFromAzure()` instead of `GetEmbedding()`, and note that
the `PredictionModel` is managed by the server, so you don't need to create
an instance yourself.)

```csharp
var predEngine = GetPredictionEngine();

var sentence1 = "That is a very happy person";

HashEntry[] doc1 = {
    new("content", sentence1),
    new("genre", "persons"),
    new("embedding", GetEmbedding(predEngine, sentence1))
};

db.HashSet("doc:1", doc1);

var sentence2 = "That is a happy dog";

HashEntry[] doc2 = {
    new("content", sentence2),
    new("genre", "pets"),
    new("embedding", GetEmbedding(predEngine, sentence2))
};

db.HashSet("doc:2", doc2);

var sentence3 = "Today is a sunny day";

HashEntry[] doc3 = {
    new("content", sentence3),
    new("genre", "weather"),
    new("embedding", GetEmbedding(predEngine, sentence3))
};

db.HashSet("doc:3", doc3);
```

## Run a query

After you have created the index and added the data, you are ready to run a query.
To do this, you must create another embedding vector from your chosen query
text. Redis calculates the vector distance between the query vector and each
embedding vector in the index as it runs the query. We can request the results to be
sorted to rank them in order of ascending distance.

The code below creates the query embedding using the `GetEmbedding()` method, as with
the indexing, and passes it as a parameter when the query executes (see
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about using query parameters with embeddings).
The query is a
[K nearest neighbors (KNN)]({{< relref "/develop/ai/search-and-query/vectors#knn-vector-search" >}})
search that sorts the results in order of vector distance from the query vector.

(As before, replace `GetEmbedding()` with `GetEmbeddingFromAzure()` if you are using
Azure OpenAI.)

```csharp
var res = db.FT().Search("vector_idx",
    new Query("*=>[KNN 3 @embedding $query_vec AS score]")
    .AddParam("query_vec", GetEmbedding(predEngine, "That is a happy person"))
    .ReturnFields(
        new FieldName("content", "content"),
        new FieldName("score", "score")
    )
    .SetSortBy("score")
    .Dialect(2));

foreach (var doc in res.Documents) {
    var props = doc.GetProperties();
    var propText = string.Join(
        ", ",
        props.Select(p => $"{p.Key}: '{p.Value}'")
    );

    Console.WriteLine(
        $"ID: {doc.Id}, Properties: [\n  {propText}\n]"
    );
}
```

## Declare `TextData` and `TransformedTextData`

{{< note >}}Ignore this step if you are using an Azure OpenAI
embedding model.
{{< /note >}}

As we noted in the section above about the
[embedding model](#define-a-function-to-obtain-the-embedding-model),
we must declare two very simple classes at the end of the source
file. These are required because the API that generates the model
expects classes with named fields for the input `string` and output 
`float` array.

```csharp
class TextData
{
    public string Text { get; set; }
}

class TransformedTextData : TextData
{
    public float[] Features { get; set; }
}
```

## Run the code

Assuming you have added the code from the steps above to your source file,
it is now ready to run, but note that it may take a while to complete when
you run it for the first time (which happens because the tokenizer must download the
embedding model data before it can generate the embeddings). When you run the code,
it outputs the following result text:

```
ID: doc:1, Properties: [
  score: '4.30777168274', content: 'That is a very happy person'
]
ID: doc:2, Properties: [
  score: '25.9752807617', content: 'That is a happy dog'
]
ID: doc:3, Properties: [
  score: '68.8638000488', content: 'Today is a sunny day'
]
```

The results are ordered according to the value of the `score`
field, which represents the vector distance here. The lowest distance indicates
the greatest similarity to the query.
As you would expect, the result for `doc:1` with the content text
*"That is a very happy person"*
is the result that is most similar in meaning to the query text
*"That is a happy person"*.

## Differences with JSON documents

Indexing JSON documents is similar to hash indexing, but there are some
important differences. JSON allows much richer data modeling with nested fields, so
you must supply a [path]({{< relref "/develop/data-types/json/path" >}}) in the schema
to identify each field you want to index. However, you can declare a short alias for each
of these paths to avoid typing it in full for
every query. Also, you must specify `IndexType.JSON` with the `On()` option when you
create the index.

The code below shows these differences, but the index is otherwise very similar to
the one created previously for hashes:

```cs
var jsonSchema = new Schema()
    .AddTextField(new FieldName("$.content", "content"))
    .AddTagField(new FieldName("$.genre", "genre"))
    .AddVectorField(
        new FieldName("$.embedding", "embedding"),
        VectorField.VectorAlgo.HNSW,
        new Dictionary<string, object>()
        {
            ["TYPE"] = "FLOAT32",
            ["DIM"] = "150",
            ["DISTANCE_METRIC"] = "L2"
        }
    );


db.FT().Create(
    "vector_json_idx",
    new FTCreateParams()
        .On(IndexDataType.JSON)
        .Prefix("jdoc:"),
    jsonSchema
);
```

An important difference with JSON indexing is that the vectors are
specified using arrays of `float` instead of binary strings. This requires a modification
to the `GetEmbedding()` function declared in
[Define a function to generate an embedding](#define-a-function-to-generate-an-embedding)
above:

```cs
static float[] GetFloatEmbedding(
    PredictionEngine<TextData, TransformedTextData> model, string sentence
)
{
    // Call the prediction API to convert the text into embedding vector.
    var data = new TextData()
    {
        Text = sentence
    };

    var prediction = model.Predict(data);

    float[] floatArray = Array.ConvertAll(prediction.Features, x => (float)x);
    return floatArray;
}
```

You should make a similar modification to the `GetEmbeddingFromAzure()` function
if you are using Azure OpenAI with JSON.

Use [`JSON().set()`]({{< relref "/commands/json.set" >}}) to add the data
instead of [`HashSet()`]({{< relref "/commands/hset" >}}):

```cs
var jSentence1 = "That is a very happy person";

var jdoc1 = new {
    content = jSentence1,
    genre = "persons",
    embedding = GetFloatEmbedding(predEngine, jSentence1),
};

db.JSON().Set("jdoc:1", "$", jdoc1);

var jSentence2 = "That is a happy dog";

var jdoc2 = new {
    content = jSentence2,
    genre = "pets",
    embedding = GetFloatEmbedding(predEngine, jSentence2),
};

db.JSON().Set("jdoc:2", "$", jdoc2);

var jSentence3 = "Today is a sunny day";

var jdoc3 = new {
    content = jSentence3,
    genre = "weather",
    embedding = GetFloatEmbedding(predEngine, jSentence3),
};

db.JSON().Set("jdoc:3", "$", jdoc3);
```

The query is almost identical to the one for the hash documents. This
demonstrates how the right choice of aliases for the JSON paths can
save you having to write complex queries. The only significant difference is
that the `FieldName` objects created for the `ReturnFields()` option must
include the JSON path for the field.

An important thing to notice
is that the vector parameter for the query is still specified as a
binary string (using the `GetEmbedding()` method), even though the data for
the `embedding` field of the JSON was specified as a `float` array.

```cs
var jRes = db.FT().Search("vector_json_idx",
    new Query("*=>[KNN 3 @embedding $query_vec AS score]")
    .AddParam("query_vec", GetEmbedding(predEngine, "That is a happy person"))
    .ReturnFields(
        new FieldName("$.content", "content"),
        new FieldName("$.score", "score")
    )
    .SetSortBy("score")
    .Dialect(2));

foreach (var doc in jRes.Documents) {
    var props = doc.GetProperties();
    var propText = string.Join(
        ", ",
        props.Select(p => $"{p.Key}: '{p.Value}'")
    );

    Console.WriteLine(
        $"ID: {doc.Id}, Properties: [\n  {propText}\n]"
    );
}
```

Apart from the `jdoc:` prefixes for the keys, the result from the JSON
query is the same as for hash:

```
ID: jdoc:1, Properties: [
  score: '4.30777168274', content: 'That is a very happy person'
]
ID: jdoc:2, Properties: [
  score: '25.9752807617', content: 'That is a happy dog'
]
ID: jdoc:3, Properties: [
  score: '68.8638000488', content: 'Today is a sunny day'
]
```

## Learn more

See
[Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
for more information about the indexing options, distance metrics, and query format
for vectors.
