---
linkTitle: Cache llm responses
title: Cache LLM Responses
weight: 03
url: '/develop/ai/redisvl/0.17.0/user_guide/how_to_guides/llmcache/'
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

    **
    
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


```python
# look at the index specification created for the semantic cache lookup
!rvl index info -i llmcache
```

    
    
    Index Information:
    ╭───────────────┬───────────────┬───────────────┬───────────────┬───────────────┬╮
    │ Index Name    │ Storage Type  │ Prefixes      │ Index Options │ Indexing      │
    ├───────────────┼───────────────┼───────────────┼───────────────┼───────────────┼┤
    | llmcache      | HASH          | ['llmcache']  | []            | 0             |
    ╰───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴╯
    Index Fields:
    ╭─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬╮
    │ Name            │ Attribute       │ Type            │ Field Option    │ Option Value    │ Field Option    │ Option Value    │ Field Option    │ Option Value    │ Field Option    │ Option Value    │
    ├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼┤
    │ prompt          │ prompt          │ TEXT            │ WEIGHT          │ 1               │                 │                 │                 │                 │                 │                 │
    │ response        │ response        │ TEXT            │ WEIGHT          │ 1               │                 │                 │                 │                 │                 │                 │
    │ inserted_at     │ inserted_at     │ NUMERIC         │                 │                 │                 │                 │                 │                 │                 │                 │
    │ updated_at      │ updated_at      │ NUMERIC         │                 │                 │                 │                 │                 │                 │                 │                 │
    │ prompt_vector   │ prompt_vector   │ VECTOR          │ algorithm       │ FLAT            │ data_type       │ FLOAT32         │ dim             │ 768             │ distance_metric │ COSINE          │
    ╰─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴╯


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

    Fetched record: {'prompt': 'What is the capital of France?', 'prompt_vector': b'\x80;\xdb?|\x0b\xaa\xbfj~\xb7\xbe\xd6\xcdX\xc0i\xa6\xa7?2r\x12\xbe\x81U\x17\xc0\x06jt\xbf\xd1M\x04\xc0Pd\x8d\xc08,\x17?\xce\xef\x04\xc0\x94\xb2\x9a\xbf\xa2@\x99\xbf\xa1\xd7\x8b\xbeX\xf4=\xbf.B\x1c\xbf3\xc2(\xbf6s\xdf\xbd\x8b\x9b$\xbf\x90\xab$\xbfQX}\xbf-*\x84\xbfW\x02\r?\xb1\xce\x17\xc0\xe6\xab\x8a>{l\xca=\xc4\x14\x9d\xbe\x7f,\x11\xc0f\x9b\xbc=\xb8;">$\x1a\x1a\xc0/\xd0\x8f?\xf4\x02\x85>\x10\x8a\xc3\xbe\xbb-6\xbb>xm\xc0Gx"\xbf\x1b@u\xbd$\xe9S\xbe\x91\xe55\xbdR\x11u@\x8a\xab>@\x9d\xd7\xe7?\'L\xe0\xbf\xfb8;?>\xce\x98\xbf.\xe0\xad\xbez\xdf\xdf?\xbb\x14\xaa?\xf92m\xbf\x1e\x9e\xde?\xe9\xaf\xf4>\x91\x80\xcd?\xa1lc\xbf\x9a>-?=[q\xbf\xfb\x1at\xc0\'\x1fc?\x11\xab\x83\xbf\xee\xa6&\xc0+~\xb8?o\x14\xe9\xbe\xe3\xab\x9c?\x1e\xc4K?\xe7Z\xa8?\xe2;\xbc?\xb1L\x9d@\x9b\xe9;?:-Y?\x81<\\@i\xaf\x9a>\xf0\xa3\x0c;\x04\\\xb7\xbf3\x1a9\xbf\xcc?\x02\xbf\xa3\xf5\xc8\xbfV7"?\xd9_8\xc0\xb0\x86M?\xc3\xda\x03@\x9c\x80\x95\xbf\x8e\xfa\xa5?\x14\xb1\x05@z\xb9n?{\xc5c\xc0|z\x9d>\x18b\xa2\xbe?\xea\x17\xc0@\xe0\xa2?\x98`\x0c?\xfak\xb9\xbe\xcdX:?\xe7,m\xbf\n\x0e@\xbe\xb8\xd8[\xc0\xdf\x1f\n\xbf\xcb\r\t\xbd\xcb`\xd6\xbf\xad&\n>\x19\x18\x8f\xbf\xf0\xd5\x19\xc0\xa8\x81\xbd\xbe|\x10\x99\xbf\x81\x87\xe6>`\xa4\xcc?U$U\xbfN\xb7\x1a\xc0x\xef\x95>4O\xa8?\xa3.\xf2\xbe\x16\x1d\r\xbfw\x11\xc6\xbf.\x9c\xd2\xbe\xb6\xfc\x00@E\x0b\x85\xbenT\xf4?\xc26E\xbeB\xa4#?\xe4mV?hX\xcb?\xcbzu?\xfa,\xf8\xbfE\x88\x8a?\x04\x8e\xc8?\x92;\xcf??\xf3;?\xec\xa0\xc6\xbf\x94}u\xbe\x11?\x7f\xbeA\xebD?\t\xbc\x8f\xbe7*\xa0?8T\xc4\xbf&\x00\xe3=\xdd\xb6\t>\xa3\xea\xef>\xf6\xe3\n@\xa5\xbf\x80\xbfA\xea\xd7>\x8df0\xbf\xf9 .\xbf\x1c.7>D6\x15?v\xc7\x1e\xbf\xba\xdc\x18\xbf\xf57\xd6?\x88\xae\x03@\xa9\xd3"\xbe\x90\x1cY\xbe\xecn\x8a\xbeN\xb9\x12\xbf\x0f\xe2U>\xbc\x06\xac\xbf99r\xbf\x82U\xe7\xbf\x17(\xe2\xbfzk\xb2=\xdc\xf1\r@\xbe\xaf\xbe\xbez\x9d\xc7?\x96\x8a\xb7\xbe\x8e\xb8=\xbf<\xd2a\xbd7\xe7\x11@4:e\xbf\xbb\x9b@\xbe4\xa8\x0c\xbe\xe1:\x9e\xbe\xa8\x8bp\xbf\xe2\x16\x9d@\x902M\xc0*v\x8f>\xc5X|\xbe\xfe\xe4\x84?\xa8\x93\xda\xbe\x02\r\xfb\xbfe\x82\xfa?\x17\x9d\'\xc0\xc1T\xca\xbf\xd3\xc4\x8c\xbe=9\xf7\xbez.\xa4\xbf!{\x85\xbf\x85/\xa5=\xcb\xe1\x97?\nW<\xbf2v\xe6\xbf\xe2\xfc\xd9\xbc\x93r\x1b?\xba7W=\xd0/\r\xc0J\xf6;\xbe\xdc6\xba?\xdd\xce\x99\xbf\xcf\xfe\xe5>\xe3\xf6\r\xc0n\xed\xa9\xbfn\x9c\x1a?\xe8\x0f\x92\xbd\xb0y\x0b@O\xf8\x90?rq+\xc0\xb3\xa7=?\xfdl\xc3\xbf\xd6Z\x01?Z\xd69\xbf\x1c\x06\xba?\xfc\\\x96\xbf\x91\xee\xe9?\xbf\xc5\xda>W\xed\x97?\x1d\xc4\x0c?\x15\x93\xbb?\x8d\xaf\x87\xc0\x06{D\xbeK\xb9\xdb?a\x19}\xbf_(9\xbf\xecL\'@\xa2\xc2\xdd?\x06\x86\xc8\xbe\x94N\x1a\xc0\x9c\x13\xce>\xab\x9ae\xbfC\xf6\xde\xbem\n\xce\xbe\x17\xd5\x04@5Mf\xbe\xf4\xea\x8d?\xb4\xa2=\xbf>\xbc\x1a\xc0\x01H\x93?*X\x87?|6\xa4?\xa5`\xbc\xbe~L\xa7>\xa5@\x95\xbeZo\x8a\xbf\x10\xec\x8d\xbee\xe3+@\xd3\xd8\xa2\xbf\xf6+<?E\x03\x0e\xc0\x8b=,\xbfOP\x8f\xbf\x8eH\xda?|\xd2m?\x87\xb9\x1f\xbf\xd5\x1c\xaf\xbf\x92Yr@\xf9M\x91\xc0a\xa4\xaa?w\x0e\xf4\xbf\xc0\x0c{\xbf!\xc5\xa2=\xe4\xe8\xfe?\x84\x07\xd4?\xa4h\x89\xc0\xe1a\xa7?h\tJ\xbf\x11\x1d\n?\x07\xf2\xa8\xbf\x0f`L?C\x9a?@!_\x0b\xc0V\xef\xf2\xbc\xbe\x19\xc2\xbdQw[=\xaa\xe0M\xbf09!?~\x01o>\xacG.\xc0\xc0\x13\xaa?D\xea"?\xa5\xc5\xb3?\xbe\x12\xa4?\xea<\x19@\x92X\xd0?\x8c\xa9i\xbf\xb8I\x1d?\x19\xca\xf8?L\x0c\x85>\xdcd\xb8\xbf\xda@v\xbd4\xb3\xf9\xbf\xa6\x80\x83<x\xbe\x88?\xb6HK?\x8d1\x15@\xae\x07\x05?M\x18\x12\xc0R!\x9f\xbf\xc3\xc5\x07@\xd0\xdf\x83?#\xed\xf8\xbf^\x05\xe6\xbd\xf0\xbdq?9;\'@\xd2Y\x9b?\x1d\xbf\xfc>\x94=\x07\xc0\xef>\r@ \x9b\x95?4\x803\xbf1\r\xf3?>v>>\x1cx\xc9>Au2@\x98n$@\x8e\xa9O\xbf#S6=\xf6G9?\xc6;\x81\xbf$w\xd7?\x11\x89L\xbf\xb7\x1f\xec;\x8e\xab\x06\xc0\xba\x16\xb2\xbe0\xa8\'\xc0\xf4\x17j?\x84\xd7\xa5?,\xe7\xd0\xbe\xa7\xd6\xea?\xc5\xec\xfa?\xdaa\xee?#\x07\xe8\xbe\xed\xda\xe7;jC\xac\xbf\x17\xc1f?\xedx|\xbe\xe6\x1d\xd5\xbf\xb6;$\xc0<v\x1a\xc0ZK\xf9\xbf\x98 3\xbf\xd2\x90\x17\xbe\xe9e5\xc0\xa1\xd2d?\x03$\'?\xf7\xe6,\xbf\xeb\xd7\xef\xbf\xf5L\x17\xbe\r:l\xbf\xfd\xd3\xb2=\xfeQ\xc2?\x10\xb3\xf4\xbfs))@2\xad\xc1>\xe0\xdd\xc9\xbcGN\x07\xc0J;\x08\xc0\x85\xfa}\xbf\x04\xc7]?\xaa\x8b\xd2?\xc7\x01\xa9?\x80\xac\x0c@gG\x94?\xf7S\xa1?\xe2\xb2\xc2\xbf\x9aD\x01@\r\xac\xf8?\x8f\xcf\xe4\xbe\xc22]\xbe\x0fU\xab\xbe\x8b\x80\xdf>T\xb5V\xbfy\x7f\xc0?y\x10\xf6=\xb1$O?HE?\xbd\xda\xa9\xbe=\xf2\xc4\xf1\xbei\x8f\xfb?\x13}o?\xf2&\xc7\xbf\n\xc9\x9a<=\x8c7@!\xbf\x80\xbfk?\xdb?9\xb9\x82?u\x1a\x16\xbf\xd5\xee*\xc0\xc4\x84\x1a\xbf\xf8>q\xbe\x80\xccu?\xbe\xeb\xff\xbeH\x14\xa1?\xc4\x80h>C\\\x80\xbe5\x9f\x12>A\x16D\xbf\x007y>Q\xaf\x90@\xe2\xf6\xed\xbd; R?\xda\xe6\xb9\xbf\xcbNZ\xbf\xd2\xbe\xe7?\xf2E\xe4\xbfn\xde\x95\xbf\xdaq\x84?B}\x0b@}\x90\x9a?\xbc\x8f#?\x94> \xc0\x82.\xa0\xbfaz\x08?)\x06L\xbf\xaa\xe5\xc9?9o\x08@\xd3\x8e\x0c\xbe\xbbb^?%\x8f\x0e\xc0\x90d-??X*?At*\xbf\xb8\xb9\x11\xc0\xf5\x93\xfb?RID\xbf\xcbZC@\xfeu\x18?rJ\x81\xbej\xa4\xce\xbf]\x99\x7f<\xd9\x07\x86>\xd8z\x9a?\x13\xa86\xc0\x18>\xce?\xac\xa8+>Q\xd9&@\xfa\xfc\x85?\nJ\x8e\xbfjx\xc6?\xbe\x89`\xc0\xf2\xad\xd9?\x967y?\x8b\xd2\x98?\xf5q\x9e\xbf\x86|\xa5?\x9d\xc5\xc2\xbe\x9d\xd2\xc1\xbf5:\xca\xbfp\x8a\x00>\xb5Iy\xc0\x84\x1b\xa5\xbf\xf6\xb7\x84\xbf\xb0}\x8e?+\xea\x0b@\x10\xc5\xb9?_\xadt\xbfdw\xaf\xbe9=\x19\xbe\xef\x07\x00<\x12+X\xbf\xech\xcb>e\xa6\x00<U\xf3\x80?\x99\x04-\xbf\xbe/K\xc0U\x00\xa8?\xb4\x8c\x99\xbf{\xad\x11@\x1cz7@\xa6\xa5"@\x94\xef\xe9?BmD\xc0\x98D\x85\xbf\xb3\xff\x1a\xbf\xaa\x82\x8e>#\x9e\x17\xbfx\x19\x12\xbf\xaa8\xb6\xbf\xcdLC\xbf\x8a\x92\xea\xbd\xa2\x8ej\xbf\'\xc7\xff?&\xad\xfb\xbd\x9c\x83 ?\x12\xa3U\xbf\x1a\x83\xf5>\x8a\xe5$\xc0Z[\x87\xbf\xbc\x16\xa3\xbf\xd7Z\x81>\r\x0f\x00\xc0xx\xb6\xbfQ\xdao\xbf\nV{?\x01\xb5\x14@\x93\xc5z?F[\x05\xbfL\x01\t\xc0\xdd\xee\x02\xc0\x17j>@\x87\xde\xfc?X\xd2\x04@\x9d\xfa\x00\xbd7\xc0=\xbf$\x07)\xbf\xe1\x13\xa6>\x9c\xad\x07\xbf/Y.\xbf/\x99]\xbfN\xc6\xa4?f\xd1\x91?\xfaB\xa7\xbe\x86\xf06\xbf\xb1M\x00\xc0\xf5\xdb\xdb\xbf)\xdc\xfb?\x9e\xc8\xe0?}gE@y\xe1\x81\xc0\xb7A\xac\xbe:\xaf\xcd>\xabJ\x82\xbf\xdb\xbc\x88?\x1a\xcd\xa7>\xf9"\r\xbf\x85l\x82\xbf\x02T\xce\xbf~\xe6\x97\xbe+c\xa3?\xd9\xc6!@\xc9zG@||L>\x9e\x0b\xa4?t\xa9\xc6\xbf\xa9\xdd\xdd>\r\x00[\xbf5\xecH\xbf)a\xd8?\xda\xb4\xe4\xbf\xec?\xa3?Q5]?\x8d\xf3$@\xfe\xef\x1e>\xfc\xf9\x97?_`\x02\xbe\xb4\xf1.\xbdv3R\xbf$(4\xc0wF\xd5?\x9a\x19Y\xbf\xec\x84\xcb\xbd\xc0q\x93?|1\x16\xbf\x01\x88G\xbfZ\x88\x04>\x9c\xed\x1a\xbf%\'\x00?\xb3\xf5\x18@\'\xb93\xbfRw\x95?]\x82\xb6?\xf6h^\xbf\xf1\x15\x92?\xb5\xc1\x01?\xb3\xf1\x17\xbf\x19.|\xbf\xaa\x05\x9c<n\xc6{\xbfqr\x1a\xc0V\x18\xde>\xcb\xce\x08> g\xcf\xbe5\xd0\xa3\xbf\x8f*\xc5\xbeS\x1d\xc9>\xfeG\xcd\xbf\xf4\xed\x18@F|!@o\x90!\xbf\xd4\xf4+>\xbc\xb5\x90?0\xd94\xbf\x1e\xa4"\xbe\xca\xb2.@\xf2\xbe\xfa\xbf\xa0\x90\x8b\xbf\xc6\xe8\x16\xbf|\xa9.\xbf\x8f\x94\xd3\xbf\xfd\n\x08@\x8f\x18E?\x14\xab\xaf?s\xee\xb2\xbf\xbb\xfa\x17\xbe\x84m\x93?\x06\xf2]\xbf\xcdJ\xc8\xbe\x88\r\xd4?\xea\xaa\xe7>%\x1a\xca\xbe\xfb\x01\xab?Dx\xfe>\xabd\x85= _4\xbf\xb2\x99~?\xf0H!?+\xfaU?\xa87\xb1>M\xe57\xbfb\xb6f?\xb5,\x00\xc0\xdb\xbdA\xc0C\xb0\xc2?\xa3\x00\xc9\xbe\xb9\xfdF\xc0\xb0\n\xcf?\xe4\x83\x14\xc00\xc8\xaf\xbe\xb7M@\xbf3\x17\x98>Mw\x19?_\xc1[\xbf6\xa3\x87\xbe-\xc0\xb7\xbf\xae\xd5:@\xcd\x13\xac?\xcd7\xae\xbe\xbaT6@\x8e/T?\x89\xe3U?>^\xa1?\x13b\x95?+\x0e\x19\xc0o\xd6"\xbfO@\x0c\xc0\xddJ\xa5\xbd\x94`(\xbc\x87<*\xbf7\x1a\x07?\xe5Z\x01\xc0\xce\xb9P?]\xea\x00?D\x89\x8d?\x02\xbf\xb8\xbe\x93\xa1h\xbfQ\x1er?\xa204\xc02\xc3\xf1?\xed \x10@\xae#\xdf?\xc5\xc4\xd7?\x84\xa7m\xbf\xbfv\x96=\x0c\xc2z\xbf\xd1j\x14@u\x83\x87=\xd3\x80K?\x92:p\xbfQ}\x0b@\xd5\xd2\x98\xbf7w]>Vt\x97\xbe\xa2\xcc\x11\xbe\xd8\x9a\x01\xbf.\x1f\x13\xc0\xc5Q\x18\xc0-"\xfe\xbf\xa69V?\xf5\x08\xc6\xbf\x1a5\x0f\xc0\xbc50?\rR\xee?\xb3\x18q>i\xf2U?*\xfc\xfc>*\x1ez>\xa1\xee\x1d\xc0\xd7\x13\x1e@r\x9a\x8e\xbfy1r\xbe\x9e\xda<@\x06\x82\x89\xbf\x18\xf8\x10\xc0}\xd3\xaa>\x90\xa4\x07@U\xcf\x05?\x14\x93\x05\xc0\xa4\x12o@\xf9\xfd\xea>A\x14s?P\xbe\x93\xbf\xb6n\x11\xbfn\xb9\xc3\xbd\x1e\x0c\xa1=0\xe7L\xbe\xca#%\xc0\x19\xaa\xc6><Y\xd2?2\xa6\x97\xbf\xfbL\xe1\xbe\x9bBR>\x13\xbcR>\xb5\xa7T=|\xcfh?#\xa8\xa5?\x9e\x8f\x1d?\xfc\xc9\x02@\xe8\x9e\x99\xbdA\xc3O\xbf\xc5\x06>>"8\x8e?\x96\xd2T\xbf\x91\xf6\x0e\xc0f\x95\xc9\xbf\xdc\x01\x12@c\n\x01\xc0\x98\xad?@\xa0E\xbc\xbf\x02\x8b\xd4\xbf\x83\x97\x86?\x1d\x16\x05\xc0\xff>+\xbf\xb1\xdb8>\xbd\xc2\xf8?xe\x9e?W\x8c\xec\xbf\xf5\xc3\x00@\x96,\x99=\xd9\xb0\xd4\xbe\x93\x94^?<\xadA@%Ud\xbe3\xd9\x15\xc0b5\x81?X\xfe\x18@\xf5\xe5\xc0\xbf"\x13\x00@\xd9\xc61@\xc7~\xcd\xbe\x19o\x8a\xbf\xb7\xb9/\xbfZdE\xbf\xd4\xb8T\xbfN\x88\x8d>\tA.\xbfd\xac\xba\xc0m\xbc_\xbe\x14\xb7:\xbe\xcf \xf5\xbf\xbb\xfb\xb6>\xd5\xc8\x8c\xbf\xff\xc6L@\x91(\xcd\xbf\x0e\x83\xc9>+-\x9c?#{i\xbf\xe6\x94\xd6>\xc4\xd2i?XD\xf2\xbe\xad\x19p\xbe\x07\xd9\x99\xbfO\xe56\xc0\xb3]|>\xd5\x9df\xbe\xa5\x9a\x80>0\x16\xbf>\xf8\xeb\xfb\xbf\x8ad\xc8\xbe:pt?m6<?\xda\x96\x90?-d:>\xbe\x1f\x1f@', 'metadata': '{"source": "geography"}', 'entry_id': '115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545', 'response': 'Paris', 'inserted_at': '1772490439.163563', 'updated_at': '1772490439.163563'}



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


