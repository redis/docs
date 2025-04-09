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
from redisvl.extensions.llmcache import SemanticCache

sem_cache = SemanticCache(
    name="sem_cache",                    # underlying search index name
    redis_url="redis://localhost:6379",  # redis connection url string
    distance_threshold=0.5               # semantic cache distance threshold
)

paris_key = sem_cache.store(prompt="what is the capital of france?", response="paris")
rabat_key = sem_cache.store(prompt="what is the capital of morocco?", response="rabat")

```

This works well but we want to make sure the cache only applies for the appropriate questions. If we test the cache with a question we don't want a response to we see that the current distance_threshold is too high. 


```python
sem_cache.check("what's the capital of britain?")
```




    [{'entry_id': 'c990cc06e5e77570e5f03360426d2b7f947cbb5a67daa8af8164bfe0b3e24fe3',
      'prompt': 'what is the capital of france?',
      'response': 'paris',
      'vector_distance': 0.421104669571,
      'inserted_at': 1741039231.99,
      'updated_at': 1741039231.99,
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
    
    Distance threshold after: 0.13050847457627118 
    


We can also see that we no longer match on the incorrect example:


```python
sem_cache.check("what's the capital of britain?")
```




    []



But still match on highly relevant prompts:


```python
sem_cache.check("what's the capital city of france?")
```




    [{'entry_id': 'c990cc06e5e77570e5f03360426d2b7f947cbb5a67daa8af8164bfe0b3e24fe3',
      'prompt': 'what is the capital of france?',
      'response': 'paris',
      'vector_distance': 0.0835866332054,
      'inserted_at': 1741039231.99,
      'updated_at': 1741039231.99,
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
    
    Eval metric F1: start 0.438, end 0.719 
    Ending thresholds: {'greeting': 1.0858585858585856, 'farewell': 0.5545454545454545}


### Test it out


```python
# Query the router with a statement
route_match = router("hi there")
route_match
```




    RouteMatch(name='greeting', distance=0.295984119177)



## Cleanup


```python
router.delete()
sem_cache.delete()
```
