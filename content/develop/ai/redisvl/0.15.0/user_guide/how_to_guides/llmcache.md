---
linkTitle: Cache llm responses
title: Cache LLM Responses
weight: 03
url: '/develop/ai/redisvl/0.15.0/user_guide/how_to_guides/llmcache/'
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
- Customize semantic similarity thresholds
- Configure TTL policies for cache expiration
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

    The capital of France is Paris.


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
    vectorizer=HFTextVectorizer("redis/langcache-embed-v1"),  # embedding model
)
```


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



## Customize the Distance Threshold

For most use cases, the right semantic similarity threshold is not a fixed quantity. Depending on the choice of embedding model,
the properties of the input query, and even business use case -- the threshold might need to change.

The distance threshold uses Redis COSINE distance units [0-2], where 0 means identical and 2 means completely different.

Fortunately, you can seamlessly adjust the threshold at any point like below:


```python
# Widen the semantic distance threshold (allow less similar matches)
llmcache.set_threshold(0.5)
```


```python
# Really try to trick it by asking around the point
# But is able to slip just under our new threshold
question = "What is the capital city of the country in Europe that also has a city named Nice?"
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

    Without caching, a call to openAI to answer this simple question took 3.055630922317505 seconds.





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

    Avg time taken with LLM cache enabled: 0.05140402317047119
    Percentage of time saved: 98.32%



```python
# check the stats of the index
!rvl stats -i llmcache
```

    
    Statistics:
    ╭─────────────────────────────┬────────────╮
    │ Stat Key                    │ Value      │
    ├─────────────────────────────┼────────────┤
    │ num_docs                    │ 1          │
    │ num_terms                   │ 19         │
    │ max_doc_id                  │ 4          │
    │ num_records                 │ 36         │
    │ percent_indexed             │ 1          │
    │ hash_indexing_failures      │ 0          │
    │ number_of_uses              │ 19         │
    │ bytes_per_record_avg        │ 62.3888893 │
    │ doc_table_size_mb           │ 0.00782489 │
    │ inverted_sz_mb              │ 0.00214195 │
    │ key_table_size_mb           │ 1.14440917 │
    │ offset_bits_per_record_avg  │ 8          │
    │ offset_vectors_sz_mb        │ 2.67028808 │
    │ offsets_per_term_avg        │ 0.77777779 │
    │ records_per_doc_avg         │ 36         │
    │ sortable_values_size_mb     │ 0          │
    │ total_indexing_time         │ 1.366666   │
    │ total_inverted_index_blocks │ 21         │
    │ vector_index_sz_mb          │ 3.01630401 │
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
