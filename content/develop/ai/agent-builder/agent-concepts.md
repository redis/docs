---
Title: How agents work
alwaysopen: false
categories:
- docs
- develop
- ai
description: Learn how AI agents work and why Redis is the perfect foundation for building intelligent systems
linkTitle: How agents work
weight: 10
---

## How AI agents work

AI agents are autonomous systems that go far beyond simple chatbots. They combine large language models (LLMs) with external tools, memory, and planning capabilities to accomplish complex tasks.

**Key differences from chatbots:**
- Maintain state across multiple conversations
- Reason through problems step-by-step
- Take actions in the real world
- Learn and adapt from interactions

### Core agent architecture

![AI agent architecture](/images/ai_agent/ai-agent-architecture-diagram.svg)

### The agent processing cycle

Every user interaction follows a 6-step cycle that makes agents intelligent:

![AI agent processing cycle](/images/ai_agent/simple-processing-cycle.svg)

Why this cycle matters:
- Maintains context across multiple conversations
- Learns from experience to improve future responses
- Handles complex tasks that require multiple steps
- Recovers from failures and adapts plans in real-time

> Example: When you ask "Book me a flight to Paris and find a hotel," the agent breaks this into separate tasks, remembers your travel preferences, searches for options, and coordinates the booking process.

## Why Redis powers AI agents

Redis is the **ideal foundation** for AI agents because it excels at the three things agents need most: **speed**, **memory**, and **search**.

### Redis powers every part of your agent

<div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
  <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
    <h4 class="font-semibold text-black dark:text-white mb-2">Planner</h4>
    <p class="text-sm text-black dark:text-white">Stores workflow templates and agent plans as Hashes or JSON. Enables complex multi-step reasoning.</p>
  </div>

  <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
    <h4 class="font-semibold text-black dark:text-white mb-2">Retriever</h4>
    <p class="text-sm text-black dark:text-white">Vector Search finds semantically similar documents instantly. Supports hybrid search for better results.</p>
  </div>

  <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
    <h4 class="font-semibold text-black dark:text-white mb-2">Executor</h4>
    <p class="text-sm text-black dark:text-white">Stores conversation history, user preferences, and intermediate results. Maintains state across workflows.</p>
  </div>
</div>

### Key advantages

**Ultra-fast response times**
- Sub-millisecond data access keeps conversations flowing naturally
- In-memory processing eliminates disk I/O bottlenecks
- Optimized data structures for different use cases

**Built-in vector search**
- Native vector indexing with HNSW, FLAT, and SVS-VAMANA algorithms
- SVS-VAMANA leverages Intel hardware acceleration for enhanced performance
- Hybrid search combining vector similarity with metadata filtering
- Real-time updates without index rebuilds
- [Learn more about Redis Vector Search →](/content/develop/ai/search-and-query/vectors/_index.md)

**Agent memory**
- **Short-term**: Conversation context and session state
- **Long-term**: User preferences and learned patterns
- Flexible data structures (Hashes, Lists, Streams, JSON) for different memory types
- **Managed option**: The [Redis Iris Context Engine](/content/develop/ai/context-engine/agent-memory/_index.md) provides short-term (session) and long-term memory as a managed service — with semantic long-term search — so you don't have to build the vector index and storage yourself
- [Explore Redis data structures →](/content/develop/data-types/_index.md)

### Managed agent context with Redis Iris

You can build each part of an agent's context layer yourself from Redis data structures, or use the [Redis Iris context engine](/content/develop/ai/context-engine/_index.md) services for it. Each service runs fully managed on Redis Cloud, or self-managed on your own infrastructure, and has a REST API.

| Agent need | Build it yourself with Redis | Redis Iris service |
|:--|:--|:--|
| Remember the user across sessions | Streams, Hashes, and vector search for session and long-term memory | [Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md) stores session events, summarizes long sessions, and extracts long-term memories in the background. |
| Avoid repeat LLM calls | Vector search plus your own cache logic | [LangCache](/content/develop/ai/context-engine/langcache/_index.md) returns a cached response when a new prompt is semantically similar to a cached one. |
| Query business data safely | Hand-written tools or generated queries per agent | [Context Retriever](/content/develop/ai/context-engine/context-retriever/_index.md) generates tools from a data model you define once. Agents call them over MCP (Model Context Protocol), and agent keys limit what each agent can reach. |
| Keep that data current | Your own sync jobs from the source database | [Data Integration](/content/develop/ai/context-engine/data-integration/_index.md) streams changes from relational databases into Redis within seconds. |

LangCache, Agent Memory, and Context Retriever are currently in preview. To see where each service fits in a single request, see [how a request flows through Redis Iris](/content/develop/ai/context-engine/concepts/request-flow.md).

## Types of agents you can build

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Conversational assistants</h3>

Build chatbots and virtual assistants that:
- Maintain natural conversations with context and memory
- Provide personalized responses based on user history

[Build a conversational agent →](../)
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Recommendation engines</h3>

