---
title: "AI agent patterns"
linkTitle: "Patterns"
description: "Production-ready patterns for AI agents using Redis"
weight: 50
hideListLinks: true
---

This section provides production-ready patterns for building AI agents with Redis. Each pattern combines high-level abstractions with raw Redis commands, enabling both rapid development and deep debugging.

## Available patterns

### Caching and cost optimization

- [Semantic cache](semantic-cache/) - Cache LLM responses by semantic meaning to reduce API costs by 40-60%

### Search and retrieval

- [RAG hybrid search](rag-hybrid-search/) - Retrieval-augmented generation with vector similarity and metadata filtering

### Agent coordination

- [Agent message streams](agent-message-streams/) - Event-driven agent coordination with persistent message history and at-most-once delivery

### Feature serving

- [Feature stores](feature-store/) - Serve pre-computed ML features with sub-millisecond latency

## Pattern structure

Each pattern follows a consistent format:

1. **The abstraction (developer experience)** - High-level libraries like RedisVL and Featureform for rapid development
2. **The raw commands (machine verification)** - Exact Redis commands for debugging and validation
3. **Alternative approaches** - Redis 8 native features and other implementation options
4. **Production patterns** - Real-world considerations including multi-tenancy, memory management, and monitoring
5. **Performance characteristics** - Latency benchmarks and scalability guidance
6. **Why this works** - Design rationale covering safety, accuracy, efficiency, and flexibility

## Key benefits

**Dual-layer approach**: Each pattern shows both high-level abstractions (for safety and speed) and raw Redis commands (for debugging and verification). This enables rapid development while maintaining full control when needed.

**Production-ready**: Patterns include memory estimates, performance benchmarks, failure modes, and multi-tenant isolation strategies that are critical for production deployments.

**Framework agnostic**: Works with LangChain, LangGraph, CrewAI, or custom agent implementations.

**Future-proof**: Patterns show both current approaches (Redis Search, RedisVL) and Redis 8 native features (Vector Sets) where applicable.

## Additional resources

- [RedisVL documentation]({{< relref "/develop/ai/redisvl" >}})
- [Featureform documentation]({{< relref "/develop/ai/featureform" >}})
- [Redis for AI libraries]({{< relref "/integrate/redis-ai-libraries" >}})
- [Vector database quick start]({{< relref "/develop/get-started/vector-database" >}})
- [RAG quick start guide]({{< relref "/develop/get-started/rag" >}})

