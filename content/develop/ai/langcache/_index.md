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
weight: 30
bannerText: LangCache is currently available in preview. Features and behavior are subject to change.
bannerChildren: true
---

Redis LangCache is a fully-managed semantic caching service that reduces large language model (LLM) costs and improves response times for AI applications.

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
- **Simpler Deployments**: Access our managed service using a REST API with automated embedding generation, configurable controls, and no database management required.
- **Advanced cache management**: Manage data access and privacy, eviction protocols, and monitor usage and cache hit rates.

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

See the [LangCache API and SDK examples]({{< relref "/develop/ai/langcache/api-examples" >}}) for more information on how to use the LangCache API.

## Get started

LangCache is currently in preview:

- Public preview on [Redis Cloud]({{< relref "/operate/rc/langcache" >}})
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
