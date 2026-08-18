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
description: Search by meaning with vector embeddings, run KNN queries with FT.SEARCH, and combine keywords with semantic similarity using FT.HYBRID.
linkTitle: 5. Vector and hybrid search
stack: true
title: Vector and hybrid search
aliases:
- /get-started/search-tutorial/vector-search/
- /get-started/vector-database/
- /develop/get-started/vector-database/
weight: 5
---

This is the final step of the [Redis Search tutorial]({{< relref "/develop/get-started/search-tutorial" >}}). It builds on everything so far: the [catalog]({{< relref "/develop/get-started/search-tutorial/data-modeling" >}}), the [index]({{< relref "/develop/get-started/search-tutorial/indexing" >}}), and the [search]({{< relref "/develop/get-started/search-tutorial/search" >}}) syntax.

{{% alert title="Version requirement" color="warning" %}}
The hybrid search section uses [FT.HYBRID]({{< relref "/commands/ft.hybrid" >}}), which requires Redis 8.8 or later. Vector search with `FT.SEARCH` works on earlier versions with Redis Search.
{{% /alert %}}

So far you have matched products by the words they contain and the exact values of their fields. But a shopper searching for "*something to listen to music on a run*" will not use the word *headphones* or *earbuds*, and a keyword search would miss them. **Vector search** solves this by matching on *meaning* rather than exact words.

{{% alert title="Which client library?" color="info" %}}
This tutorial performs vector search with `redis-cli` and the core Redis commands, and shows `redis-py` for Python. If you want a higher-level Python experience, [RedisVL]({{< relref "/develop/clients/redis-vl" >}}) is a client library purpose-built for vector workflows. You can also find vector search examples for the other client libraries:

