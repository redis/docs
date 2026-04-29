---
linkTitle: SQLQuery class
title: SQLQuery class
weight: 12
url: '/develop/ai/redisvl/0.14.0/user_guide/how_to_guides/sql_to_redis_queries/'
---


It may arise that you want to use SQL-like queries to interact with your Redis vector database. While Redis does not natively support SQL, the `redisvl` library provides a `SQLQuery` class that allows you to write SQL-like queries that are automatically translated into Redis queries.

The `SQLQuery` class is a wrapper around the [`sql-redis`](https://pypi.org/project/sql-redis/) package, which provides a SQL-to-Redis query translator. The `sql-redis` package is not installed by default with `redisvl`, so you will need to install with the optional syntax:

`pip install redisvl[sql-redis]` or, if running locally, you can `uv sync --all-extras --all-groups`

## Create an index to search


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

## Create sample dataset


```python
data = [
    {
        'user': 'john',
        'age': 34,
        'job': 'software engineer',
        'region': 'us-west',
        'job_description': 'Designs, develops, and maintains software applications and systems.'
    },
    {
        'user': 'bill',
        'age': 54,
        'job': 'engineer',
        'region': 'us-central',
        'job_description': 'Applies scientific and mathematical principles to solve technical problems.'
    },
    {
        'user': 'mary',
        'age': 24,
        'job': 'doctor',
        'region': 'us-central',
        'job_description': 'Diagnoses and treats illnesses, injuries, and other medical conditions in the healthcare field.'
    },
    {
        'user': 'joe',
        'age': 27,
        'job': 'dentist',
        'region': 'us-east',
        'job_description': 'Provides oral healthcare including diagnosing and treating teeth and gum issues.'
    },
    {
        'user': 'stacy',
        'age': 61,
        'job': 'project manager',
        'region': 'us-west',
        'job_description': 'Plans, organizes, and oversees projects from inception to completion.'
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
```

### Create the index

Now that we are connected to Redis, we need to run the create command.


```python
index.create(overwrite=True, drop=True)
```

## Load Data to `SearchIndex`

Load the sample dataset to Redis.

### Validate data entries on load
RedisVL uses pydantic validation under the hood to ensure loaded data is valid and confirms to your schema. This setting is optional and can be configured in the `SearchIndex` class.


```python
keys = index.load(data)

print(keys)
```

    ['user_simple_docs:01KGJDNVDAZ9A6XY69Q6BCRMX5', 'user_simple_docs:01KGJDNVE024SKZB3804R8B6C3', 'user_simple_docs:01KGJDNVEKW1BV836X4926K7S3', 'user_simple_docs:01KGJDNVF62TBDR9Y9V4WZ59ZG', 'user_simple_docs:01KGJDNVFS0BXM7GF6DA66JHSN']


## Create a `SQLQuery` Object

First, let's test a simple select statement such as the one below.


```python
from redisvl.query import SQLQuery

sql_str = """
    SELECT user, region, job, age
    FROM user_simple
    WHERE age > 17
    """

sql_query = SQLQuery(sql_str) 
```

## Check the created query string


```python
sql_query.redis_query_string(redis_url="redis://localhost:6379")
```




    'FT.SEARCH user_simple "@age:[(17 +inf]" RETURN 4 user region job age'



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



## Additional query support

### Conditional operators


```python
sql_str = """
    SELECT user, region, job, age
    FROM user_simple
    WHERE age > 17 and region = 'us-west'
"""

# could maybe be nice to set a connection string at the class level
# this would deviate from our other query like classes though so thinking on it
sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@age:[(17 +inf] @region:{us\-west}" RETURN 4 user region job age





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





    [{'user': 'john',
      'region': 'us-west',
      'job': 'software engineer',
      'age': '34'},
     {'user': 'bill', 'region': 'us-central', 'job': 'engineer', 'age': '54'},
     {'user': 'stacy', 'region': 'us-west', 'job': 'project manager', 'age': '61'},
     {'user': 'mary', 'region': 'us-central', 'job': 'doctor', 'age': '24'}]




```python
# job is a tag field therefore this syntax works
sql_str = """
    SELECT user, region, job, age
    FROM user_simple
    WHERE job IN ('software engineer', 'engineer', 'pancake tester')
    """

# could maybe be nice to set a connection string at the class level
# this would deviate from our other query like classes though so thinking on it
sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job:{software engineer|engineer|pancake tester}" RETURN 4 user region job age





    [{'user': 'john',
      'region': 'us-west',
      'job': 'software engineer',
      'age': '34'},
     {'user': 'bill', 'region': 'us-central', 'job': 'engineer', 'age': '54'}]



### Text based searches

See [the docs](https://redis.io/docs/latest/develop/ai/search-and-query/query/full-text/) for available text queries in Redis.

For more on exact matching see [here](https://redis.io/docs/latest/develop/ai/search-and-query/query/exact-match/)


```python
# Prefix
sql_str = """
    SELECT user, region, job, job_description, age
    FROM user_simple
    WHERE job_description = 'sci*'
"""

# could maybe be nice to set a connection string at the class level
# this would deviate from our other query like classes though so thinking on it
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
# Suffix
sql_str = """
    SELECT user, region, job, job_description, age
    FROM user_simple
    WHERE job_description = '*care'
"""

# could maybe be nice to set a connection string at the class level
# this would deviate from our other query like classes though so thinking on it
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
# Fuzzy
sql_str = """
    SELECT user, region, job, job_description, age
    FROM user_simple
    WHERE job_description = '%diagnose%'
"""

# could maybe be nice to set a connection string at the class level
# this would deviate from our other query like classes though so thinking on it
sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@job_description:%diagnose%" RETURN 5 user region job job_description age





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

# could maybe be nice to set a connection string at the class level
# this would deviate from our other query like classes though so thinking on it
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
# Phrase with stop words currently limitation of core Redis
sql_str = """
    SELECT user, region, job, job_description, age
    FROM user_simple
    WHERE job_description = 'diagnosing and treating'
"""

# could maybe be nice to set a connection string at the class level
# this would deviate from our other query like classes though so thinking on it
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

# could maybe be nice to set a connection string at the class level
# this would deviate from our other query like classes though so thinking on it
sql_query = SQLQuery(sql_str)
redis_query = sql_query.redis_query_string(redis_url="redis://localhost:6379")
print("Resulting redis query: ", redis_query)
results = index.query(sql_query)
results
```

    Resulting redis query:  FT.SEARCH user_simple "@age:[40 60]" RETURN 4 user region job age





    [{'user': 'bill', 'region': 'us-central', 'job': 'engineer', 'age': '54'}]



### Aggregations

See docs for redis supported reducer functions: [https://redis.io/docs/latest/develop/ai/search-and-query/advanced-concepts/aggregations/#supported-groupby-reducers](docs).


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

    Resulting redis query:  FT.AGGREGATE user_simple "*" LOAD 2 age region GROUPBY 1 @region REDUCE COUNT 0 AS count_age REDUCE COUNT_DISTINCT 1 @age AS count_distinct_age REDUCE MIN 1 @age AS min_age REDUCE MAX 1 @age AS max_age REDUCE AVG 1 @age AS avg_age REDUCE STDDEV 1 @age AS std_age REDUCE FIRST_VALUE 1 @age AS fist_value_age REDUCE TOLIST 1 @age AS to_list_age REDUCE QUANTILE 2 @age 0.99 AS quantile_age





    [{'region': 'us-west',
      'count_age': '2',
      'count_distinct_age': '2',
      'min_age': '34',
      'max_age': '61',
      'avg_age': '47.5',
      'std_age': '19.091883092',
      'fist_value_age': '34',
      'to_list_age': [b'34', b'61'],
      'quantile_age': '61'},
     {'region': 'us-central',
      'count_age': '2',
      'count_distinct_age': '2',
      'min_age': '24',
      'max_age': '54',
      'avg_age': '39',
      'std_age': '21.2132034356',
      'fist_value_age': '54',
      'to_list_age': [b'24', b'54'],
      'quantile_age': '54'},
     {'region': 'us-east',
      'count_age': '1',
      'count_distinct_age': '1',
      'min_age': '27',
      'max_age': '27',
      'avg_age': '27',
      'std_age': '0',
      'fist_value_age': '27',
      'to_list_age': [b'27'],
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
     {'vector_distance': '0.965160429478',
      'user': 'john',
      'job': 'software engineer',
      'job_description': 'Designs, develops, and maintains software applications and systems.'},
     {'vector_distance': '1.00401365757',
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
     {'vector_distance': '1.00401365757', 'user': 'mary', 'region': 'us-central'}]



## Cleanup

Below we will clean up after our work. First, you can flush all data from Redis associated with the index by
using the `.clear()` method. This will leave the secondary index in place for future insertions or updates.

But if you want to clean up everything, including the index, just use `.delete()`
which will by default remove the index AND the underlying data.


```python
# Clear all data from Redis associated with the index
index.clear()
```




    5




```python
# But the index is still in place
index.exists()
```




    True




```python
# Remove / delete the index in its entirety
index.delete()
```
