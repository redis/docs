---
LinkTitle: LiteLLM
Title: Redis with LiteLLM
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Cache LLM responses by exact match or semantic similarity, and share rate-limit counters across LiteLLM instances, with Redis.
group: ai
stack: true
summary: Use Redis as the LiteLLM response cache, as a semantic cache, and as the shared store for router usage counters.
type: integration
weight: 30
---

[LiteLLM](https://docs.litellm.ai/) gives you one interface to many LLM providers. You can use it as a Python library or run it as a proxy server. Redis supports it in three ways:

| Use | What Redis stores |
|-----|-------------------|
| **Response cache** | Model responses, keyed by the request, so an identical request skips the provider call. |
| **Semantic cache** | Responses and prompt embeddings, so a request with the same meaning as an earlier one skips the provider call. |
| **Router usage counters** | Per-deployment request and token counts, so several LiteLLM processes count against the same limit. |

See the [semantic cache](/content/develop/use-cases/semantic-cache/_index.md) and
[rate limiter](/content/develop/use-cases/rate-limiter/_index.md) use cases for more
information about when to use these patterns.

## Requirements

- Python 3.10 to 3.15
- Redis with [Redis Search](/content/develop/ai/search-and-query/_index.md) for the semantic cache 
(Redis 8 and later versions include it but earlier versions need Redis Stack). The response cache and router 
counters work on any Redis server.

Install LiteLLM with the `proxy` extra, plus the Redis clients:

```bash
pip install 'litellm[proxy]' redis redisvl
```

A plain `pip install litellm` is not enough. A cached `completion()` call fails with `ModuleNotFoundError: No module named 'fastapi'`, because the caching code imports `fastapi`, which only the `proxy` extra installs. LiteLLM doesn't install `redis` or `redisvl` itself, and the semantic cache needs both.

The examples on this page were run with LiteLLM 1.110.0 and Redis 8.10. They use `mock_response` so that they run without a provider key. Replace `mock_response` with the key for your provider to call a real model.

## Cache responses

Set `litellm.cache` to a `Cache` of type `redis`, then pass `caching=True` on each call that should use it:

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache

litellm.cache = Cache(type="redis", host="localhost", port="6379", ttl=120, namespace="llm")

messages = [{"role": "user", "content": "What is Redis?"}]

first = completion(model="gpt-4o-mini", messages=messages, mock_response="An in-memory data store.", caching=True)
second = completion(model="gpt-4o-mini", messages=messages, mock_response="An in-memory data store.", caching=True)

print(second._hidden_params.get("cache_hit"))  # True
```

LiteLLM builds the cache key from the model, the messages, and the other request parameters
(so two requests that only differ in the `temperature` value will still have separate
cache entries, for example). Each entry is a Redis string with the key `<namespace>:<hash>`
and a time to live (TTL) of `ttl` seconds. `port` is a string.

To pass a password or use TLS, set `password` and the other `Cache` arguments, or put the connection settings in environment variables such as `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`.

## Cache by meaning with the semantic cache

The `redis-semantic` cache embeds each prompt, searches a Redis vector index for a stored prompt within a similarity threshold, and returns that prompt's response:

```python
litellm.cache = Cache(
    type="redis-semantic",
    redis_url="redis://localhost:6379",
    similarity_threshold=0.8,
    redis_semantic_cache_embedding_model="text-embedding-3-small",
    redis_semantic_cache_index_name="llm_semantic_cache",
)

def ask(question):
    response = completion(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": question}],
        caching=True,
    )
    return response._hidden_params.get("cache_hit"), response.choices[0].message.content

print(ask("How do I reset my password on the website?"))   # miss: calls the model
print(ask("How can I reset the password on this website?"))  # hit: same meaning
print(ask("What is the capital of France?"))                # miss: different meaning
```

- `similarity_threshold` is a value from 0 to 1. A higher value needs a closer match. Tune it on your own prompts.
- `redis_semantic_cache_embedding_model` is any embedding model that LiteLLM can call. It runs on every request, so it adds a call and a cost even for a cache hit.
- Pass the connection as `redis_url`. With `host` and `port` alone, the cache also needs a password and raises `Missing required Redis configuration: REDIS_PASSWORD` without one.
- LiteLLM creates the index on the first request. It takes the vector size from the embedding model, so you don't define a schema.

The semantic cache returns an earlier response for any prompt that is close enough, but this can be wrong when a small change in wording changes the answer. Set the threshold high, or use the exact-match cache, for prompts where fine discrimination is important.

## Share rate limits across instances

A LiteLLM `Router` spreads requests over model deployments and can enforce `rpm` (requests per minute) and `tpm` (tokens per minute) limits on each one. By default, each process counts its own usage. Pass `redis_host` and `redis_port` and the router counts in Redis instead:

```python
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "chat",
            "litellm_params": {"model": "gpt-4o-mini", "rpm": 100},
        }
    ],
    routing_strategy="usage-based-routing-v2",
    enable_pre_call_checks=True,
    redis_host="localhost",
    redis_port=6379,
)
```

Every process that runs this code adds to the same counters, so the `rpm` limit applies to all of them together. In a test with a limit of 4, a first process sent 5 requests and 3 succeeded. A second process then sent 5 requests and none succeeded. Without `redis_host`, each process allowed 3 or 4.

The router writes one key per deployment and minute for requests and for tokens, in the form `<deployment hash>:<model>:rpm:<hour>-<minute>`, with a TTL of about a minute. It also writes a second set of keys with a `global_router:` prefix. Treat the limit as approximate: in the test above, a limit of 4 let 3 requests through.

## Run the proxy with Redis

In the proxy, set the same options in `config.yaml`:

```yaml
model_list:
  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: localhost
    port: 6379
    ttl: 600
    namespace: "litellm.caching"

router_settings:
  routing_strategy: usage-based-routing-v2
  redis_host: localhost
  redis_port: 6379
```

Start the proxy with a master key:

```bash
export LITELLM_MASTER_KEY=<your-master-key>
litellm --config config.yaml --port 4000
```

The proxy refuses to start without a strong master key. A repeated request returns a `x-litellm-cache-key` response header with the Redis key of the cached entry. The first request, which isn't cached, has no such header.

In testing, the proxy wrote its `rpm` and `tpm` counters to Redis when `router_settings` named a Redis server. It didn't reject requests above an `rpm` set on a single deployment, so check how your own deployment behaves before you rely on a proxy limit.

## More information

- [LiteLLM caching](https://docs.litellm.ai/docs/caching/all_caches)
- [LiteLLM routing](https://docs.litellm.ai/docs/routing)
- [RedisVL](/content/develop/ai/redisvl/_index.md), which LiteLLM uses for the semantic cache
- [Redis LangCache](/content/develop/ai/langcache/_index.md), a managed semantic cache
