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

    /Users/justin.cechmanek/.pyenv/versions/3.13/envs/redisvl-dev/lib/python3.13/site-packages/tqdm/auto.py:21: TqdmWarning: IProgress not found. Please update jupyter and ipywidgets. See https://ipywidgets.readthedocs.io/en/stable/user_install.html
      from .autonotebook import tqdm as notebook_tqdm


    16:16:11 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    16:16:11 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: redis/langcache-embed-v1


    Batches:   0%|          | 0/1 [00:00<?, ?it/s]Compiling the model with `torch.compile` and using a `torch.mps` device is not supported. Falling back to non-compiled mode.
    Batches: 100%|██████████| 1/1 [00:00<00:00,  3.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  1.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 25.04it/s]


This works well but we want to make sure the cache only applies for the appropriate questions. If we test the cache with a question we don't want a response to we see that the current distance_threshold is too high. 


```python
sem_cache.check("what's the capital of britain?")
```

    Batches: 100%|██████████| 1/1 [00:00<00:00,  1.24it/s]





    [{'entry_id': 'c990cc06e5e77570e5f03360426d2b7f947cbb5a67daa8af8164bfe0b3e24fe3',
      'prompt': 'what is the capital of france?',
      'response': 'paris',
      'vector_distance': 0.335606634617,
      'inserted_at': 1746051375.81,
      'updated_at': 1746051375.81,
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
    


    Batches: 100%|██████████| 1/1 [00:00<00:00,  1.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 23.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 24.43it/s]
    /Users/justin.cechmanek/.pyenv/versions/3.13/envs/redisvl-dev/lib/python3.13/site-packages/ranx/metrics/f1.py:36: NumbaTypeSafetyWarning: unsafe cast from uint64 to int64. Precision may be lost.
      scores[i] = _f1(qrels[i], run[i], k, rel_lvl)


    Distance threshold after: 0.10372881355932204 
    


We can also see that we no longer match on the incorrect example:


```python
sem_cache.check("what's the capital of britain?")
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 12.39it/s]





    []



But still match on highly relevant prompts:


```python
sem_cache.check("what's the capital city of france?")
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 25.92it/s]





    [{'entry_id': 'c990cc06e5e77570e5f03360426d2b7f947cbb5a67daa8af8164bfe0b3e24fe3',
      'prompt': 'what is the capital of france?',
      'response': 'paris',
      'vector_distance': 0.043138384819,
      'inserted_at': 1746051375.81,
      'updated_at': 1746051375.81,
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

    16:16:41 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    16:16:41 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: sentence-transformers/all-mpnet-base-v2


    Batches: 100%|██████████| 1/1 [00:00<00:00,  5.90it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  4.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.29it/s]


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
    


    Batches: 100%|██████████| 1/1 [00:00<00:00,  7.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.68it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  9.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 44.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  9.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  9.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.82it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.16it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  7.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  9.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.68it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.03it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 74.82it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.64it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.29it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 75.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 73.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 74.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.07it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.29it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.62it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.78it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.75it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.75it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.46it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.29it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.46it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 22.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.67it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.29it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.07it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.90it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.03it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.16it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.23it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.03it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.75it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.75it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.03it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.18it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.82it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.16it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.68it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 72.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 71.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 20.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.29it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.49it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.82it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.23it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.06it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.49it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.67it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.62it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 22.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.16it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.75it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 19.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.64it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.46it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.28it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.75it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.21it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 24.78it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 51.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.64it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.49it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.78it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.46it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.03it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.11it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 26.60it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.43it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.15it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.56it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.06it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.16it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 28.07it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.20it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.17it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.67it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.62it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 31.04it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.03it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.55it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.02it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 38.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.75it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.26it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.93it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.06it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.88it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.79it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.01it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.35it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.05it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.70it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 69.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.09it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.25it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.47it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 28.70it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.81it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.07it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.85it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.23it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.84it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.31it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.58it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.87it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.77it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.50it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.51it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.72it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.14it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.41it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 67.63it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 17.08it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.74it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.64it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.61it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.10it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.22it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 59.16it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.86it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 58.44it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.69it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.96it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.95it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.36it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 68.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.83it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.57it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 41.90it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 20.01it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.68it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 61.99it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.13it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.30it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.66it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.27it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 63.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.42it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.40it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.71it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.32it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.48it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 64.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 65.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 70.37it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.00it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 66.63it/s]


    Eval metric F1: start 0.438, end 0.812 
    Ending thresholds: {'greeting': 0.5828282828282831, 'farewell': 0.7545454545454545}


### Test it out


```python
# Query the router with a statement
route_match = router("hi there")
route_match
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 55.72it/s]





    RouteMatch(name='greeting', distance=0.295984089375)



## Cleanup


```python
router.delete()
sem_cache.delete()
```
