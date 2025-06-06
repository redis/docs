---
linkTitle: Threshold optimization
title: Threshold Optimization
type: integration
weight: 09
---


After setting up `SemanticRouter` or `SemanticCache` it's best to tune the `distance_threshold` to get the most performance out of your system. RedisVL provides helper classes to make this light weight optimization easy.

**Note:** Threshold optimization relies on `python > 3.9.`

# CacheThresholdOptimizer

Let's say you setup the following semantic cache with a distance_threshold of `X` and store the entries:

- prompt: `what is the capital of france?` response: `paris`
- prompt: `what is the capital of morocco?` response: `rabat`


```python
from redisvl.extensions.cache.llm import SemanticCache
from redisvl.utils.vectorize import HFTextVectorizer

sem_cache = SemanticCache(
    name="sem_cache",                                       # underlying search index name
    redis_url="redis://localhost:6379",                     # redis connection url string
    distance_threshold=0.5,                                 # semantic cache distance threshold
    vectorizer=HFTextVectorizer("redis/langcache-embed-v1") # embedding model
)

paris_key = sem_cache.store(prompt="what is the capital of france?", response="paris")
rabat_key = sem_cache.store(prompt="what is the capital of morocco?", response="rabat")

```

    /Users/tyler.hutcherson/Library/Caches/pypoetry/virtualenvs/redisvl-VnTEShF2-py3.13/lib/python3.13/site-packages/tqdm/auto.py:21: TqdmWarning: IProgress not found. Please update jupyter and ipywidgets. See https://ipywidgets.readthedocs.io/en/stable/user_install.html
      from .autonotebook import tqdm as notebook_tqdm


    16:53:13 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    16:53:13 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: redis/langcache-embed-v1
    16:53:13 sentence_transformers.SentenceTransformer WARNING   You try to use a model that was created with version 4.1.0, however, your version is 3.4.1. This might cause unexpected behavior or errors. In that case, try to update to the latest version.
    
    
    


    Batches: 100%|██████████| 1/1 [00:00<00:00,  6.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  2.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 19.54it/s]


This works well but we want to make sure the cache only applies for the appropriate questions. If we test the cache with a question we don't want a response to we see that the current distance_threshold is too high. 


```python
sem_cache.check("what's the capital of britain?")
```

    Batches: 100%|██████████| 1/1 [00:00<00:00,  3.09it/s]





    [{'entry_id': 'c990cc06e5e77570e5f03360426d2b7f947cbb5a67daa8af8164bfe0b3e24fe3',
      'prompt': 'what is the capital of france?',
      'response': 'paris',
      'vector_distance': 0.335606694221,
      'inserted_at': 1748551995.69,
      'updated_at': 1748551995.69,
      'key': 'sem_cache:c990cc06e5e77570e5f03360426d2b7f947cbb5a67daa8af8164bfe0b3e24fe3'}]



### Define test_data and optimize

With the `CacheThresholdOptimizer` you can quickly tune the distance threshold by providing some test data in the form:

```json
[
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
```

The threshold optimizer will then efficiently execute and score different threshold against the what is currently populated in your cache and automatically update the threshold of the cache to the best setting


```python
from redisvl.utils.optimize import CacheThresholdOptimizer

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

print(f"Distance threshold before: {sem_cache.distance_threshold} \n")
optimizer = CacheThresholdOptimizer(sem_cache, test_data)
optimizer.optimize()
print(f"Distance threshold after: {sem_cache.distance_threshold} \n")
```

    Distance threshold before: 0.5 
    


    Batches: 100%|██████████| 1/1 [00:00<00:00,  3.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 21.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 21.99it/s]


    Distance threshold after: 0.10372881355932204 
    


We can also see that we no longer match on the incorrect example:


```python
sem_cache.check("what's the capital of britain?")
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 17.70it/s]





    []



But still match on highly relevant prompts:


```python
sem_cache.check("what's the capital city of france?")
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 19.72it/s]





    [{'entry_id': 'c990cc06e5e77570e5f03360426d2b7f947cbb5a67daa8af8164bfe0b3e24fe3',
      'prompt': 'what is the capital of france?',
      'response': 'paris',
      'vector_distance': 0.043138384819,
      'inserted_at': 1748551995.69,
      'updated_at': 1748551995.69,
      'key': 'sem_cache:c990cc06e5e77570e5f03360426d2b7f947cbb5a67daa8af8164bfe0b3e24fe3'}]



# RouterThresholdOptimizer

Very similar to the caching case, you can optimize your router.

### Define the routes


```python
from redisvl.extensions.router import Route

routes = [
        Route(
            name="greeting",
            references=["hello", "hi"],
            metadata={"type": "greeting"},
            distance_threshold=0.5,
        ),
        Route(
            name="farewell",
            references=["bye", "goodbye"],
            metadata={"type": "farewell"},
            distance_threshold=0.5,
        ),
    ]
```