```python
# Really try to trick it by asking around the point
# But is able to slip just under our new threshold
question = "What is the capital of the country where Nice is located?"
llmcache.check(prompt=question)[0]['response']
```


    ---------------------------------------------------------------------------

    IndexError                                Traceback (most recent call last)

    Cell In[16], line 4
          1 # Really try to trick it by asking around the point
          2 # But is able to slip just under our new threshold
          3 question = "What is the capital city of the country in Europe that also has a city named Nice?"
    ----> 4 llmcache.check(prompt=question)[0]['response']


    IndexError: list index out of range



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

    Without caching, a call to openAI to answer this simple question took 0.865767240524292 seconds.





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

    Avg time taken with LLM cache enabled: 0.013062572479248047
    Percentage of time saved: 98.49%



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
    │ num_records                 │ 88         │
    │ percent_indexed             │ 1          │
    │ hash_indexing_failures      │ 0          │
    │ number_of_uses              │ 41         │
    │ bytes_per_record_avg        │ 34.8636360 │
    │ doc_table_size_mb           │ 0.01545429 │
    │ inverted_sz_mb              │ 0.00292587 │
    │ key_table_size_mb           │ 2.76565551 │
    │ offset_bits_per_record_avg  │ 8          │
    │ offset_vectors_sz_mb        │ 6.00814819 │
    │ offsets_per_term_avg        │ 0.71590906 │
    │ records_per_doc_avg         │ 88         │
    │ sortable_values_size_mb     │ 0          │
    │ total_indexing_time         │ 1.14699995 │
    │ total_inverted_index_blocks │ 103        │
    │ vector_index_sz_mb          │ 3.01609802 │
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

- [Cache Embeddings](10_embeddings_cache.ipynb) - Cache embedding vectors for faster repeated computations
- [Manage LLM Message History](07_message_history.ipynb) - Store and retrieve conversation history
- [Query and Filter Data](02_complex_filtering.ipynb) - Learn more about filter expressions for cache access control

## Cleanup


```python
complex_cache.delete()
```
