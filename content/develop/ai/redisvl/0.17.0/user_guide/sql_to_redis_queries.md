---
linkTitle: Write sql queries for redis
title: Write SQL Queries for Redis
weight: 12
url: '/develop/ai/redisvl/0.17.0/user_guide/sql_to_redis_queries/'
---


While Redis does not natively support SQL, RedisVL provides a `SQLQuery` class that translates SQL-like queries into Redis queries.

The `SQLQuery` class wraps the [`sql-redis`](https://pypi.org/project/sql-redis/) package. This package is not installed by default, so install it with:

```bash
pip install redisvl[sql-redis]
```

## Prerequisites

Before you begin, ensure you have:
- Installed RedisVL with SQL support: `pip install redisvl[sql-redis]`
- A running Redis instance ([Redis 8+](https://redis.io/downloads/) or [Redis Cloud](https://redis.io/cloud))

## What You'll Learn

By the end of this guide, you will be able to:
- Write SQL-like queries for Redis using `SQLQuery`
- Translate SELECT, WHERE, and ORDER BY clauses to Redis queries
- Combine SQL queries with vector search
- Use aggregate functions and grouping
- Query geographic data with `geo_distance()`
- Filter and extract date/time data with `YEAR()`, `MONTH()`, and `DATE_FORMAT()`

## Table of Contents

1. [Define the schema](#define-the-schema)
2. [Create sample dataset](#create-sample-dataset)
3. [Create a SearchIndex](#create-a-searchindex)
4. [Load data](#load-data)
5. [Write SQL queries](#write-sql-queries)
6. [Query types](#query-types)
   - [Text searches](#text-searches)
   - [Aggregations](#aggregations)
   - [Vector search](#vector-search)
   - [Geographic queries](#geographic-queries)
   - [Date and datetime queries](#date-and-datetime-queries)
7. [Async support](#async-support)
8. [Additional query examples](#additional-query-examples)
9. [Cleanup](#cleanup)

## Define the schema


```python
from redisvl.utils.vectorize import HFTextVectorizer

hf = HFTextVectorizer()

schema = {
    "index": {
        "name": "user_simple",
        "prefix": "user_simple_docs",
        "storage_type": "json",
    },
    "fields": [
        {"name": "user", "type": "tag"},
        {"name": "region", "type": "tag"},
        {"name": "job", "type": "tag"},
        {"name": "job_description", "type": "text"},
        {"name": "age", "type": "numeric"},
        {"name": "office_location", "type": "geo"},
        {
            "name": "job_embedding",
            "type": "vector",
            "attrs": {
                "dims": len(hf.embed("get embed length")),
                "distance_metric": "cosine",
                "algorithm": "flat",
                "datatype": "float32"
            }
        }
    ]
}
```

    /Users/robert.shelton/Documents/redis-vl-python/.venv/lib/python3.11/site-packages/tqdm/auto.py:21: TqdmWarning: IProgress not found. Please update jupyter and ipywidgets. See https://ipywidgets.readthedocs.io/en/stable/user_install.html
      from .autonotebook import tqdm as notebook_tqdm


## Create sample dataset


```python
# Office locations use "longitude,latitude" format (lon,lat - Redis convention)
# San Francisco: -122.4194, 37.7749
# Chicago: -87.6298, 41.8781
# New York: -73.9857, 40.7580
data = [
    {
        'user': 'john',
        'age': 34,
        'job': 'software engineer',
        'region': 'us-west',
        'job_description': 'Designs, develops, and maintains software applications and systems.',
        'office_location': '-122.4194,37.7749'  # San Francisco
    },
    {
        'user': 'bill',
        'age': 54,
        'job': 'engineer',
        'region': 'us-central',
        'job_description': 'Applies scientific and mathematical principles to solve technical problems.',
        'office_location': '-87.6298,41.8781'  # Chicago
    },
    {
        'user': 'mary',
        'age': 24,
        'job': 'doctor',
        'region': 'us-central',
        'job_description': 'Diagnoses and treats illnesses, injuries, and other medical conditions in the healthcare field.',
        'office_location': '-87.6298,41.8781'  # Chicago
    },
    {
        'user': 'joe',
        'age': 27,
        'job': 'dentist',
        'region': 'us-east',
        'job_description': 'Provides oral healthcare including diagnosing and treating teeth and gum issues.',
        'office_location': '-73.9857,40.7580'  # New York
    },
    {
        'user': 'stacy',
        'age': 61,
        'job': 'project manager',
        'region': 'us-west',
        'job_description': 'Plans, organizes, and oversees projects from inception to completion.',
        'office_location': '-122.4194,37.7749'  # San Francisco
    }
]

data = [
    {  
        **d,
        "job_embedding": hf.embed(f"{d['job_description']=} {d['job']=}"),
    } 
    for d in data
]
```

## Create a SearchIndex

With the schema and sample dataset ready, create a `SearchIndex`.

### Bring your own Redis connection instance

This is ideal in scenarios where you have custom settings on the connection instance or if your application will share a connection pool:


```python
from redisvl.index import SearchIndex
from redis import Redis

client = Redis.from_url("redis://localhost:6379")
index = SearchIndex.from_dict(schema, redis_client=client)
```

### Let the index manage the connection instance

This is ideal for simple cases:


```python
index = SearchIndex.from_dict(schema, redis_url="redis://localhost:6379")
```

### Create the index

Now that we are connected to Redis, we need to run the create command.


```python
index.create(overwrite=True, drop=True)
```

## Load data

Load the sample dataset to Redis.

### Validate data entries on load
RedisVL uses pydantic validation under the hood to ensure loaded data is valid and conforms to your schema. This setting is optional and can be configured via `validate_on_load=True` in the `SearchIndex` class.

**Note**: This guide omits `validate_on_load` because GEO fields use `longitude,latitude` format (Redis convention), which differs from the validation expectation. A future RedisVL release will align GEO validation with Redis conventions.


```python
keys = index.load(data)

print(keys)
```

    ['user_simple_docs:01KN7Y4J630537VY4Y5D9EZMYX', 'user_simple_docs:01KN7Y4J630537VY4Y5D9EZMYY', 'user_simple_docs:01KN7Y4J630537VY4Y5D9EZMYZ', 'user_simple_docs:01KN7Y4J630537VY4Y5D9EZMZ0', 'user_simple_docs:01KN7Y4J630537VY4Y5D9EZMZ1']


## Write SQL queries

First, let's test a simple select statement such as the one below.


```python
from redisvl.query import SQLQuery

sql_str = """
    SELECT user, region, job, age
    FROM user_simple
    WHERE age > 17
    """

# Optional sql_redis_options are passed through to sql-redis.
# schema_cache_strategy balances startup cost vs repeated-query speed:
# use "lazy" (default) to load schemas on demand, or "load_all"
# to preload schemas up front for broader repeated-query workloads.
sql_query = SQLQuery(
    sql_str, sql_redis_options={"schema_cache_strategy": "lazy"}
)

```

## Check the created query string


```python
sql_query.redis_query_string(redis_url="redis://localhost:6379")
```




    'FT.SEARCH user_simple "@age:[(17 +inf]" RETURN 4 user region job age DIALECT 2'



### Executing the query


```python
results = index.query(sql_query)
results
```




    [{'user': 'john',
      'region': 'us-west',
      'job': 'software engineer',
      'age': '34'},
     {'user': 'bill', 'region': 'us-central', 'job': 'engineer', 'age': '54'},
     {'user': 'mary', 'region': 'us-central', 'job': 'doctor', 'age': '24'},
     {'user': 'joe', 'region': 'us-east', 'job': 'dentist', 'age': '27'},
     {'user': 'stacy', 'region': 'us-west', 'job': 'project manager', 'age': '61'}]



## Query types

### Conditional operators


```python
sql_str = """
    SELECT user, region, job, age
    FROM user_simple
    WHERE age > 17 and region = 'us-west'
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@age:[(17 +inf] @region:{us\-west}" RETURN 4 user region job age DIALECT 2





    [{'user': 'john',
      'region': 'us-west',
      'job': 'software engineer',
      'age': '34'},
     {'user': 'stacy', 'region': 'us-west', 'job': 'project manager', 'age': '61'}]




```python
sql_str = """
    SELECT user, region, job, age
    FROM user_simple
    WHERE region = 'us-west' or region = 'us-central'
    """

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "((@region:{us\-west})|(@region:{us\-central}))" RETURN 4 user region job age





    [{'user': 'mary', 'region': 'us-central', 'job': 'doctor', 'age': '24'},
     {'user': 'bill', 'region': 'us-central', 'job': 'engineer', 'age': '54'},
     {'user': 'stacy', 'region': 'us-west', 'job': 'project manager', 'age': '61'},
     {'user': 'john',
      'region': 'us-west',
      'job': 'software engineer',
      'age': '34'}]




```python
# job is a tag field therefore this syntax works
sql_str = """
    SELECT user, region, job, age
    FROM user_simple
    WHERE job IN ('software engineer', 'engineer', 'pancake tester')
    """

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job:{software engineer|engineer|pancake tester}" RETURN 4 user region job age





    [{'user': 'bill', 'region': 'us-central', 'job': 'engineer', 'age': '54'},
     {'user': 'john',
      'region': 'us-west',
      'job': 'software engineer',
      'age': '34'}]



### Text searches

See [the docs](https://redis.io/docs/latest/develop/ai/search-and-query/query/full-text/) for available text queries in Redis.

For more on exact matching see [here](https://redis.io/docs/latest/develop/ai/search-and-query/query/exact-match/).

With `sql-redis >= 0.4.0`, TEXT search operators are explicit:

- `WHERE job_description = 'healthcare including'` for exact phrase matching
- `WHERE job_description LIKE 'sci%'`, `LIKE '%care'`, or `LIKE '%diagnose%'` for wildcard matching
- `WHERE fuzzy(job_description, 'diagnose')` for typo-tolerant matching
- `WHERE fulltext(job_description, 'healthcare OR diagnosing')` for tokenized search



```python
# Prefix (LIKE)
sql_str = """
    SELECT user, region, job, job_description, age
    FROM user_simple
    WHERE job_description LIKE 'sci%'
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job_description:sci*" RETURN 5 user region job job_description age





    [{'user': 'bill',
      'region': 'us-central',
      'job': 'engineer',
      'job_description': 'Applies scientific and mathematical principles to solve technical problems.',
      'age': '54'}]




```python
# Suffix (LIKE)
sql_str = """
    SELECT user, region, job, job_description, age
    FROM user_simple
    WHERE job_description LIKE '%care'
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job_description:*care" RETURN 5 user region job job_description age





    [{'user': 'mary',
      'region': 'us-central',
      'job': 'doctor',
      'job_description': 'Diagnoses and treats illnesses, injuries, and other medical conditions in the healthcare field.',
      'age': '24'},
     {'user': 'joe',
      'region': 'us-east',
      'job': 'dentist',
      'job_description': 'Provides oral healthcare including diagnosing and treating teeth and gum issues.',
      'age': '27'}]




```python
# Contains (LIKE)
sql_str = """
    SELECT user, region, job, job_description, age
    FROM user_simple
    WHERE job_description LIKE '%diagnose%'
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job_description:*diagnose*" RETURN 5 user region job job_description age





    [{'user': 'mary',
      'region': 'us-central',
      'job': 'doctor',
      'job_description': 'Diagnoses and treats illnesses, injuries, and other medical conditions in the healthcare field.',
      'age': '24'}]




```python
# Phrase no stop words
sql_str = """
    SELECT user, region, job, job_description, age
    FROM user_simple
    WHERE job_description = 'healthcare including'
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job_description:"healthcare including"" RETURN 5 user region job job_description age





    [{'user': 'joe',
      'region': 'us-east',
      'job': 'dentist',
      'job_description': 'Provides oral healthcare including diagnosing and treating teeth and gum issues.',
      'age': '27'}]




```python
# Phrase with stop words (sql-redis strips default stopwords and warns)
sql_str = """
    SELECT user, region, job, job_description, age
    FROM user_simple
    WHERE job_description = 'diagnosing and treating'
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job_description:"diagnosing treating"" RETURN 5 user region job job_description age





    [{'user': 'joe',
      'region': 'us-east',
      'job': 'dentist',
      'job_description': 'Provides oral healthcare including diagnosing and treating teeth and gum issues.',
      'age': '27'}]




```python
sql_str = """
    SELECT user, region, job, age
    FROM user_simple
    WHERE age BETWEEN 40 and 60
    """

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@age:[40 60]" RETURN 4 user region job age





    [{'user': 'bill', 'region': 'us-central', 'job': 'engineer', 'age': '54'}]



### Aggregations

See docs for redis supported reducer functions: [docs](https://redis.io/docs/latest/develop/ai/search-and-query/advanced-concepts/aggregations/#supported-groupby-reducers).


```python
sql_str = """
    SELECT
        user,
        COUNT(age) as count_age,
        COUNT_DISTINCT(age) as count_distinct_age,
        MIN(age) as min_age,
        MAX(age) as max_age,
        AVG(age) as avg_age,
        STDEV(age) as std_age,
        FIRST_VALUE(age) as fist_value_age,
        ARRAY_AGG(age) as to_list_age,
        QUANTILE(age, 0.99) as quantile_age
    FROM user_simple
    GROUP BY region
    """

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.AGGREGATE user_simple "*" LOAD 3 @age @region @user GROUPBY 1 @region REDUCE COUNT 0 AS count_age REDUCE COUNT_DISTINCT 1 @age AS count_distinct_age REDUCE MIN 1 @age AS min_age REDUCE MAX 1 @age AS max_age REDUCE AVG 1 @age AS avg_age REDUCE STDDEV 1 @age AS std_age REDUCE FIRST_VALUE 1 @age AS fist_value_age REDUCE TOLIST 1 @age AS to_list_age REDUCE QUANTILE 2 @age 0.99 AS quantile_age





    [{'region': 'us-west',
      'count_age': '2',
      'count_distinct_age': '2',
      'min_age': '34',
      'max_age': '61',
      'avg_age': '47.5',
      'std_age': '19.091883092',
      'fist_value_age': '61',
      'to_list_age': ['34', '61'],
      'quantile_age': '61'},
     {'region': 'us-central',
      'count_age': '2',
      'count_distinct_age': '2',
      'min_age': '24',
      'max_age': '54',
      'avg_age': '39',
      'std_age': '21.2132034356',
      'fist_value_age': '24',
      'to_list_age': ['24', '54'],
      'quantile_age': '54'},
     {'region': 'us-east',
      'count_age': '1',
      'count_distinct_age': '1',
      'min_age': '27',
      'max_age': '27',
      'avg_age': '27',
      'std_age': '0',
      'fist_value_age': '27',
      'to_list_age': ['27'],
      'quantile_age': '27'}]



### Vector search


```python
sql_str = """
    SELECT user, job, job_description, cosine_distance(job_embedding, :vec) AS vector_distance
    FROM user_simple
    ORDER BY vector_distance ASC
    """

vec = hf.embed("looking for someone to use base principles to solve problems", as_buffer=True)
sql_query = SQLQuery(sql_str, params={"vec": vec})

redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)

results
```

    Resulting redis query:  FT.SEARCH user_simple "*=>[KNN 10 @job_embedding $vector AS vector_distance]" PARAMS 2 vector $vector DIALECT 2 RETURN 4 user job job_description vector_distance SORTBY vector_distance ASC





    [{'vector_distance': '0.823510587215',
      'user': 'bill',
      'job': 'engineer',
      'job_description': 'Applies scientific and mathematical principles to solve technical problems.'},
     {'vector_distance': '0.965160369873',
      'user': 'john',
      'job': 'software engineer',
      'job_description': 'Designs, develops, and maintains software applications and systems.'},
     {'vector_distance': '1.00401353836',
      'user': 'mary',
      'job': 'doctor',
      'job_description': 'Diagnoses and treats illnesses, injuries, and other medical conditions in the healthcare field.'},
     {'vector_distance': '1.0062687397',
      'user': 'stacy',
      'job': 'project manager',
      'job_description': 'Plans, organizes, and oversees projects from inception to completion.'},
     {'vector_distance': '1.01110625267',
      'user': 'joe',
      'job': 'dentist',
      'job_description': 'Provides oral healthcare including diagnosing and treating teeth and gum issues.'}]




```python
sql_str = """
    SELECT user, region, cosine_distance(job_embedding, :vec) AS vector_distance
    FROM user_simple
    WHERE region = 'us-central'
    ORDER BY vector_distance ASC
    """

vec = hf.embed("looking for someone to use base principles to solve problems", as_buffer=True)
sql_query = SQLQuery(sql_str, params={"vec": vec})

redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)

results
```

    Resulting redis query:  FT.SEARCH user_simple "(@region:{us\-central})=>[KNN 10 @job_embedding $vector AS vector_distance]" PARAMS 2 vector $vector DIALECT 2 RETURN 3 user region vector_distance SORTBY vector_distance ASC





    [{'vector_distance': '0.823510587215', 'user': 'bill', 'region': 'us-central'},
     {'vector_distance': '1.00401353836', 'user': 'mary', 'region': 'us-central'}]



### Geographic queries

Use `geo_distance()` to filter by location or calculate distances between points.

**Syntax:**
- Filter: `WHERE geo_distance(field, POINT(lon, lat), 'unit') < radius`
- Distance: `SELECT geo_distance(field, POINT(lon, lat)) AS distance`

**Units:** `'km'` (kilometers), `'mi'` (miles), `'m'` (meters), `'ft'` (feet)

**Note:** `POINT()` uses longitude first, then latitude - matching Redis conventions.


```python
# Find users within 500km of San Francisco
sql_str = """
    SELECT user, job, region, office_location
    FROM user_simple
    WHERE geo_distance(office_location, POINT(-122.4194, 37.7749), 'km') < 500
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "*" GEOFILTER office_location -122.4194 37.7749 500.0 km RETURN 4 user job region office_location





    [{'user': 'stacy',
      'job': 'project manager',
      'region': 'us-west',
      'office_location': '-122.4194,37.7749'},
     {'user': 'john',
      'job': 'software engineer',
      'region': 'us-west',
      'office_location': '-122.4194,37.7749'}]




```python
# Find users within 50 miles of Chicago (using miles)
sql_str = """
    SELECT user, job, region
    FROM user_simple
    WHERE geo_distance(office_location, POINT(-87.6298, 41.8781), 'mi') < 50
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "*" GEOFILTER office_location -87.6298 41.8781 50.0 mi RETURN 3 user job region





    [{'user': 'mary', 'job': 'doctor', 'region': 'us-central'},
     {'user': 'bill', 'job': 'engineer', 'region': 'us-central'}]




```python
# Combine GEO filter with TAG filter - find engineers near Chicago
sql_str = """
    SELECT user, job, region
    FROM user_simple
    WHERE job = 'engineer' AND geo_distance(office_location, POINT(-87.6298, 41.8781), 'mi') < 50
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job:{engineer}" GEOFILTER office_location -87.6298 41.8781 50.0 mi RETURN 3 user job region





    [{'user': 'bill', 'job': 'engineer', 'region': 'us-central'}]




```python
# Combine GEO with NUMERIC filter - find users over 30 near San Francisco
sql_str = """
    SELECT user, job, age
    FROM user_simple
    WHERE age > 30 AND geo_distance(office_location, POINT(-122.4194, 37.7749), 'km') < 100
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@age:[(30 +inf]" GEOFILTER office_location -122.4194 37.7749 100.0 km RETURN 3 user job age





    [{'user': 'stacy', 'job': 'project manager', 'age': '61'},
     {'user': 'john', 'job': 'software engineer', 'age': '34'}]




```python
# Combine GEO with TEXT search - find users with "technical" in job description near Chicago
sql_str = """
    SELECT user, job, job_description
    FROM user_simple
    WHERE job_description LIKE 'technical%' AND geo_distance(office_location, POINT(-87.6298, 41.8781), 'km') < 100
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job_description:technical*" GEOFILTER office_location -87.6298 41.8781 100.0 km RETURN 3 user job job_description





    [{'user': 'bill',
      'job': 'engineer',
      'job_description': 'Applies scientific and mathematical principles to solve technical problems.'}]




```python
# Calculate distances from New York to all users
# Note: geo_distance() in SELECT uses FT.AGGREGATE and returns distance in meters
sql_str = """
    SELECT user, region, geo_distance(office_location, POINT(-73.9857, 40.7580)) AS distance_meters
    FROM user_simple
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)

# Convert meters to km for readability and sort by distance
print("\nDistances from NYC:")
for r in sorted(results, key=lambda x: float(x.get('distance_meters', 0))):
    dist_km = float(r.get('distance_meters', 0)) / 1000
    print(f"  {r['user']:10} | {r['region']:12} | {dist_km:,.0f} km")
```

    Resulting redis query:  FT.AGGREGATE user_simple "*" LOAD 3 @office_location @region @user APPLY geodistance(@office_location, -73.9857, 40.758) AS distance_meters
    
    Distances from NYC:
      joe        | us-east      | 0 km
      mary       | us-central   | 1,145 km
      bill       | us-central   | 1,145 km
      stacy      | us-west      | 4,131 km
      john       | us-west      | 4,131 km


### GEO Query Summary

| Method | Pattern | Example |
|--------|---------|---------|
| **SQL - Basic radius** | `WHERE geo_distance(field, POINT(lon, lat), 'unit') < radius` | `WHERE geo_distance(location, POINT(-122.4, 37.8), 'km') < 50` |
| **SQL - With miles** | Same with `'mi'` unit | `WHERE geo_distance(location, POINT(-73.9, 40.7), 'mi') < 10` |
| **SQL - With TAG** | Combined with `AND` | `WHERE category = 'retail' AND geo_distance(...) < 100` |
| **SQL - With NUMERIC** | Combined with `AND` | `WHERE age > 30 AND geo_distance(...) < 100` |
| **SQL - Distance calc** | `SELECT geo_distance(...)` | `SELECT geo_distance(location, POINT(lon, lat)) AS dist` |
| **Native - Within** | `Geo(field) == GeoRadius(...)` | `Geo("location") == GeoRadius(-122.4, 37.8, 100, "km")` |
| **Native - Outside** | `Geo(field) != GeoRadius(...)` | `Geo("location") != GeoRadius(-87.6, 41.9, 1000, "km")` |
| **Native - Combined** | Use `&` and `\|` operators | `geo_filter & tag_filter & num_filter` |

**Key Points:**
1. **Coordinate Format**: `"longitude,latitude"` - longitude first!
2. **POINT() Syntax**: `POINT(lon, lat)` - longitude first (matches Redis)
3. **Units**: `'km'`, `'mi'`, `'m'`, `'ft'`
4. **geo_distance()**: Returns meters, divide by 1000 for km

### Date and datetime queries

Use date literals and functions to query timestamp data. Redis stores dates as Unix timestamps in NUMERIC fields.

**Key Concepts:**
- Date literals like `'2024-01-01'` are auto-converted to Unix timestamps
- Date functions (`YEAR()`, `MONTH()`, `DAY()`) extract date parts
- `DATE_FORMAT()` formats timestamps as readable strings


```python
# Create a separate index for date examples
from datetime import datetime, timezone

def to_timestamp(date_str):
    """Convert ISO date string to Unix timestamp (UTC)."""
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp())

# Define schema with NUMERIC fields for timestamps
events_schema = {
    "index": {
        "name": "events",
        "prefix": "event:",
        "storage_type": "hash",
    },
    "fields": [
        {"name": "name", "type": "text", "attrs": {"sortable": True}},
        {"name": "category", "type": "tag", "attrs": {"sortable": True}},
        {"name": "created_at", "type": "numeric", "attrs": {"sortable": True}},
    ],
}

events_index = SearchIndex.from_dict(events_schema, redis_url="redis://localhost:6379")
events_index.create(overwrite=True)

# Sample events spanning 2023-2024
events = [
    {"name": "New Year Kickoff", "category": "meeting", "created_at": to_timestamp("2024-01-01")},
    {"name": "Q1 Planning", "category": "meeting", "created_at": to_timestamp("2024-01-15")},
    {"name": "Product Launch", "category": "release", "created_at": to_timestamp("2024-02-20")},
    {"name": "Team Offsite", "category": "meeting", "created_at": to_timestamp("2024-03-10")},
    {"name": "Summer Summit", "category": "conference", "created_at": to_timestamp("2024-07-15")},
    {"name": "Holiday Party 2023", "category": "conference", "created_at": to_timestamp("2023-12-15")},
    {"name": "Year End Review 2023", "category": "meeting", "created_at": to_timestamp("2023-12-20")},
]

events_index.load(events)

print(f"Loaded {len(events)} events:")
for e in events:
    date = datetime.fromtimestamp(e["created_at"], tz=timezone.utc).strftime("%Y-%m-%d")
    print(f"  - {e['name']:25} | {date} | {e['category']}")
```

    Loaded 7 events:
      - New Year Kickoff          | 2024-01-01 | meeting
      - Q1 Planning               | 2024-01-15 | meeting
      - Product Launch            | 2024-02-20 | release
      - Team Offsite              | 2024-03-10 | meeting
      - Summer Summit             | 2024-07-15 | conference
      - Holiday Party 2023        | 2023-12-15 | conference
      - Year End Review 2023      | 2023-12-20 | meeting



```python
# Find events after January 1st, 2024 using date literal
sql_str = """
    SELECT name, category
    FROM events
    WHERE created_at > '2024-01-01'
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = events_index.query(sql_query)

print(f"\nEvents after 2024-01-01 ({len(results)} found):")
for r in results:
    print(f"  - {r['name']}")
```

    Resulting redis query:  FT.SEARCH events "@created_at:[(1704067200 +inf]" RETURN 2 name category
    
    Events after 2024-01-01 (4 found):
      - Summer Summit
      - Q1 Planning
      - Team Offsite
      - Product Launch



```python
# Find events in Q1 2024 using BETWEEN
sql_str = """
    SELECT name, category
    FROM events
    WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31'
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = events_index.query(sql_query)

print(f"\nEvents in Q1 2024 ({len(results)} found):")
for r in results:
    print(f"  - {r['name']} ({r['category']})")
```

    Resulting redis query:  FT.SEARCH events "@created_at:[1704067200 1711843200]" RETURN 2 name category
    
    Events in Q1 2024 (4 found):
      - Q1 Planning (meeting)
      - New Year Kickoff (meeting)
      - Team Offsite (meeting)
      - Product Launch (release)



```python
# Combine date filter with TAG filter - find meetings in H1 2024
sql_str = """
    SELECT name
    FROM events
    WHERE category = 'meeting' AND created_at BETWEEN '2024-01-01' AND '2024-06-30'
"""

sql_query = SQLQuery(sql_str)
results = events_index.query(sql_query)

print(f"Meetings in H1 2024 ({len(results)} found):")
for r in results:
    print(f"  - {r['name']}")
```

    Meetings in H1 2024 (3 found):
      - Q1 Planning
      - New Year Kickoff
      - Team Offsite


### Date Query Summary

| Pattern | Example |
|---------|---------|
| **After date** | `WHERE created_at > '2024-01-01'` |
| **Before date** | `WHERE created_at < '2024-12-31'` |
| **Date range** | `WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31'` |
| **Extract year** | `SELECT YEAR(created_at) AS year` |
| **Extract month** | `SELECT MONTH(created_at) AS month` (returns 0-11) |
| **Filter by year** | `WHERE YEAR(created_at) = 2024` |
| **Group by date** | `GROUP BY YEAR(created_at)` |
| **Format date** | `DATE_FORMAT(created_at, '%Y-%m-%d')` |

**Key Points:**
1. **Storage**: Dates stored as Unix timestamps in NUMERIC fields
2. **Date Literals**: ISO 8601 strings auto-converted to timestamps
3. **Timezone**: Dates without timezone are treated as UTC
4. **Month Index**: Redis `MONTH()` returns 0-11, not 1-12

## Async support

SQL queries also work with `AsyncSearchIndex` for async applications:


```python
from redisvl.index import AsyncSearchIndex
from redisvl.query import SQLQuery

# Create async index
async_index = AsyncSearchIndex.from_dict(schema, redis_url="redis://localhost:6379")

# Execute SQL query asynchronously
sql_query = SQLQuery(f"SELECT user, age FROM {async_index.name} WHERE age > 30")
results = await async_index.query(sql_query)

# Cleanup
await async_index.disconnect()
```

## Additional Query Examples

The following sections provide more detailed examples for geographic and date queries.

### Native GEO filters

As an alternative to SQL syntax, RedisVL provides native `Geo` and `GeoRadius` filter classes.
These can be combined with other filters using `&` (AND) and `|` (OR) operators.


```python
from redisvl.query import FilterQuery
from redisvl.query.filter import Geo, GeoRadius, Tag, Num

# Find users within 100km of Chicago using native filters
geo_filter = Geo("office_location") == GeoRadius(-87.6298, 41.8781, 100, "km")

print(f"Filter expression: {geo_filter}\n")

query = FilterQuery(
    filter_expression=geo_filter,
    return_fields=["user", "job", "region"]
)

results = index.query(query)
print(f"Users within 100km of Chicago ({len(results)} found):")
for r in results:
    print(f"  - {r['user']} ({r['job']}) - {r['region']}")
```

    Filter expression: @office_location:[-87.6298 41.8781 100 km]
    
    Users within 100km of Chicago (2 found):
      - mary (doctor) - us-central
      - bill (engineer) - us-central



```python
# Find users OUTSIDE 1000km of Chicago (using !=)
geo_filter_outside = Geo("office_location") != GeoRadius(-87.6298, 41.8781, 1000, "km")

print(f"Filter expression: {geo_filter_outside}\n")

query = FilterQuery(
    filter_expression=geo_filter_outside,
    return_fields=["user", "region"]
)

results = index.query(query)
print(f"Users OUTSIDE 1000km of Chicago ({len(results)} found):")
for r in results:
    print(f"  - {r['user']} ({r['region']})")
```

    Filter expression: (-@office_location:[-87.6298 41.8781 1000 km])
    
    Users OUTSIDE 1000km of Chicago (3 found):
      - joe (us-east)
      - stacy (us-west)
      - john (us-west)



```python
# Combine GEO + TAG + NUMERIC filters
# Find engineers over 40 within 500km of Chicago
geo_filter = Geo("office_location") == GeoRadius(-87.6298, 41.8781, 500, "km")
job_filter = Tag("job") == "engineer"
age_filter = Num("age") > 40

combined_filter = geo_filter & job_filter & age_filter

print(f"Combined filter: {combined_filter}\n")

query = FilterQuery(
    filter_expression=combined_filter,
    return_fields=["user", "job", "age", "region"]
)

results = index.query(query)
print(f"Engineers over 40 within 500km of Chicago ({len(results)} found):")
for r in results:
    print(f"  - {r['user']} (age: {r['age']}) - {r['region']}")
```

    Combined filter: ((@office_location:[-87.6298 41.8781 500 km] @job:{engineer}) @age:[(40 +inf])
    
    Engineers over 40 within 500km of Chicago (1 found):
      - bill (age: 54) - us-central


### Additional Date Examples

More advanced date query patterns including date function extraction and formatting.


```python
# Extract YEAR and MONTH using date functions in SELECT
sql_str = """
    SELECT name, YEAR(created_at) AS year, MONTH(created_at) AS month
    FROM events
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = events_index.query(sql_query)

print(f"\nEvents with year/month:")
for r in results:
    # Note: MONTH returns 0-11 in Redis (0=January)
    month_num = int(r.get('month', 0)) + 1
    print(f"  - {r['name']:25} | {r.get('year')}-{month_num:02d}")
```

    Resulting redis query:  FT.AGGREGATE events "*" LOAD 2 @created_at @name APPLY year(@created_at) AS year APPLY monthofyear(@created_at) AS month
    
    Events with year/month:
      - Summer Summit             | 2024-07
      - Q1 Planning               | 2024-01
      - Year End Review 2023      | 2023-12
      - New Year Kickoff          | 2024-01
      - Holiday Party 2023        | 2023-12
      - Team Offsite              | 2024-03
      - Product Launch            | 2024-02



```python
# Filter by YEAR using date function in WHERE
sql_str = """
    SELECT name
    FROM events
    WHERE YEAR(created_at) = 2024
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = events_index.query(sql_query)

print(f"\nEvents in 2024 ({len(results)} found):")
for r in results:
    print(f"  - {r['name']}")
```

    Resulting redis query:  FT.AGGREGATE events "*" LOAD 2 @created_at @name APPLY year(@created_at) AS year_created_at FILTER @year_created_at == 2024
    
    Events in 2024 (5 found):
      - Summer Summit
      - Q1 Planning
      - New Year Kickoff
      - Team Offsite
      - Product Launch



```python
# Count events per year using GROUP BY
sql_str = """
    SELECT YEAR(created_at) AS year, COUNT(*) AS event_count
    FROM events
    GROUP BY year
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = events_index.query(sql_query)

print("\nEvents per year:")
for r in sorted(results, key=lambda x: x.get('year', 0)):
    print(f"  {r['year']}: {r['event_count']} events")
```

    Resulting redis query:  FT.AGGREGATE events "*" LOAD 2 @created_at @year APPLY year(@created_at) AS year GROUPBY 1 @year REDUCE COUNT 0 AS event_count
    
    Events per year:
      2023: 2 events
      2024: 5 events



```python
# Format dates using DATE_FORMAT
sql_str = """
    SELECT name, DATE_FORMAT(created_at, '%Y-%m-%d') AS event_date
    FROM events
"""

sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = events_index.query(sql_query)

print("\nEvents with formatted dates:")
for r in results:
    print(f"  - {r['name']:25} | {r.get('event_date', 'N/A')}")
```

    Resulting redis query:  FT.AGGREGATE events "*" LOAD 2 @created_at @name APPLY timefmt(@created_at, "%Y-%m-%d") AS event_date
    
    Events with formatted dates:
      - Summer Summit             | 2024-07-15
      - Q1 Planning               | 2024-01-15
      - Year End Review 2023      | 2023-12-20
      - New Year Kickoff          | 2024-01-01
      - Holiday Party 2023        | 2023-12-15
      - Team Offsite              | 2024-03-10
      - Product Launch            | 2024-02-20


## Next Steps

Now that you understand SQL queries for Redis, explore these related guides:

- [Use Advanced Query Types](11_advanced_queries.ipynb) - Learn about TextQuery, HybridQuery, and MultiVectorQuery
- [Query and Filter Data](02_complex_filtering.ipynb) - Apply filters using native RedisVL query syntax
- [Getting Started](01_getting_started.ipynb) - Review the basics of RedisVL indexes

## Cleanup

To remove all data from Redis associated with the index, use the `.clear()` method. This leaves the index in place for future insertions or updates.

To remove everything including the index, use `.delete()` which removes both the index and the underlying data.


```python
# Delete both indexes and all associated data
events_index.delete(drop=True)
index.delete(drop=True)
```