### Initialize the SemanticRouter


```python
import os
from redisvl.extensions.router import SemanticRouter
from redisvl.utils.vectorize import HFTextVectorizer

os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Initialize the SemanticRouter
router = SemanticRouter(
    name="greeting-router",
    vectorizer=HFTextVectorizer(),
    routes=routes,
    redis_url="redis://localhost:6379",
    overwrite=True # Blow away any other routing index with this name
)
```

    16:53:26 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    16:53:26 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: sentence-transformers/all-mpnet-base-v2


    Batches: 100%|██████████| 1/1 [00:00<00:00,  9.90it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  6.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.94it/s]


### Provide test_data


```python
test_data = [
    # Greetings
    {"query": "hello", "query_match": "greeting"},
    {"query": "hi", "query_match": "greeting"},
    {"query": "hey", "query_match": "greeting"},
    {"query": "greetings", "query_match": "greeting"},
    {"query": "good morning", "query_match": "greeting"},
    {"query": "good afternoon", "query_match": "greeting"},
    {"query": "good evening", "query_match": "greeting"},
    {"query": "howdy", "query_match": "greeting"},
    {"query": "what's up", "query_match": "greeting"},
    {"query": "yo", "query_match": "greeting"},
    {"query": "hiya", "query_match": "greeting"},
    {"query": "salutations", "query_match": "greeting"},
    {"query": "how's it going", "query_match": "greeting"},
    {"query": "how are you", "query_match": "greeting"},
    {"query": "nice to meet you", "query_match": "greeting"},
    # Farewells
    {"query": "goodbye", "query_match": "farewell"},
    {"query": "bye", "query_match": "farewell"},
    {"query": "see you later", "query_match": "farewell"},
    {"query": "take care", "query_match": "farewell"},
    {"query": "farewell", "query_match": "farewell"},
    {"query": "have a good day", "query_match": "farewell"},
    {"query": "see you soon", "query_match": "farewell"},
    {"query": "catch you later", "query_match": "farewell"},
    {"query": "so long", "query_match": "farewell"},
    {"query": "peace out", "query_match": "farewell"},
    {"query": "later", "query_match": "farewell"},
    {"query": "all the best", "query_match": "farewell"},
    {"query": "take it easy", "query_match": "farewell"},
    {"query": "have a good one", "query_match": "farewell"},
    {"query": "cheerio", "query_match": "farewell"},
    # Null matches
    {"query": "what's the capital of britain?", "query_match": ""},
    {"query": "what does laffy taffy taste like?", "query_match": ""},
]
```

### Optimize

Note: by default route distance threshold optimization will use a random search to find the best threshold since, unlike caching, there are many thresholds to optimize concurrently. 


```python
from redisvl.utils.optimize import RouterThresholdOptimizer

print(f"Route thresholds before: {router.route_thresholds} \n")
optimizer = RouterThresholdOptimizer(router, test_data)
optimizer.optimize()
```

    Route thresholds before: {'greeting': 0.5, 'farewell': 0.5} 
    


    Batches: 100%|██████████| 1/1 [00:00<00:00, 12.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 14.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 47.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 12.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 13.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.03it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.46it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 11.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 13.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.01it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.62it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.70it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 47.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 49.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.01it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.90it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.70it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 42.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 37.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 41.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 45.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.07it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.07it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.62it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.90it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.67it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.06it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.62it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.46it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.01it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 49.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.78it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.64it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.82it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 49.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.49it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 41.03it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 47.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.67it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.90it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.49it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.68it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.23it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.49it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.67it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 41.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 49.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 38.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 46.78it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.64it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.16it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.07it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.70it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 43.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.82it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.29it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.82it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.78it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 47.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 45.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 46.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.06it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.70it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 43.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 46.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 46.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.78it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.29it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 36.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.03it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 46.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.46it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.29it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.46it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.62it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 42.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.23it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.23it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 43.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 47.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.64it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.62it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.49it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.68it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.49it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.75it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.82it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.78it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 44.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 43.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 41.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.64it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.16it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.62it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.49it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 47.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.67it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.16it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.07it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 42.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.46it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.64it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.01it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 49.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.75it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 44.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.39it/s]


    Eval metric F1: start 0.438, end 0.562 
    Ending thresholds: {'greeting': 0.31212121212121235, 'farewell': 0.4414141414141417}


### Test it out


```python
# Query the router with a statement
route_match = router("hi there")
route_match
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.56it/s]





    RouteMatch(name='greeting', distance=0.295984089375)



## Cleanup


```python
router.delete()
sem_cache.delete()
```
