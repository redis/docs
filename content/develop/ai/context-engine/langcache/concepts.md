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

## Semantic caching

LangCache matches an incoming prompt against stored entries by similarity, not exact text, so two prompts that are close enough are treated as the same request. This similarity match is what lets "What are Product A's features?" and "Tell me about Product A's capabilities" share a cached response.

A standard, exact-key cache is either right or absent: the key you looked up either matches a stored value exactly, or it's a miss, so a hit can never return the wrong answer. Semantic caching gives up that guarantee: a prompt that's similar but not equivalent can also match, and return an answer for a question the user didn't ask. A traditional cache can be stale. A semantic cache can be *wrong*, and that failure looks identical to a correct hit until you check the content.

```mermaid {width="70%"}
graph LR
    A["Incoming prompt"] --> B{"Similarity above<br/>threshold?"}
    B -->|Yes| C(["Return cached response<br/>(milliseconds)"])
    B -->|No| D["Call the LLM"]
    D --> E["Store prompt and response<br/>as a new cache entry"]
    E --> F(["Return the LLM response"])
```

## Exact-key caching vs. semantic caching

Here's how the two compare:

| | Exact-key caching | Semantic caching (LangCache) |
|:---|:---|:---|
| Match criterion | Exact key equality | Similarity above a threshold |
| Hit/miss | Binary: no in-between | Threshold-tuned: a near-miss is still possible |
| Correctness risk | None from the cache itself | A false-positive match can return a wrong answer |
| Tuning | TTL, eviction policy | TTL, eviction policy, **and** similarity threshold |

## Choosing a threshold is a tradeoff, not a default

There's no globally correct similarity threshold. A tighter threshold reduces wrong-answer risk but also reduces the hit rate you're paying for the cache to get. A looser threshold raises the hit rate but raises the odds of a false-positive match. The right setting depends on the relative cost of a wrong answer versus an unnecessary LLM call. A support FAQ bot can tolerate a looser threshold than a bot answering account-specific financial questions.

## FAQ

**Could I get back a response for a different question than the one I asked?**
Yes. Matching on similarity rather than exact content is an inherent property of semantic caching, not a bug: LangCache matches by similarity, so a prompt that's close enough to a cached one can match even when the two aren't equivalent. Tightening the similarity threshold makes mismatches less likely, or you can inspect a matched entry to see how close the embeddings actually were.

**Is there a default similarity threshold I should use?**
No: the right threshold is a tradeoff specific to your use case (see above). If you're picking one for the first time, start conservative (tighter) and loosen it while monitoring hit rate and spot-checking matches, rather than starting loose and trying to catch bad matches after the fact.

**Does LangCache replace my existing cache layer?**
Only the part of it caching LLM responses by similarity — LangCache doesn't replace general-purpose exact-key caching for anything else in your application.

See the [AI agent context engine FAQ](https://redis.io/blog/faq-real-time-context-engine-agent-memory-and-retrieval/) for how LangCache compares to building your own cache or skipping caching for smaller workloads.

## Next steps

- [Use the LangCache API and SDK](/content/develop/ai/context-engine/langcache/api-examples.md) to search and populate a cache.
- [LangCache REST API reference](/content/develop/ai/context-engine/langcache/api-reference.md) for the full endpoint and parameter details, including threshold configuration.