Create intelligent recommendation systems that:
- Learn from user behavior and preferences
- Provide real-time personalized suggestions

[Build a recommendation agent →](../)
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Knowledge assistants (RAG)</h3>

Build retrieval-augmented generation agents that:
- Ingest documents and answer questions with citations
- Combine vector search with semantic caching for fast, grounded responses

[Build a knowledge assistant →](../)
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Redis Iris conversational assistants</h3>

Build conversational agents backed by managed Redis Iris Agent Memory that:
- Get session and long-term memory without building a vector index
- Extract durable memories automatically in the background

[Build a Redis Iris agent →](../)
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Task automation agents</h3>

Automate complex workflows and business processes:
- Execute multi-step tasks with decision-making
- Integrate with APIs and external systems
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Data analysis agents</h3>

Process and analyze large datasets intelligently:
- Perform statistical analysis and pattern recognition
- Handle real-time data streams
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Customer support agents</h3>

Provide intelligent customer service:
- Answer questions using knowledge bases
- Route complex issues to human agents
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Research and retrieval agents</h3>

Find and synthesize information from multiple sources:
- Search across documents, databases, and web content
- Summarize findings and extract key insights
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Monitoring and alerting agents</h3>

Watch systems and notify when action is needed:
- Detect anomalies and security threats
- Send intelligent alerts with context
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Personal productivity agents</h3>

Help users manage tasks and information:
- Schedule meetings and manage calendars
- Organize and prioritize tasks
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Trading and financial agents</h3>

Make intelligent financial decisions:
- Analyze market data and trends
- Execute trades based on predefined strategies
</div>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
<h3 class="no-toc">Content generation agents</h3>

Create and manage content at scale:
- Generate articles, summaries, and documentation
- Adapt content for different audiences and formats
</div>

</div>

## Agent architecture patterns

### Single-agent systems

Simple agents that handle all tasks within one system:
- Easier to develop and maintain
- Good for focused use cases
- All logic contained in one place
- Suitable for most applications

### Multi-agent systems

Multiple specialized agents working together:
- Each agent handles specific domains or tasks
- agents can communicate and coordinate
- More complex but more scalable
- Good for enterprise applications

### Hierarchical agents

Agents organized in layers with different responsibilities:
- High-level agents handle planning and coordination
- Low-level agents execute specific tasks
- Clear separation of concerns
- Easier to debug and maintain


## Redis data structures for agent memory

Understanding how to map agent memory needs to Redis data structures is crucial for building efficient agents:

### Redis streams for conversation history

- Use case: Ordered conversation logs with timestamps and metadata
- Key benefits: Automatic ordering, range queries, consumer groups, guaranteed delivery
- Implementation: Store user/agent message pairs with rich contextual metadata
- Retention: Use XTRIM for automatic cleanup based on age or count limits
- [Learn about Redis Streams →](/content/develop/data-types/streams/_index.md)


### Redis Hashes for User Profiles

- Use case: Structured user data with frequent partial updates and atomic operations
- Key benefits: Memory efficient field-level operations, atomic updates, O(1) field access
- Implementation: Multi-layered profile system with preferences, behavior patterns, and learned data
- Scaling: Hash tags for cluster distribution, field expiration for data lifecycle management
- [Learn about Redis Hashes →](/content/develop/data-types/hashes.md)

### Redis JSON for Complex State

- Use case: Nested data structures, complex agent workflows, hierarchical configurations
- Key benefits: JSONPath queries, atomic nested updates, schema validation, efficient storage
- Implementation: Multi-step task orchestration, complex decision trees, dynamic configurations
- Querying: Advanced JSONPath expressions for complex data retrieval and manipulation
- [Learn about Redis JSON →](/content/develop/data-types/json/_index.md)

### Redis Sets for Relationships and Tags

- Use case: Entity relationships, user interest tracking, session management, feature flags
- Key benefits: O(1) membership testing, efficient set operations, automatic deduplication
- Implementation: Complex relationship modeling, real-time recommendation engines, access control
- Operations: Union, intersection, difference for advanced analytics and personalization
- [Learn about Redis Sets →](/content/develop/data-types/sets.md)

### Redis Vector Sets for Semantic Search

- Use case: Embedding storage, similarity search, semantic retrieval, content recommendations
- Key benefits: High-performance vector similarity search, multiple distance metrics, real-time indexing
- Implementation: RAG systems, semantic memory, content discovery, personalized recommendations
- Queries: K-nearest neighbor search, range queries, hybrid filtering with metadata
- [Learn about Redis Vector Sets →](/content/develop/data-types/vector-sets/_index.md)

### Redis Sorted Sets for Rankings and Priorities

- Use case: Dynamic scoring systems, priority queues, leaderboards, time-series data
- Key benefits: O(log N) insertions, range queries by score/rank, atomic score updates
- Implementation: Real-time recommendation scoring, task prioritization, performance analytics
- Queries: Range by score, rank, lexicographical order, and complex aggregations
- [Learn about Redis Sorted Sets →](/content/develop/data-types/sorted-sets.md)

