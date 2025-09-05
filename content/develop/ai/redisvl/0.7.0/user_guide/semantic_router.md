---
linkTitle: Semantic routing
title: Semantic Routing
weight: 08
url: '/develop/ai/redisvl/0.7.0/user_guide/semantic_router/'
---


RedisVL provides a `SemanticRouter` interface to utilize Redis' built-in search & aggregation in order to perform
KNN-style classification over a set of `Route` references to determine the best match.

This notebook will go over how to use Redis as a Semantic Router for your applications

## Define the Routes

Below we define 3 different routes. One for `technology`, one for `sports`, and
another for `entertainment`. Now for this example, the goal here is
surely topic "classification". But you can create routes and references for
almost anything.

Each route has a set of references that cover the "semantic surface area" of the
route. The incoming query from a user needs to be semantically similar to one or
more of the references in order to "match" on the route.

Additionally, each route has a `distance_threshold` which determines the maximum distance between the query and the reference for the query to be routed to the route. This value is unique to each route.


```python
from redisvl.extensions.router import Route


# Define routes for the semantic router
technology = Route(
    name="technology",
    references=[
        "what are the latest advancements in AI?",
        "tell me about the newest gadgets",
        "what's trending in tech?"
    ],
    metadata={"category": "tech", "priority": 1},
    distance_threshold=0.71
)

sports = Route(
    name="sports",
    references=[
        "who won the game last night?",
        "tell me about the upcoming sports events",
        "what's the latest in the world of sports?",
        "sports",
        "basketball and football"
    ],
    metadata={"category": "sports", "priority": 2},
    distance_threshold=0.72
)

entertainment = Route(
    name="entertainment",
    references=[
        "what are the top movies right now?",
        "who won the best actor award?",
        "what's new in the entertainment industry?"
    ],
    metadata={"category": "entertainment", "priority": 3},
    distance_threshold=0.7
)

```

## Initialize the SemanticRouter

``SemanticRouter`` will automatically create an index within Redis upon initialization for the route references. By default, it uses the `HFTextVectorizer` to 
generate embeddings for each route reference.


```python
import os
from redisvl.extensions.router import SemanticRouter
from redisvl.utils.vectorize import HFTextVectorizer

os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Initialize the SemanticRouter
router = SemanticRouter(
    name="topic-router",
    vectorizer=HFTextVectorizer(),
    routes=[technology, sports, entertainment],
    redis_url="redis://localhost:6379",
    overwrite=True # Blow away any other routing index with this name
)
```

    /Users/tyler.hutcherson/Library/Caches/pypoetry/virtualenvs/redisvl-VnTEShF2-py3.13/lib/python3.13/site-packages/tqdm/auto.py:21: TqdmWarning: IProgress not found. Please update jupyter and ipywidgets. See https://ipywidgets.readthedocs.io/en/stable/user_install.html
      from .autonotebook import tqdm as notebook_tqdm


    16:52:49 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    16:52:49 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: sentence-transformers/all-mpnet-base-v2


    Batches: 100%|██████████| 1/1 [00:00<00:00,  7.67it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  8.97it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  5.24it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 48.90it/s]



```python
# look at the index specification created for the semantic router
!rvl index info -i topic-router
```

    
    
    Index Information:
    ╭──────────────────┬──────────────────┬──────────────────┬──────────────────┬──────────────────╮
    │ Index Name       │ Storage Type     │ Prefixes         │ Index Options    │ Indexing         │
    ├──────────────────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
    | topic-router     | HASH             | ['topic-router'] | []               | 0                |
    ╰──────────────────┴──────────────────┴──────────────────┴──────────────────┴──────────────────╯
    Index Fields:
    ╭─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────╮
    │ Name            │ Attribute       │ Type            │ Field Option    │ Option Value    │ Field Option    │ Option Value    │ Field Option    │ Option Value    │ Field Option    │ Option Value    │
    ├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┤
    │ reference_id    │ reference_id    │ TAG             │ SEPARATOR       │ ,               │                 │                 │                 │                 │                 │                 │
    │ route_name      │ route_name      │ TAG             │ SEPARATOR       │ ,               │                 │                 │                 │                 │                 │                 │
    │ reference       │ reference       │ TEXT            │ WEIGHT          │ 1               │                 │                 │                 │                 │                 │                 │
    │ vector          │ vector          │ VECTOR          │ algorithm       │ FLAT            │ data_type       │ FLOAT32         │ dim             │ 768             │ distance_metric │ COSINE          │
    ╰─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────╯



```python
router._index.info()["num_docs"]
```




    11



## Simple routing


```python
# Query the router with a statement
route_match = router("Can you tell me about the latest in artificial intelligence?")
route_match
```

    Batches: 100%|██████████| 1/1 [00:00<00:00,  8.83it/s]





    RouteMatch(name='technology', distance=0.419145941734)




```python
# Query the router with a statement and return a miss
route_match = router("are aliens real?")
route_match
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 12.45it/s]





    RouteMatch(name=None, distance=None)



We can also route a statement to many routes and order them by distance:


```python
# Perform multi-class classification with route_many() -- toggle the max_k and the distance_threshold
route_matches = router.route_many("How is AI used in basketball?", max_k=3)
route_matches
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 10.98it/s]





    [RouteMatch(name='technology', distance=0.556493639946),
     RouteMatch(name='sports', distance=0.671060085297)]




```python
# Toggle the aggregation method -- note the different distances in the result
from redisvl.extensions.router.schema import DistanceAggregationMethod

route_matches = router.route_many("How is AI used in basketball?", aggregation_method=DistanceAggregationMethod.min, max_k=3)
route_matches
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 52.93it/s]





    [RouteMatch(name='technology', distance=0.556493639946),
     RouteMatch(name='sports', distance=0.629264354706)]



Note the different route match distances. This is because we used the `min` aggregation method instead of the default `avg` approach.

## Update the routing config


```python
from redisvl.extensions.router import RoutingConfig

