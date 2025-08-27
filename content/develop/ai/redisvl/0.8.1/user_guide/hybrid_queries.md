---
linkTitle: Querying with RedisVL
title: Querying with RedisVL
weight: 02
url: '/develop/ai/redisvl/0.8.1/user_guide/hybrid_queries/'
---


In this notebook, we will explore more complex queries that can be performed with ``redisvl``

Before running this notebook, be sure to
1. Have installed ``redisvl`` and have that environment active for this notebook.
2. Have a running Redis instance with RediSearch > 2.4 running.


```python
import pickle
from jupyterutils import table_print, result_print

# load in the example data and printing utils
data = pickle.load(open("hybrid_example_data.pkl", "rb"))
table_print(data)
```


<table><tr><th>user</th><th>age</th><th>job</th><th>credit_score</th><th>office_location</th><th>user_embedding</th><th>last_updated</th></tr><tr><td>john</td><td>18</td><td>engineer</td><td>high</td><td>-122.4194,37.7749</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?'</td><td>1741627789</td></tr><tr><td>derrick</td><td>14</td><td>doctor</td><td>low</td><td>-122.4194,37.7749</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?'</td><td>1741627789</td></tr><tr><td>nancy</td><td>94</td><td>doctor</td><td>high</td><td>-122.4194,37.7749</td><td>b'333?\xcd\xcc\xcc=\x00\x00\x00?'</td><td>1710696589</td></tr><tr><td>tyler</td><td>100</td><td>engineer</td><td>high</td><td>-122.0839,37.3861</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc>\x00\x00\x00?'</td><td>1742232589</td></tr><tr><td>tim</td><td>12</td><td>dermatologist</td><td>high</td><td>-122.0839,37.3861</td><td>b'\xcd\xcc\xcc>\xcd\xcc\xcc>\x00\x00\x00?'</td><td>1739644189</td></tr><tr><td>taimur</td><td>15</td><td>CEO</td><td>low</td><td>-122.0839,37.3861</td><td>b'\x9a\x99\x19?\xcd\xcc\xcc=\x00\x00\x00?'</td><td>1742232589</td></tr><tr><td>joe</td><td>35</td><td>dentist</td><td>medium</td><td>-122.0839,37.3861</td><td>b'fff?fff?\xcd\xcc\xcc='</td><td>1742232589</td></tr></table>



```python
schema = {
    "index": {
        "name": "user_queries",
        "prefix": "user_queries_docs",
        "storage_type": "hash", # default setting -- HASH
    },
    "fields": [
        {"name": "user", "type": "tag"},
        {"name": "credit_score", "type": "tag"},
        {"name": "job", "type": "text"},
        {"name": "age", "type": "numeric"},
        {"name": "last_updated", "type": "numeric"},
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
from redisvl.index import SearchIndex

# construct a search index from the schema
index = SearchIndex.from_dict(schema, redis_url="redis://localhost:6379")

# create the index (no data yet)
index.create(overwrite=True)
```


```python
# use the CLI to see the created index
!rvl index listall
```

    13:00:56 [RedisVL] INFO   Indices:
    13:00:56 [RedisVL] INFO   1. user_queries



```python
# load data to redis
keys = index.load(data)
```


```python
index.info()['num_docs']
```




    7



## Hybrid Queries

Hybrid queries are queries that combine multiple types of filters. For example, you may want to search for a user that is a certain age, has a certain job, and is within a certain distance of a location. This is a hybrid query that combines numeric, tag, and geographic filters.

### Tag Filters

Tag filters are filters that are applied to tag fields. These are fields that are not tokenized and are used to store a single categorical value.


```python
from redisvl.query import VectorQuery
from redisvl.query.filter import Tag

t = Tag("credit_score") == "high"

v = VectorQuery(
    vector=[0.1, 0.1, 0.5],
    vector_field_name="user_embedding",
    return_fields=["user", "credit_score", "age", "job", "office_location", "last_updated"],
    filter_expression=t
)

results = index.query(v)
result_print(results)
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr></table>



```python
# negation
t = Tag("credit_score") != "high"

