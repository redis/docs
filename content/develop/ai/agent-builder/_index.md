---
Title: AI agent builder
alwaysopen: false
categories:
- docs
- develop
- ai
description: Build custom AI agents powered by Redis with our interactive code generator
linkTitle: Agent builder
hideListLinks: true
weight: 50
---


Agents use Redis for data storage, [vector search](/content/develop/get-started/search-tutorial/vector-search.md), and [conversation memory](/content/develop/get-started/rag.md). The interactive builder generates code in your preferred programming language with your choice of model.

## Get started

Use the interactive builder below to generate your custom AI agent code:

{{< agent-builder >}}

## What are AI agents?

AI agents are intelligent systems that can plan, remember, and take actions to help users accomplish goals. Unlike simple chatbots, agents can remember conversations, plan multi-step tasks, use external tools, and learn from interactions.

Redis powers these capabilities with fast, reliable data storage and retrieval that keeps your agents responsive and intelligent.

**Learn more**: [How agents work](agent-concepts/)

## What you can build

Choose from four types of intelligent agents:

- **Recommendation engines**: Personalized product and content recommendations
- **Conversational assistants**: Chatbots with memory and context awareness
- **Knowledge assistants**: RAG agents that ingest documents, answer questions with citations, and use semantic caching
- **Redis Iris conversational assistants**: Conversational agents backed by managed [Redis Iris Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md) — session and long-term memory with no vector index to build

The agent builder will generate complete, working code examples for your chosen agent type.

## Features

- **Multiple programming languages**: Generate code in Python and JavaScript (Node.js), with Java and C# coming soon
- **LLM integration**: Support for OpenAI, Anthropic Claude, and Llama 2
- **Redis optimized**: Uses Redis data structures for optimal performance

## After you generate your code

Use the **Copy** or **Download** buttons and follow the steps below to test it locally:

1. **Set up your environment**: Install Redis and the required dependencies
2. **Configure your API keys**: Add your LLM provider credentials to environment variables
3. **Test locally**: Start with simple conversations to verify everything works
4. **Deploy and scale**: Use Redis Cloud for production deployments

The generated code includes detailed setup instructions and best practices to get you started quickly. If you want to generate another agent, select the **Start again** button.

## Learn more

### AI agent resources

- [How agents work](agent-concepts/) - Learn how agents work and why Redis is perfect for them

### Redis AI documentation

- [Redis Vector Search](/content/develop/ai/search-and-query/vectors/_index.md) - Semantic search capabilities 
- [Redis Streams](/content/develop/data-types/streams/_index.md) - Real-time data and conversation history
- [AI Notebooks Collection](/content/develop/ai/notebook-collection.md) - Interactive tutorials and examples 
- [Ecosystem Integrations](/content/develop/ai/ecosystem-integrations.md) - Redis with AI frameworks

### For experienced developers

If you're ready to go beyond the agent builder, these resources cover production-grade managed services and cutting-edge Redis AI projects:

- [Redis Context Engine](/content/develop/ai/context-engine/_index.md) — Managed services for agent memory, semantic caching, and structured data access (Redis Iris)
- [Redis AI Incubator](https://redis.io/ai-incubator/) — Early-stage AI projects and experiments from the Redis team

### Community and support

- Join the [Redis Discord](https://discord.gg/redis) for community support
- Explore [Redis AI Resources on GitHub](https://github.com/redis-developer/redis-ai-resources)
- Watch [AI Video Collection](/content/develop/ai/ai-videos.md) for tutorials and demonstrations
