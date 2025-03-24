---
linkTitle: Semantic routing
title: Semantic Routing
type: integration
weight: 08
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
    distance_threshold=1.0
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
    distance_threshold=0.5
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

    /Users/robert.shelton/.pyenv/versions/3.11.9/lib/python3.11/site-packages/huggingface_hub/file_download.py:1142: FutureWarning: `resume_download` is deprecated and will be removed in version 1.0.0. Downloads always resume when possible. If you want to force a new download, use `force_download=True`.
      warnings.warn(
    /Users/robert.shelton/.pyenv/versions/3.11.9/lib/python3.11/site-packages/huggingface_hub/file_download.py:1142: FutureWarning: `resume_download` is deprecated and will be removed in version 1.0.0. Downloads always resume when possible. If you want to force a new download, use `force_download=True`.
      warnings.warn(


    14:07:31 redisvl.index.index INFO   Index already exists, overwriting.



```python
router.vectorizer
```




    HFTextVectorizer(model='sentence-transformers/all-mpnet-base-v2', dims=768)




```python
# look at the index specification created for the semantic router
!rvl index info -i topic-router
```

    
    
    Index Information:
    ╭──────────────┬────────────────┬──────────────────┬─────────────────┬────────────╮
    │ Index Name   │ Storage Type   │ Prefixes         │ Index Options   │   Indexing │
    ├──────────────┼────────────────┼──────────────────┼─────────────────┼────────────┤
    │ topic-router │ HASH           │ ['topic-router'] │ []              │          0 │
    ╰──────────────┴────────────────┴──────────────────┴─────────────────┴────────────╯
    Index Fields:
    ╭────────────┬─────────────┬────────┬────────────────┬────────────────┬────────────────┬────────────────┬────────────────┬────────────────┬─────────────────┬────────────────╮
    │ Name       │ Attribute   │ Type   │ Field Option   │ Option Value   │ Field Option   │ Option Value   │ Field Option   │   Option Value │ Field Option    │ Option Value   │
    ├────────────┼─────────────┼────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼─────────────────┼────────────────┤
    │ route_name │ route_name  │ TAG    │ SEPARATOR      │ ,              │                │                │                │                │                 │                │
    │ reference  │ reference   │ TEXT   │ WEIGHT         │ 1              │                │                │                │                │                 │                │
    │ vector     │ vector      │ VECTOR │ algorithm      │ FLAT           │ data_type      │ FLOAT32        │ dim            │            768 │ distance_metric │ COSINE         │
    ╰────────────┴─────────────┴────────┴────────────────┴────────────────┴────────────────┴────────────────┴────────────────┴────────────────┴─────────────────┴────────────────╯


## Simple routing


```python
# Query the router with a statement
route_match = router("Can you tell me about the latest in artificial intelligence?")
route_match
```




    RouteMatch(name='technology', distance=0.119614303112)




```python
# Query the router with a statement and return a miss
route_match = router("are aliens real?")
route_match
```




    RouteMatch(name=None, distance=None)




```python
# Toggle the runtime distance threshold
route_match = router("Which basketball team will win the NBA finals?")
route_match
```




    RouteMatch(name=None, distance=None)



We can also route a statement to many routes and order them by distance:


```python
# Perform multi-class classification with route_many() -- toggle the max_k and the distance_threshold
route_matches = router.route_many("Lebron James", max_k=3)
route_matches
```




    []




```python
# Toggle the aggregation method -- note the different distances in the result
from redisvl.extensions.router.schema import DistanceAggregationMethod

route_matches = router.route_many("Lebron James", aggregation_method=DistanceAggregationMethod.min, max_k=3)
route_matches
```




    []



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




    []



## Router serialization


```python
router.to_dict()
```




    {'name': 'topic-router',
     'routes': [{'name': 'technology',
       'references': ['what are the latest advancements in AI?',
        'tell me about the newest gadgets',
        "what's trending in tech?"],
       'metadata': {'category': 'tech', 'priority': '1'},
       'distance_threshold': 1.0},
      {'name': 'sports',
       'references': ['who won the game last night?',
        'tell me about the upcoming sports events',
        "what's the latest in the world of sports?",
        'sports',
        'basketball and football'],
       'metadata': {'category': 'sports', 'priority': '2'},
       'distance_threshold': 0.5},
      {'name': 'entertainment',
       'references': ['what are the top movies right now?',
        'who won the best actor award?',
        "what's new in the entertainment industry?"],
       'metadata': {'category': 'entertainment', 'priority': '3'},
       'distance_threshold': 0.7}],
     'vectorizer': {'type': 'hf',
      'model': 'sentence-transformers/all-mpnet-base-v2'},
     'routing_config': {'distance_threshold': 0.5,
      'max_k': 3,
      'aggregation_method': 'min'}}




```python
router2 = SemanticRouter.from_dict(router.to_dict(), redis_url="redis://localhost:6379")

assert router2.to_dict() == router.to_dict()
```

    14:07:34 redisvl.index.index INFO   Index already exists, not overwriting.



```python
router.to_yaml("router.yaml", overwrite=True)
```


```python
router3 = SemanticRouter.from_yaml("router.yaml", redis_url="redis://localhost:6379")

assert router3.to_dict() == router2.to_dict() == router.to_dict()
```

    14:07:34 redisvl.index.index INFO   Index already exists, not overwriting.


## Clean up the router


```python
# Use clear to flush all routes from the index
router.clear()
```


```python
# Use delete to clear the index and remove it completely
router.delete()
```