v.set_filter(t)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>



```python
# use multiple tags as a list
t = Tag("credit_score") == ["high", "medium"]

v.set_filter(t)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>



```python
# use multiple tags as a set (to enforce uniqueness)
t = Tag("credit_score") == set(["high", "high", "medium"])

v.set_filter(t)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>


What about scenarios where you might want to dynamically generate a list of tags? Have no fear. RedisVL allows you to do this gracefully without having to check for the **empty case**. The **empty case** is when you attempt to run a Tag filter on a field with no defined values to match:

`Tag("credit_score") == []`

An empty filter like the one above will yield a `*` Redis query filter which implies the base case -- there is no filter here to use.


```python
# gracefully fallback to "*" filter if empty case
empty_case = Tag("credit_score") == []

v.set_filter(empty_case)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>


### Numeric Filters

Numeric filters are filters that are applied to numeric fields and can be used to isolate a range of values for a given field.


```python
from redisvl.query.filter import Num

numeric_filter = Num("age").between(15, 35)

v.set_filter(numeric_filter)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>



```python
# exact match query
numeric_filter = Num("age") == 14

v.set_filter(numeric_filter)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr></table>



```python
# negation
numeric_filter = Num("age") != 14

v.set_filter(numeric_filter)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>


### Timestamp Filters

In redis all times are stored as an epoch time numeric however, this class allows you to filter with python datetime for ease of use. 


```python
from redisvl.query.filter import Timestamp
from datetime import datetime

dt = datetime(2025, 3, 16, 13, 45, 39, 132589)
print(f'Epoch comparison: {dt.timestamp()}')

timestamp_filter = Timestamp("last_updated") > dt

v.set_filter(timestamp_filter)
result_print(index.query(v))
```

    Epoch comparison: 1742147139.132589



<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>



```python
from redisvl.query.filter import Timestamp
from datetime import datetime

dt = datetime(2025, 3, 16, 13, 45, 39, 132589)

print(f'Epoch comparison: {dt.timestamp()}')

timestamp_filter = Timestamp("last_updated") < dt

v.set_filter(timestamp_filter)
result_print(index.query(v))
```

    Epoch comparison: 1742147139.132589



<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr></table>



```python
from redisvl.query.filter import Timestamp
from datetime import datetime

dt_1 = datetime(2025, 1, 14, 13, 45, 39, 132589)
dt_2 = datetime(2025, 3, 16, 13, 45, 39, 132589)

print(f'Epoch between: {dt_1.timestamp()} - {dt_2.timestamp()}')

timestamp_filter = Timestamp("last_updated").between(dt_1, dt_2)

v.set_filter(timestamp_filter)
result_print(index.query(v))
```

    Epoch between: 1736880339.132589 - 1742147139.132589



<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr></table>


### Text Filters

Text filters are filters that are applied to text fields. These filters are applied to the entire text field. For example, if you have a text field that contains the text "The quick brown fox jumps over the lazy dog", a text filter of "quick" will match this text field.


```python
from redisvl.query.filter import Text

# exact match filter -- document must contain the exact word doctor
text_filter = Text("job") == "doctor"

v.set_filter(text_filter)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr></table>



```python
# negation -- document must not contain the exact word doctor
negate_text_filter = Text("job") != "doctor"

v.set_filter(negate_text_filter)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>



```python
# wildcard match filter
wildcard_filter = Text("job") % "doct*"

v.set_filter(wildcard_filter)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr></table>



```python
# fuzzy match filter
fuzzy_match = Text("job") % "%%engine%%"

v.set_filter(fuzzy_match)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>



```python
# conditional -- match documents with job field containing engineer OR doctor
conditional = Text("job") % "engineer|doctor"

v.set_filter(conditional)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr></table>



```python
# gracefully fallback to "*" filter if empty case
empty_case = Text("job") % ""

v.set_filter(empty_case)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>


Use raw query strings as input. Below we use the `~` flag to indicate that the full text query is optional. We also choose the BM25 scorer and return document scores along with the result.


