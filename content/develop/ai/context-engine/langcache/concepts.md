---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Learn how semantic caching in LangCache differs from exact-key caching, and what that means for correctness.
hideListLinks: true
linktitle: Concepts
title: LangCache concepts
weight: 3
---

## The failure mode exact-key caching doesn't have

A standard cache is either right or absent. The key you looked up either matches a stored value exactly, or it's a miss. There's no way for a hit to return the wrong answer, because equality is exact.

Semantic caching gives up that guarantee on purpose. LangCache matches an incoming prompt against stored entries by similarity, not exact text, so two prompts that are close enough are treated as the same request. That's the entire point: it's what lets "What are Product A's features?" and "Tell me about Product A's capabilities" share a cached response. It's also the new risk: a prompt that's similar but not equivalent can match and return an answer for a question the user didn't ask. A traditional cache can be stale. A semantic cache can be *wrong*, and that failure looks identical to a correct hit until you check the content.

```mermaid {width="70%"}
graph LR
    A["Incoming prompt"] --> B{"Similarity above<br/>threshold?"}
    B -->|Yes| C(["Return cached response<br/>(milliseconds)"])
    B -->|No| D["Call the LLM"]
    D --> E["Store prompt and response<br/>as a new cache entry"]
    E --> F(["Return the LLM response"])
```

## Exact-key caching vs. semantic caching

| | Exact-key caching | LangCache |
|:---|:---|:---|
| Match criterion | Exact key equality | Similarity above a threshold |
| Hit/miss | Binary: no in-between | Threshold-tuned: a near-miss is still possible |
| Correctness risk | None from the cache itself | A false-positive match can return a wrong answer |
| Tuning | TTL, eviction policy | TTL, eviction policy, **and** similarity threshold |

## Choosing a threshold is a tradeoff, not a default

There's no globally correct similarity threshold. A tighter threshold reduces wrong-answer risk but also reduces the hit rate you're paying for the cache to get. A looser threshold raises the hit rate but raises the odds of a false-positive match. The right setting depends on the relative cost of a wrong answer versus an unnecessary LLM call. A support FAQ bot can tolerate a looser threshold than a bot answering account-specific financial questions.

## FAQ

**Why did I get back a cached response for a question I didn't ask?**
The incoming prompt matched an existing cache entry above the configured similarity threshold, but the match wasn't semantically equivalent. Tighten the threshold, or inspect the matched entry to see how close the embeddings actually were.

**How do I choose a threshold if there's no default that's "correct"?**
Start conservative (tighter) and loosen it while monitoring hit rate and spot-checking matches, rather than starting loose and trying to catch bad matches after the fact.

**Does LangCache replace my existing cache layer?**
Only the part of it caching LLM responses by similarity. It doesn't replace general-purpose exact-key caching for anything else in your application.

See the [AI agent context engine FAQ](https://redis.io/blog/faq-real-time-context-engine-agent-memory-and-retrieval/) for how LangCache compares to building your own cache or skipping caching for smaller workloads.

## Next steps

- [Use the LangCache API and SDK](/content/develop/ai/context-engine/langcache/api-examples.md) to search and populate a cache.
- [LangCache REST API reference](/content/develop/ai/context-engine/langcache/api-reference.md) for the full endpoint and parameter details, including threshold configuration.
