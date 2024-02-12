---
linkTitle: Query and filter
title: Query and filter
type: integration
description: Query and filter with RedisVL
weight: 3
---
In this document, you will explore more complex queries that can be performed with `redisvl`

{{< note >}}
This document is a converted form of [this Jupyter notebook](https://github.com/RedisVentures/redisvl/blob/main/docs/user_guide/hybrid_queries_02.ipynb).
{{< /note >}}

Before beginning, be sure of the following:

1. You have installed `redisvl` and have that environment activated.
1. You have a running Redis instance with the search and query capability.

The sample, binary data is in [this file on GitHub](https://github.com/RedisVentures/redisvl/blob/main/docs/user_guide/hybrid_example_data.pkl).

```python
import pickle
from jupyterutils import table_print, result_print

# load in the example data and printing utils
data = pickle.load(open("hybrid_example_data.pkl", "rb"))
table_print(data)
```

<table><tr><th>user</th><th>age</th><th>job</th><th>credit_score</th><th>office_location</th><th>user_embedding</th></tr><tr><td>john</td><td>18</td><td>engineer</td><td>high</td><td>-122.4194,37.7749</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?'</td></tr><tr><td>derrick</td><td>14</td><td>doctor</td><td>low</td><td>-122.4194,37.7749</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc=\x00\x00\x00?'</td></tr><tr><td>nancy</td><td>94</td><td>doctor</td><td>high</td><td>-122.4194,37.7749</td><td>b'333?\xcd\xcc\xcc=\x00\x00\x00?'</td></tr><tr><td>tyler</td><td>100</td><td>engineer</td><td>high</td><td>-122.0839,37.3861</td><td>b'\xcd\xcc\xcc=\xcd\xcc\xcc>\x00\x00\x00?'</td></tr><tr><td>tim</td><td>12</td><td>dermatologist</td><td>high</td><td>-122.0839,37.3861</td><td>b'\xcd\xcc\xcc>\xcd\xcc\xcc>\x00\x00\x00?'</td></tr><tr><td>taimur</td><td>15</td><td>CEO</td><td>low</td><td>-122.0839,37.3861</td><td>b'\x9a\x99\x19?\xcd\xcc\xcc=\x00\x00\x00?'</td></tr><tr><td>joe</td><td>35</td><td>dentist</td><td>medium</td><td>-122.0839,37.3861</td><td>b'fff?fff?\xcd\xcc\xcc='</td></tr></table>

```python
schema = {
    "index": {
        "name": "user_index",
        "prefix": "v1",
        "storage_type": "hash",
    },
    "fields": {
        "tag": [{"name": "credit_score"}],
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
from redisvl.index import SearchIndex

# construct a search index from the schema
index = SearchIndex.from_dict(schema)

# connect to local redis instance
index.connect("redis://localhost:6379")

# create the index (no data yet)
index.create(overwrite=True)
```

```python
# use the CLI to see the created index
$ rvl index listall

18:26:34 [RedisVL] INFO   Indices:
18:26:34 [RedisVL] INFO   1. user_index
```

```python
keys = index.load(data)
```

## Hybrid queries

Hybrid queries are queries that combine multiple types of filters. For example, you may want to search for a user that is a certain age, has a certain job, and is within a certain distance of a location. This is a hybrid query that combines numeric, tag, and geographic filters.

### Tag filters

Tag filters are filters that are applied to tag fields. These are fields that are not tokenized and are used to store a single categorical value.

```python
from redisvl.query import VectorQuery
from redisvl.query.filter import Tag

t = Tag("credit_score") == "high"

v = VectorQuery([0.1, 0.1, 0.5],
                "user_embedding",
                return_fields=["user", "credit_score", "age", "job", "office_location"],
                filter_expression=t)

results = index.query(v)
result_print(results)
```
<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>

```python
# negation
t = Tag("credit_score") != "high"

v.set_filter(t)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

```python
# use multiple tags as a list
t = Tag("credit_score") == ["high", "medium"]

v.set_filter(t)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

```python
# use multiple tags as a set (to enforce uniqueness)
t = Tag("credit_score") == set(["high", "high", "medium"])

v.set_filter(t)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

What about scenarios where you might want to dynamically generate a list of tags? Have no fear. RedisVL allows you to do this gracefully without having to check for the **empty case**. The **empty case** is when you attempt to run a Tag filter on a field with no defined values to match:

`Tag("credit_score") == []`

An empty filter like the one above will yield a `*` Redis query filter which implies the base case, that is, there is no filter.

```python
# gracefully fallback to "*" filter if empty case
empty_case = Tag("credit_score") == []

v.set_filter(empty_case)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

### Numeric filters

Numeric filters are filters that are applied to numeric fields and can be used to isolate a range of values for a given field.

```python
from redisvl.query.filter import Num

numeric_filter = Num("age") > 15

v.set_filter(numeric_filter)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

```python
# exact match query
numeric_filter = Num("age") == 14

v.set_filter(numeric_filter)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>

```python
# negation
numeric_filter = Num("age") != 14

v.set_filter(numeric_filter)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

### Text filters

Text filters are filters that are applied to text fields. These filters are applied to the entire text field. For example, if you have a text field that contains the text "The quick brown fox jumps over the lazy dog", a text filter of "quick" will match this text field.

```python
from redisvl.query.filter import Text

# exact match filter -- document must contain the exact word doctor
text_filter = Text("job") == "doctor"

v.set_filter(text_filter)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>

```python
# negation -- document must not contain the exact word doctor
negate_text_filter = Text("job") != "doctor"

v.set_filter(negate_text_filter)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

```python
# wildcard match filter
wildcard_filter = Text("job") % "doct*"

v.set_filter(wildcard_filter)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>


```python
# fuzzy match filter
fuzzy_match = Text("job") % "%%engine%%"

v.set_filter(fuzzy_match)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr></table>

```python
# conditional -- match documents with job field containing engineer OR doctor
conditional = Text("job") % "engineer|doctor"

v.set_filter(conditional)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>

```python
# gracefully fallback to "*" filter if empty case
empty_case = Text("job") % ""

v.set_filter(empty_case)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

### Geographic filters

Geographic filters are filters that are applied to geographic fields. These filters are used to find results that are within a certain distance of a given point. The distance is specified in kilometers, miles, meters, or feet. A radius can also be specified to find results within a certain radius of a given point.

```python
from redisvl.query.filter import Geo, GeoRadius

# within 10 km of San Francisco office
geo_filter = Geo("office_location") == GeoRadius(-122.4194, 37.7749, 10, "km")

v.set_filter(geo_filter)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>

```python
# within 100 km Radius of San Francisco office
geo_filter = Geo("office_location") == GeoRadius(-122.4194, 37.7749, 100, "km")

v.set_filter(geo_filter)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

```python
# not within 10 km Radius of San Francisco office
geo_filter = Geo("office_location") != GeoRadius(-122.4194, 37.7749, 10, "km")

v.set_filter(geo_filter)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

## Combining Filters

In this example, we will combine a numeric filter with a tag filter. We will search for users that are between the ages of 20 and 30 and have a job of "engineer".

### Intersection ("and")

```python
t = Tag("credit_score") == "high"
low = Num("age") >= 18
high = Num("age") <= 100

combined = t & low & high

v = VectorQuery([0.1, 0.1, 0.5],
                "user_embedding",
                return_fields=["user", "credit_score", "age", "job",  "office_location"],
                filter_expression=combined)


result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>

### Union ("or")

The union of two queries is the set of all results that are returned by either of the two queries. The union of two queries is performed using the `|` operator.

```python
low = Num("age") < 18
high = Num("age") > 93

combined = low | high

v.set_filter(combined)
result_print(index.query(v))
```

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr></table>

### Dynamic combination

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

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th><th>office_location</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr><tr><td>0.217882037163</td><td>taimur</td><td>low</td><td>15</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>nancy</td><td>high</td><td>94</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>joe</td><td>medium</td><td>35</td><td>dentist</td><td>-122.0839,37.3861</td></tr></table>

## Filter queries

In some cases, you may not want to run a vector query, but just use a ``FilterExpression`` similar to a SQL query. The ``FilterQuery`` class enable this functionality. It is similar to the ``VectorQuery`` class but soley takes a ``FilterExpression``.

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

## Count queries

In some cases, you may need to use a ``FilterExpression`` to execute a ``CountQuery`` that simply returns the count of the number of entities in the pertaining set. It is similar to the ``FilterQuery`` class but does not return the values of the underlying data.

```python
from redisvl.query import CountQuery

has_low_credit = Tag("credit_score") == "low"

filter_query = CountQuery(filter_expression=has_low_credit)

count = index.query(filter_query)

print(f"{count} records match the filter expression {str(has_low_credit)} for the given index.")

2 records match the filter expression @credit_score:{low} for the given index.
```

## Range queries

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

<table><tr><th>vector_distance</th><th>user</th><th>credit_score</th><th>age</th><th>job</th></tr><tr><td>0</td><td>john</td><td>high</td><td>18</td><td>engineer</td></tr><tr><td>0</td><td>derrick</td><td>low</td><td>14</td><td>doctor</td></tr><tr><td>0.109129190445</td><td>tyler</td><td>high</td><td>100</td><td>engineer</td></tr><tr><td>0.158809006214</td><td>tim</td><td>high</td><td>12</td><td>dermatologist</td></tr></table>

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

## Other Redis queries

Sometimes there may be a case where RedisVL does not cover the explicit functionality required by the query either because of new releases that haven't been implemented in the client, or because of a very specific use case. In these cases, it is possible to use the ``SearchIndex.search`` method to execute query with a redis-py ``Query`` object or through a raw redis string.

### Redis-Py


```python
# Manipulate the Redis-py Query object
redis_py_query = v.query

# choose to sort by age instead of vector distance
redis_py_query.sort_by("age", asc=False)

# run the query with the ``SearchIndex.search`` method
result = index.search(redis_py_query, v.params)
result_print(result)
```

<table><tr><th>vector_distance</th><th>age</th><th>user</th><th>credit_score</th><th>job</th><th>office_location</th></tr><tr><td>0.109129190445</td><td>100</td><td>tyler</td><td>high</td><td>engineer</td><td>-122.0839,37.3861</td></tr><tr><td>0.266666650772</td><td>94</td><td>nancy</td><td>high</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.653301358223</td><td>35</td><td>joe</td><td>medium</td><td>dentist</td><td>-122.0839,37.3861</td></tr><tr><td>0</td><td>18</td><td>john</td><td>high</td><td>engineer</td><td>-122.4194,37.7749</td></tr><tr><td>0.217882037163</td><td>15</td><td>taimur</td><td>low</td><td>CEO</td><td>-122.0839,37.3861</td></tr><tr><td>0</td><td>14</td><td>derrick</td><td>low</td><td>doctor</td><td>-122.4194,37.7749</td></tr><tr><td>0.158809006214</td><td>12</td><td>tim</td><td>high</td><td>dermatologist</td><td>-122.0839,37.3861</td></tr></table>

### Raw Redis query string

One case might be where you simply want to have a search that only filters on a tag field and don't need other functionality. Conversely, you may need to have a query that is more complex than what is currently supported by RedisVL. In these cases, you can use the ``SearchIndex.search`` again with just a raw redis query string.

```python
t = Tag("credit_score") == "high"

str(t)

'@credit_score:{high}'
```

```python
results = index.search(str(t))
for r in results.docs:
    print(r.__dict__)

{'id': 'v1:fcb5f3ea23034dab9f09eebaa9f8ecbb', 'payload': None, 'user': 'john', 'age': '18', 'job': 'engineer', 'credit_score': 'high', 'office_location': '-122.4194,37.7749', 'user_embedding': '==\x00\x00\x00?'}
{'id': 'v1:5d63fd6921364e76802582651ce1f681', 'payload': None, 'user': 'nancy', 'age': '94', 'job': 'doctor', 'credit_score': 'high', 'office_location': '-122.4194,37.7749', 'user_embedding': '333?=\x00\x00\x00?'}
{'id': 'v1:0a1e7b02ae0449b18293eca52833528b', 'payload': None, 'user': 'tyler', 'age': '100', 'job': 'engineer', 'credit_score': 'high', 'office_location': '-122.0839,37.3861', 'user_embedding': '=>\x00\x00\x00?'}
{'id': 'v1:0f9e0ba47e0b462681a3256fabaedfbc', 'payload': None, 'user': 'tim', 'age': '12', 'job': 'dermatologist', 'credit_score': 'high', 'office_location': '-122.0839,37.3861', 'user_embedding': '>>\x00\x00\x00?'}
```

## Inspecting queries

In this example, you will learn how to inspect the query that is generated by RedisVL. This can be useful for debugging purposes or for understanding how the query is being executed.

Again, take the example of a query that combines a numeric filter with a tag filter. This will search for users that are between the ages of between 18 and 100, have a high credit score, and sort by closest vector distance to the query vector.

```python
t = Tag("credit_score") == "high"
low = Num("age") >= 18
high = Num("age") <= 100

combined = t & low & high

v.set_filter(combined)

# Using the str() method, you can see what Redis Query this will emit.
str(v)

'((@credit_score:{high} @age:[18 +inf]) @age:[-inf 100])=>[KNN 10 @user_embedding $vector AS vector_distance] RETURN 6 user credit_score age job office_location vector_distance SORTBY vector_distance ASC DIALECT 2 LIMIT 0 10'
```
