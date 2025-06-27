---
linkTitle: 0.5.1 feature overview
title: 0.5.1 Feature Overview
---


This notebook provides an overview of what's new with the 0.5.1 release of redisvl. It also highlights changes and potential enhancements for existing usage.

## What's new?

- Hybrid query and text query classes
- Threshold optimizer classes
- Schema validation
- Timestamp filters
- Batched queries
- Vector normalization
- Hybrid policy on knn with filters

## Define and load index for examples


```python
from redisvl.utils.vectorize import HFTextVectorizer
from redisvl.index import SearchIndex
import datetime as dt

import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="redis")

# Embedding model
emb_model = HFTextVectorizer()

REDIS_URL = "redis://localhost:6379/0"
NOW = dt.datetime.now()

job_data = [
  {
    "job_title": "Software Engineer",
    "job_description": "Develop and maintain web applications using JavaScript, React, and Node.js.",
    "posted": (NOW - dt.timedelta(days=1)).timestamp() # day ago
  },
  {
    "job_title": "Data Analyst",
    "job_description": "Analyze large datasets to provide business insights and create data visualizations.",
    "posted": (NOW - dt.timedelta(days=7)).timestamp() # week ago
  },
  {
    "job_title": "Marketing Manager",
    "job_description": "Develop and implement marketing strategies to drive brand awareness and customer engagement.",
    "posted": (NOW - dt.timedelta(days=30)).timestamp() # month ago
  }
]

job_data = [{**job, "job_embedding": emb_model.embed(job["job_description"], as_buffer=True)} for job in job_data]


job_schema = {
    "index": {
        "name": "jobs",
        "prefix": "jobs",
        "storage_type": "hash",
    },
    "fields": [
        {"name": "job_title", "type": "text"},
        {"name": "job_description", "type": "text"},
        {"name": "posted", "type": "numeric"},
        {
            "name": "job_embedding",
            "type": "vector",
            "attrs": {
                "dims": 768,
                "distance_metric": "cosine",
                "algorithm": "flat",
                "datatype": "float32"
            }

        }
    ],
}

index = SearchIndex.from_dict(job_schema, redis_url=REDIS_URL)
index.create(overwrite=True, drop=True)
index.load(job_data)
```

    12:44:52 redisvl.index.index INFO   Index already exists, overwriting.





    ['jobs:01JR0V1SA29RVD9AAVSTBV9P5H',
     'jobs:01JR0V1SA209KMVHMD7G54P3H5',
     'jobs:01JR0V1SA23ZE7BRERXTZWC33Z']



# HybridQuery class

Perform hybrid lexical (BM25) and vector search where results are ranked by: `hybrid_score = (1-alpha)*lexical_Score + alpha*vector_similarity`.


```python
from redisvl.query import HybridQuery

text = "Find a job as a where you develop software"
vec = emb_model.embed(text, as_buffer=True)

query = HybridQuery(
    text=text,
    text_field_name="job_description",
    vector=vec,
    vector_field_name="job_embedding",
    alpha=0.7,
    num_results=10,
    return_fields=["job_title"],
)

results = index.query(query)
results
```




    [{'vector_distance': '0.61871612072',
      'job_title': 'Software Engineer',
      'vector_similarity': '0.69064193964',
      'text_score': '49.6242910712',
      'hybrid_score': '15.3707366791'},
     {'vector_distance': '0.937997639179',
      'job_title': 'Marketing Manager',
      'vector_similarity': '0.53100118041',
      'text_score': '49.6242910712',
      'hybrid_score': '15.2589881476'},
     {'vector_distance': '0.859166145325',
      'job_title': 'Data Analyst',
      'vector_similarity': '0.570416927338',
      'text_score': '0',
      'hybrid_score': '0.399291849136'}]



# TextQueries

TextQueries make it easy to perform pure lexical search with redisvl.


```python
from redisvl.query import TextQuery

text = "Find where you develop software"

query = TextQuery(
    text=text,
    text_field_name="job_description",
    return_fields=["job_title"],
    num_results=10,
)

results = index.query(query)
results
```




    [{'id': 'jobs:01JR0V1SA29RVD9AAVSTBV9P5H',
      'score': 49.62429107116745,
      'job_title': 'Software Engineer'},
     {'id': 'jobs:01JR0V1SA23ZE7BRERXTZWC33Z',
      'score': 49.62429107116745,
      'job_title': 'Marketing Manager'}]



