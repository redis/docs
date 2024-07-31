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
description: Understand how to use Redis as a vector database
linkTitle: Vector database
stack: true
title: Redis as a vector database quick start guide
weight: 3
---

This quick start guide helps you to:

1. Understand what a vector database is
2. Create a Redis vector database
3. Create vector embeddings and store vectors
4. Query data and perform a vector search


## Understand vector databases

Data is often unstructured, which means that it isn't described by a well-defined schema. Examples of unstructured data include text passages, images, videos, or audio. One approach to storing and searching through unstructured data is to use vector embeddings.

**What are vectors?** In machine learning and AI, vectors are sequences of numbers that represent data. They are the inputs and outputs of models, encapsulating underlying information in a numerical form. Vectors transform unstructured data, such as text, images, videos, and audio, into a format that machine learning models can process.

- **Why are they important?** Vectors capture complex patterns and semantic meanings inherent in data, making them powerful tools for a variety of applications. They allow machine learning models to understand and manipulate unstructured data more effectively.
- **Enhancing traditional search.** Traditional keyword or lexical search relies on exact matches of words or phrases, which can be limiting. In contrast, vector search, or semantic search, leverages the rich information captured in vector embeddings. By mapping data into a vector space, similar items are positioned near each other based on their meaning. This approach allows for more accurate and meaningful search results, as it considers the context and semantic content of the query rather than just the exact words used.


## Create a Redis vector database
You can use [Redis Stack]({{< relref "/operate/oss_and_stack/" >}}) as a vector database. It allows you to:

* Store vectors and the associated metadata within hashes or [JSON]({{< relref "/develop/data-types/json" >}}) documents
* Create and configure secondary indices for search
* Perform vector searches
* Update vectors and metadata
* Delete and cleanup

The easiest way to get started is to use Redis Cloud:

1. Create a [free account](https://redis.com/try-free?utm_source=redisio&utm_medium=referral&utm_campaign=2023-09-try_free&utm_content=cu-redis_cloud_users).

   <img src="../img/free-cloud-db.png" width="500px">
2. Follow the instructions to create a free database.

This free Redis Cloud database comes out of the box with all the Redis Stack features.

You can alternatively use the [installation guides]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) to install Redis Stack on your local machine.

You need to have the following features configured for your Redis server: JSON and search and query.

## Install the required Python packages

Create a Python virtual environment and install the following dependencies using `pip`:

* `redis`: You can find further details about the `redis-py` client library in the [clients]({{< relref "/develop/connect/clients/python" >}}) section of this documentation site.
* `pandas`: Pandas is a data analysis library.
* `sentence-transformers`: You will use the [SentenceTransformers](https://www.sbert.net/) framework to generate embeddings on full text.
* `tabulate`: `pandas` uses `tabulate` to render Markdown.

You will also need the following imports in your Python code:

{{< clients-example search_vss imports />}}

## Connect

Connect to Redis. By default, Redis returns binary responses. To decode them, you pass the `decode_responses` parameter set to `True`:

{{< clients-example search_vss connect />}}
<br/>
{{% alert title="Tip" color="warning" %}}
Instead of using a local Redis Stack server, you can copy and paste the connection details from the Redis Cloud database configuration page. Here is an example connection string of a Cloud database that is hosted in the AWS region `us-east-1` and listens on port 16379: `redis-16379.c283.us-east-1-4.ec2.cloud.redislabs.com:16379`. The connection string has the format `host:port`. You must also copy and paste the username and password of your Cloud database. The line of code for connecting with the default user changes then to `client = redis.Redis(host="redis-16379.c283.us-east-1-4.ec2.cloud.redislabs.com", port=16379, password="your_password_here" decode_responses=True)`.
{{% /alert  %}}


## Prepare the demo dataset

This quick start guide also uses the **bikes** dataset. Here is an example document from it:

```json
{
  "model": "Jigger",
  "brand": "Velorim",
  "price": 270,
  "type": "Kids bikes",
  "specs": {
    "material": "aluminium",
    "weight": "10"
  },
  "description": "Small and powerful, the Jigger is the best ride for the smallest of tikes! ..."
}
```

The `description` field contains free-form text descriptions of bikes and will be used to create vector embeddings.


###  1. Fetch the demo data
You need to first fetch the demo dataset as a JSON array:

{{< clients-example search_vss get_data />}}

Inspect the structure of one of the bike JSON documents:

{{< clients-example search_vss dump_data />}}

### 2. Store the demo data in Redis
Now iterate over the `bikes`  array to store the data as [JSON]({{< relref "/develop/data-types/json/" >}}) documents in Redis by using the [JSON.SET]({{< baseurl >}}/commands/json.set//) command. The below code uses a [pipeline]({{< relref "/develop/use/pipelining" >}}) to minimize the network round-trip times:

{{< clients-example search_vss load_data />}}

Once loaded, you can retrieve a specific attributes from one of the JSON documents in Redis using a [JSONPath](https://goessner.net/articles/JsonPath/) expression:

{{< clients-example search_vss get />}}

### 3. Select a text embedding model

[HuggingFace](https://huggingface.co) has a large catalog of text embedding models that are locally servable through the `SentenceTransformers` framework. Here we use the [MS MARCO](https://microsoft.github.io/msmarco/) model that is widely used in search engines, chatbots, and other AI applications.

```python
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer('msmarco-distilbert-base-v4')
```

### 4. Generate text embeddings
Iterate over all the Redis keys with the prefix `bikes:`:

{{< clients-example search_vss get_keys />}}

Use the keys as input to the [JSON.MGET]({{< baseurl >}}/commands/json.mget/) command, along with the `$.description` field, to collect the descriptions in a list. Then, pass the list of descriptions to the `.encode()` method:

{{< clients-example search_vss generate_embeddings />}}

Insert the vectorized descriptions to the bike documents in Redis using the [JSON.SET]({{< baseurl >}}/commands/json.set) command. The following command inserts a new field into each of the documents under the JSONPath `$.description_embeddings`. Once again, do this using a pipeline to avoid unnecessary network round-trips:

{{< clients-example search_vss load_embeddings />}}

Inspect one of the updated bike documents using the [JSON.GET]({{< baseurl >}}/commands/json.get) command:

{{< clients-example search_vss dump_example />}}

{{% alert title="Note" color="warning" %}}
When storing a vector embedding within a JSON document, the embedding is stored as a JSON array. In the example above, the array was shortened considerably for the sake of readability.
{{% /alert  %}}


## Create an index

### 1. Create an index with a vector field

You must create an index to query document metadata or to perform vector searches. Use the [FT.CREATE]({{< baseurl >}}/commands/ft.create) command:

{{< clients-example search_vss create_index >}}
FT.CREATE idx:bikes_vss ON JSON
  PREFIX 1 bikes: SCORE 1.0
  SCHEMA
    $.model TEXT WEIGHT 1.0 NOSTEM
    $.brand TEXT WEIGHT 1.0 NOSTEM
    $.price NUMERIC
    $.type TAG SEPARATOR ","
    $.description AS description TEXT WEIGHT 1.0
    $.description_embeddings AS vector VECTOR FLAT 6 TYPE FLOAT32 DIM 768 DISTANCE_METRIC COSINE
{{< /clients-example >}}

Here is a breakdown of the `VECTOR` field definition:

* `$.description_embeddings AS vector`: The vector field's JSON path and its field alias `vector`.
* `FLAT`: Specifies the indexing method, which is either a flat index or a hierarchical navigable small world graph ([HNSW](https://arxiv.org/ftp/arxiv/papers/1603/1603.09320.pdf)).
* `TYPE FLOAT32`: Sets the float precision of a vector component, in this case a 32-bit floating point number.
* `DIM 768`: The length or dimension of the embeddings, determined by the chosen embedding model.
* `DISTANCE_METRIC COSINE`: The chosen distance function: [cosine distance](https://en.wikipedia.org/wiki/Cosine_similarity).

You can find further details about all these options in the [vector reference documentation]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}}).

### 2. Check the state of the index

As soon as you execute the [FT.CREATE]({{< baseurl >}}/commands/ft.create) command, the indexing process runs in the background. In a short time, all JSON documents should be indexed and ready to be queried. To validate that, you can use the [FT.INFO]({{< baseurl >}}/commands/ft.info) command, which provides details and statistics about the index. Of particular interest are the number of documents successfully indexed and the number of failures:

{{< clients-example search_vss validate_index >}}
FT.INFO idx:bikes_vss
{{< /clients-example >}}

## Perform vector searches

This quick start guide focuses on vector search. However, you can learn more about how to query based on document metadata in the [document database quick start guide]({{< relref "/develop/get-started/document-database" >}}).

### 1. Embed your queries

The following code snippet shows a list of text queries you will use to perform vector search in Redis:

{{< clients-example search_vss def_bulk_queries />}}

First, encode each input query as a vector embedding using the same SentenceTransformers model:

{{< clients-example search_vss enc_bulk_queries />}}

<br/>
{{% alert title="Tip" color="warning" %}}
It is vital that you use the same embedding model to embed your queries as you did your documents. Using a different model will result in poor semantic search results or error.
{{% /alert  %}}

### 2. K-nearest neighbors (KNN) search
The KNN algorithm calculates the distance between the query vector and each vector in Redis based on the chosen distance function. It then returns the top K items with the smallest distances to the query vector. These are the most semantically similar items.

Now construct a query to do just that:

```python
query = (
    Query('(*)=>[KNN 3 @vector $query_vector AS vector_score]')
     .sort_by('vector_score')
     .return_fields('vector_score', 'id', 'brand', 'model', 'description')
     .dialect(2)
)
```

Let's break down the above query template:
- The filter expression `(*)` means `all`. In other words, no filtering was applied. You could replace it with an expression that filters by additional metadata.
- The `KNN` part of the query searches for the top 3 nearest neighbors.
- The query vector must be passed in as the param `query_vector`.
- The distance to the query vector is returned as `vector_score`.
- The results are sorted by this `vector_score`.
- Finally, it returns the fields `vector_score`,  `id`, `brand`, `model`, and `description` for each result.

{{% alert title="Note" color="warning" %}}
To utilize a vector query with the [`FT.SEARCH`]({{< baseurl >}}/commands/ft.search/) command, you must specify DIALECT 2 or greater.
{{% /alert  %}}

You must pass the vectorized query as a byte array with the param name `query_vector`. The following code creates a Python NumPy array from the query vector and converts it into a compact, byte-level representation that can be passed as a parameter to the query:

```python
client.ft('idx:bikes_vss').search(
    query,
    {
      'query_vector': np.array(encoded_query, dtype=np.float32).tobytes()
    }
).docs
```

With the template for the query in place, you can execute all queries in a loop. Notice that the script calculates the `vector_score` for each result as `1 - doc.vector_score`. Because the cosine distance is used as the metric, the items with the smallest distance are closer and, therefore, more similar to the query.

Then, loop over the matched documents and create a list of results that can be converted into a Pandas table to visualize the results:

{{< clients-example search_vss define_bulk_query />}}

The query results show the individual queries' top three matches (our K parameter) along with the bike's id, brand, and model for each query.

For example, for the query "Best Mountain bikes for kids", the highest similarity score (`0.54`) and, therefore the closest match was the 'Nord' brand 'Chook air 5' bike model, described as:

> The Chook Air 5 gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. The lower top tube makes it easy to mount and dismount in any situation, giving your kids greater safety on the trails. The Chook Air 5 is the perfect intro to mountain biking.

From the description, this bike is an excellent match for younger children, and the embeddings accurately captured the semantics of the description.

{{< clients-example search_vss run_knn_query />}}

| query | score | id | brand | model | description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Best Mountain bikes for kids | 0.54 | bikes:003 | Nord | Chook air 5 | The Chook Air 5  gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. The lower  top tube makes it easy to mount and dismount in any situation, giving your kids greater safety on the trails. The Chook Air 5 is the perfect intro to mountain biking. |
|  | 0.51 | bikes:010 | nHill | Summit | This budget mountain bike from nHill performs well both on bike paths and on the trail. The fork with 100mm of travel absorbs rough terrain. Fat Kenda Booster tires give you grip in corners and on wet trails. The Shimano Tourney drivetrain offered enough gears for finding a comfortable pace to ride uphill, and the Tektro hydraulic disc brakes break smoothly. Whether you want an affordable bike that you can take to work, but also take trail riding on the weekends or you’re just after a stable,... |
|  | 0.46 | bikes:001 | Velorim | Jigger | Small and powerful, the Jigger is the best ride for the smallest of tikes! This is the tiniest kids’ pedal bike on the market available without a coaster brake, the Jigger is the vehicle of choice for the rare tenacious little rider raring to go. We say rare because this smokin’ little bike is not ideal for a nervous first-time rider, but it’s a true giddy up for a true speedster. The Jigger is a 12 inch lightweight kids bicycle and it will meet your little one’s need for speed. It’s a single... |


## Next steps

1. You can learn more about the query options, such as filters and vector range queries, by reading the [vector reference documentation]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}}).
2. The complete [search and query documentation]({{< relref "/develop/interact/search-and-query/" >}}) might be interesting for you.
3. If you want to follow the code examples more interactively, then you can use the [Jupyter notebook](https://github.com/RedisVentures/redis-vss-getting-started/blob/main/vector_similarity_with_redis.ipynb) that inspired this quick start guide.
4. If you want to see more advanced examples of a Redis vector database in action, visit the [Redis AI Resources](https://github.com/redis-developer/redis-ai-resources) page on GitHub.