router.update_routing_config(
    RoutingConfig(aggregation_method=DistanceAggregationMethod.min, max_k=3)
)
```


```python
route_matches = router.route_many("Lebron James")
route_matches
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 10.93it/s]





    [RouteMatch(name='sports', distance=0.663253903389)]



## Router serialization


```python
router.to_dict()
```




    {'name': 'topic-router',
     'routes': [{'name': 'technology',
       'references': ['what are the latest advancements in AI?',
        'tell me about the newest gadgets',
        "what's trending in tech?"],
       'metadata': {'category': 'tech', 'priority': 1},
       'distance_threshold': 0.71},
      {'name': 'sports',
       'references': ['who won the game last night?',
        'tell me about the upcoming sports events',
        "what's the latest in the world of sports?",
        'sports',
        'basketball and football'],
       'metadata': {'category': 'sports', 'priority': 2},
       'distance_threshold': 0.72},
      {'name': 'entertainment',
       'references': ['what are the top movies right now?',
        'who won the best actor award?',
        "what's new in the entertainment industry?"],
       'metadata': {'category': 'entertainment', 'priority': 3},
       'distance_threshold': 0.7}],
     'vectorizer': {'type': 'hf',
      'model': 'sentence-transformers/all-mpnet-base-v2'},
     'routing_config': {'max_k': 3, 'aggregation_method': 'min'}}




```python
router2 = SemanticRouter.from_dict(router.to_dict(), redis_url="redis://localhost:6379")

assert router2.to_dict() == router.to_dict()
```

    16:52:53 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    16:52:53 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: sentence-transformers/all-mpnet-base-v2


    Batches: 100%|██████████| 1/1 [00:00<00:00, 45.24it/s]

    16:52:54 redisvl.index.index INFO   Index already exists, not overwriting.


    



```python
router.to_yaml("router.yaml", overwrite=True)
```


```python
router3 = SemanticRouter.from_yaml("router.yaml", redis_url="redis://localhost:6379")

assert router3.to_dict() == router2.to_dict() == router.to_dict()
```

    16:52:54 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    16:52:54 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: sentence-transformers/all-mpnet-base-v2


    Batches: 100%|██████████| 1/1 [00:00<00:00, 53.94it/s]

    16:52:54 redisvl.index.index INFO   Index already exists, not overwriting.


    


# Add route references


```python
router.add_route_references(route_name="technology", references=["latest AI trends", "new tech gadgets"])
```

    Batches: 100%|██████████| 1/1 [00:00<00:00,  7.24it/s]





    ['topic-router:technology:f243fb2d073774e81c7815247cb3013794e6225df3cbe3769cee8c6cefaca777',
     'topic-router:technology:7e4bca5853c1c3298b4d001de13c3c7a79a6e0f134f81acc2e7cddbd6845961f']



# Get route references


```python
# by route name
refs = router.get_route_references(route_name="technology")
refs
```




    [{'id': 'topic-router:technology:85cc73a1437df27caa2f075a29c497e5a2e532023fbb75378aedbae80779ab37',
      'reference_id': '85cc73a1437df27caa2f075a29c497e5a2e532023fbb75378aedbae80779ab37',
      'route_name': 'technology',
      'reference': 'tell me about the newest gadgets'},
     {'id': 'topic-router:technology:851f51cce5a9ccfbbcb66993908be6b7871479af3e3a4b139ad292a1bf7e0676',
      'reference_id': '851f51cce5a9ccfbbcb66993908be6b7871479af3e3a4b139ad292a1bf7e0676',
      'route_name': 'technology',
      'reference': 'what are the latest advancements in AI?'},
     {'id': 'topic-router:technology:f243fb2d073774e81c7815247cb3013794e6225df3cbe3769cee8c6cefaca777',
      'reference_id': 'f243fb2d073774e81c7815247cb3013794e6225df3cbe3769cee8c6cefaca777',
      'route_name': 'technology',
      'reference': 'latest AI trends'},
     {'id': 'topic-router:technology:7e4bca5853c1c3298b4d001de13c3c7a79a6e0f134f81acc2e7cddbd6845961f',
      'reference_id': '7e4bca5853c1c3298b4d001de13c3c7a79a6e0f134f81acc2e7cddbd6845961f',
      'route_name': 'technology',
      'reference': 'new tech gadgets'},
     {'id': 'topic-router:technology:149a9c9919c58534aa0f369e85ad95ba7f00aa0513e0f81e2aff2ea4a717b0e0',
      'reference_id': '149a9c9919c58534aa0f369e85ad95ba7f00aa0513e0f81e2aff2ea4a717b0e0',
      'route_name': 'technology',
      'reference': "what's trending in tech?"}]




```python
# by reference id
refs = router.get_route_references(reference_ids=[refs[0]["reference_id"]])
refs
```




    [{'id': 'topic-router:technology:85cc73a1437df27caa2f075a29c497e5a2e532023fbb75378aedbae80779ab37',
      'reference_id': '85cc73a1437df27caa2f075a29c497e5a2e532023fbb75378aedbae80779ab37',
      'route_name': 'technology',
      'reference': 'tell me about the newest gadgets'}]



# Delete route references


```python
# by route name
deleted_count = router.delete_route_references(route_name="sports")
deleted_count
```




    5




```python
# by id
deleted_count = router.delete_route_references(reference_ids=[refs[0]["reference_id"]])
deleted_count
```




    1



## Clean up the router


```python
# Use clear to flush all routes from the index
router.clear()
```


```python
# Use delete to clear the index and remove it completely
router.delete()
```