# Threshold optimization

In redis 0.5.0 we added the ability to quickly configure either your semantic cache or semantic router with test data examples.

For a step by step guide see: [09_threshold_optimization.ipynb](../09_threshold_optimization.ipynb).

For a more advanced routing example see: [this example](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/semantic-router/01_routing_optimization.ipynb). 


```python
from redisvl.utils.optimize import CacheThresholdOptimizer
from redisvl.extensions.cache.llm import SemanticCache

sem_cache = SemanticCache(
    name="sem_cache",                    # underlying search index name
    redis_url="redis://localhost:6379",  # redis connection url string
    distance_threshold=0.5               # semantic cache distance threshold
)

paris_key = sem_cache.store(prompt="what is the capital of france?", response="paris")
rabat_key = sem_cache.store(prompt="what is the capital of morocco?", response="rabat")

test_data = [
    {
        "query": "What's the capital of Britain?",
        "query_match": ""
    },
    {
        "query": "What's the capital of France??",
        "query_match": paris_key
    },
    {
        "query": "What's the capital city of Morocco?",
        "query_match": rabat_key
    },
]

print(f"\nDistance threshold before: {sem_cache.distance_threshold} \n")
optimizer = CacheThresholdOptimizer(sem_cache, test_data)
optimizer.optimize()
print(f"\nDistance threshold after: {sem_cache.distance_threshold} \n")
```

    
    Distance threshold before: 0.5 
    
    
    Distance threshold after: 0.13050847457627118 
    


# Schema validation

This feature makes it easier to make sure your data is in the right format. To demo this we will create a new index with the `validate_on_load` flag set to `True`


