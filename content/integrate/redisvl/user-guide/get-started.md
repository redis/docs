---
description: Get started with RedisVL
linkTitle: Get started
title: Get started
type: integration
weight: 2
---
RedisVL is a versatile Python library with an integrated CLI, which is designed to enhance AI applications implemented using Redis. This guide will walk you through the following steps:

1. Define an `IndexSchema`.
2. Prepare a sample dataset.
3. Create a `SearchIndex` object.
4. Test `rvl` CLI functionality.
5. Load the sample data.
6. Build `VectorQuery` objects and execute searches.
7. Update a `SearchIndex` object.

{{< note >}}
This document is a converted form of [this Jupyter notebook](https://github.com/RedisVentures/redisvl/blob/main/docs/user_guide/getting_started_01.ipynb).
{{< /note >}}

Before beginning, be sure of the following:

1. You have installed RedisVL and have that environment activated.
1. You have a running Redis instance with the search and query capability.

## Define an `IndexSchema`

The `IndexSchema` maintains crucial index configuration and field definitions to
enable search with Redis. For ease of use, the schema can be constructed from a
Python dictionary or a YAML file.

### Example schema creation

Consider a dataset with user information, including `job`, `age`, `credit_score`,
and a three-dimensional `user_embedding` vector.

You must decide on a Redis index name and key prefix to use for this
dataset. Below are example schema definitions in both YAML and Python `dict` formats.

**YAML definition:**

```yaml
version: '0.1.0'

index:
  name: user_simple
  prefix: user_simple_docs

fields:
    - name: user
      type: tag
    - name: credit_store
      type: tag
    - name: job
      type: text
    - name: age
      type: numeric
    - name: user_embedding
      type: vector
      attrs:
        algorithm: flat
        dims: 3
        distance_metric: cosine
        datatype: float32
```

Store this information in a local file, such as `schema.yaml`, for use with RedisVL.

**Python dictionary:**

```python
schema = {
    "index": {
        "name": "user_simple",
        "prefix": "user_simple_docs",
    },
    "fields": [
        {"name": "user", "type": "tag"},
        {"name": "credit_score", "type": "tag"},
        {"name": "job", "type": "text"},
        {"name": "age", "type": "numeric"},
        {
            "name": "user_embedding",
            "type": "vector",
            "attrs": {
                "dims": 3,
                "distance_metric": "cosine",
                "algorithm": "flat",
                "datatype": "float32"
            }
        }
    ]
}
```

## Sample dataset preparation

Below, create a mock dataset with `user`, `job`, `age`, `credit_score`, and
`user_embedding` fields. The `user_embedding` vectors are synthetic examples
for demonstration purposes.

For more information on creating real-world embeddings, refer to this
[article](https://mlops.community/vector-similarity-search-from-basics-to-production/).

```python
import numpy as np

data = [
    {
        'user': 'john',
        'age': 1,
        'job': 'engineer',
        'credit_score': 'high',
        'user_embedding': np.array([0.1, 0.1, 0.5], dtype=np.float32).tobytes()
    },
    {
        'user': 'mary',
        'age': 2,
        'job': 'doctor',
        'credit_score': 'low',
        'user_embedding': np.array([0.1, 0.1, 0.5], dtype=np.float32).tobytes()
    },
    {
        'user': 'joe',
        'age': 3,
        'job': 'dentist',
        'credit_score': 'medium',
        'user_embedding': np.array([0.9, 0.9, 0.1], dtype=np.float32).tobytes()
    }
]
```

As seen above, the sample `user_embedding` vectors are converted into bytes using the `NumPy` Python package.

## Create a `SearchIndex`

With the schema and sample dataset ready, create a `SearchIndex`:

```python
from redisvl.index import SearchIndex

index = SearchIndex.from_dict(schema)
# or use .from_yaml('schema_file.yaml')
```

Now we also need to create a Redis connection. There are a few ways to do this:

- Create and manage your own client connection (recommended).
- Provide a simple Redis URL and let RedisVL connect on your behalf.

### Bring your own Redis connection instance

This is ideal in scenarios where you have custom settings on the connection instance or if your application will share a connection pool:

```python
from redis import Redis

client = Redis.from_url("redis://localhost:6379")

index.set_client(client)
# optionally provide an async Redis client object to enable async index operations
```

### Let the index manage the connection instance

This is ideal for simple cases:

```python
index.connect("redis://localhost:6379")
# optionally use an async client by passing use_async=True
```

### Create the underlying index

Now that there's a connection to Redis, run the create command.

```python
index.create(overwrite=True)
```

Note: at this point, the index has no associated data. Data loading follows.

## Inspect with the `rvl` command

Use the `rvl` CLI command to inspect the newly-created index and its fields:

```python
$ rvl index listall
18:25:34 [RedisVL] INFO   Indices:
18:25:34 [RedisVL] INFO   1. user_simple
```

```python
$ rvl index info -i user_simple

╭──────────────┬────────────────┬──────────────────────┬─────────────────┬────────────╮
│ Index Name   │ Storage Type   │ Prefixes             │ Index Options   │   Indexing │
├──────────────┼────────────────┼──────────────────────┼─────────────────┼────────────┤
│ user_simple  │ HASH           │ ['user_simple_docs'] │ []              │          0 │
╰──────────────┴────────────────┴──────────────────────┴─────────────────┴────────────╯
Index Fields:
╭────────────────┬────────────────┬─────────┬────────────────┬────────────────╮
│ Name           │ Attribute      │ Type    │ Field Option   │ Option Value   │
├────────────────┼────────────────┼─────────┼────────────────┼────────────────┤
│ user           │ user           │ TAG     │ SEPARATOR      │ ,              │
│ credit_score   │ credit_score   │ TAG     │ SEPARATOR      │ ,              │
│ job            │ job            │ TEXT    │ WEIGHT         │ 1              │
│ age            │ age            │ NUMERIC │                │                │
│ user_embedding │ user_embedding │ VECTOR  │                │                │
╰────────────────┴────────────────┴─────────┴────────────────┴────────────────╯
```

## Load data to `SearchIndex`

Load the sample dataset to Redis:

```python
keys = index.load(data)

print(keys)

['user:31d4f3c73f1a4c26b41cf0e2b8e0248a',
 'user:c9ff740437064b919245e49ef585484d',
 'user:6db5f2e09f08438785b73d8048d5350b']
```

By default, `load` will create a unique Redis key as a combination of the index key `prefix` and a UUID. You can also customize the key by providing direct keys or pointing to a specified `id_field` on load.

### Update the index with new data

Update data using the `load` method:

```python
# Add more data
new_data = [{
    'user': 'tyler',
    'age': 9,
    'job': 'engineer',
    'credit_score': 'high',
    'user_embedding': np.array([0.1, 0.3, 0.5], dtype=np.float32).tobytes()
}]
keys = index.load(new_data)

print(keys)

['user_simple_docs:ea6e8f2f93d5447c950ccb6843627761']
```

## Create `VectorQuery` objects

Next, create a vector query object for your newly-populated index. This example will use a simple vector to demonstrate how vector search works. Vectors in production will likely be much larger than three floating point numbers and often require machine learning models (e.g., [Huggingface](https://huggingface.co/models) sentence transformers) or an embeddings API (e.g., Cohere and OpenAI). RedisVL provides a set of vectorizers to assist with vector creation.

```python
from redisvl.query import VectorQuery
from jupyterutils import result_print

query = VectorQuery(
    vector=[0.1, 0.1, 0.5],
    vector_field_name="user_embedding",
    return_fields=["user", "age", "job", "credit_score", "vector_distance"],
    num_results=3
)
```

### Executing queries

With your `VectorQuery` object defined, you can execute the query over the `SearchIndex` using the `query` method.

```python
results = index.query(query)
result_print(results)
```

<table><tr><th>vector_distance</th><th>user</th><th>age</th><th>job</th><th>credit_score</th></tr><tr><td>0</td><td>john</td><td>1</td><td>engineer</td><td>high</td></tr><tr><td>0</td><td>mary</td><td>2</td><td>doctor</td><td>low</td></tr><tr><td>0.0566299557686</td><td>tyler</td><td>9</td><td>engineer</td><td>high</td></tr></table>

## Using an asynchronous Redis client

The `AsyncSearchIndex` class, along with an asynchronous Redis Python client, provides for asynchronous queries, index creation, and data loading. This is the
recommended way for working with `redisvl` in production settings.

```python
from redisvl.index import AsyncSearchIndex
from redis.asyncio import Redis

client = Redis.from_url("redis://localhost:6379")

index = AsyncSearchIndex.from_dict(schema)
index.set_client(client)

# execute the vector query async
results = await index.aquery(query)
result_print(results)
```

<table><tr><th>vector_distance</th><th>user</th><th>age</th><th>job</th><th>credit_score</th></tr><tr><td>0</td><td>john</td><td>1</td><td>engineer</td><td>high</td></tr><tr><td>0</td><td>mary</td><td>2</td><td>doctor</td><td>low</td></tr><tr><td>0.0566299557686</td><td>tyler</td><td>9</td><td>engineer</td><td>high</td></tr></table>

## Update a schema

In some scenarios, it makes sense to update the index schema. With Redis and RedisVL, this is easy because Redis can keep the underlying data in place while you update to the index configuration.

Imagine you want to re-index this data in the following ways:

- Use a `Tag` type for the `job` field instead of `Text`.
- Use an `HNSW` vector index for the `user_embedding` field instead of a `flat` vector index.

```python
# Modify this schema to have what we want

index.schema.remove_field("job")
index.schema.remove_field("user_embedding")
index.schema.add_fields([
    {"name": "job", "type": "tag"},
    {
        "name": "user_embedding",
        "type": "vector",
        "attrs": {
            "dims": 3,
            "distance_metric": "cosine",
            "algorithm": "flat",
            "datatype": "float32"
        }
    }
])

# Run the index update but keep underlying data in place
await index.create(overwrite=True, drop=False)

# Execute the vector query
results = await index.aquery(query)
result_print(results)
```

<table><tr><th>vector_distance</th><th>user</th><th>age</th><th>job</th><th>credit_score</th></tr><tr><td>0</td><td>john</td><td>1</td><td>engineer</td><td>high</td></tr><tr><td>0</td><td>mary</td><td>2</td><td>doctor</td><td>low</td></tr><tr><td>0.0566299557686</td><td>tyler</td><td>9</td><td>engineer</td><td>high</td></tr></table>

## Check index stats

Use `rvl` to check the statistics for the index:

```python
$ rvl stats -i user_simple

Statistics:
╭─────────────────────────────┬─────────────╮
│ Stat Key                    │ Value       │
├─────────────────────────────┼─────────────┤
│ num_docs                    │ 4           │
│ num_terms                   │ 0           │
│ max_doc_id                  │ 4           │
│ num_records                 │ 20          │
│ percent_indexed             │ 1           │
│ hash_indexing_failures      │ 0           │
│ number_of_uses              │ 2           │
│ bytes_per_record_avg        │ 1           │
│ doc_table_size_mb           │ 0.00044632  │
│ inverted_sz_mb              │ 1.90735e-05 │
│ key_table_size_mb           │ 0.000165939 │
│ offset_bits_per_record_avg  │ nan         │
│ offset_vectors_sz_mb        │ 0           │
│ offsets_per_term_avg        │ 0           │
│ records_per_doc_avg         │ 5           │
│ sortable_values_size_mb     │ 0           │
│ total_indexing_time         │ 0.246       │
│ total_inverted_index_blocks │ 11          │
│ vector_index_sz_mb          │ 0.0201416   │
╰─────────────────────────────┴─────────────╯

```

## Cleanup

```python
# clean up the index
await index.adelete()
```
