---
linkTitle: Cache llm responses
title: Cache LLM Responses
aliases:
- /integrate/redisvl/user_guide/how_to_guides/03_llmcache
weight: 03
---


This guide demonstrates how to use RedisVL's `SemanticCache` to cache LLM responses based on semantic similarity. Semantic caching reduces API costs and latency by retrieving cached responses for semantically similar prompts instead of making redundant API calls.

## Prerequisites

Before you begin, ensure you have:
- Installed RedisVL: `pip install redisvl`
- A running Redis instance ([Redis 8+](https://redis.io/downloads/) or [Redis Cloud](https://redis.io/cloud))
- An OpenAI API key for the examples

## What You'll Learn

By the end of this guide, you will be able to:
- Set up and configure a `SemanticCache`
- Store and retrieve cached LLM responses
- Understand entry IDs and keys for fetching and deleting specific entries
- Customize semantic similarity thresholds
- Configure TTL policies and understand TTL refresh behavior
- Implement access controls with tags and filters for multi-user scenarios

First, import [OpenAI](https://platform.openai.com) to use their API for responding to user prompts. The following code creates a simple `ask_openai` helper method to assist.


```python
import os
import getpass
import time
import numpy as np

from openai import OpenAI


os.environ["TOKENIZERS_PARALLELISM"] = "False"

api_key = os.getenv("OPENAI_API_KEY") or getpass.getpass("Enter your OpenAI API key: ")

client = OpenAI(api_key=api_key)

def ask_openai(question: str) -> str:
    response = client.completions.create(
      model="gpt-4o-mini",
      prompt=f"Answer the following question simply: {question}",
      max_tokens=200
    )
    return response.choices[0].text.strip()
```


```python
# Test
print(ask_openai("What is the capital of France?"))
```

    Paris.


## Initializing ``SemanticCache``

``SemanticCache`` will automatically create an index within Redis upon initialization for the semantic cache content.


```python
import warnings
warnings.filterwarnings('ignore')

from redisvl.extensions.cache.llm import SemanticCache
from redisvl.utils.vectorize import HFTextVectorizer

llmcache = SemanticCache(
    name="llmcache",                                          # underlying search index name
    redis_url="redis://localhost:6379",                       # redis connection url string
    distance_threshold=0.1,                                   # semantic cache distance threshold (Redis COSINE [0-2], lower is stricter)
    vectorizer=HFTextVectorizer("redis/langcache-embed-v2"),  # embedding model
)
```

    You try to use a model that was created with version 4.1.0, however, your version is 3.4.1. This might cause unexpected behavior or errors. In that case, try to update to the latest version.
    
    
    



```python
# look at the index specification created for the semantic cache lookup
!rvl index info -i llmcache
```

    
    
    Index Information:
    ╭───────────────┬───────────────┬───────────────┬───────────────┬───────────────╮
    │ Index Name    │ Storage Type  │ Prefixes      │ Index Options │ Indexing      │
    ├───────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
    | llmcache      | HASH          | ['llmcache']  | []            | 0             |
    ╰───────────────┴───────────────┴───────────────┴───────────────┴───────────────╯
    Index Fields:
    ╭─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────╮
    │ Name            │ Attribute       │ Type            │ Field Option    │ Option Value    │ Field Option    │ Option Value    │ Field Option    │ Option Value    │ Field Option    │ Option Value    │
    ├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┤
    │ prompt          │ prompt          │ TEXT            │ WEIGHT          │ 1               │                 │                 │                 │                 │                 │                 │
    │ response        │ response        │ TEXT            │ WEIGHT          │ 1               │                 │                 │                 │                 │                 │                 │
    │ inserted_at     │ inserted_at     │ NUMERIC         │                 │                 │                 │                 │                 │                 │                 │                 │
    │ updated_at      │ updated_at      │ NUMERIC         │                 │                 │                 │                 │                 │                 │                 │                 │
    │ prompt_vector   │ prompt_vector   │ VECTOR          │ algorithm       │ FLAT            │ data_type       │ FLOAT32         │ dim             │ 768             │ distance_metric │ COSINE          │
    ╰─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────╯


## Basic Cache Usage


```python
question = "What is the capital of France?"
```


```python
# Check the semantic cache -- should be empty
if response := llmcache.check(prompt=question):
    print(response)
else:
    print("Empty cache")
```

    Empty cache


Our initial cache check should be empty since we have not yet stored anything in the cache. Below, store the `question`,
proper `response`, and any arbitrary `metadata` (as a python dictionary object) in the cache.


```python
# Cache the question, answer, and arbitrary metadata
llmcache.store(
    prompt=question,
    response="Paris",
    metadata={"city": "Paris", "country": "france"}
)
```




    'llmcache:115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545'



Now check the cache again with the same question and with a semantically similar question:


```python
# Check the cache again
if response := llmcache.check(prompt=question, return_fields=["prompt", "response", "metadata"]):
    print(response)
else:
    print("Empty cache")
```

    [{'prompt': 'What is the capital of France?', 'response': 'Paris', 'metadata': {'city': 'Paris', 'country': 'france'}, 'key': 'llmcache:115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545'}]



```python
# Check for a semantically similar result
question = "What actually is the capital of France?"
llmcache.check(prompt=question)[0]['response']
```




    'Paris'



## Entry IDs and Keys

Each cache entry has two identifiers:

- **`entry_id`**: A deterministic hash of the prompt + filters. Used to identify the entry within the cache.
- **`key`**: The full Redis key (prefix + entry_id). Used for direct Redis operations.

The `entry_id` is generated as a SHA256 hash of the prompt and any filters, meaning:
- Same prompt + same filters = same `entry_id` (overwrites previous entry)
- Same prompt + different filters = different `entry_id` (both stored)


```python
# Store an entry and capture the returned key
key = llmcache.store(
    prompt="What is the capital of France?",
    response="Paris",
    metadata={"source": "geography"}
)
print(f"Full Redis key: {key}")
```

    Full Redis key: llmcache:115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545



```python
# Check and see both entry_id and key in the response
result = llmcache.check(
    prompt="What is the capital of France?",
    return_fields=["entry_id", "prompt", "response"]
)
print(f"Entry ID: {result[0]['entry_id']}")
print(f"Key: {result[0]['key']}")
```

    Entry ID: 115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545
    Key: llmcache:115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545


### Fetch and Delete Specific Entries

You can fetch or delete specific cache entries using the underlying index. First, let's see what keys exist in the cache:


```python
# List all keys in the cache using the underlying index
from redisvl.query import FilterQuery
from redisvl.query.filter import FilterExpression

query = FilterQuery(
    filter_expression=FilterExpression("*"),
    return_fields=["entry_id", "prompt", "response"]
)
all_entries = llmcache._index.query(query)
print(f"Found {len(all_entries)} entries in cache:")
for entry in all_entries:
    print(f"  - entry_id: {entry['entry_id'][:20]}... prompt: {entry['prompt'][:30]}...")
```

    Found 1 entries in cache:
      - entry_id: 115049a298532be2f181... prompt: What is the capital of France?...



```python
# Fetch a specific entry by its entry_id
entry_id = result[0]['entry_id']
record = llmcache._index.fetch(entry_id)
print(f"Fetched record: {record}")
```

    Fetched record: {'metadata': '{"source": "geography"}', 'entry_id': '115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545', 'inserted_at': '1776288885.186736', 'updated_at': '1776288885.1867368', 'prompt': 'What is the capital of France?', 'response': 'Paris', 'prompt_vector': b'\xa15\x06@\x1c\x10\xba\xbf$\xa28\xbf[\x8aU\xc0\x02E\x89?q\x825\xbd\xca\xc1\xf1\xbf\x186\xfb\xbe\xb5\n\x12\xc0\x9es\x83\xc0\xe2\'\'?\xb7T\xfc\xbf\x9b\xef\xa1\xbf\x0bo\xae\xbf"\xebG>-\x16\x81\xbf\x8e&\x13\xbf\xb2l_\xbf\x8b\xf9>?\x96\xdf(\xbf:7\x99\xbf\xf7\xbd\x8f\xbfLoQ\xbf\x89\xb2M?c\xea\x16\xc0s\x1e\xdc\xbe\xf2fx\xbf\x8b\xa5B>\xfaM\xef\xbf9\xdd$?(\xa1=\xbf\x1a\xd0\x99\xbf[dd?\x04\x9c\xc9>\xff\xf9\x0f\xbe0\x90X\xber[H\xc0=.\xb1=\x0bO\x90\xbd\xba\xaa\x81\xbe\xca<A;\xdb\x8ev@.\'0@$\x08\xdf?\xe9\x94\x1c\xc0\xce\x89\xf9>\xfd\x04\xb4\xbf\xb6)U\xbf#h\xea?\xef\xba\x1b?\xb9e\x04\xbe\x0fb\x0e@\xdc\xbdL?\xb8i\xb5?\xd8\xf0u\xbf\xf3g\x9b>\n\xc2\x83\xbf\xe6\xaa\x83\xc0\xc1\xf7\'?!\xe1\xd8\xbe\xc3\xd3\'\xc0)\x9c\x90?xx\xd3\xbe\xa5\x9dz?\xf8\x10\x9f?5\x99\xc5?\x03\xd5\x9f?\xf2\xc0B?\x08\x9f\xb1>oW|?\xa0\xa4e@\xe9\xed\x90?\xfcf\xe9>\xe8\xe9\xe8\xbf\xc5\x04T\xbf\x9du\xa6\xbe\x14\xa2\x98\xbf#\xb7+?\xe9\x8a`\xc0\x18uU?\xbd\x1a<@2~\xbf\xbf&1\xa4?8M\x19@\xb0\x883?\x94\xf1\x84\xc0\xea=\xd8=^\x1b\xdc\xbe\x1e\xbd\x14\xc0\x10x\x87?\xde\xe5\xf7>;[\xee=N\xf1"?\xda\x8ci\xbf\xed\xdb\x07\xbe\x12 Z\xc0i\xfb\x03\xbd\x9f\x82\xea>\x9b=\x0f\xc0\xe6D\xbf\xbe\xf7\x91\xb9\xbfU)(\xc0\xdbP\x92\xbd\xf6\xd6\x86\xbfoD\xe0>\x1a9\x01@\x9c?\x1a\xbf\x9a\xc9\n\xc0gd\'?\xcdqr?3%<\xbf\x8f\xe8\xc2\xbe\xbe\xae\x9d\xbf\xc4\x0e+\xbf-e\x02@4+\x9a\xbf\xa5\x88\xe7?W\xe9K\xbe\xd7;Y?\xd9\x8a\x94?\r\xaf\xc2?*\xd1\xa6?\xb7\x82\x00\xc0\xb2\x8d\xbf>X\xd2\x8f?\x1c\xe7\xcf?A\x89J?\xcem\xe4\xbfP2\x15\xbd\xc3I9\xbe)\x14H?\xbe\x87\x87\xbe\xb6\xcb\xa2?Un\xc4\xbf\xb2\xaf^>\x1b%\xd6\xbe\x1e\tW?\xcf\x82\x0f@\xa5K\xc8\xbeD\xe1\x90=\xfd\xa4\x12\xbf\x05\xcb>\xbe\xd3\xcf\x08\xbf\xe4}\xc4\xbev\x02\x92\xbe\x07\xc7\x19\xbc\xd5\x9b\xd9?\xdev\x03@\x9a\xbff\xbe\xdd\x94\x8f>Y\xad\xd8\xbe\x9f\xcf$\xbf0\x0cz\xbe\x1d\xfd\x96\xbf\x7f?n\xbfh_\x12\xc0\x02v\xdd\xbf^E\xa4>\xda{\xe3?l\xa5\xab\xbe\xad.\x12@T\xed>\xbf]\xe9Y\xbf\xc5\xad\xca\xbd\xc8\x01\x1e@\x0f\xbf=\xbf\x8b\xe2\xa0>Pf\x98\xbd@>\x00\xbe\xb6\xe5g\xbf\xec~\xa9@\xb6\x10L\xc0Q\x1fA?\xeb!\xa6\xbdf^u?\xb6\xabi\xbfm\x02\x11\xc0\xa3\x0e\xc7?\x9c\xd6%\xc0\x9d\x85\x94\xbf\x04\xa98>\x9a\xe8_\xbe\x86\xbdr\xbf\xa9p\x8e\xbf6G0\xbb\xf1\xc9\xa3?\xe36$\xbf\x04O\x05\xc0r\xf2\xa8>\x9a\xe3\x14?\x07M\xc8<S>\xe8\xbfR@\x13<\xfaZ\xe0?l\x00\xde\xbf\xfc\xa5\x03?\xd0\xe5.\xc03m\xdc\xbf\x9f\xa7\x90?eB\x97\xbeqE\x04@\xfc\x07<?\xe9\xbe3\xc0\x1eG\xa8?\xd7\xf9\xd8\xbfvmi?J\xe4g\xbfj:\xa3?\xcb\x16\xd1\xbfP\x04\xee?/e\x9e>\x8cU\x98?\xa8s\xc6=\xf5/\xc1?\x0fl\x80\xc0d\xfa0\xbf\x81#\xf0?z4\x03\xbf\x95\x88l\xbf\xbf\xbe\'@$\x9c\xd5?\x82\n)\xbfxd\x17\xc0\x02EQ?\x83\xc7\x83\xbf\x8f\xcc\x84\xbe\xa9\xa0Q\xbf:;\xf9?\xdc>\x17\xbf\x02$\xe1?\xf4\x8e\x1b\xbf\x1c\x19:\xc0\x81\xd4k?#\x83\x85?\x9a\x8c\xdd?\xa3\x10\xa9\xbe\xc69\xff>s\x81T=T\xf7\x85\xbfF4\xc6\xbe\x10\xf5\x1c@vf\x93\xbf\xb4\xa8\x8d?\xd5>\x1f\xc0\xe3\xc0k\xbf/WA\xbf89\xcd?\xe1[\x94?\x81$\xa4\xbe&\'\xd6\xbf,:[@\xad/\xd2\xbf\xba\x17\x86?\xc4\xe2\x01\xc0\xa0\xf9\xf0\xbe]\x03\xec\xbdv\xe3\x0f@\xdd\xfb\x13@\xdc\xe2\x8a\xc0\x88c]?\xb4\xb4K\xbf\xd69\x1a?.\xc1\xe1\xbf\xaaNd?\tJE@\x9bB\t\xc0\xa7,\x95;\xa5\xde\x0b\xbe\x8a9)>;\xd7\xc4\xbf\x11\xe7\x0e?8\x9c\x9d\xbd}\xfd\x0c\xc0G\xa1\x7f?\xc7\x14\x19?\x8bi\xc1?\x88\xfaS?\x8dg\x19@\x16\xf9\x9e?\x7fa0\xbf\x96\x0c\xe8>\xec\x03\xc9?Z>\xf0>\xcf\xaa\xda\xbf1WI\xbed\xc9\x9c\xbf$L\x13?:\x02\x9b?\t\xe9G?\xf8\x10\x07@1\xe1\xab>\xca\xa6\xdc\xbf\x1b0\xac\xbf\xb9\xb7\xd2?l.\xbd>\x92\xa0\xf4\xbf!W\x03\xbf\x88l\xdd>o\xa1-@\xc7kb?b\x0e\xfd>\x12\xb5\xb7\xbf\x02,\xfa?,\x84t?"\xa3\x0e\xbfT\xb7\xd6?\x89\xb9w\xbe`#\xd4=\xfcC=@\x8b\xa68@\xe8\x88f\xbfV\x0c\xd7\xbe\x12\xe8\x0b?=A\x82\xbf\x83\x15\xa9?ogq\xbf\xa1<\xca\xbe\x8e\n\x13\xc0\xbe\x95\xce\xbd\x075!\xc09\x8a\xdd?\xec\xce\x9b?\xfd\x8f3\xbf\xf6\xc8\xf2?rO\x0e@\x18\x0e\xd0?\x00u\'\xbf\x8f\xca\x90\xbe5C\x11\xbf\x1b\xe1\xcb?Z\x94\x96\xbfc!\r\xc0H\x83\t\xc0\x90\xf6\x1c\xc0\x84M\xf1\xbf\x0e\x0b\x0c\xbf\xd0\xe1"\xbe\n8?\xc0\x8ad\x1a?\x9a\xc4\xbb>\xee\x99\xad\xbf{z\xbc\xbf\xcc\xfb\x03\xbe\xffI~\xbd\xd6d\x82>q\x0c\xd5?\x17\x0b\x08\xc0\x07|C@\xb80{>\xd9+\x1c>\x11d\x12\xc0?%,\xc0\xd1 \x9b\xbf\x82\x84S?XE\x90?\xba\xc52?;l\x06@Z\xfd\x80?\x1a\x97\xac?Fn\xcc\xbf\xf4I\xc1?\x9b\xa7\xdf?\xfeOs\xbf\xacN\xa6=B\xfe#==\xfe"?\xa8\\\x1d\xbf\xbd(\xf0?\xa1~<\xbe\xfd\xda\x8f>\x83\x19\xab\xbemi\xcc:\x0e\xbc\xba\xbe\xe3e\xef?\xdag\x8d?\x82\xf1\xfe\xbf\xcb\xf4\x06\xbd6CD@\xfeqg\xbf\xce\xc0\x96?\x89 M?\x9b)\x87\xbe\x934(\xc0W\xba\xa0\xbe\xeb\x84s>\x1fi\xfc?\xfc\x0fs\xbf\xd9\xfd\x98?Y\xb7\x9e>\x18\xfe\x00\xbe^)\n?\xa8\xb4\xff\xbe\xec\xde)=Y\x9b\x89@M\x9a\xb5\xbe\xef\xa2G?\xf3\xa3\x8b\xbf[\xf9\x8b\xbfw\xb5\x86?\xcb\x16\x04\xc04\xd6\xa3\xbf\xb09\x9a?}\xd5!@\xdb\xc5\x87?\xcf(\x86?\xaa\x80\x1e\xc0\x14&\xa6\xbf\xc18\x11?\x88IH\xbf\x82CH?\xb6G\x17@9\xa9&\xbe#Y\xc8>\xa5\xc9\x0e\xc0\x15\x93*?\x97\xe5\x02?\xf0\xcaW\xbf\xfeh&\xc0C\x7f\r@\x0c\xf0Z\xbf\x91DM@\nzm?R\xc4\xb6<\x7fv\xd4\xbfA\x96\x91\xbeg\xd3\x8e>\xd8\xd3!?\xf1\x838\xc0\xf9^\xbf?|@{>x\xfc2@}/\x99?\x96hj\xbf\x86\xd2\xbe?3\x10m\xc0\x0f\xe9\xcb?\xc6\xc2\x9c?\xb2\xf4\x9d?-\xa6A\xbf*\xe5\xed?D\xf01=\xb2\xd5\xd9\xbf\t\x00\n\xc0\xca\xecb>f\xb6r\xc0\xa4\'\xe7\xbf\xea\x00\xa0\xbfD\xa03?9\xf6\x04@\x1b\x07\xbd?\x18^\x8a\xbf[\xcf\xb8=L\xfd\xa1\xbes;c\xbe\x1e7*\xbf\xb8~\xb7\xbd\x96\xa2\xaa<\x8e\xc0k?&\xf0\x1a\xbf\x1f\x8cM\xc0\xb1)\xe7?\xe4\xfeu\xbf\xd1\xd2"@\xf6\xa5%@y\xdf\xe9?\x87S\xae?\x8e\xef.\xc0\xc9\x91\xb5\xbf\x00\xdb\x12\xbf\x05}#\xbd\x1d\x8a\x16\xbf%\xcd\x1a\xbfb\xd9Z\xbf\xde\xbfC\xbf\xb1\xee\x18?\xa7\x1b\x9b\xbf(j\x05@\xbd\x06r? \xd7\x1d>\xbaWL\xbf\x9f\xf8\xfc>\x99\xa2)\xc0\xbf\xed\x99\xbf\x1d\xbd\x99\xbf\xea\x80h\xbe\x82H\x1d\xc0>G\xbc\xbf\x9f\xd8\x0e\xbf\xa2\x1aV?\xba\x0f\x14@\xb0\xed\xad?8\x11>\xbei\x18\x05\xc0\x19\x0c\xfd\xbf8\xf37@#\x14\x06@F\r\xf4?\x8a\x9er\xbf?p\xd8\xbe}\xdb\x99\xbf\x88\xf6\x19?\xab`w>]\xf6\x00\xbf\x8c\xd0+\xbf=V\xda?\xab3\x9f?Kq\xec\xbd\x893&\xbf\xf3A\x01\xc0R\xa8\x0c\xc0\xe7\xe5\n@\xd5\xc2\x00@\xc9V0@o\xfe\x82\xc0\xb1\x8a\x1f\xbf\xcd\x81!>\xbb\x17`\xbf\x16\xe9\xac?\xd9^\x95>):\x91\xbe\x0f\x08h\xbf\xe6R\xc9\xbf\xff\'E\xbe\x01\x85z?g\xb5\x1b@\xe80G@U\x1b\xd4\xbe\xf9\xb7\x8a?\x1a\xb3\xd1\xbf5\xb7\xb3>\x9c\x86h\xbf`\xd06\xbf\x89\x10\xa7?\xd0\x19\xda\xbf\x10\x81x?6Kh?\x0bT\x03@\xfeSd>\xce\x1d\xba?\t\xe6\x8b\xbe\x12\x8a\x96\xbe\x16\x84\xb8=OS!\xc0a=\x02@\xba\xd6\x95\xbe\xcb\xdd\x0b=h\xf5\xb5?f\x8c\x80\xbe&\xd5\x98\xbf\x10\t\xf1>I\xba\x89\xbf!\xcb7>q0\n@\xf4\x8e\x10\xbf86\x84?\xec\n\x06@?\x9b\x8b\xbe\x07\x99\xc5?\xb5Zp?,}<\xbf\xc1I\x98\xbfU\xc5\x9d\xbe\x9dS\x19\xbfhL\xd1\xbfre\xed\xbd:\x0fv\xbe\x07Vf\xbe\x82H\xa7\xbf\xe8\xf7\x04\xbf\x94\xf1P?\x04K\xe2\xbf|\xa4\x1c@&?5@\xc8\x92\x12\xbf\xc9\xe7i>\xff\x85-?\x1cJ]\xbf\xf50\xc2=\x02\xcdK@\xdc\x9c\x11\xc0\x13\x02\x99\xbf\xb1\xc9\xd7\xbe\x9d\x1c]\xbf\xf6\xcd\x93\xbf\xe02\n@R\xb2\'?\xed\xa2\x88?Oq\xeb\xbf\xb0\x05\x01\xbc/\xc7@?\'\xed\xde\xbe\xe3\x95\xdd\xbd\x06\x8b\xd8?K\x10\xaa>\nL\xfd\xbe\xe8\xd4\xec?\xea\x07d?M\xae\xeb>\xe9\x9e\xa0\xbe\xb7y\x88?\xfd\xf1\x16?\x1e\x07a?b|+?\xada\xff\xbe\x865V?\x01\xb5\xe9\xbf\xf62(\xc0\x1e/\xcb?\xd7\x8f\xb6=\xcd\x88]\xc0&\xfc\xde?\xb7 \x1f\xc0\xe1\xd9\x0b\xbf\x85\xb0I\xbf\x84\xc9\xc1\xbe\x1b\xea\x84?\xf8\xd00\xbfeg\xb3=\xa1t\t\xc0\xf0\xda1@(\x14\xa5?\xfc\x06\xf0\xbe\n\x1a*@\x04+\x99?\xd8\xa9\xbe?\xc7$\x84?Q]\xcd?E\xf0\x1b\xc0\xfdma\xbe\x1d\xb3\x12\xc0\x8f\xe9\xc4=\xcc\xe4\xfa\xbe\x14\xect\xbe\xc9\x05\xbe=`\xda\x05\xc0\xb5z\xc3?|\x15}?\xc3\\\xac?\xc7QW\xbfIu\xf4\xbe%**?\xb4Q,\xc0y-\x12@\xc1\xd0\x0f@:j\x01@k\x87\xba?b/\xe1\xbeh\xaa<\xbe59\x98\xbfa_\x07@\xd9a\x0c>\x01\x12\xa1?R\x16\x94\xbf\xc2\xdb\x03@\xef\xe0m\xbfl:\xb3=~\x95\x19\xbf\x9c\x1b]\xbd^o\x82\xbf\xa1i \xc0\xdd\x8dD\xc0\xcc\x04\xe3\xbf\x90\xbb\xba?\xb5\xf8\xa5\xbf%\xab\t\xc07\x05\x8b?\xa5\x16\xbe?\x0b`\x01\xbe/\xc2e?s\x0c\x88>z\xf2\x0e>\x97\x93#\xc0h\x9b\r@\x0bJ\x95\xbf4\xb8\x93>vSZ@\x0c7\xae\xbf\'\x82\x1a\xc0\xd1\x8b!>\x8ag\xa0?G\xcb\xa5>n@\xd5\xbf\x84\x0f\\@2\x88H?\x9bD\x8d?\xc5n\x80\xbf\xa7\xc8\x9d\xbfk\x10\xa1>\xa9< \xbe\xba\xc4\xc5=\x94\xc9\x1f\xc0\xdd\xc1\xd5>\xa0\x9c\xc6?)\x8d}\xbf\xd83\x91\xbeEb\xed<%\x1aE?\xaf\xd4\x05\xbe\xbc\xa3 ?\xd3#\x9e?xi\x14?\xe0G#@\xc7\xef \xbfI\xde:\xbf\x9a\xcf+\xbe\x8b\xa7\xaa?>0\x8e\xbf\xf1\xdd\x13\xc09\xea\xe4\xbfB\x1d#@*(\t\xc0+\x7f\x14@|@\x9e\xbfD\x89\xe4\xbf\x96<L?\x1f\x0e\x15\xc05\xfey\xbf&P\xae>\x95\xa3\xcb?\xa0z\xa4?6p\xf6\xbf!\xd4\x02@\xf2\xbe-\xbd(\xc8\x12\xbf\xa8R"=pGQ@>\xc2\x16\xbf\xc9\xd3.\xc0\x95\xb4\x83?\x94\x13\xcb?\xb4\x14\xee\xbf*\x8c\x1f@ZK\x1d@\xc2\x08J\xbfSsz\xbf\xc0"\xee\xbe\xd72\xb6\xbe\xd1\x03\x11\xbf;\xe6?>F\xbcK\xbfP]\xa7\xc0\xbaW\xbe>\xd18%>\xdbo\x1b\xc0k\xb8a\xbe\x15\xdd\xaa\xbfY\xaeW@\x03\x93\x11\xc0\xf3<M?^\x9a\xf2?U\rU\xbf\xe8\xde\x1f>\x07\xa8\x9c?\x04\x0f\x81\xbeI\x1b\xd7\xbe\xae\xbe\x1a\xbff\xb2?\xc0\xdd\xe3p>\xc3\xa1\xc7=\x12\xa9K>\x1b\x18\xdc=\x92\x97\xe2\xbf\x1ety\xbey\xa2X?k\xc3p?\x9b]\xb6?\xce\xb8\x1b?uG\x19@'}



```python
# Delete specific entries by ID or key
# By entry IDs (without prefix):
llmcache.drop(ids=[entry_id])

# Or by full Redis keys (with prefix):
# llmcache.drop(keys=[key])

# Verify it's deleted
result = llmcache.check(prompt="What is the capital of France?")
print(f"After deletion: {result}")
```

    After deletion: []


## Customize the Distance Threshold

For most use cases, the right semantic similarity threshold is not a fixed quantity. Depending on the choice of embedding model,
the properties of the input query, and even business use case -- the threshold might need to change.

The distance threshold uses Redis COSINE distance units [0-2], where 0 means identical and 2 means completely different.

Fortunately, you can seamlessly adjust the threshold at any point like below:


```python
# Widen the semantic distance threshold (allow less similar matches)
llmcache.set_threshold(0.5)

# Re-store an entry for the threshold demo
llmcache.store(prompt="What is the capital of France?", response="Paris")
```




    'llmcache:115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545'




```python
# Really try to trick it by asking around the point
# But is able to slip just under our new threshold
question = "What is the capital of the country where Nice is located?"
llmcache.check(prompt=question)[0]['response']
```




    'Paris'




```python
# Invalidate the cache completely by clearing it out
llmcache.clear()

# Should be empty now
llmcache.check(prompt=question)
```




    []



## Utilize TTL

Redis uses TTL policies (optional) to expire individual keys at points in time in the future.
This allows you to focus on your data flow and business logic without bothering with complex cleanup tasks.

A TTL policy set on the `SemanticCache` allows you to temporarily hold onto cache entries. Below, the TTL policy is set to 5 seconds.


```python
llmcache.set_ttl(5) # 5 seconds
```


```python
llmcache.store("This is a TTL test", "This is a TTL test response")

time.sleep(6)
```


```python
# confirm that the cache has cleared by now on it's own
result = llmcache.check("This is a TTL test")

print(result)
```

    []



```python
# Reset the TTL to null (long lived data)
llmcache.set_ttl()
```

### TTL Behavior Details

Understanding how TTL works with `SemanticCache` is important for production use:

| Scenario | Behavior |
|----------|----------|
| `ttl=None` (default) | Entries persist forever. `check()` does not affect TTL. |
| `ttl=3600` at init | Entries get TTL on `store()`. TTL is **refreshed** on every `check()` hit. |
| Set TTL later with `set_ttl(3600)` | **Existing entries keep no TTL**, but `check()` will now **add** TTL to matched entries. |
| Remove TTL with `set_ttl(None)` | Existing entries keep their TTL, but `check()` no longer refreshes it. |

**Important:** The `check()` method automatically refreshes TTL on all matched entries (sliding window pattern). This keeps frequently accessed entries alive but can unexpectedly add TTL to entries that were originally stored without one.

### TTL Refresh on Check

When `check()` finds matching entries, it refreshes the TTL on **all** matched results, not just the one you use:


```python
# Example: TTL refresh behavior
llmcache.set_ttl(300)  # 5 minutes

# Store an entry
llmcache.store("What is Python?", "A programming language")

# Every time check() finds this entry, TTL resets to 300 seconds
result = llmcache.check("What is Python?")  # TTL refreshed

# Reset for next examples
llmcache.set_ttl()
llmcache.clear()
```

## Simple Performance Testing

Next, measure the speedup obtained by using ``SemanticCache``. The ``time`` module measures the time taken to generate responses with and without ``SemanticCache``.


```python
def answer_question(question: str) -> str:
    """Helper function to answer a simple question using OpenAI with a wrapper
    check for the answer in the semantic cache first.

    Args:
        question (str): User input question.

    Returns:
        str: Response.
    """
    results = llmcache.check(prompt=question)
    if results:
        return results[0]["response"]
    else:
        answer = ask_openai(question)
        return answer
```


```python
start = time.time()
# asking a question -- openai response time
question = "What was the name of the first US President?"
answer = answer_question(question)
end = time.time()

print(f"Without caching, a call to openAI to answer this simple question took {end-start} seconds.")

# add the entry to our LLM cache
llmcache.store(prompt=question, response="George Washington")
```

    Without caching, a call to openAI to answer this simple question took 1.346540927886963 seconds.





    'llmcache:67e0f6e28fe2a61c0022fd42bf734bb8ffe49d3e375fd69d692574295a20fc1a'




```python
# Calculate the avg latency for caching over LLM usage
times = []

for _ in range(10):
    cached_start = time.time()
    cached_answer = answer_question(question)
    cached_end = time.time()
    times.append(cached_end-cached_start)

avg_time_with_cache = np.mean(times)
print(f"Avg time taken with LLM cache enabled: {avg_time_with_cache}")
print(f"Percentage of time saved: {round(((end - start) - avg_time_with_cache) / (end - start) * 100, 2)}%")
```

    Avg time taken with LLM cache enabled: 0.04209451675415039
    Percentage of time saved: 96.87%



```python
# check the stats of the index
!rvl stats -i llmcache
```

    
    Statistics:
    ╭─────────────────────────────┬────────────╮
    │ Stat Key                    │ Value      │
    ├─────────────────────────────┼────────────┤
    │ num_docs                    │ 1          │
    │ num_terms                   │ 24         │
    │ max_doc_id                  │ 9          │
    │ num_records                 │ 83         │
    │ percent_indexed             │ 1          │
    │ hash_indexing_failures      │ 0          │
    │ number_of_uses              │ 23         │
    │ bytes_per_record_avg        │ 36.7469863 │
    │ doc_table_size_mb           │ 0.01546192 │
    │ inverted_sz_mb              │ 0.00290870 │
    │ key_table_size_mb           │ 2.76565551 │
    │ offset_bits_per_record_avg  │ 8          │
    │ offset_vectors_sz_mb        │ 5.72204589 │
    │ offsets_per_term_avg        │ 0.72289156 │
    │ records_per_doc_avg         │ 83         │
    │ sortable_values_size_mb     │ 0          │
    │ total_indexing_time         │ 4.01000022 │
    │ total_inverted_index_blocks │ 26         │
    │ vector_index_sz_mb          │ 3.01629638 │
    ╰─────────────────────────────┴────────────╯



```python
# Clear the cache AND delete the underlying index
llmcache.delete()
```

## Cache Access Controls, Tags & Filters
When running complex workflows with similar applications, or handling multiple users it's important to keep data segregated. Building on top of RedisVL's support for complex and hybrid queries we can tag and filter cache entries using custom-defined `filterable_fields`.

Let's store multiple users' data in our cache with similar prompts and ensure we return only the correct user information:


```python
private_cache = SemanticCache(
    name="private_cache",
    filterable_fields=[{"name": "user_id", "type": "tag"}]
)

private_cache.store(
    prompt="What is the phone number linked to my account?",
    response="The number on file is 123-555-0000",
    filters={"user_id": "abc"},
)

private_cache.store(
    prompt="What's the phone number linked in my account?",
    response="The number on file is 123-555-1111",
    filters={"user_id": "def"},
)
```

    You try to use a model that was created with version 4.1.0, however, your version is 3.4.1. This might cause unexpected behavior or errors. In that case, try to update to the latest version.
    
    
    





    'private_cache:2831a0659fb888e203cd9fedb9f65681bfa55e4977c092ed1bf87d42d2655081'




```python
from redisvl.query.filter import Tag

# define user id filter
user_id_filter = Tag("user_id") == "abc"

response = private_cache.check(
    prompt="What is the phone number linked to my account?",
    filter_expression=user_id_filter,
    num_results=2
)

print(f"found {len(response)} entry \n{response[0]['response']}")
```

    found 1 entry 
    The number on file is 123-555-0000



```python
# Cleanup
private_cache.delete()
```

Multiple `filterable_fields` can be defined on a cache, and complex filter expressions can be constructed to filter on these fields, as well as the default fields already present.


```python

complex_cache = SemanticCache(
    name='account_data',
    filterable_fields=[
        {"name": "user_id", "type": "tag"},
        {"name": "account_type", "type": "tag"},
        {"name": "account_balance", "type": "numeric"},
        {"name": "transaction_amount", "type": "numeric"}
    ]
)
complex_cache.store(
    prompt="what is my most recent checking account transaction under $100?",
    response="Your most recent transaction was for $75",
    filters={"user_id": "abc", "account_type": "checking", "transaction_amount": 75},
)
complex_cache.store(
    prompt="what is my most recent savings account transaction?",
    response="Your most recent deposit was for $300",
    filters={"user_id": "abc", "account_type": "savings", "transaction_amount": 300},
)
complex_cache.store(
    prompt="what is my most recent checking account transaction over $200?",
    response="Your most recent transaction was for $350",
    filters={"user_id": "abc", "account_type": "checking", "transaction_amount": 350},
)
complex_cache.store(
    prompt="what is my checking account balance?",
    response="Your current checking account is $1850",
    filters={"user_id": "abc", "account_type": "checking"},
)
```

    You try to use a model that was created with version 4.1.0, however, your version is 3.4.1. This might cause unexpected behavior or errors. In that case, try to update to the latest version.
    
    
    





    'account_data:944f89729b09ca46b99923d223db45e0bccf584cfd53fcaf87d2a58f072582d3'




```python
from redisvl.query.filter import Num

value_filter = Num("transaction_amount") > 100
account_filter = Tag("account_type") == "checking"
complex_filter = value_filter & account_filter

# check for checking account transactions over $100
complex_cache.set_threshold(0.3)
response = complex_cache.check(
    prompt="what is my most recent checking account transaction?",
    filter_expression=complex_filter,
    num_results=5
)
print(f'found {len(response)} entry')
print(response[0]["response"])
```

    found 1 entry
    Your most recent transaction was for $350


## Next Steps

Now that you understand semantic caching, explore these related guides:

- [Cache Embeddings]({{< relref "embeddings_cache" >}}) - Cache embedding vectors for faster repeated computations
- [Manage LLM Message History]({{< relref "message_history" >}}) - Store and retrieve conversation history
- [Query and Filter Data]({{< relref "complex_filtering" >}}) - Learn more about filter expressions for cache access control

## Cleanup


```python
complex_cache.delete()
```
