---
Title: Redis AI Agent Builder
alwaysopen: false
categories:
- docs
- develop
- ai
description: Build custom AI agents powered by Redis with our interactive code generator
linkTitle: Agent Builder
hideListLinks: true
weight: 50
---


Agents use Redis for data storage, vector search, and conversation memory. The interactive builder generates production-ready code in your preferred programming language.

## Get started

Use the interactive builder below to generate your custom AI agent code:

{{< agent-builder >}}

## What are AI agents?

AI agents are intelligent systems that can plan, remember, and take actions to help users accomplish goals. Unlike simple chatbots, agents can remember conversations, plan multi-step tasks, use external tools, and learn from interactions.

Redis powers these capabilities with fast, reliable data storage and retrieval that keeps your agents responsive and intelligent.

**Learn more**: [How agents work](agent-concepts/)

## What you can build

Choose from two types of intelligent agents:

- **Recommendation engines**: Personalized product and content recommendations
- **Conversational assistants**: Chatbots with memory and context awareness

The agent builder will generate complete, working code examples for your chosen agent type.

## Features

- **Multiple programming languages**: Generate code in Python, with JavaScript (Node.js), Java, and C# coming soon
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

- [Redis Vector Search](/develop/interact/search-and-query/vector-search/) - Semantic search capabilities
- [Redis Streams](/develop/data-types/streams/) - Real-time data and conversation history
- [AI Notebooks Collection](/develop/ai/notebook-collection/) - Interactive tutorials and examples
- [Ecosystem Integrations](/develop/ai/ecosystem-integrations/) - Redis with AI frameworks

### Community and support

- Join the [Redis Discord](https://discord.gg/redis) for community support
- Explore [Redis AI Resources on GitHub](https://github.com/redis-developer/redis-ai-resources)
- Watch [AI Video Collection](/develop/ai/ai-videos/) for tutorials and demonstrations
