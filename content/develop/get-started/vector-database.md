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
2. Set a vector database up
3. Create vector embeddings and store vectors
4. Query data and perform a vector search


## Understand vector databases

Data is often unstructured, which means that it isn't described by a well-defined schema. Examples of unstructured data include text passages, images, videos, or music titles. An approach to dealing with unstructured data is to vectorize it. Vectorizing means to map unstructured data to a flat sequence of numbers. Such a vector represents the data embedded in an N-dimensional space. Machine learning models have facilitated the rise of embeddings as a widely embraced method for generating dense, low-dimensional vector representations. Given a suitable machine learning model, the generated embeddings can encapsulate complex patterns and semantic meanings inherent in data. 

You can use Redis Stack as a vector database. It allows you to:

* Store vectors and the associated metadata within hashes or [JSON]({{< relref "/develop/data-types/json" >}}) documents
* Retrieve vectors
* Perform vector searches

## Set a vector database up

The easiest way to get started with [Redis Stack]({{< relref "/operate/oss_and_stack/" >}}) is to use Redis Cloud:

1. Create a [free account](https://redis.com/try-free?utm_source=redisio&utm_medium=referral&utm_campaign=2023-09-try_free&utm_content=cu-redis_cloud_users).
2. Follow the instructions to create a free database.
   
   <img src="../img/free-cloud-db.png" width="500px">

This free Redis Cloud database comes out of the box with all the Redis Stack features.

You can alternatively use the [installation guides]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) to install Redis Stack on your local machine.

## Install the required Python packages

The code examples are currently provided for Redis CLI and Python. For Python, you will need to create a virtual environment and install the following Python packages:

