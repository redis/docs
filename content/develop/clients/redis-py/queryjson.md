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
description: Learn how to use the Redis query engine with JSON
linkTitle: JSON query example
title: Example - Index and query JSON documents
weight: 2
---

This example shows how to create a
[search index]({{< relref "/develop/interact/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) data and
run queries against the index.

Make sure that you have Redis Stack and `redis-py` installed.

Import dependencies:

```python
import redis
from redis.commands.json.path import Path
import redis.commands.search.aggregation as aggregations
import redis.commands.search.reducers as reducers
from redis.commands.search.field import TextField, NumericField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import NumericFilter, Query
```

Connect to your Redis database.

```python
r = redis.Redis(host='localhost', port=6379)
```

Let's create some test data to add to your database.

```python
user1 = {
    "name": "Paul John",
    "email": "paul.john@example.com",
    "age": 42,
    "city": "London"
}
user2 = {
    "name": "Eden Zamir",
    "email": "eden.zamir@example.com",
    "age": 29,
    "city": "Tel Aviv"
}
user3 = {
    "name": "Paul Zamir",
    "email": "paul.zamir@example.com",
    "age": 35,
    "city": "Tel Aviv"
}
```

Define indexed fields and their data types using `schema`. Use JSON path expressions to map specific JSON elements to the schema fields.

```python
schema = (
    TextField("$.name", as_name="name"), 
    TagField("$.city", as_name="city"), 
    NumericField("$.age", as_name="age")
)
```

Create an index. In this example, all JSON documents with the key prefix `user:` will be indexed. For more information, see [Query syntax]({{< relref "/develop/interact/search-and-query/query/" >}}). 

```python
rs = r.ft("idx:users")
rs.create_index(
    schema,
    definition=IndexDefinition(
        prefix=["user:"], index_type=IndexType.JSON
    )
)
# b'OK'
```

Use [`JSON.SET`]({{< baseurl >}}/commands/json.set/) to set each user value at the specified path.

```python
r.json().set("user:1", Path.root_path(), user1)
r.json().set("user:2", Path.root_path(), user2)
r.json().set("user:3", Path.root_path(), user3)
```

Let's find user `Paul` and filter the results by age.

```python
res = rs.search(
    Query("Paul @age:[30 40]")
)
# Result{1 total, docs: [Document {'id': 'user:3', 'payload': None, 'json': '{"name":"Paul Zamir","email":"paul.zamir@example.com","age":35,"city":"Tel Aviv"}'}]}
```

Query using JSON Path expressions.

```python
rs.search(
    Query("Paul").return_field("$.city", as_field="city")
).docs
# [Document {'id': 'user:1', 'payload': None, 'city': 'London'}, Document {'id': 'user:3', 'payload': None, 'city': 'Tel Aviv'}]
```

Aggregate your results using [`FT.AGGREGATE`]({{< baseurl >}}/commands/ft.aggregate/).

```python
req = aggregations.AggregateRequest("*").group_by('@city', reducers.count().alias('count'))
print(rs.aggregate(req).rows)
# [[b'city', b'Tel Aviv', b'count', b'2'], [b'city', b'London', b'count', b'1']]
```