```python
v.set_filter("(~(@job:engineer))")
v.scorer("BM25").with_scores()

index.query(v)
```




    [{'id': 'user_queries_docs:01JY4J5VC91SV4C91BM4D0FCV2',
      'score': 0.9090908893868948,
      'vector_distance': '0',
      'user': 'john',
      'credit_score': 'high',
      'age': '18',
      'job': 'engineer',
      'office_location': '-122.4194,37.7749',
      'last_updated': '1741627789'},
     {'id': 'user_queries_docs:01JY4J5VC90DRSFJ0WKXXN49JT',
      'score': 0.0,
      'vector_distance': '0',
      'user': 'derrick',
      'credit_score': 'low',
      'age': '14',
      'job': 'doctor',
      'office_location': '-122.4194,37.7749',
      'last_updated': '1741627789'},
     {'id': 'user_queries_docs:01JY4J5VC9QTPMCD60YP40Q6PW',
      'score': 0.9090908893868948,
      'vector_distance': '0.109129190445',
      'user': 'tyler',
      'credit_score': 'high',
      'age': '100',
      'job': 'engineer',
      'office_location': '-122.0839,37.3861',
      'last_updated': '1742232589'},
     {'id': 'user_queries_docs:01JY4J5VC9FW7QQNJKDJ4Z7PRG',
      'score': 0.0,
      'vector_distance': '0.158808946609',
      'user': 'tim',
      'credit_score': 'high',
      'age': '12',
      'job': 'dermatologist',
      'office_location': '-122.0839,37.3861',
      'last_updated': '1739644189'},
     {'id': 'user_queries_docs:01JY4J5VC940DJ9F47EJ6KN2MH',
      'score': 0.0,
      'vector_distance': '0.217882037163',
      'user': 'taimur',
      'credit_score': 'low',
      'age': '15',
      'job': 'CEO',
      'office_location': '-122.0839,37.3861',
      'last_updated': '1742232589'},
     {'id': 'user_queries_docs:01JY4J5VC9D53KQD7ZTRP14KCE',
      'score': 0.0,
      'vector_distance': '0.266666650772',
      'user': 'nancy',
      'credit_score': 'high',
      'age': '94',
      'job': 'doctor',
      'office_location': '-122.4194,37.7749',
      'last_updated': '1710696589'},
     {'id': 'user_queries_docs:01JY4J5VC9806MD90GBZNP0MNY',
      'score': 0.0,
      'vector_distance': '0.653301358223',
      'user': 'joe',
      'credit_score': 'medium',
      'age': '35',
      'job': 'dentist',
      'office_location': '-122.0839,37.3861',
      'last_updated': '1742232589'}]



### Geographic Filters

Geographic filters are filters that are applied to geographic fields. These filters are used to find results that are within a certain distance of a given point. The distance is specified in kilometers, miles, meters, or feet. A radius can also be specified to find results within a certain radius of a given point.


```python
from redisvl.query.filter import Geo, GeoRadius

# within 10 km of San Francisco office
geo_filter = Geo("office_location") == GeoRadius(-122.4194, 37.7749, 10, "km")

v.set_filter(geo_filter)
result_print(index.query(v))
```


<table><tr><th>score</th><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0.4545454446934474</td><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.4545454446934474</td><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.4545454446934474</td><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr></table>



```python
# within 100 km Radius of San Francisco office
geo_filter = Geo("office_location") == GeoRadius(-122.4194, 37.7749, 100, "km")

v.set_filter(geo_filter)
result_print(index.query(v))
```


<table><tr><th>score</th><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0.4545454446934474</td><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.4545454446934474</td><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td><td>1741627789</td></tr><tr><td>0.4545454446934474</td><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.4545454446934474</td><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.4545454446934474</td><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.4545454446934474</td><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td><td>1710696589</td></tr><tr><td>0.4545454446934474</td><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>



```python
# not within 10 km Radius of San Francisco office
geo_filter = Geo("office_location") != GeoRadius(-122.4194, 37.7749, 10, "km")

v.set_filter(geo_filter)
result_print(index.query(v))
```


