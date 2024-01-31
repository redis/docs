---
linkTitle: JSON vs. Hash storage
title: JSON vs. Hash storage
type: integration
description: Storing JSON and hashes with RedisVL
weight: 6
---

Out of the box, Redis provides a [variety of data structures](https://redis.com/redis-enterprise/data-structures/) that can adapt to your domain specific applications and use cases.
In this notebook, we will demonstrate how to use RedisVL with both [Hash](https://redis.io/docs/data-types/hashes/) and [JSON](https://redis.io/docs/data-types/json/) data.

{{< note >}}
This document is a converted form of [this Jupyter notebook](https://github.com/RedisVentures/redisvl/blob/main/docs/user_guide/hash_vs_json_05.ipynb).
{{< /note >}}

Before beginning, be sure of the following:

1. You have installed `redisvl` and have that environment activated.
1. You have a running Redis instance with the search and query capability.

```python
# import necessary modules
import pickle

from redisvl.utils.utils import buffer_to_array
from jupyterutils import result_print, table_print
from redisvl.index import SearchIndex


# load in the example data and printing utils
data = pickle.load(open("hybrid_example_data.pkl", "rb"))
```


```python
table_print(data)
```


<table><tr><th>user</th><th>age</th><th>job</th><th>credit_score</th><th>office_location</th><th>user_embedding</th></tr><tr><td>john</td><td>18</td><td>engineer</td><td>high</td><td>-122.4194,37.7749</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?'</td></tr><tr><td>derrick</td><td>14</td><td>doctor</td><td>low</td><td>-122.4194,37.7749</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?'</td></tr><tr><td>nancy</td><td>94</td><td>doctor</td><td>high</td><td>-122.4194,37.7749</td><td>b'333?\xcd\xcc\xcc=\x00\x00\x00?'</td></tr><tr><td>tyler</td><td>100</td><td>engineer</td><td>high</td><td>-122.0839,37.3861</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc>\x00\x00\x00?'</td></tr><tr><td>tim</td><td>12</td><td>dermatologist</td><td>high</td><td>-122.0839,37.3861</td><td>b'\xcd\xcc\xcc>\xcd\xcc\xcc>\x00\x00\x00?'</td></tr><tr><td>taimur</td><td>15</td><td>CEO</td><td>low</td><td>-122.0839,37.3861</td><td>b'\x9a\x99\x19?\xcd\xcc\xcc=\x00\x00\x00?'</td></tr><tr><td>joe</td><td>35</td><td>dentist</td><td>medium</td><td>-122.0839,37.3861</td><td>b'fff?fff?\xcd\xcc\xcc='</td></tr></table>


## Hash or JSON - how to choose?
Both storage options offer a variety of features and tradeoffs. Below we will work through a dummy dataset to learn when and how to use both.

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

> Hashes are typically the default recommendation.


```python
# define the hash index schema
hash_schema = {
    "index": {
        "name": "user-hashes",
        "storage_type": "hash", # default setting
        "prefix": "hash",
    },
    "fields": {
        "tag": [{"name": "credit_score"}, {"name": "user"}],
        "text": [{"name": "job"}],
        "numeric": [{"name": "age"}],
        "geo": [{"name": "office_location"}],
        "vector": [{
                "name": "user_embedding",
                "dims": 3,
                "distance_metric": "cosine",
                "algorithm": "flat",
                "datatype": "float32"}
        ]
    },
}
```


```python
# construct a search index from the hash schema
hindex = SearchIndex.from_dict(hash_schema)

# connect to local redis instance
hindex.connect("redis://localhost:6379")

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
     'user_embedding': b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?'}




```python
# load hash data
keys = hindex.load(data)
```


```python
$ rvl stats -i user-hashes
```

    
    Statistics:
    ╭─────────────────────────────┬─────────────╮
    │ Stat Key                    │ Value       │
    ├─────────────────────────────┼─────────────┤
    │ num_docs                    │ 7           │
    │ num_terms                   │ 6           │
    │ max_doc_id                  │ 7           │
    │ num_records                 │ 44          │
    │ percent_indexed             │ 1           │
    │ hash_indexing_failures      │ 0           │
    │ number_of_uses              │ 1           │
    │ bytes_per_record_avg        │ 3.40909     │
    │ doc_table_size_mb           │ 0.000700951 │
    │ inverted_sz_mb              │ 0.000143051 │
    │ key_table_size_mb           │ 0.000248909 │
    │ offset_bits_per_record_avg  │ 8           │
    │ offset_vectors_sz_mb        │ 8.58307e-06 │
    │ offsets_per_term_avg        │ 0.204545    │
    │ records_per_doc_avg         │ 6.28571     │
    │ sortable_values_size_mb     │ 0           │
    │ total_indexing_time         │ 0.121       │
    │ total_inverted_index_blocks │ 18          │
    │ vector_index_sz_mb          │ 0.0200424   │
    ╰─────────────────────────────┴─────────────╯


#### Performing Queries
Once our index is created and data is loaded into the right format, we can run queries against the index with RedisVL:


```python
from redisvl.query import VectorQuery
from redisvl.query.filter import Tag, Text, Num

t = (Tag("credit_score") == "high") & (Text("job") % "enginee*") & (Num("age") > 17)

v = VectorQuery([0.1, 0.1, 0.5],
                "user_embedding",
                return_fields=["user", "credit_score", "age", "job", "office_location"],
                filter_expression=t)


results = hindex.query(v)
result_print(results)

```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr></table>


### Working with JSON
Redis also supports native **JSON** objects. These can be multi-level (nested) objects, with full JSONPath support for updating/retrieving sub elements:

```python
{
    "name": "bike",
    "metadata": {
        "model": "Deimos",
        "brand": "Ergonom",
        "type": "Enduro bikes",
        "price": 4972,
    }
}
```

JSON is best suited for use cases with the following characteristics:
- Ease of use and data model flexibility are top concerns
- Application data is already native JSON
- Replacing another document storage/db solution

#### Full JSON Path support
Because RedisJSON enables full path support, when creating an index schema, elements need to be indexed and selected by their path with the `name` param and aliased using the `as_name` param as shown below.


```python
# define the json index schema
json_schema = {
    "index": {
        "name": "user-json",
        "storage_type": "json", # updated storage_type option
        "prefix": "json",
    },
    "fields": {
        "tag": [{"name": "$.credit_score", "as_name": "credit_score"}, {"name": "$.user", "as_name": "user"}],
        "text": [{"name": "$.job", "as_name": "job"}],
        "numeric": [{"name": "$.age", "as_name": "age"}],
        "geo": [{"name": "$.office_location", "as_name": "office_location"}],
        "vector": [{
                "name": "$.user_embedding",
                "as_name": "user_embedding",
                "dims": 3,
                "distance_metric": "cosine",
                "algorithm": "flat",
                "datatype": "float32"}
        ]
    },
}
```


```python
# construct a search index from the json schema
jindex = SearchIndex.from_dict(json_schema)

# connect to local redis instance
jindex.connect("redis://localhost:6379")

# create the index (no data yet)
jindex.create(overwrite=True)
```


```python
# note the multiple indices in the same database
$ rvl index listall
```

    [32m18:29:36[0m [34m[RedisVL][0m [1;30mINFO[0m   Indices:
    [32m18:29:36[0m [34m[RedisVL][0m [1;30mINFO[0m   1. user-hashes
    [32m18:29:36[0m [34m[RedisVL][0m [1;30mINFO[0m   2. user-json


#### Vectors as float arrays
Vectorized data stored in JSON must be stored as a pure array (python list) of floats. We will modify our sample data to account for this below:


```python
import numpy as np

json_data = data.copy()

for d in json_data:
    d['user_embedding'] = buffer_to_array(d['user_embedding'], dtype=np.float32)
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
     'user_embedding': [0.10000000149011612, 0.10000000149011612, 0.5]}




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
hindex.delete()
jindex.delete()
```