```python
# NBVAL_SKIP
from redisvl.index import SearchIndex

# sample schema
car_schema = {
    "index": {
        "name": "cars",
        "prefix": "cars",
        "storage_type": "json",
    },
    "fields": [
        {"name": "make", "type": "text"},
        {"name": "model", "type": "text"},
        {"name": "description", "type": "text"},
        {"name": "mpg", "type": "numeric"},
        {
            "name": "car_embedding",
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

sample_data_bad = [
    {
        "make": "Toyota",
        "model": "Camry",
        "description": "A reliable sedan with great fuel economy.",
        "mpg": 28,
        "car_embedding": [0.1, 0.2, 0.3]
    },
    {
        "make": "Honda",
        "model": "CR-V",
        "description": "A practical SUV with advanced technology.",
        # incorrect type will throw an error
        "mpg": "twenty-two",
        "car_embedding": [0.4, 0.5, 0.6]
    }
]

# this should now throw an error
car_index = SearchIndex.from_dict(car_schema, redis_url=REDIS_URL, validate_on_load=True)
car_index.create(overwrite=True)

try:
    car_index.load(sample_data_bad)
except Exception as e:
    print(f"Error loading data: {e}")
```

    16:20:25 redisvl.index.index ERROR   Schema validation error while loading data
    Traceback (most recent call last):
      File "/Users/robert.shelton/.pyenv/versions/3.11.9/lib/python3.11/site-packages/redisvl/index/storage.py", line 204, in _preprocess_and_validate_objects
        processed_obj = self._validate(processed_obj)
                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      File "/Users/robert.shelton/.pyenv/versions/3.11.9/lib/python3.11/site-packages/redisvl/index/storage.py", line 160, in _validate
        return validate_object(self.index_schema, obj)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      File "/Users/robert.shelton/.pyenv/versions/3.11.9/lib/python3.11/site-packages/redisvl/schema/validation.py", line 276, in validate_object
        validated = model_class.model_validate(flat_obj)
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      File "/Users/robert.shelton/.pyenv/versions/3.11.9/lib/python3.11/site-packages/pydantic/main.py", line 627, in model_validate
        return cls.__pydantic_validator__.validate_python(
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    pydantic_core._pydantic_core.ValidationError: 2 validation errors for cars__PydanticModel
    mpg.int
      Input should be a valid integer, unable to parse string as an integer [type=int_parsing, input_value='twenty-two', input_type=str]
        For further information visit https://errors.pydantic.dev/2.10/v/int_parsing
    mpg.float
      Input should be a valid number, unable to parse string as a number [type=float_parsing, input_value='twenty-two', input_type=str]
        For further information visit https://errors.pydantic.dev/2.10/v/float_parsing
    
    The above exception was the direct cause of the following exception:
    
    Traceback (most recent call last):
      File "/Users/robert.shelton/.pyenv/versions/3.11.9/lib/python3.11/site-packages/redisvl/index/index.py", line 615, in load
        return self._storage.write(
               ^^^^^^^^^^^^^^^^^^^^
      File "/Users/robert.shelton/.pyenv/versions/3.11.9/lib/python3.11/site-packages/redisvl/index/storage.py", line 265, in write
        prepared_objects = self._preprocess_and_validate_objects(
                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      File "/Users/robert.shelton/.pyenv/versions/3.11.9/lib/python3.11/site-packages/redisvl/index/storage.py", line 211, in _preprocess_and_validate_objects
        raise SchemaValidationError(str(e), index=i) from e
    redisvl.exceptions.SchemaValidationError: Validation failed for object at index 1: 2 validation errors for cars__PydanticModel
    mpg.int
      Input should be a valid integer, unable to parse string as an integer [type=int_parsing, input_value='twenty-two', input_type=str]
        For further information visit https://errors.pydantic.dev/2.10/v/int_parsing
    mpg.float
      Input should be a valid number, unable to parse string as a number [type=float_parsing, input_value='twenty-two', input_type=str]
        For further information visit https://errors.pydantic.dev/2.10/v/float_parsing
    Error loading data: Validation failed for object at index 1: 2 validation errors for cars__PydanticModel
    mpg.int
      Input should be a valid integer, unable to parse string as an integer [type=int_parsing, input_value='twenty-two', input_type=str]
        For further information visit https://errors.pydantic.dev/2.10/v/int_parsing
    mpg.float
      Input should be a valid number, unable to parse string as a number [type=float_parsing, input_value='twenty-two', input_type=str]
        For further information visit https://errors.pydantic.dev/2.10/v/float_parsing


# Timestamp filters

In Redis datetime objects are stored as numeric epoch times. Timestamp filter makes it easier to handle querying by these fields by handling conversion for you.


```python
from redisvl.query import FilterQuery
from redisvl.query.filter import Timestamp

# find all jobs
ts = Timestamp("posted") < NOW # now datetime created above

filter_query = FilterQuery(
    return_fields=["job_title", "job_description", "posted"], 
    filter_expression=ts,
    num_results=10,
)
res = index.query(filter_query)
res
```




    [{'id': 'jobs:01JQYMYZBA6NM6DX9YW35MCHJZ',
      'job_title': 'Software Engineer',
      'job_description': 'Develop and maintain web applications using JavaScript, React, and Node.js.',
      'posted': '1743625199.9'},
     {'id': 'jobs:01JQYMYZBABXYR96H96SQ99ZPS',
      'job_title': 'Data Analyst',
      'job_description': 'Analyze large datasets to provide business insights and create data visualizations.',
      'posted': '1743106799.9'},
     {'id': 'jobs:01JQYMYZBAGEBDS270EZADQ1TM',
      'job_title': 'Marketing Manager',
      'job_description': 'Develop and implement marketing strategies to drive brand awareness and customer engagement.',
      'posted': '1741123199.9'}]




```python
# jobs posted in the last 3 days => 1 job
ts = Timestamp("posted") > NOW - dt.timedelta(days=3)

filter_query = FilterQuery(
    return_fields=["job_title", "job_description", "posted"], 
    filter_expression=ts,
    num_results=10,
)
res = index.query(filter_query)
res
```




    [{'id': 'jobs:01JQYMYZBA6NM6DX9YW35MCHJZ',
      'job_title': 'Software Engineer',
      'job_description': 'Develop and maintain web applications using JavaScript, React, and Node.js.',
      'posted': '1743625199.9'}]




```python
# more than 3 days ago but less than 14 days ago => 1 job
ts = Timestamp("posted").between(
    NOW - dt.timedelta(days=14),
    NOW - dt.timedelta(days=3),
)

filter_query = FilterQuery(
    return_fields=["job_title", "job_description", "posted"], 
    filter_expression=ts,
    num_results=10,
)

res = index.query(filter_query)
res
```




    [{'id': 'jobs:01JQYMYZBABXYR96H96SQ99ZPS',
      'job_title': 'Data Analyst',
      'job_description': 'Analyze large datasets to provide business insights and create data visualizations.',
      'posted': '1743106799.9'}]



# Batch search

This enhancement allows you to speed up the execution of queries by reducing the impact of network latency.


```python
import time
num_queries = 200

start = time.time()
for i in range(num_queries):
    # run the same filter query 
    res = index.query(filter_query)
end = time.time()
print(f"Time taken for {num_queries} queries: {end - start:.2f} seconds")
```

    Time taken for 200 queries: 0.11 seconds



```python
batched_queries = [filter_query] * num_queries

start = time.time()

index.batch_search(batched_queries, batch_size=10)

end = time.time()
print(f"Time taken for {num_queries} batched queries: {end - start:.2f} seconds")
```

    Time taken for 200 batched queries: 0.03 seconds


# Vector normalization

By default, Redis returns the vector cosine distance when performing a search, which yields a value between 0 and 2, where 0 represents a perfect match. However, you may sometimes prefer a similarity score between 0 and 1, where 1 indicates a perfect match. When enabled, this flag performs the conversion for you. Additionally, if this flag is set to true for L2 distance, it normalizes the Euclidean distance to a value between 0 and 1 as well.
 


```python
from redisvl.query import VectorQuery

query = VectorQuery(
    vector=emb_model.embed("Software Engineer", as_buffer=True),
    vector_field_name="job_embedding",
    return_fields=["job_title", "job_description", "posted"],
    normalize_vector_distance=True,
)

res = index.query(query)
res
```




    [{'id': 'jobs:01JQYMYZBA6NM6DX9YW35MCHJZ',
      'vector_distance': '0.7090711295605',
      'job_title': 'Software Engineer',
      'job_description': 'Develop and maintain web applications using JavaScript, React, and Node.js.',
      'posted': '1743625199.9'},
     {'id': 'jobs:01JQYMYZBABXYR96H96SQ99ZPS',
      'vector_distance': '0.6049451231955',
      'job_title': 'Data Analyst',
      'job_description': 'Analyze large datasets to provide business insights and create data visualizations.',
      'posted': '1743106799.9'},
     {'id': 'jobs:01JQYMYZBAGEBDS270EZADQ1TM',
      'vector_distance': '0.553376108408',
      'job_title': 'Marketing Manager',
      'job_description': 'Develop and implement marketing strategies to drive brand awareness and customer engagement.',
      'posted': '1741123199.9'}]



# Hybrid policy on knn with filters

Within the default redis client you can set the `HYBRID_POLICY` which specifies the filter mode to use during vector search with filters. It can take values `BATCHES` or `ADHOC_BF`. Previously this option was not exposed by redisvl.


```python
from redisvl.query.filter import Text

filter = Text("job_description") % "Develop"

query = VectorQuery(
    vector=emb_model.embed("Software Engineer", as_buffer=True),
    vector_field_name="job_embedding",
    return_fields=["job_title", "job_description", "posted"],
    hybrid_policy="BATCHES"
)

query.set_filter(filter)

res = index.query(query)
res
```




    [{'id': 'jobs:01JQYMYZBA6NM6DX9YW35MCHJZ',
      'vector_distance': '0.581857740879',
      'job_title': 'Software Engineer',
      'job_description': 'Develop and maintain web applications using JavaScript, React, and Node.js.',
      'posted': '1743625199.9'},
     {'id': 'jobs:01JQYMYZBAGEBDS270EZADQ1TM',
      'vector_distance': '0.893247783184',
      'job_title': 'Marketing Manager',
      'job_description': 'Develop and implement marketing strategies to drive brand awareness and customer engagement.',
      'posted': '1741123199.9'}]


