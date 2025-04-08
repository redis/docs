---
linkTitle: Getting started with RedisVL
title: Getting Started with RedisVL
type: integration
weight: 01
---

`redisvl` is a versatile Python library with an integrated CLI, designed to enhance AI applications using Redis. This guide will walk you through the following steps:

1. Defining an `IndexSchema`
2. Preparing a sample dataset
3. Creating a `SearchIndex` object
4. Testing `rvl` CLI functionality
5. Loading the sample data
6. Building `VectorQuery` objects and executing searches
7. Updating a `SearchIndex` object

...and more!

Prerequisites:
- Ensure `redisvl` is installed in your Python environment.
- Have a running instance of [Redis Stack](https://redis.io/docs/install/install-stack/) or [Redis Cloud](https://redis.io/cloud).

_____

## Define an `IndexSchema`

The `IndexSchema` maintains crucial **index configuration** and **field definitions** to
enable search with Redis. For ease of use, the schema can be constructed from a
python dictionary or yaml file.

### Example Schema Creation
Consider a dataset with user information, including `job`, `age`, `credit_score`,
and a 3-dimensional `user_embedding` vector.

You must also decide on a Redis index name and key prefix to use for this
dataset. Below are example schema definitions in both YAML and Dict format.

**YAML Definition:**

```yaml
version: '0.1.0'

index:
  name: user_simple
  prefix: user_simple_docs

fields:
    - name: user
      type: tag
    - name: credit_score
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
Store this in a local file, such as `schema.yaml`, for RedisVL usage.

**Python Dictionary:**


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

## Sample Dataset Preparation

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

As seen above, the sample `user_embedding` vectors are converted into bytes. Using the `NumPy`, this is fairly trivial.

## Create a `SearchIndex`

With the schema and sample dataset ready, create a `SearchIndex`.

### Bring your own Redis connection instance

This is ideal in scenarios where you have custom settings on the connection instance or if your application will share a connection pool:


```python
from redisvl.index import SearchIndex
from redis import Redis

client = Redis.from_url("redis://localhost:6379")
index = SearchIndex.from_dict(schema, redis_client=client, validate_on_load=True)
```

### Let the index manage the connection instance

This is ideal for simple cases:


```python
index = SearchIndex.from_dict(schema, redis_url="redis://localhost:6379", validate_on_load=True)

# If you don't specify a client or Redis URL, the index will attempt to
# connect to Redis at the default address "redis://localhost:6379".
```




    <redisvl.index.index.SearchIndex at 0x10faca900>



### Create the index

Now that we are connected to Redis, we need to run the create command.


```python
index.create(overwrite=True)
```

Note that at this point, the index has no entries. Data loading follows.

## Inspect with the `rvl` CLI
Use the `rvl` CLI to inspect the created index and its fields:


```python
!rvl index listall
```

    10:59:25 [RedisVL] INFO   Indices:
    10:59:25 [RedisVL] INFO   1. user_simple



```python
!rvl index info -i user_simple
```

    
    
    Index Information:
    ╭──────────────┬────────────────┬──────────────────────┬─────────────────┬────────────╮
    │ Index Name   │ Storage Type   │ Prefixes             │ Index Options   │   Indexing │
    ├──────────────┼────────────────┼──────────────────────┼─────────────────┼────────────┤
    │ user_simple  │ HASH           │ ['user_simple_docs'] │ []              │          0 │
    ╰──────────────┴────────────────┴──────────────────────┴─────────────────┴────────────╯
    Index Fields:
    ╭────────────────┬────────────────┬─────────┬────────────────┬────────────────┬────────────────┬────────────────┬────────────────┬────────────────┬─────────────────┬────────────────╮
    │ Name           │ Attribute      │ Type    │ Field Option   │ Option Value   │ Field Option   │ Option Value   │ Field Option   │   Option Value │ Field Option    │ Option Value   │
    ├────────────────┼────────────────┼─────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼─────────────────┼────────────────┤
    │ user           │ user           │ TAG     │ SEPARATOR      │ ,              │                │                │                │                │                 │                │
    │ credit_score   │ credit_score   │ TAG     │ SEPARATOR      │ ,              │                │                │                │                │                 │                │
    │ job            │ job            │ TEXT    │ WEIGHT         │ 1              │                │                │                │                │                 │                │
    │ age            │ age            │ NUMERIC │                │                │                │                │                │                │                 │                │
    │ user_embedding │ user_embedding │ VECTOR  │ algorithm      │ FLAT           │ data_type      │ FLOAT32        │ dim            │              3 │ distance_metric │ COSINE         │
    ╰────────────────┴────────────────┴─────────┴────────────────┴────────────────┴────────────────┴────────────────┴────────────────┴────────────────┴─────────────────┴────────────────╯


## Load Data to `SearchIndex`

Load the sample dataset to Redis.

### Validate data entries on load
RedisVL uses pydantic validation under the hood to ensure loaded data is valid and confirms to your schema. This setting is optional and can be configured in the `SearchIndex` class.


```python
keys = index.load(data)

print(keys)
```

    ['user_simple_docs:01JQ9FEZ4GAAYT9W7BWAF7CV18', 'user_simple_docs:01JQ9FEZ4JCE5FD1D5QY6BAJ0J', 'user_simple_docs:01JQ9FEZ4KF9AZYBKMYNMYBZ5A']


By default, `load` will create a unique Redis key as a combination of the index key `prefix` and a random ULID. You can also customize the key by providing direct keys or pointing to a specified `id_field` on load.

### Load invalid data
This will raise a `SchemaValidationError` if `validate_on_load` is set to true in the `SearchIndex` class.


```python
# NBVAL_SKIP

keys = index.load([{"user_embedding": True}])
```

    11:00:03 redisvl.index.index ERROR   Schema validation error while loading data
    Traceback (most recent call last):
      File "/Users/tyler.hutcherson/Documents/AppliedAI/redis-vl-python/redisvl/index/storage.py", line 204, in _preprocess_and_validate_objects
        processed_obj = self._validate(processed_obj)
      File "/Users/tyler.hutcherson/Documents/AppliedAI/redis-vl-python/redisvl/index/storage.py", line 160, in _validate
        return validate_object(self.index_schema, obj)
      File "/Users/tyler.hutcherson/Documents/AppliedAI/redis-vl-python/redisvl/schema/validation.py", line 274, in validate_object
        validated = model_class.model_validate(flat_obj)
      File "/Users/tyler.hutcherson/Library/Caches/pypoetry/virtualenvs/redisvl-VnTEShF2-py3.13/lib/python3.13/site-packages/pydantic/main.py", line 627, in model_validate
        return cls.__pydantic_validator__.validate_python(
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
            obj, strict=strict, from_attributes=from_attributes, context=context
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        )
        ^
    pydantic_core._pydantic_core.ValidationError: 1 validation error for user_simple__PydanticModel
    user_embedding
      Input should be a valid bytes [type=bytes_type, input_value=True, input_type=bool]
        For further information visit https://errors.pydantic.dev/2.10/v/bytes_type
    
    The above exception was the direct cause of the following exception:
    
    Traceback (most recent call last):
      File "/Users/tyler.hutcherson/Documents/AppliedAI/redis-vl-python/redisvl/index/index.py", line 586, in load
        return self._storage.write(
               ~~~~~~~~~~~~~~~~~~~^
            self._redis_client,  # type: ignore
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        ...<6 lines>...
            validate=self._validate_on_load,
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        )
        ^
      File "/Users/tyler.hutcherson/Documents/AppliedAI/redis-vl-python/redisvl/index/storage.py", line 265, in write
        prepared_objects = self._preprocess_and_validate_objects(
            list(objects),  # Convert Iterable to List
        ...<3 lines>...
            validate=validate,
        )
      File "/Users/tyler.hutcherson/Documents/AppliedAI/redis-vl-python/redisvl/index/storage.py", line 211, in _preprocess_and_validate_objects
        raise SchemaValidationError(str(e), index=i) from e
    redisvl.exceptions.SchemaValidationError: Validation failed for object at index 0: 1 validation error for user_simple__PydanticModel
    user_embedding
      Input should be a valid bytes [type=bytes_type, input_value=True, input_type=bool]
        For further information visit https://errors.pydantic.dev/2.10/v/bytes_type



    ---------------------------------------------------------------------------

    ValidationError                           Traceback (most recent call last)

    File ~/Documents/AppliedAI/redis-vl-python/redisvl/index/storage.py:204, in BaseStorage._preprocess_and_validate_objects(self, objects, id_field, keys, preprocess, validate)
        203 if validate:
    --> 204     processed_obj = self._validate(processed_obj)
        206 # Store valid object with its key for writing


    File ~/Documents/AppliedAI/redis-vl-python/redisvl/index/storage.py:160, in BaseStorage._validate(self, obj)
        159 # Pass directly to validation function and let any errors propagate
    --> 160 return validate_object(self.index_schema, obj)


    File ~/Documents/AppliedAI/redis-vl-python/redisvl/schema/validation.py:274, in validate_object(schema, obj)
        273 # Validate against model
    --> 274 validated = model_class.model_validate(flat_obj)
        275 return validated.model_dump(exclude_none=True)


    File ~/Library/Caches/pypoetry/virtualenvs/redisvl-VnTEShF2-py3.13/lib/python3.13/site-packages/pydantic/main.py:627, in BaseModel.model_validate(cls, obj, strict, from_attributes, context)
        626 __tracebackhide__ = True
    --> 627 return cls.__pydantic_validator__.validate_python(
        628     obj, strict=strict, from_attributes=from_attributes, context=context
        629 )


    ValidationError: 1 validation error for user_simple__PydanticModel
    user_embedding
      Input should be a valid bytes [type=bytes_type, input_value=True, input_type=bool]
        For further information visit https://errors.pydantic.dev/2.10/v/bytes_type

    
    The above exception was the direct cause of the following exception:


    SchemaValidationError                     Traceback (most recent call last)

    Cell In[16], line 1
    ----> 1 keys = index.load([{"user_embedding": True}])


    File ~/Documents/AppliedAI/redis-vl-python/redisvl/index/index.py:586, in SearchIndex.load(self, data, id_field, keys, ttl, preprocess, batch_size)
        556 """Load objects to the Redis database. Returns the list of keys loaded
        557 to Redis.
        558 
       (...)
        583     RedisVLError: If there's an error loading data to Redis.
        584 """
        585 try:
    --> 586     return self._storage.write(
        587         self._redis_client,  # type: ignore
        588         objects=data,
        589         id_field=id_field,
        590         keys=keys,
        591         ttl=ttl,
        592         preprocess=preprocess,
        593         batch_size=batch_size,
        594         validate=self._validate_on_load,
        595     )
        596 except SchemaValidationError:
        597     # Pass through validation errors directly
        598     logger.exception("Schema validation error while loading data")


    File ~/Documents/AppliedAI/redis-vl-python/redisvl/index/storage.py:265, in BaseStorage.write(self, redis_client, objects, id_field, keys, ttl, preprocess, batch_size, validate)
        262     return []
        264 # Pass 1: Preprocess and validate all objects
    --> 265 prepared_objects = self._preprocess_and_validate_objects(
        266     list(objects),  # Convert Iterable to List
        267     id_field=id_field,
        268     keys=keys,
        269     preprocess=preprocess,
        270     validate=validate,
        271 )
        273 # Pass 2: Write all valid objects in batches
        274 added_keys = []


    File ~/Documents/AppliedAI/redis-vl-python/redisvl/index/storage.py:211, in BaseStorage._preprocess_and_validate_objects(self, objects, id_field, keys, preprocess, validate)
        207     prepared_objects.append((key, processed_obj))
        209 except ValidationError as e:
        210     # Convert Pydantic ValidationError to SchemaValidationError with index context
    --> 211     raise SchemaValidationError(str(e), index=i) from e
        212 except Exception as e:
        213     # Capture other exceptions with context
        214     object_id = f"at index {i}"


    SchemaValidationError: Validation failed for object at index 0: 1 validation error for user_simple__PydanticModel
    user_embedding
      Input should be a valid bytes [type=bytes_type, input_value=True, input_type=bool]
        For further information visit https://errors.pydantic.dev/2.10/v/bytes_type


### Upsert the index with new data
Upsert data by using the `load` method again:


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
```

    ['user_simple_docs:01JQ9FHCB1B64GXF6WPK127VZ6']


## Creating `VectorQuery` Objects

Next we will create a vector query object for our newly populated index. This example will use a simple vector to demonstrate how vector similarity works. Vectors in production will likely be much larger than 3 floats and often require Machine Learning models (i.e. Huggingface sentence transformers) or an embeddings API (Cohere, OpenAI). `redisvl` provides a set of [Vectorizers]({{< relref "vectorizers#openai" >}}) to assist in vector creation.


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
With our `VectorQuery` object defined above, we can execute the query over the `SearchIndex` using the `query` method.


```python
results = index.query(query)
result_print(results)
```


<table><tr><th>vector_distance</th><th>user</th><th>age</th><th>job</th><th>credit_score</th></tr><tr><td>0</td><td>john</td><td>1</td><td>engineer</td><td>high</td></tr><tr><td>0</td><td>mary</td><td>2</td><td>doctor</td><td>low</td></tr><tr><td>0.0566299557686</td><td>tyler</td><td>9</td><td>engineer</td><td>high</td></tr></table>


## Using an Asynchronous Redis Client

The `AsyncSearchIndex` class along with an async Redis python client allows for queries, index creation, and data loading to be done asynchronously. This is the
recommended route for working with `redisvl` in production-like settings.


```python
schema
```




    {'index': {'name': 'user_simple', 'prefix': 'user_simple_docs'},
     'fields': [{'name': 'user', 'type': 'tag'},
      {'name': 'credit_score', 'type': 'tag'},
      {'name': 'job', 'type': 'text'},
      {'name': 'age', 'type': 'numeric'},
      {'name': 'user_embedding',
       'type': 'vector',
       'attrs': {'dims': 3,
        'distance_metric': 'cosine',
        'algorithm': 'flat',
        'datatype': 'float32'}}]}




```python
from redisvl.index import AsyncSearchIndex
from redis.asyncio import Redis

client = Redis.from_url("redis://localhost:6379")
index = AsyncSearchIndex.from_dict(schema, redis_client=client)
```


```python
# execute the vector query async
results = await index.query(query)
result_print(results)
```


<table><tr><th>vector_distance</th><th>user</th><th>age</th><th>job</th><th>credit_score</th></tr><tr><td>0</td><td>john</td><td>1</td><td>engineer</td><td>high</td></tr><tr><td>0</td><td>mary</td><td>2</td><td>doctor</td><td>low</td></tr><tr><td>0.0566299557686</td><td>tyler</td><td>9</td><td>engineer</td><td>high</td></tr></table>


## Updating a schema
In some scenarios, it makes sense to update the index schema. With Redis and `redisvl`, this is easy because Redis can keep the underlying data in place while you change or make updates to the index configuration.

So for our scenario, let's imagine we want to reindex this data in 2 ways:
- by using a `Tag` type for `job` field instead of `Text`
- by using an `hnsw` vector index for the `user_embedding` field instead of a `flat` vector index


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
            "algorithm": "hnsw",
            "datatype": "float32"
        }
    }
])
```


```python
# Run the index update but keep underlying data in place
await index.create(overwrite=True, drop=False)
```

    11:01:30 redisvl.index.index INFO   Index already exists, overwriting.



```python
# Execute the vector query async
results = await index.query(query)
result_print(results)
```


<table><tr><th>vector_distance</th><th>user</th><th>age</th><th>job</th><th>credit_score</th></tr><tr><td>0</td><td>john</td><td>1</td><td>engineer</td><td>high</td></tr><tr><td>0</td><td>mary</td><td>2</td><td>doctor</td><td>low</td></tr><tr><td>0.0566299557686</td><td>tyler</td><td>9</td><td>engineer</td><td>high</td></tr></table>


## Check Index Stats
Use the `rvl` CLI to check the stats for the index:


```python
!rvl stats -i user_simple
```

    
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
    │ bytes_per_record_avg        │ 47.8        │
    │ doc_table_size_mb           │ 0.000423431 │
    │ inverted_sz_mb              │ 0.000911713 │
    │ key_table_size_mb           │ 0.000165939 │
    │ offset_bits_per_record_avg  │ nan         │
    │ offset_vectors_sz_mb        │ 0           │
    │ offsets_per_term_avg        │ 0           │
    │ records_per_doc_avg         │ 5           │
    │ sortable_values_size_mb     │ 0           │
    │ total_indexing_time         │ 6.529       │
    │ total_inverted_index_blocks │ 11          │
    │ vector_index_sz_mb          │ 0.235947    │
    ╰─────────────────────────────┴─────────────╯


## Cleanup

Below we will clean up after our work. First, you can flush all data from Redis associated with the index by
using the `.clear()` method. This will leave the secondary index in place for future insertions or updates.

But if you want to clean up everything, including the index, just use `.delete()`
which will by default remove the index AND the underlying data.


```python
# Clear all data from Redis associated with the index
await index.clear()
```




    4




```python
# Butm the index is still in place
await index.exists()
```




    True




```python
# Remove / delete the index in its entirety
await index.delete()
```
