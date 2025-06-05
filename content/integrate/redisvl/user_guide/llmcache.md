---
linkTitle: Semantic caching for LLMs
title: Semantic Caching for LLMs
type: integration
weight: 03
---


RedisVL provides a ``SemanticCache`` interface to utilize Redis' built-in caching capabilities AND vector search in order to store responses from previously-answered questions. This reduces the number of requests and tokens sent to the Large Language Models (LLM) service, decreasing costs and enhancing application throughput (by reducing the time taken to generate responses).

This notebook will go over how to use Redis as a Semantic Cache for your applications

First, we will import [OpenAI](https://platform.openai.com) to use their API for responding to user prompts. We will also create a simple `ask_openai` helper method to assist.


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
      model="gpt-3.5-turbo-instruct",
      prompt=question,
      max_tokens=200
    )
    return response.choices[0].text.strip()
```


```python
# Test
print(ask_openai("What is the capital of France?"))
```

    19:17:51 httpx INFO   HTTP Request: POST https://api.openai.com/v1/completions "HTTP/1.1 200 OK"
    The capital of France is Paris.


## Initializing ``SemanticCache``

``SemanticCache`` will automatically create an index within Redis upon initialization for the semantic cache content.


```python
from redisvl.extensions.cache.llm import SemanticCache
from redisvl.utils .vectorize import HFTextVectorizer

llmcache = SemanticCache(
    name="llmcache",                                          # underlying search index name
    redis_url="redis://localhost:6379",                       # redis connection url string
    distance_threshold=0.1,                                   # semantic cache distance threshold
    vectorizer=HFTextVectorizer("redis/langcache-embed-v1"),  # embedding model
)
```

    19:17:51 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    19:17:51 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: redis/langcache-embed-v1


    Batches: 100%|██████████| 1/1 [00:00<00:00, 17.57it/s]



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

    Batches: 100%|██████████| 1/1 [00:00<00:00, 18.30it/s]

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

    Batches: 100%|██████████| 1/1 [00:00<00:00, 26.10it/s]





    'llmcache:115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545'



Now we will check the cache again with the same question and with a semantically similar question:


```python
# Check the cache again
if response := llmcache.check(prompt=question, return_fields=["prompt", "response", "metadata"]):
    print(response)
else:
    print("Empty cache")
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 12.36it/s]


    [{'prompt': 'What is the capital of France?', 'response': 'Paris', 'metadata': {'city': 'Paris', 'country': 'france'}, 'key': 'llmcache:115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545'}]



```python
# Check for a semantically similar result
question = "What actually is the capital of France?"
llmcache.check(prompt=question)[0]['response']
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 12.22it/s]





    'Paris'



## Customize the Distance Threshhold

For most use cases, the right semantic similarity threshhold is not a fixed quantity. Depending on the choice of embedding model,
the properties of the input query, and even business use case -- the threshhold might need to change. 

Fortunately, you can seamlessly adjust the threshhold at any point like below:


```python
# Widen the semantic distance threshold
llmcache.set_threshold(0.5)
```


```python
# Really try to trick it by asking around the point
# But is able to slip just under our new threshold
question = "What is the capital city of the country in Europe that also has a city named Nice?"
llmcache.check(prompt=question)[0]['response']
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 19.20it/s]





    'Paris'




```python
# Invalidate the cache completely by clearing it out
llmcache.clear()

# should be empty now
llmcache.check(prompt=question)
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 26.71it/s]





    []



## Utilize TTL

Redis uses TTL policies (optional) to expire individual keys at points in time in the future.
This allows you to focus on your data flow and business logic without bothering with complex cleanup tasks.

A TTL policy set on the `SemanticCache` allows you to temporarily hold onto cache entries. Below, we will set the TTL policy to 5 seconds.


```python
llmcache.set_ttl(5) # 5 seconds
```


```python
llmcache.store("This is a TTL test", "This is a TTL test response")

time.sleep(6)
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 20.45it/s]



```python
# confirm that the cache has cleared by now on it's own
result = llmcache.check("This is a TTL test")

print(result)
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 17.02it/s]

    []


    



```python
# Reset the TTL to null (long lived data)
llmcache.set_ttl()
```

## Simple Performance Testing

Next, we will measure the speedup obtained by using ``SemanticCache``. We will use the ``time`` module to measure the time taken to generate responses with and without ``SemanticCache``.


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

    Batches: 100%|██████████| 1/1 [00:00<00:00, 14.88it/s]


    19:18:04 httpx INFO   HTTP Request: POST https://api.openai.com/v1/completions "HTTP/1.1 200 OK"
    Without caching, a call to openAI to answer this simple question took 0.8826751708984375 seconds.


    Batches: 100%|██████████| 1/1 [00:00<00:00, 18.38it/s]





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

    Batches: 100%|██████████| 1/1 [00:00<00:00, 13.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 27.94it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 27.19it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 27.53it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 28.12it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 27.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 25.39it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 26.34it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 28.07it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 27.35it/s]

    Avg time taken with LLM cache enabled: 0.0463670015335083
    Percentage of time saved: 94.75%


    



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
    │ max_doc_id                  │ 3          │
    │ num_records                 │ 29         │
    │ percent_indexed             │ 1          │
    │ hash_indexing_failures      │ 0          │
    │ number_of_uses              │ 19         │
    │ bytes_per_record_avg        │ 75.9655151 │
    │ doc_table_size_mb           │ 1.34468078 │
    │ inverted_sz_mb              │ 0.00210094 │
    │ key_table_size_mb           │ 2.76565551 │
    │ offset_bits_per_record_avg  │ 8          │
    │ offset_vectors_sz_mb        │ 2.09808349 │
    │ offsets_per_term_avg        │ 0.75862067 │
    │ records_per_doc_avg         │ 29         │
    │ sortable_values_size_mb     │ 0          │
    │ total_indexing_time         │ 3.875      │
    │ total_inverted_index_blocks │ 21         │
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

    19:18:07 [RedisVL] WARNING   The default vectorizer has changed from `sentence-transformers/all-mpnet-base-v2` to `redis/langcache-embed-v1` in version 0.6.0 of RedisVL. For more information about this model, please refer to https://arxiv.org/abs/2504.02268 or visit https://huggingface.co/redis/langcache-embed-v1. To continue using the old vectorizer, please specify it explicitly in the constructor as: vectorizer=HFTextVectorizer(model='sentence-transformers/all-mpnet-base-v2')
    19:18:07 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    19:18:07 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: redis/langcache-embed-v1


    Batches: 100%|██████████| 1/1 [00:00<00:00,  8.98it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 24.89it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 26.95it/s]





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

    Batches: 100%|██████████| 1/1 [00:00<00:00, 27.98it/s]

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

    19:18:09 [RedisVL] WARNING   The default vectorizer has changed from `sentence-transformers/all-mpnet-base-v2` to `redis/langcache-embed-v1` in version 0.6.0 of RedisVL. For more information about this model, please refer to https://arxiv.org/abs/2504.02268 or visit https://huggingface.co/redis/langcache-embed-v1. To continue using the old vectorizer, please specify it explicitly in the constructor as: vectorizer=HFTextVectorizer(model='sentence-transformers/all-mpnet-base-v2')
    19:18:09 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    19:18:09 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: redis/langcache-embed-v1


    Batches: 100%|██████████| 1/1 [00:00<00:00, 13.54it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 16.76it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 21.82it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 28.80it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 21.04it/s]





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

    Batches: 100%|██████████| 1/1 [00:00<00:00, 28.15it/s]

    found 1 entry
    Your most recent transaction was for $350


    



```python
# Cleanup
complex_cache.delete()
```