- [`redis-py` (Python)]({{< relref "/develop/clients/redis-py/vecsearch" >}})
- [`NRedisStack` (C#/.NET)]({{< relref "/develop/clients/dotnet/nredisstack/vecsearch" >}})
- [`node-redis` (JavaScript/Node.js)]({{< relref "/develop/clients/nodejs/vecsearch" >}})
- [`jedis` (Java)]({{< relref "/develop/clients/jedis/vecsearch" >}})
- [`go-redis` (Go)]({{< relref "/develop/clients/go/vecsearch" >}})
{{% /alert %}}

## How vector search works

A machine learning **embedding model** turns a piece of text into a list of numbers, called a **vector**, that captures its meaning. Texts with similar meanings produce vectors that are close together in space. To search by meaning, you:

1. Generate an embedding for each product (here, from its description) and store it on the document.
2. Add a `VECTOR` field to the index so Redis can search those embeddings.
3. At query time, embed the search phrase and ask Redis for the products whose vectors are nearest to it.

"Nearest" is measured by a **distance metric**. This tutorial uses cosine distance, where a smaller distance means more similar.

## Generate and store embeddings

Embeddings come from a model, so this step uses a client library rather than `redis-cli`. The example below uses the Python [SentenceTransformers](https://www.sbert.net/) framework to embed each product description and store the result on the document under `$.embedding`. The model used here produces 768-dimensional vectors.

```python
from redis import Redis
from sentence_transformers import SentenceTransformer

r = Redis(host="localhost", port=6379, decode_responses=True)
embedder = SentenceTransformer("msmarco-distilbert-base-v4")  # 768-dimensional vectors

# Embed each product's description and store it on the document.
for key in r.scan_iter(match="product:*"):
    description = r.json().get(key, "$.description")[0]
    embedding = embedder.encode(description).astype("float32").tolist()
    r.json().set(key, "$.embedding", embedding)
```

Redis can store vectors in either hashes or JSON documents. Because this tutorial uses JSON, each embedding is stored as a JSON array of numbers, so every product now has an `embedding` field alongside its other attributes.

## Add a vector field to the index

<details><summary>Reload products data and re-create index</summary>
{{% redis-cli %}}
redis> FT.CREATE idx:catalog ON JSON PREFIX 1 product: SCHEMA $.name AS name TEXT $.brand AS brand TAG SORTABLE $.category AS category TAG $.description AS description TEXT $.price AS price NUMERIC SORTABLE $.rating AS rating NUMERIC SORTABLE $.review_count AS review_count NUMERIC $.stock AS stock NUMERIC $.release_year AS release_year NUMERIC SORTABLE $.features[*] AS features TAG
OK
redis> JSON.SET product:1 $ '{"name":"Aurora AcousticPro Headphones","brand":"Aurora","category":"Audio","price":199.99,"rating":4.6,"features":["wireless","noise-cancelling","bluetooth"],"specs":{"color":"midnight black","weight_grams":268}}'
OK
redis> JSON.SET product:2 $ '{"name":"Aurora BudsMini Earbuds","brand":"Aurora","category":"Audio","description":"Tiny true-wireless earbuds with a secure in-ear fit and sweat resistance for workouts. The compact charging case slips into a pocket and delivers three full recharges on the go.","price":89.99,"rating":4.3,"review_count":942,"stock":130,"release_year":2023,"features":["wireless","bluetooth","in-ear","water-resistant"],"specs":{"color":"pearl white","weight_grams":5,"warranty_years":1}}'
OK
redis> JSON.SET product:3 $ '{"name":"Sonus Boom Portable Speaker","brand":"Sonus","category":"Audio","description":"A rugged portable Bluetooth speaker with deep bass and a waterproof shell. Toss it in a bag for the beach or a campsite and enjoy room-filling sound for up to 20 hours per charge.","price":129.5,"rating":4.5,"review_count":512,"stock":64,"release_year":2024,"features":["wireless","bluetooth","portable","waterproof"],"specs":{"color":"slate gray","weight_grams":540,"warranty_years":1}}'
OK
redis> JSON.SET product:4 $ '{"name":"Pixma Vortex 15 Laptop","brand":"Pixma","category":"Computers","description":"A thin-and-light 15-inch laptop with a fast multi-core processor, 16 GB of memory, and a speedy solid-state drive. The backlit keyboard and bright display make it a capable companion for work and study.","price":1399.0,"rating":4.7,"review_count":318,"stock":18,"release_year":2024,"features":["laptop","ssd","backlit-keyboard","lightweight"],"specs":{"color":"space silver","weight_grams":1600,"warranty_years":2}}'
OK
redis> JSON.SET product:5 $ '{"name":"Pixma UltraView 27 Monitor","brand":"Pixma","category":"Computers","description":"A 27-inch 4K monitor with an IPS panel for accurate colors and wide viewing angles. A single USB-C cable carries video and power, keeping your desk tidy.","price":329.99,"rating":4.4,"review_count":221,"stock":27,"release_year":2023,"features":["monitor","4k","ips","usb-c"],"specs":{"color":"black","weight_grams":5200,"warranty_years":3}}'
OK
redis> JSON.SET product:6 $ '{"name":"Clackr Mechanical Keyboard","brand":"Clackr","category":"Accessories","description":"A compact mechanical keyboard with tactile switches, per-key RGB lighting, and wireless connectivity. Hot-swappable switches let you tune the typing feel without soldering.","price":119.0,"rating":4.8,"review_count":1502,"stock":88,"release_year":2024,"features":["keyboard","mechanical","rgb","wireless"],"specs":{"color":"graphite","weight_grams":720,"warranty_years":2}}'
OK
redis> JSON.SET product:7 $ '{"name":"Glide Pro Wireless Mouse","brand":"Glide","category":"Accessories","description":"An ergonomic wireless mouse with a high-precision sensor and a contoured shape that reduces wrist strain. A single charge lasts for weeks of everyday use.","price":59.99,"rating":4.2,"review_count":869,"stock":150,"release_year":2022,"features":["mouse","wireless","ergonomic"],"specs":{"color":"charcoal","weight_grams":98,"warranty_years":1}}'
OK
redis> JSON.SET product:8 $ '{"name":"Pulse Series 6 Smartwatch","brand":"Pulse","category":"Wearables","description":"A sleek smartwatch with built-in GPS, continuous heart-rate monitoring, and water resistance for swimming. Track workouts, sleep, and notifications from your wrist.","price":249.0,"rating":4.5,"review_count":1733,"stock":51,"release_year":2024,"features":["smartwatch","gps","heart-rate","water-resistant"],"specs":{"color":"rose gold","weight_grams":38,"warranty_years":1}}'
OK
redis> JSON.SET product:9 $ '{"name":"Pulse Band Fitness Tracker","brand":"Pulse","category":"Wearables","description":"A lightweight fitness band that tracks steps, heart rate, and sleep stages. The slim screen shows daily progress and the battery lasts a full week between charges.","price":79.99,"rating":4.1,"review_count":2210,"stock":200,"release_year":2023,"features":["fitness-tracker","heart-rate","sleep-tracking"],"specs":{"color":"ocean blue","weight_grams":24,"warranty_years":1}}'
OK
redis> JSON.SET product:10 $ '{"name":"Lumi Glow Smart Bulb","brand":"Lumi","category":"Home","description":"A color-changing smart bulb that connects over Wi-Fi and works with voice assistants. Dim it for movie night or set a warm white for reading, all from your phone.","price":24.99,"rating":4.0,"review_count":640,"stock":320,"release_year":2022,"features":["smart-home","wifi","dimmable","color"],"specs":{"color":"white","weight_grams":70,"warranty_years":2}}'
OK
redis> JSON.SET product:11 $ '{"name":"Lumi Climate Smart Thermostat","brand":"Lumi","category":"Home","description":"A learning smart thermostat that adjusts heating and cooling to your routine and helps lower energy bills. The crisp display and Wi-Fi app make scheduling effortless.","price":149.0,"rating":4.6,"review_count":388,"stock":75,"release_year":2024,"features":["smart-home","wifi","energy-saving"],"specs":{"color":"white","weight_grams":210,"warranty_years":3}}'
OK
redis> JSON.SET product:12 $ '{"name":"Vista Action Cam 4K","brand":"Vista","category":"Cameras","description":"A pocket-sized action camera that shoots stabilized 4K video and is waterproof without a case. Mount it on a helmet or bike and capture your adventures in sharp detail.","price":299.0,"rating":4.3,"review_count":455,"stock":33,"release_year":2023,"features":["camera","4k","waterproof","wifi"],"specs":{"color":"black","weight_grams":128,"warranty_years":1}}'
OK
{{% /redis-cli %}}

</details>

The index you created earlier does not know about the new `embedding` field. Recreate it to include a `VECTOR` field. Dropping the index does not delete your documents, and the embeddings you just stored are indexed as soon as the new index is created:

{{< clients-example set="search_tutorial" step="create_vector_index" description="Foundational: Recreate the index with a VECTOR field so embeddings can be searched" difficulty="intermediate" >}}
> FT.DROPINDEX idx:catalog
OK
> FT.CREATE idx:catalog ON JSON PREFIX 1 product: SCHEMA $.name AS name TEXT $.brand AS brand TAG SORTABLE $.category AS category TAG $.description AS description TEXT $.price AS price NUMERIC SORTABLE $.rating AS rating NUMERIC SORTABLE $.features[*] AS features TAG $.embedding AS embedding VECTOR FLAT 6 TYPE FLOAT32 DIM 768 DISTANCE_METRIC COSINE
OK
{{< /clients-example >}}

The vector field definition reads: index `$.embedding` as a `VECTOR` field using the `FLAT` algorithm, with `6` attributes following &mdash; `TYPE FLOAT32`, `DIM 768` (the model's dimension), and `DISTANCE_METRIC COSINE`. `FLAT` does an exact search and is a good default for small datasets; for large datasets you would choose `HNSW`. For all the options, see the [vector search concepts]({{< relref "/develop/ai/search-and-query/vectors" >}}) page.

## K-nearest neighbors (KNN)

A KNN query asks for the `k` products whose embeddings are closest to a query vector. You embed the search phrase with the *same* model, then pass the resulting vector to `FT.SEARCH`:

```
FT.SEARCH idx:catalog "(*)=>[KNN 3 @embedding $query_vector AS score]" PARAMS 2 query_vector "\x9a\x99\x19\x3f..." SORTBY score ASC RETURN 2 score name DIALECT 2
```

Here is what each part does:

- **`(*)`** is a pre-filter that runs *before* the vector search. `(*)` means "consider all products". You can put any query here to restrict the candidates (shown next).
- **`=>[KNN 3 @embedding $query_vector AS score]`** asks for the 3 nearest neighbors in the `embedding` field, naming each result's distance `score`.
- **`PARAMS 2 query_vector "..."`** supplies the query vector's binary value. The `2` means two arguments follow: the parameter name and its value.
- **`SORTBY score ASC`** orders results closest-first, and **`DIALECT 2`** selects the query dialect that vector search requires.

{{% alert title="Note" color="info" %}}
The query vector's binary value is long, so it is shortened in the example above. In a real application your client library builds it for you from the model's output, as in the [embedding step](#generate-and-store-embeddings) above.
{{% /alert %}}

For a phrase like "*portable music for the outdoors*", this returns the products whose descriptions are closest in meaning &mdash; the portable speaker and the earbuds rank highly &mdash; even though they share no specific keyword with the query.

### Pre-filter the candidates

The pre-filter is where vector search meets the filtering you already know. Replace `(*)` with any `FT.SEARCH` query to search for similar products *within a subset*. This finds the 3 nearest products **among Audio products only**:

```
FT.SEARCH idx:catalog "(@category:{Audio})=>[KNN 3 @embedding $query_vector AS score]" PARAMS 2 query_vector "\x9a\x99\x19\x3f..." SORTBY score ASC RETURN 2 score name DIALECT 2
```

## Hybrid search

Keyword search and vector search each have strengths. Keyword search is precise when the user knows the exact term; vector search is forgiving when they describe what they want in their own words. **Hybrid search** runs both at once and fuses the results, giving you the best of each.

The [FT.HYBRID]({{< relref "/commands/ft.hybrid" >}}) command takes a `SEARCH` clause (a full-text query, exactly like `FT.SEARCH`) and a `VSIM` clause (a vector similarity query), and combines their rankings. This searches for the keyword *wireless* and, at the same time, for products semantically similar to the query vector (here, an embedding of "*wireless headphones for listening to music*"):

```
FT.HYBRID idx:catalog SEARCH "wireless" VSIM @embedding $query_vector KNN 2 K 5 LOAD 1 @name PARAMS 2 query_vector "\x9a\x99\x19\x3f..."
```

As with the KNN examples, the query vector's binary value is shortened above; your client library builds it from the model's output.

The result blends two rankings: products that literally mention *wireless* and products whose meaning is closest to the query vector. For this query, the wireless headphones and earbuds come out on top &mdash; they satisfy both the keyword and the meaning &mdash; followed by other wireless items and the nearest semantic matches such as the portable speaker.

By default, `FT.HYBRID` fuses the two rankings with a method called Reciprocal Rank Fusion. You can tune the balance with a `COMBINE` clause, and add `FILTER`, `LOAD`, `APPLY`, and `SORTBY` steps just as you would in an aggregation. See the [FT.HYBRID]({{< relref "/commands/ft.hybrid" >}}) reference for the full syntax.

{{% alert title="Try it in Redis Insight" color="info" %}}
The [Redis Insight Search workspace]({{< relref "/develop/tools/insight/search-workspace" >}}) is built for exactly this kind of work. Its welcome screen introduces full-text, vector, and hybrid search, it can load a ready-made vector dataset, and its editor handles the vector parameters for you &mdash; a much friendlier way to experiment with vector and hybrid queries than pasting binary blobs into `redis-cli`.
{{% /alert %}}

## What you have learned

Congratulations &mdash; you have gone from an empty database to running hybrid semantic search. Along the way you:

1. Modeled records as JSON documents and learned when hashes fit better.
2. Created an index and chose `TEXT`, `TAG`, and `NUMERIC` field types.
3. Searched, filtered, and projected with `FT.SEARCH`.
4. Grouped and summarized data with `FT.AGGREGATE`.
5. Searched by meaning with vector KNN and combined it with keywords using `FT.HYBRID`.

## Where to go next

- **Go deeper on querying** &mdash; the [query documentation]({{< relref "/develop/ai/search-and-query/query" >}}) covers fuzzy matching, geospatial queries, scoring, and more.
- **Tune your vectors** &mdash; [vector search concepts]({{< relref "/develop/ai/search-and-query/vectors" >}}) explains the `FLAT` and `HNSW` index types, vector range queries, and how to choose between them.
- **Use a vector-native Python library** &mdash; [RedisVL]({{< relref "/develop/clients/redis-vl" >}}) provides a higher-level API for building vector search and AI applications on Redis.
- **Build an AI application** &mdash; see how Redis powers retrieval-augmented generation in the [RAG quick start]({{< relref "/develop/get-started/rag" >}}) and [Redis for AI]({{< relref "/develop/ai" >}}).
- **See also** &mdash; if you need standalone similarity search without a full search index, Redis also offers the [vector sets]({{< relref "/develop/data-types/vector-sets" >}}) data type.