* `redis`: You can find further details about the `redis-py` client library in the [clients]({{< relref "/develop/connect/clients/python" >}}) section of this documentation site.
* `pandas`: Pandas is a data analysis library.
* `sentence-transformers`: You will use the [SentenceTransformers](https://www.sbert.net/) framework to generate embeddings on full text. Sentence-BERT (SBERT) is a [BERT](https://en.wikipedia.org/wiki/BERT_(language_model)) model modification that produces consistent and contextually rich sentence embeddings. SBERT improves tasks like semantic search and text grouping by allowing for efficient and meaningful comparison of sentence-level semantic similarity.
* `tabulate`: This package is optional. Pandas use it to render Markdown. 

You will also need the following imports in your Python code:

{{< clients-example search_vss imports />}}

## Connect

Instantiate the Redis client. By default, Redis returns binary responses. To decode them, you pass the `decode_responses` parameter set to `True`:

{{< clients-example search_vss connect />}}
<br/>
{{% alert title="Tip" color="warning" %}}
Instead of using a local Redis Stack server, you can copy and paste the connection details from the Redis Cloud database configuration page. Here is an example connection string of a Cloud database that is hosted in the AWS region `us-east-1` and listens on port 16379: `redis-16379.c283.us-east-1-4.ec2.cloud.redislabs.com:16379`. The connection string has the format `host:port`. You must also copy and paste the username and password of your Cloud database. The line of code for connecting with the default user changes then to `client = redis.Redis(host="redis-16379.c283.us-east-1-4.ec2.cloud.redislabs.com", port=16379, password="your_password_here" decode_responses=True)`.
{{% /alert  %}}


## Create vector embeddings from the demo data

This quick start guide also uses the **bikes** dataset. Here is an example document of it:

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
  "description": "Small and powerful, the Jigger is the best ride for the smallest of tikes! ...
}
```

The `description` field is particularly interesting since it contains a free-form textual description of a bicycle.


###  1. Fetch the demo data
You need to first fetch the demo dataset as a JSON array:

{{< clients-example search_vss get_data />}}

The following code allows you to look at the structure of one of our bike JSON documents.

{{< clients-example search_vss dump_data />}}

### 2. Store the demo data in your database
Then, you iterate over the `bikes`  array to store the data as [JSON]({{< relref "/develop/data-types/json/" >}}) documents in the database by using the [JSON.SET]({{< baseurl >}}/commands/json.set/) command. The below code uses a [pipeline]({{< relref "/develop/use/pipelining" >}}) to minimize the round-trip times:

{{< clients-example search_vss load_data />}}

You can now retrieve a specific value from one of the JSON documents in Redis using a [JSONPath](https://goessner.net/articles/JsonPath/) expression:

{{< clients-example search_vss get />}}

### 3. Select a machine-learning model

This quick start guide uses a pre-trained [MS MARCO](https://microsoft.github.io/msmarco/) model. They are widely used in search engines, chatbots, and other AI applications.  

```python
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer('msmarco-distilbert-base-v4')
```

### 4. Create the vector embeddings
In the next step, you must iterate over all the Redis keys with the prefix `bikes:`:

{{< clients-example search_vss get_keys />}}

Use the keys as a parameter to the [JSON.MGET]({{< baseurl >}}/commands/json.mget/) command, along with the JSONPath expression `$.description` to collect the descriptions in a list. Then, pass the list to the `encode` method to get a list of vectorized embeddings:

{{< clients-example search_vss generate_embeddings />}}

You now need to add the vectorized descriptions to the JSON documents in Redis using the [JSON.SET]({{< baseurl >}}/commands/json.set/) command. The following command inserts a new field in each of the documents under the JSONPath `$.description_embeddings`. Once again, you'll do this using a pipeline:

{{< clients-example search_vss load_embeddings />}}

Inspect one of the vectorized bike documents using the [JSON.GET]((https://redis.io/commands/json.get/)) command:

{{< clients-example search_vss dump_example />}}

When storing a vector embedding within a JSON document, the embedding is stored as a JSON array.

{{% alert title="Note" color="warning" %}}
In the example above, the array was shortened considerably for the sake of readability.
{{% /alert  %}}


## Create an index 

### 1. Create an index with a vector field

You must create an index to query based on vector metadata or perform vector searches. Use the [FT.CREATE]({{< baseurl >}}/commands/ft.create/) command:

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

Here is a breakdown of the `VECTOR` schema field definition:

* `$.description_embeddings AS vector`: The vector field's JSON path and its field alias `vector`.
* `FLAT`: Specifies the indexing method, which is either a flat index or a hierarchical navigable small world graph (`HNSW`).
* `TYPE FLOAT32`: Sets the type of a vector component, in this case a 32-bit floating point number.
* `DIM 768`: The length or dimension of the embeddings, which you determined previously to be `768`.
* `DISTANCE_METRIC COSINE`: The distance function is, in this example, [cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity).  

You can find further details about all these options in the [vector reference documentation]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}}).

### 2. Check the state of the index

As soon as you execute the [FT.CREATE]({{< baseurl >}}/commands/ft.create/) command, the indexing process runs in the background. In a short time, all JSON documents should be indexed and ready to be queried. To validate that, you can use the [FT.INFO]({{< baseurl >}}/commands/ft.info/) command, which provides details and statistics about the index. Of particular interest are the number of documents successfully indexed and the number of failures:  

{{< clients-example search_vss validate_index >}}
FT.INFO idx:bikes_vss
{{< /clients-example >}}

## Search and query

This quick start guide focuses on the vector search aspect. Still, you can learn more about how to query based on vector metadata in the [document database quick start guide]({{< relref "/develop/get-started/document-database" >}}).

### 1. Embed your prompts

The following code snipped shows a list of textual prompts:

{{< clients-example search_vss def_bulk_queries />}}

You need first to encode the query prompts as you did with the descriptions of the bikes by using the same SentenceTransformers model:

{{< clients-example search_vss enc_bulk_queries />}}

### 2. Perform a K-nearest neighbors (KNN) query

KNN is a foundational algorithm that aims to find the most similar items to a given input. The KNN algorithm calculates the distance between the query vector and each vector in the database based on the chosen distance function. It then returns the K items with the smallest distances to the query vector. These are the most similar items. 

The following example shows a query that doesn't apply a pre-filter. The pre-filter expression `(*)` means `all`, but you could replace it with a query expression that filters by additional metadata. 

Then KNN part of the query searches for the three nearest neighbors. The distance to the query vector is returned as `vector_score`. The results are sorted by this score. Finally, it returns the fields `vector_score`,  `id`, `$.brand`, `$.model`, and `$.description` within the resultset.


```python
query = (
    Query('(*)=>[KNN 3 @vector $query_vector AS vector_score]')
     .sort_by('vector_score')
     .return_fields('vector_score', 'id', 'brand', 'model', 'description')
     .dialect(2)
)
```

{{% alert title="Note" color="warning" %}}
To utilize a vector query with the [`FT.SEARCH`]({{< baseurl >}}/commands/ft.search) command, you must specify DIALECT 2 or greater.
{{% /alert  %}}

You must pass the vectorized query as `$query_vector` as a byte array. The following code shows an example of creating a Python NumPy array from a vectorized query prompt (`encoded_query`) as a single precision floating point array and converting it into a compact, byte-level representation that can be passed as a parameter to the query:

```python
client.ft(INDEX_NAME).search(query, { 'query_vector': np.array(encoded_query, dtype=np.float32).tobytes() }).docs
```

With the template for the query in place, you can execute all query prompts in a loop by passing the vectorized query prompts over. Notice that the script calculates the `vector_score` for each result as `1 - doc.vector_score`. Because the cosine distance is used as the metric, the items with the smallest distance are closer and, therefore, more similar to the query. 

Then, loop over the matched documents and create a list of results that can be converted into a Pandas table to visualize the results:

{{< clients-example search_vss define_bulk_query />}}

The query results show the individual queries' top three matches (our K parameter) along with the bike's id, brand, and model for each query. For example, for the query "Best Mountain bikes for kids", the highest similarity score (`0.54`) and, therefore the closest match was the 'Nord' brand 'Chook air 5' bike model, described as:

> The Chook Air 5 gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. The lower top tube makes it easy to mount and dismount in any situation, giving your kids greater safety on the trails. The Chook Air 5 is the perfect intro to mountain biking.

From the description, this bike is an excellent match for younger children, and the used embeddings have accurately captured the semantics of the description.

{{< clients-example search_vss run_knn_query />}}

| query | score | id | brand | model | description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Best Mountain bikes for kids | 0.54 | bikes:003 | Nord | Chook air 5 | The Chook Air 5  gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. The lower  top tube makes it easy to mount and dismount in any situation, giving your kids greater safety on the trails. The Chook Air 5 is the perfect intro to mountain biking. |
|  | 0.51 | bikes:010 | nHill | Summit | This budget mountain bike from nHill performs well both on bike paths and on the trail. The fork with 100mm of travel absorbs rough terrain. Fat Kenda Booster tires give you grip in corners and on wet trails. The Shimano Tourney drivetrain offered enough gears for finding a comfortable pace to ride uphill, and the Tektro hydraulic disc brakes break smoothly. Whether you want an affordable bike that you can take to work, but also take trail riding on the weekends or you’re just after a stable,... |
|  | 0.46 | bikes:001 | Velorim | Jigger | Small and powerful, the Jigger is the best ride for the smallest of tikes! This is the tiniest kids’ pedal bike on the market available without a coaster brake, the Jigger is the vehicle of choice for the rare tenacious little rider raring to go. We say rare because this smokin’ little bike is not ideal for a nervous first-time rider, but it’s a true giddy up for a true speedster. The Jigger is a 12 inch lightweight kids bicycle and it will meet your little one’s need for speed. It’s a single... |
`...`

## Next steps

1. You can learn more about the query options, such as pre-filters and radius queries, by reading the [vector reference documentation]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}}).
2. The complete [search and query documentation]({{< relref "/develop/interact/search-and-query/" >}}) might be interesting for you.
3. If you want to follow the code examples more interactively, then you can use the [Jupyter notebook](https://github.com/RedisVentures/redis-vss-getting-started/blob/main/vector_similarity_with_redis.ipynb) that inspired this quick start guide.
