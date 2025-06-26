---
alwaysopen: false
categories:
- docs
- operate
- rc
description: Store LLM responses for AI applications in Redis Cloud.
hideListLinks: true
linktitle: LangCache 
title: Semantic caching with LangCache
weight: 36
---

LangCache is a semantic caching service available as a REST API that stores LLM responses for fast and cheaper retrieval, built on the Redis vector database. By using semantic caching, customers can significantly reduce API costs and lower the average latency of their generative AI applications.

## LangCache overview

LangCache uses semantic caching to store and reuse previous LLM responses for repeated queries. Instead of calling the LLM for every request, LangCache checks if a similar response has already been generated and is stored in the cache. If a match is found, LangCache returns the cached response instantly, saving time and resources. 

Imagine you’re using an LLM to build an agent to answer questions about your company's products. Your users may ask questions like the following:

- "What are the features of Product A?"
- "Can you list the main features of Product A?"
- "Tell me about Product A’s features."

These prompts may have slight variations, but they essentially ask the same question. LangCache can help you avoid calling the LLM for each of these prompts by caching the response to the first prompt and returning it for any similar prompts.

Using LangCache as a semantic caching service in Redis Cloud has the following benefits:

- **Lower LLM costs**:  Reduce costly LLM calls by easily storing the most frequently-requested responses.
- **Faster AI app responses**: Get faster AI responses by retrieving previously-stored requests from memory.
- **Simpler Deployments**: Access our managed service via a REST API with automated embedding generation, configurable controls.
- **Advanced cache management**: Manage data access and privacy, eviction protocols, and monitor usage and cache hit rates.

### LLM cost reduction with LangCache

LangCache reduces your LLM costs by caching responses and avoiding repeated API calls. When a response is served from cache, you don’t pay for output tokens. Input token costs are typically offset by embedding and storage costs.

For every cached response, you'll save the output token cost. To calculate your monthly savings with LangCache, you can use the following formula:

```bash
Estimated monthly savings with LangCache = (Monthly output token costs) × (Cache hit rate)
```

The more requests you serve from LangCache, the more you save, because you’re not paying to regenerate the output.

Here’s an example:
- Monthly LLM spend: $200
- Percentage of output tokens in your spend: 60%
- Cost of output tokens: $200 × 60% = $120
- Cache hit rate: 50%
- Estimated savings: $120 × 50% = $60/month

{{<note>}}
The forumla and numbers above will provide a rough estimate of your monthly savings. Actual savings will vary depending on your usage.
{{</note>}}

## LangCache architecture

The following diagram displays how you can integrate LangCache into your GenAI app:

{{< image filename="images/rc/langcache-process.png" >}}

1. A user sends a prompt to your AI app.
1. Your app sends the prompt to LangCache through the `POST /v1/caches/{cacheId}/search` endpoint.
1. LangCache calls an embedding model service to generate an embedding for the prompt.
1. LangCache searches the cache to see if a similar response already exists by matching the embeddings of the new query with the stored embeddings. 
1. If a semantically similar entry is found (also known as a cache hit), LangCache gets the cached response and returns it to your app. Your app can then send the cached response back to the user.
1. If no match is found (also known as a cache miss), your app receives an empty response from LangCache. Your app then queries your chosen LLM to generate a new response.
1. Your app sends the prompt and the new response to LangCache through the `POST /v1/caches/{cacheId}/entries` endpoint. 
1. LangCache stores the embedding with the new response in the cache for future use.

## Get started with LangCache on Redis Cloud

To set up LangCache on Redis Cloud:

1. [Create a database]({{< relref "/operate/rc/databases/create-database" >}}) on Redis Cloud.
2. [Create a LangCache service]({{< relref "/operate/rc/langcache/create-service" >}}) for your database.
3. [Use the LangCache API]({{< relref "/operate/rc/langcache/use-langcache" >}}) from your client app.

After you set up LangCache, you can [view and edit the cache]({{< relref "/operate/rc/langcache/view-edit-cache" >}}) and [monitor the cache's performance]({{< relref "/operate/rc/langcache/monitor-cache" >}}).