<table><tr><th>score</th><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th><th>last_updated</th></tr><tr><td>0.0</td><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.0</td><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td><td>1739644189</td></tr><tr><td>0.0</td><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td><td>1742232589</td></tr><tr><td>0.0</td><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td><td>1742232589</td></tr></table>


## Combining Filters

In this example, we will combine a numeric filter with a tag filter. We will search for users that are between the ages of 20 and 30 and have a job of "engineer".

### Intersection ("and")


```python
t = Tag("credit_score") == "high"
low = Num("age") >= 18
high = Num("age") <= 100
ts = Timestamp("last_updated") > datetime(2025, 3, 16, 13, 45, 39, 132589)

combined = t & low & high & ts

v = VectorQuery([0.1, 0.1, 0.5],
                "user_embedding",
                return_fields=["user", "credit_score", "age", "job",  "office_location"],
                filter_expression=combined)


result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr></table>


### Union ("or")

The union of two queries is the set of all results that are returned by either of the two queries. The union of two queries is performed using the `|` operator.


```python
low = Num("age") < 18
high = Num("age") > 93

combined = low | high

v.set_filter(combined)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>


### Dynamic Combination

There are often situations where you may or may not want to use a filter in a
given query. As shown above, filters will except the ``None`` type and revert
to a wildcard filter essentially returning all results.

The same goes for filter combinations which enables rapid reuse of filters in
requests with different parameters as shown below. This removes the need for
a number of "if-then" conditionals to test for the empty case.




```python
def make_filter(age=None, credit=None, job=None):
    flexible_filter = (
        (Num("age") > age) &
        (Tag("credit_score") == credit) &
        (Text("job") % job)
    )
    return flexible_filter

```


```python
# all parameters
combined = make_filter(age=18, credit="high", job="engineer")
v.set_filter(combined)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr></table>



```python
# just age and credit_score
combined = make_filter(age=18, credit="high")
v.set_filter(combined)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>



```python
# just age
combined = make_filter(age=18)
v.set_filter(combined)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>



```python
# no filters
combined = make_filter()
v.set_filter(combined)
result_print(index.query(v))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>


## Non-vector Queries

In some cases, you may not want to run a vector query, but just use a ``FilterExpression`` similar to a SQL query. The ``FilterQuery`` class enable this functionality. It is similar to the ``VectorQuery`` class but solely takes a ``FilterExpression``.


```python
from redisvl.query import FilterQuery

has_low_credit = Tag("credit_score") == "low"

filter_query = FilterQuery(
    return_fields=["user", "credit_score", "age", "job", "location"],
    filter_expression=has_low_credit
)

results = index.query(filter_query)

result_print(results)
```


<table><tr><th>user</th><th>credit_score</th><th>age</th><th>job</th></tr><tr><td>derrick</td><td>low</td><td>14</td><td>doctor</td></tr><tr><td>taimur</td><td>low</td><td>15</td><td>CEO</td></tr></table>


## Count Queries

In some cases, you may need to use a ``FilterExpression`` to execute a ``CountQuery`` that simply returns the count of the number of entities in the pertaining set. It is similar to the ``FilterQuery`` class but does not return the values of the underlying data.


```python
from redisvl.query import CountQuery

has_low_credit = Tag("credit_score") == "low"

filter_query = CountQuery(filter_expression=has_low_credit)

count = index.query(filter_query)

print(f"{count} records match the filter expression {str(has_low_credit)} for the given index.")
```

    2 records match the filter expression @credit_score:{low} for the given index.


## Range Queries

Range Queries are a useful method to perform a vector search where only results within a vector ``distance_threshold`` are returned. This enables the user to find all records within their dataset that are similar to a query vector where "similar" is defined by a quantitative value.


