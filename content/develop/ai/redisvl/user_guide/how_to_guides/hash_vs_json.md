---
linkTitle: Choose a storage type
title: Choose a Storage Type
aliases:
- /integrate/redisvl/user_guide/how_to_guides/05_hash_vs_json
weight: 05
---


Redis provides a [variety of data structures](https://redis.com/redis-enterprise/data-structures/) that can adapt to your domain-specific applications. This guide demonstrates how to use RedisVL with both [Hash](https://redis.io/docs/latest/develop/data-types/#hashes) and [JSON](https://redis.io/docs/latest/develop/data-types/json/) storage types, helping you choose the right approach for your use case.

## Prerequisites

Before you begin, ensure you have:
- Installed RedisVL: `pip install redisvl`
- A running Redis instance ([Redis 8+](https://redis.io/downloads/) or [Redis Cloud](https://redis.io/cloud))

## What You'll Learn

By the end of this guide, you will be able to:
- Understand the differences between Hash and JSON storage types
- Define schemas for both Hash and JSON storage
- Load and query data using each storage type
- Access nested JSON fields using JSONPath expressions
- Choose the right storage type for your application


```python
# import necessary modules
import pickle

from redisvl.redis.utils import buffer_to_array
from redisvl.index import SearchIndex


# load in the example data and printing utils
data = pickle.load(open("hybrid_example_data.pkl", "rb"))
```


```python
from jupyterutils import result_print, table_print

table_print(data)
```


<table><tr><th>user</th><th>age</th><th>job</th><th>credit_score</th><th>office_location</th><th>user_embedding</th><th>last_updated</th></tr><tr><td>john</td><td>18</td><td>engineer</td><td>high</td><td>-122.4194,37.7749</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?'</td><td>1741627789</td></tr><tr><td>derrick</td><td>14</td><td>doctor</td><td>low</td><td>-122.4194,37.7749</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?'</td><td>1741627789</td></tr><tr><td>nancy</td><td>94</td><td>doctor</td><td>high</td><td>-122.4194,37.7749</td><td>b'333?\xcd\xcc\xcc=\x00\x00\x00?'</td><td>1710696589</td></tr><tr><td>tyler</td><td>100</td><td>engineer</td><td>high</td><td>-122.0839,37.3861</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc>\x00\x00\x00?'</td><td>1742232589</td></tr><tr><td>tim</td><td>12</td><td>dermatologist</td><td>high</td><td>-122.0839,37.3861</td><td>b'\xcd\xcc\xcc>\xcd\xcc\xcc>\x00\x00\x00?'</td><td>1739644189</td></tr><tr><td>taimur</td><td>15</td><td>CEO</td><td>low</td><td>-122.0839,37.3861</td><td>b'\x9a\x99\x19?\xcd\xcc\xcc=\x00\x00\x00?'</td><td>1742232589</td></tr><tr><td>joe</td><td>35</td><td>dentist</td><td>medium</td><td>-122.0839,37.3861</td><td>b'fff?fff?\xcd\xcc\xcc='</td><td>1742232589</td></tr></table>


## Hash or JSON: How to Choose
Both storage options offer different features and tradeoffs. This section walks through a sample dataset to illustrate when and how to use each option.

### Working with Hashes
Hashes in Redis are simple collections of field-value pairs. Think of it like a mutable single-level dictionary contains multiple "rows":


```python
{
    "model": "Deimos",
    "brand": "Ergonom",
    "type": "Enduro bikes",
    "price": 4972,
}
```

Hashes are best suited for use cases with the following characteristics:
- Performance (speed) and storage space (memory consumption) are top concerns
- Data can be easily normalized and modeled as a single-level dict

Hashes are typically the default recommendation.


```python
# define the hash index schema
hash_schema = {
    "index": {
        "name": "user-hash",
        "prefix": "user-hash-docs",
        "storage_type": "hash", # default setting -- HASH
    },
    "fields": [
        {"name": "user", "type": "tag"},
        {"name": "credit_score", "type": "tag"},
        {"name": "job", "type": "text"},
        {"name": "age", "type": "numeric"},
        {"name": "office_location", "type": "geo"},
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
    ],
}
```


```python
# construct a search index from the hash schema
hindex = SearchIndex.from_dict(hash_schema, redis_url="redis://localhost:6379")

# create the index (no data yet)
hindex.create(overwrite=True)
```


```python
# show the underlying storage type
hindex.storage_type
```




    <StorageType.HASH: 'hash'>



#### Vectors as byte strings
One nuance when working with Hashes in Redis, is that all vectorized data must be passed as a byte string (for efficient storage, indexing, and processing). An example of that can be seen below:


```python
# show a single entry from the data that will be loaded
data[0]
```




    {'user': 'john',
     'age': 18,
     'job': 'engineer',
     'credit_score': 'high',
     'office_location': '-122.4194,37.7749',
     'user_embedding': b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?',
     'last_updated': 1741627789}




```python
# load hash data
keys = hindex.load(data)
```


```python
!rvl stats -i user-hash
```

    
    Statistics:
    ╭─────────────────────────────┬────────────╮
    │ Stat Key                    │ Value      │
    ├─────────────────────────────┼────────────┤
    │ num_docs                    │ 7          │
    │ num_terms                   │ 6          │
    │ max_doc_id                  │ 7          │
    │ num_records                 │ 44         │
    │ percent_indexed             │ 1          │
    │ hash_indexing_failures      │ 0          │
    │ number_of_uses              │ 1          │
    │ bytes_per_record_avg        │ 39.0681800 │
    │ doc_table_size_mb           │ 0.00837230 │
    │ inverted_sz_mb              │ 0.00163936 │
    │ key_table_size_mb           │ 3.50952148 │
    │ offset_bits_per_record_avg  │ 8          │
    │ offset_vectors_sz_mb        │ 8.58306884 │
    │ offsets_per_term_avg        │ 0.20454545 │
    │ records_per_doc_avg         │ 6.28571414 │
    │ sortable_values_size_mb     │ 0          │
    │ total_indexing_time         │ 0.55204    │
    │ total_inverted_index_blocks │ 18         │
    │ vector_index_sz_mb          │ 0.02820587 │
    ╰─────────────────────────────┴────────────╯


#### Performing Queries
Once our index is created and data is loaded into the right format, we can run queries against the index with RedisVL:


```python
from redisvl.query import VectorQuery
from redisvl.query.filter import Tag, Text, Num

t = (Tag("credit_score") == "high") & (Text("job") % "enginee*") & (Num("age") > 17)  # codespell:ignore enginee

v = VectorQuery(
    vector=[0.1, 0.1, 0.5],
    vector_field_name="user_embedding",
    return_fields=["user", "credit_score", "age", "job", "office_location"],
    filter_expression=t
)


results = hindex.query(v)
result_print(results)

```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr></table>



```python
# clean up
hindex.delete()

```

### Working with JSON

JSON is best suited for use cases with the following characteristics:
- Ease of use and data model flexibility are top concerns
- Application data is already native JSON
- Replacing another document storage/db solution


```python
# define the json index schema
json_schema = {
    "index": {
        "name": "user-json",
        "prefix": "user-json-docs",
        "storage_type": "json", # JSON storage type
    },
    "fields": [
        {"name": "user", "type": "tag"},
        {"name": "credit_score", "type": "tag"},
        {"name": "job", "type": "text"},
        {"name": "age", "type": "numeric"},
        {"name": "office_location", "type": "geo"},
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
    ],
}
```


```python
# construct a search index from the json schema
jindex = SearchIndex.from_dict(json_schema, redis_url="redis://localhost:6379")

# create the index (no data yet)
jindex.create(overwrite=True)
```

#### Vectors as Float Arrays
Vectorized data stored in JSON must be a pure array (Python list) of floats. The following code modifies the sample data to use this format:


```python
json_data = data.copy()

for d in json_data:
    d['user_embedding'] = buffer_to_array(d['user_embedding'], dtype='float32')
```


```python
# inspect a single JSON record
json_data[0]
```




    {'user': 'john',
     'age': 18,
     'job': 'engineer',
     'credit_score': 'high',
     'office_location': '-122.4194,37.7749',
     'user_embedding': [0.10000000149011612, 0.10000000149011612, 0.5],
     'last_updated': 1741627789}




```python
keys = jindex.load(json_data)
```


```python
# we can now run the exact same query as above
result_print(jindex.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr></table>


## Cleanup


```python
jindex.delete()
```

## Working with nested data in JSON

Redis also supports native **JSON** objects. These can be multi-level (nested) objects, with full JSONPath support for updating/retrieving sub elements:

```json
{
    "name": "Specialized Stump jumper",
    "metadata": {
        "model": "Stumpjumper",
        "brand": "Specialized",
        "type": "Enduro bikes",
        "price": 3000
    },
}
```

### Full JSON Path support
Because Redis enables full JSON path support, when creating an index schema, elements need to be indexed and selected by their path with the desired `name` AND `path` that points to where the data is located within the objects.

By default, RedisVL will assume the path as `$.{name}` if not provided in JSON fields schema. If nested provide path as `$.object.attribute`

### As an example:


```python
from redisvl.utils.vectorize import HFTextVectorizer

emb_model = HFTextVectorizer()

bike_data = [
    {
        "name": "Specialized Stump jumper",
        "metadata": {
            "model": "Stumpjumper",
            "brand": "Specialized",
            "type": "Enduro bikes",
            "price": 3000
        },
        "description": "The Specialized Stumpjumper is a versatile enduro bike that dominates both climbs and descents. Features a FACT 11m carbon fiber frame, FOX FLOAT suspension with 160mm travel, and SRAM X01 Eagle drivetrain. The asymmetric frame design and internal storage compartment make it a practical choice for all-day adventures."
    },
    {
        "name": "bike_2",
        "metadata": {
            "model": "Slash",
            "brand": "Trek",
            "type": "Enduro bikes",
            "price": 5000
        },
        "description": "Trek's Slash is built for aggressive enduro riding and racing. Featuring Trek's Alpha Aluminum frame with RE:aktiv suspension technology, 160mm travel, and Knock Block frame protection. Equipped with Bontrager components and a Shimano XT drivetrain, this bike excels on technical trails and enduro race courses."
    }
]

bike_data = [{**d, "bike_embedding": emb_model.embed(d["description"])} for d in bike_data]

bike_schema = {
    "index": {
        "name": "bike-json",
        "prefix": "bike-json",
        "storage_type": "json", # JSON storage type
    },
    "fields": [
        {
            "name": "model",
            "type": "tag",
            "path": "$.metadata.model" # note the '$'
        },
        {
            "name": "brand",
            "type": "tag",
            "path": "$.metadata.brand"
        },
        {
            "name": "price",
            "type": "numeric",
            "path": "$.metadata.price"
        },
        {
            "name": "bike_embedding",
            "type": "vector",
            "attrs": {
                "dims": len(bike_data[0]["bike_embedding"]),
                "distance_metric": "cosine",
                "algorithm": "flat",
                "datatype": "float32"
            }

        }
    ],
}
```


```python
# construct a search index from the json schema
bike_index = SearchIndex.from_dict(bike_schema, redis_url="redis://localhost:6379")

# create the index (no data yet)
bike_index.create(overwrite=True)
```


```python
bike_index.load(bike_data)
```




    ['bike-json:01KHKJ5WW3DJE0X6E85GG27V0X',
     'bike-json:01KHKJ5WW3DJE0X6E85GG27V0Y']




```python
from redisvl.query import VectorQuery

vec = emb_model.embed("I'd like a bike for aggressive riding")

v = VectorQuery(
    vector=vec,
    vector_field_name="bike_embedding",
    return_fields=[
        "brand",
        "name",
        "$.metadata.type"
    ]
)


results = bike_index.query(v)
```

**Note:** As shown in the example if you want to retrieve a field from json object that was not indexed you will also need to supply the full path as with `$.metadata.type`.


```python
results
```




    [{'id': 'bike-json:01KHKJ5WW3DJE0X6E85GG27V0Y',
      'vector_distance': '0.519988954067',
      'brand': 'Trek',
      '$.metadata.type': 'Enduro bikes'},
     {'id': 'bike-json:01KHKJ5WW3DJE0X6E85GG27V0X',
      'vector_distance': '0.65762424469',
      'brand': 'Specialized',
      '$.metadata.type': 'Enduro bikes'}]



## Next Steps

Now that you understand Hash vs JSON storage, explore these related guides:

- [Getting Started]({{< relref "getting_started" >}}) - Learn the basics of RedisVL indexes and queries
- [Query and Filter Data]({{< relref "complex_filtering" >}}) - Apply filters to narrow down search results
- [Use Advanced Query Types]({{< relref "advanced_queries" >}}) - Explore TextQuery, HybridQuery, and more


```python
# Cleanup
bike_index.delete()
```
