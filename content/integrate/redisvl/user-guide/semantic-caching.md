---
description: Semantic caching with RedisVL
linkTitle: Semantic caching
title: Semantic caching
type: integration
weight: 5
---

{{< note >}}
This document is a converted form of [this Jupyter notebook](https://github.com/RedisVentures/redisvl/blob/main/docs/user_guide/llmcache_03.ipynb).
{{< /note >}}

Before beginning, be sure of the following:

1. You have installed RedisVL and have that environment activated.
1. You have a running Redis instance with the Redis Query Engine capability.

## Semantic caching for LLMs

RedisVL provides a `SemanticCache` interface that uses Redis's built-in caching capabilities and vector search to store responses from previously-answered questions. This reduces the number of requests and tokens sent to LLM services, decreasing costs and enhancing application throughput by reducing the time taken to generate responses.

This document will teach you how to use Redis as a semantic cache for your applications.

Begin by importing [OpenAI](https://platform.openai.com) so you can use their API for responding to user prompts. You will also create a simple `ask_openai` helper method to assist.

```python
import os
import getpass
import time

from openai import OpenAI

import numpy as np

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

    The capital of France is Paris.

## Initializing `SemanticCache`

Upon initialization, `SemanticCache` will automatically create an index within Redis for the semantic cache content.

```python
from redisvl.extensions.llmcache import SemanticCache

llmcache = SemanticCache(
    name="llmcache",                     # underlying search index name
    prefix="llmcache",                   # redis key prefix for hash entries
    redis_url="redis://localhost:6379",  # redis connection url string
    distance_threshold=0.1               # semantic cache distance threshold
)
```

```python
# look at the index specification created for the semantic cache lookup
$ rvl index info -i llmcache

    Index Information:
    ╭──────────────┬────────────────┬──────────────┬─────────────────┬────────────╮
    │ Index Name   │ Storage Type   │ Prefixes     │ Index Options   │   Indexing │
    ├──────────────┼────────────────┼──────────────┼─────────────────┼────────────┤
    │ llmcache     │ HASH           │ ['llmcache'] │ []              │          0 │
    ╰──────────────┴────────────────┴──────────────┴─────────────────┴────────────╯
    Index Fields:
    ╭───────────────┬───────────────┬────────┬────────────────┬────────────────╮
    │ Name          │ Attribute     │ Type   │ Field Option   │   Option Value │
    ├───────────────┼───────────────┼────────┼────────────────┼────────────────┤
    │ prompt        │ prompt        │ TEXT   │ WEIGHT         │              1 │
    │ response      │ response      │ TEXT   │ WEIGHT         │              1 │
    │ prompt_vector │ prompt_vector │ VECTOR │                │                │
    ╰───────────────┴───────────────┴────────┴────────────────┴────────────────╯
```

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

    Empty cache
```

Your initial cache check should be empty since you have yet to store anything in the cache. Below, store the `question`, the
proper `response`, and any arbitrary `metadata` (as a Python dictionary object) in the cache.

```python
# Cache the question, answer, and arbitrary metadata
llmcache.store(
    prompt=question,
    response="Paris",
    metadata={"city": "Paris", "country": "france"}
)
```

```python
# Check the cache again
if response := llmcache.check(prompt=question, return_fields=["prompt", "response", "metadata"]):
    print(response)
else:
    print("Empty cache")

[{'id': 'llmcache:115049a298532be2f181edb03f766770c0db84c22aff39003fec340deaec7545', 'vector_distance': '9.53674316406e-07', 'prompt': 'What is the capital of France?', 'response': 'Paris', 'metadata': {'city': 'Paris', 'country': 'france'}}]
```

```python
# Check for a semantically similar result
question = "What actually is the capital of France?"
llmcache.check(prompt=question)[0]['response']

    'Paris'
```

## Customize the distance threshhold

For most use cases, the correct semantic similarity threshhold is not a fixed quantity. Depending on the choice of embedding model,
the properties of the input query, and the business use case, the threshhold might need to change. 

Fortunately, you can seamlessly adjust the threshhold at any point, as shown below:

```python
# Widen the semantic distance threshold
llmcache.set_threshold(0.3)
```

```python
# Really try to trick it by asking around the point
# But is able to slip just under our new threshold
question = "What is the capital city of the country in Europe that also has a city named Nice?"
llmcache.check(prompt=question)[0]['response']

    'Paris'
```

```python
# Invalidate the cache completely by clearing it out
llmcache.clear()

# should be empty now
llmcache.check(prompt=question)

    []
```

## Use TTL

Redis uses optional time-to-live (TTL) policies to expire individual keys at points in time in the future.
This allows you to focus on your data flow and business logic without worrying about complex cleanup tasks.

A TTL policy set on the `SemanticCache` allows you to temporarily hold onto cache entries. Set the TTL policy to 5 seconds.

```python
llmcache.set_ttl(5) # 5 seconds
```

```python
llmcache.store("This is a TTL test", "This is a TTL test response")

time.sleep(5)
```

```python
# confirm that the cache has cleared by now on it's own
result = llmcache.check("This is a TTL test")

print(result)

[]
```

```python
# Reset the TTL to null (long lived data)
llmcache.set_ttl()
```

## Simple performance testing

Next, you will measure the speedup obtained by using `SemanticCache`. You will use the `time` module to measure the time taken to generate responses with and without `SemanticCache`.

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

Without caching, a call to openAI to answer this simple question took 0.5017588138580322 seconds.
```

```python
llmcache.store(prompt=question, response="George Washington")
```

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

Avg time taken with LLM cache enabled: 0.2560166358947754
Percentage of time saved: 82.47%
```

```bash
# check the stats of the index
$ rvl stats -i llmcache

    Statistics:
    ╭─────────────────────────────┬─────────────╮
    │ Stat Key                    │ Value       │
    ├─────────────────────────────┼─────────────┤
    │ num_docs                    │ 1           │
    │ num_terms                   │ 19          │
    │ max_doc_id                  │ 3           │
    │ num_records                 │ 23          │
    │ percent_indexed             │ 1           │
    │ hash_indexing_failures      │ 0           │
    │ number_of_uses              │ 19          │
    │ bytes_per_record_avg        │ 5.30435     │
    │ doc_table_size_mb           │ 0.000134468 │
    │ inverted_sz_mb              │ 0.000116348 │
    │ key_table_size_mb           │ 2.76566e-05 │
    │ offset_bits_per_record_avg  │ 8           │
    │ offset_vectors_sz_mb        │ 2.09808e-05 │
    │ offsets_per_term_avg        │ 0.956522    │
    │ records_per_doc_avg         │ 23          │
    │ sortable_values_size_mb     │ 0           │
    │ total_indexing_time         │ 1.211       │
    │ total_inverted_index_blocks │ 19          │
    │ vector_index_sz_mb          │ 3.0161      │
    ╰─────────────────────────────┴─────────────╯
```

```python
# Clear the cache AND delete the underlying index
llmcache.delete()
```