```python
from redisvl.query import RangeQuery

range_query = RangeQuery(
    vector=[0.1, 0.1, 0.5],
    vector_field_name="user_embedding",
    return_fields=["user", "credit_score", "age", "job", "location"],
    distance_threshold=0.2
)

# same as the vector query or filter query
results = index.query(range_query)

result_print(results)
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td></tr><tr><td>0.158808946609</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td></tr></table>


We can also change the distance threshold of the query object between uses if we like. Here we will set ``distance_threshold==0.1``. This means that the query object will return all matches that are within 0.1 of the query object. This is a small distance, so we expect to get fewer matches than before.


```python
range_query.set_distance_threshold(0.1)

result_print(index.query(range_query))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td></tr></table>


Range queries can also be used with filters like any other query type. The following limits the results to only include records with a ``job`` of ``engineer`` while also being within the vector range (aka distance).


```python
is_engineer = Text("job") == "engineer"

range_query.set_filter(is_engineer)

result_print(index.query(range_query))
```


<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td></tr></table>


## Advanced Query Modifiers

See all modifier options available on the query API docs: https://redis.io/docs/latest/develop/ai/redisvl/api/query


```python
# Sort by a different field and change dialect
v = VectorQuery(
    vector=[0.1, 0.1, 0.5],
    vector_field_name="user_embedding",
    return_fields=["user", "credit_score", "age", "job",  "office_location"],
    num_results=5,
    filter_expression=is_engineer
).sort_by("age", asc=False).dialect(3)

result = index.query(v)
result_print(result)
```


<table><tr><th>vector_distance</th><th>age</th><th>user</th><th>credit_score</th><th>job</th><th>office_location</th></tr><tr><td>0.109129190445</td><td>100</td><td>tyler</td><td>high</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0</td><td>18</td><td>john</td><td>high</td><td>engineer</td><td>-122.4194,37.7749</td></tr></table>


### Raw Redis Query String

Sometimes it's helpful to convert these classes into their raw Redis query strings.


```python
# check out the complex query from above
str(v)
```




    '@job:("engineer")=>[KNN 5 @user_embedding $vector AS vector_distance] RETURN 6 user credit_score age job office_location vector_distance SORTBY age DESC DIALECT 3 LIMIT 0 5'




```python
t = Tag("credit_score") == "high"

str(t)
```




    '@credit_score:{high}'




```python
t = Tag("credit_score") == "high"
low = Num("age") >= 18
high = Num("age") <= 100

combined = t & low & high

str(combined)
```




    '((@credit_score:{high} @age:[18 +inf]) @age:[-inf 100])'



The RedisVL `SearchIndex` class exposes a `search()` method which is a simple wrapper around the `FT.SEARCH` API.
Provide any valid Redis query string.


```python
results = index.search(str(t))
for r in results.docs:
    print(r.__dict__)
```

    {'id': 'user_queries_docs:01JY4J5VC91SV4C91BM4D0FCV2', 'payload': None, 'user': 'john', 'age': '18', 'job': 'engineer', 'credit_score': 'high', 'office_location': '-122.4194,37.7749', 'user_embedding': '==\x00\x00\x00?', 'last_updated': '1741627789'}
    {'id': 'user_queries_docs:01JY4J5VC9D53KQD7ZTRP14KCE', 'payload': None, 'user': 'nancy', 'age': '94', 'job': 'doctor', 'credit_score': 'high', 'office_location': '-122.4194,37.7749', 'user_embedding': '333?=\x00\x00\x00?', 'last_updated': '1710696589'}
    {'id': 'user_queries_docs:01JY4J5VC9QTPMCD60YP40Q6PW', 'payload': None, 'user': 'tyler', 'age': '100', 'job': 'engineer', 'credit_score': 'high', 'office_location': '-122.0839,37.3861', 'user_embedding': '=>\x00\x00\x00?', 'last_updated': '1742232589'}
    {'id': 'user_queries_docs:01JY4J5VC9FW7QQNJKDJ4Z7PRG', 'payload': None, 'user': 'tim', 'age': '12', 'job': 'dermatologist', 'credit_score': 'high', 'office_location': '-122.0839,37.3861', 'user_embedding': '>>\x00\x00\x00?', 'last_updated': '1739644189'}



```python
# Cleanup
index.delete()
```