## Reliability features

Production-ready agents include built-in reliability features:

### Error handling

- Gracefully handle API failures and unexpected inputs
- Provide helpful error messages when things go wrong
- Continue functioning even when some components fail

### Retry logic

- Automatically retry failed operations with exponential backoff
- Handle temporary network issues and rate limiting
- Ensure important operations complete successfully

### Logging and monitoring

- Track what your agent does for debugging and improvement
- Monitor performance metrics like response times
- Log errors and unusual behavior for investigation

### Performance optimization

- Cache frequently accessed information
- Cache LLM responses semantically, so paraphrased questions skip the model call. [LangCache](/content/develop/ai/context-engine/langcache/_index.md) does this as a managed service
- Use efficient data structures for fast retrieval
- Scale resources based on demand

## Production deployment considerations

### Monitoring and Observability

- Agent performance metrics: Response times, success rates, user satisfaction
- Redis metrics: Memory usage, connection counts, operation latencies
- LLM usage tracking: Token consumption, API costs, rate limiting
- Business metrics: Task completion rates, user engagement, conversion

### Security and Privacy

- Data encryption: Encrypt sensitive data at rest and in transit
- Access controls: Implement proper authentication and authorization
- Governed data access: Give agents defined tools instead of direct database access. [Context Retriever](/content/develop/ai/context-engine/context-retriever/concepts.md) generates these tools and uses access tags to filter what each agent can see
- Data retention: Automatic cleanup of personal data per regulations
- Sensitive data in memory: Keep information such as payment card numbers out of long-term memory. Agent Memory [sensitive-data exclusions](/content/operate/iris/agent-memory/create-service.md#sensitive-data-exclusions) guide automatic extraction away from it
- Audit logging: Track all data access and modifications
- Memory integrity: Validate content before it is written to agent memory and verify protected records on read. Memory written from tool results, web pages, or other agents can carry instructions that are replayed into later prompts ([OWASP Top 10 for Agentic Applications, ASI06](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/); [MITRE ATLAS AML.T0080.000](https://atlas.mitre.org/techniques/AML.T0080.000)). [OWASP Agent Memory Guard](https://github.com/OWASP/www-project-agent-memory-guard) is an open-source guard for this with adapters for LangChain, OpenAI Agents SDK, AutoGen, CrewAI, and mem0

### Scaling Strategies

- Horizontal scaling: Multiple agent instances with shared Redis state
- Load balancing: Distribute requests across agent instances
- Redis clustering: Scale data storage across multiple nodes
- Caching layers: CDN for static content, Redis for dynamic data
- [Learn about Redis scaling →](/content/operate/rs/clusters/_index.md)

### Cost Optimization

- LLM cost management: Use appropriate models for different tasks, and serve repeat questions from a semantic cache such as [LangCache](/content/develop/ai/context-engine/langcache/_index.md)
- Redis memory optimization: Efficient data structures and TTL policies
- API rate limiting: Prevent excessive external API calls
- Resource monitoring: Track and optimize compute and storage costs
- [Redis performance optimization →](/content/operate/rs/databases/memory-performance/_index.md)

---

## Key takeaways

<div class="bg-gray-50 p-6 rounded-lg border border-gray-200 my-8">

**What makes agents different:**
Agents maintain memory, plan multi-step tasks, and learn from interactions—unlike simple chatbots.

**Why Redis is perfect:**
Sub-millisecond data access, built-in vector search, and flexible data structures designed for agent workflows.

**What you can build:**
Conversational assistants, recommendation engines, and complex multi-agent systems.

</div>

## Next steps

Ready to build your AI agent with Redis?

**Get started:**
- [Use the agent builder](/content/develop/ai/agent-builder/_index.md) to generate your code and get started
- [Redis quick start guide](/content/develop/get-started/_index.md) for setting up Redis

**Learn more:**
- [Redis Iris Context Engine — Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md) for managed session and long-term agent memory
- [Redis Iris concepts](/content/develop/ai/context-engine/concepts/_index.md) for how memory, caching, and governed data access work together
- Interactive demos for [Agent Memory](/content/develop/ai/context-engine/agent-memory/interactive-demo.md), [LangCache](/content/develop/ai/context-engine/langcache/interactive-demo.md), and [Context Retriever](/content/develop/ai/context-engine/context-retriever/interactive-demo.md) that run in your browser
- [Redis Vector Search documentation](/content/develop/ai/search-and-query/vectors/_index.md)
- [RedisVL Python library](/content/develop/clients/redis-vl.md) for vector operations and AI workflows
- [Redis data structures guide](/content/develop/data-types/_index.md)
- [Redis client libraries](/content/develop/clients/_index.md) for your programming language

**Deploy and scale:**
- [Redis Cloud](/content/operate/rc/_index.md) for managed Redis hosting
- [Redis Software](/content/operate/rs/_index.md) for on-premises deployment
- [Performance optimization](/content/operate/rs/databases/memory-performance/_index.md) best practices
