---
Title: Redis LangCache
alwaysopen: false
categories:
- docs
- develop
- ai
description: Store LLM responses for AI apps in a semantic cache.
linkTitle: LangCache
hideListLinks: true
weight: 10
bannerText: LangCache is currently available in preview. Features and behavior are subject to change.
bannerChildren: true
aliases:
- /develop/ai/langcache
---

Cut LLM costs and improve response times with semantic caching.

LangCache checks whether a semantically similar prompt has been answered before and returns the cached response instantly — no LLM call required. When there's no match, your app calls the LLM as usual and stores the result for future use.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< image-card image="images/ai-LLM-memory.svg" alt="Quick start icon" title="Quick Start — Create a LangCache service on Redis Cloud and make your first API call" url="/operate/rc/context-engine/langcache/create-service" >}}
  {{< image-card image="images/ai-search.svg" alt="API examples icon" title="API and SDK Examples — Search, store, and manage cache entries with REST, Python, or JS" url="/develop/ai/context-engine/langcache/api-examples" >}}
  {{< image-card image="images/ai-brain-2.svg" alt="Monitor icon" title="Monitor Cache — Track hit rates, usage, and performance in Redis Cloud" url="/operate/rc/context-engine/langcache/monitor-cache" >}}
</div>

## What is LangCache?

LangCache is a fully-managed semantic caching service that:

<ul class="my-4 space-y-2">
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Reduces LLM costs</strong> — Avoids redundant API calls for semantically equivalent queries</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Improves response times</strong> — Returns cached answers in milliseconds instead of waiting for an LLM</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Handles embeddings automatically</strong> — No embedding model to manage; LangCache generates them for you</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Gives you cache control</strong> — Configure similarity thresholds, TTLs, and eviction policies</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Works with any LLM workflow</strong> — REST API and Python/JS SDKs drop into existing applications</span></li>
</ul>

## Why use LangCache?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Dramatically lower LLM API spend for apps with repetitive queries</li>
      <li>Faster responses for AI assistants, chatbots, and RAG pipelines</li>
      <li>Cache intermediate results in multi-step agent workflows</li>
      <li>Centralize caching across multiple apps via an AI gateway</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For developers</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Two API calls to integrate — search before LLM, store after LLM</li>
      <li>Python and JavaScript SDKs available on PyPI and npm</li>
      <li>No database to provision — fully managed on Redis Cloud</li>
      <li>Monitor hit rates and cost savings from the Redis Cloud console</li>
    </ul>
  </div>
</div>

## Quick example

Before calling your LLM, search for a cached response:

```json
POST /v1/caches/{cacheId}/entries/search
{
    "prompt": "What are the features of Product A?"
}
```

On a cache miss, call your LLM, then store the result:

```json
POST /v1/caches/{cacheId}/entries
{
    "prompt": "What are the features of Product A?",
    "response": "Product A includes real-time analytics, automatic scaling, and sub-millisecond latency."
}
```

See the full [LangCache API and SDK examples]({{< relref "/develop/ai/context-engine/langcache/api-examples" >}}) for more.

## LangCache overview

LangCache uses semantic caching to store and reuse previous LLM responses for repeated queries. Instead of calling the LLM for every request, LangCache checks if a similar response has already been generated and is stored in the cache. If a match is found, LangCache returns the cached response instantly, saving time and resources. 

Imagine you’re using an LLM to build an agent to answer questions about your company's products. Your users may ask questions like the following:

- "What are the features of Product A?"
- "Can you list the main features of Product A?"
- "Tell me about Product A’s features."

These prompts may have slight variations, but they essentially ask the same question. LangCache can help you avoid calling the LLM for each of these prompts by caching the response to the first prompt and returning it for any similar prompts.

Using LangCache as a semantic caching service has the following benefits:

- **Lower LLM costs**:  Reduce costly LLM calls by easily storing the most frequently-requested responses.
- **Faster AI app responses**: Get faster AI responses by retrieving previously-stored requests from memory.
- **Simpler deployments**: Access our managed service using a REST API with automated embedding generation, configurable controls, and no database management required.
- **Advanced cache management**: Manage data access, privacy, and eviction protocols. Monitor usage and cache hit rates.

LangCache works well for the following use cases:

- **AI assistants and chatbots**: Optimize conversational AI applications by caching common responses and reducing latency for frequently asked questions.
- **RAG applications**: Enhance retrieval-augmented generation performance by caching responses to similar queries, reducing both cost and response time.
- **AI agents**: Improve multi-step reasoning chains and agent workflows by caching intermediate results and common reasoning patterns.
- **AI gateways**: Integrate LangCache into centralized AI gateway services to manage and control LLM costs across multiple applications..

### LLM cost reduction with LangCache

{{< embed-md "langcache-cost-reduction.md"  >}}

## LangCache architecture

The following diagram displays how you can integrate LangCache into your GenAI app:

{{< image filename="images/rc/langcache-process.png" alt="The LangCache process diagram." >}}

1. A user sends a prompt to your AI app.
1. Your app sends the prompt to LangCache through the `POST /v1/caches/{cacheId}/entries/search` endpoint.
1. LangCache calls an embedding model service to generate an embedding for the prompt.
1. LangCache searches the cache to see if a similar response already exists by matching the embeddings of the new query with the stored embeddings. 
1. If a semantically similar entry is found (also known as a cache hit), LangCache gets the cached response and returns it to your app. Your app can then send the cached response back to the user.
1. If no match is found (also known as a cache miss), your app receives an empty response from LangCache. Your app then queries your chosen LLM to generate a new response.
1. Your app sends the prompt and the new response to LangCache through the `POST /v1/caches/{cacheId}/entries` endpoint. 
1. LangCache stores the embedding with the new response in the cache for future use.

See the [LangCache API and SDK examples]({{< relref "/develop/ai/context-engine/langcache/api-examples" >}}) for more information on how to use the LangCache API.

## Get started

LangCache is currently in preview:

- Public preview on [Redis Cloud]({{< relref "/operate/rc/context-engine/langcache" >}})
- Fully-managed [private preview](https://redis.io/langcache/)

{{< multitabs id="langcache-get-started" 
    tab1="Redis Cloud" 
    tab2="Private preview" >}}

{{< embed-md "rc-langcache-get-started.md"  >}}

-tab-sep-

### Prerequisites

To use LangCache in private preview, you need:

- An AI application that makes LLM API calls
- A use case involving repetitive or similar queries
- Willingness to provide feedback during the preview phase

### Access

LangCache is offered as a fully-managed service. During the private preview:

- Participation is free
- Usage limits may apply
- Dedicated support is provided
- Regular feedback sessions are conducted

### Data security and privacy

LangCache stores your data on your Redis servers. Redis does not access your data or use it to train AI models. The service maintains enterprise-grade security and privacy standards.

### Support

Private preview participants receive:

- Dedicated onboarding resources
- Documentation and tutorials
- Email and chat support
- Regular check-ins with the product team
- Exclusive roadmap updates

For more information about joining the private preview, visit the [Redis LangCache website](https://redis.io/langcache/).

{{< /multitabs >}}
