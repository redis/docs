---
Title: Redis LangCache
alwaysopen: false
categories:
- docs
- develop
- ai
description: Redis LangCache provides semantic caching-as-a-service to reduce LLM costs and improve response times for AI applications.
linkTitle: LangCache
weight: 30
---

Redis LangCache is a fully-managed semantic caching service that reduces large language model (LLM) costs and improves response times for AI applications.

## How LangCache works

LangCache uses semantic caching to store and reuse previous LLM responses for similar queries. Instead of calling the LLM for every request, LangCache:

1. **Checks for similar cached responses** when a new query arrives
2. **Returns cached results instantly** if a semantically similar response exists
3. **Stores new responses** for future reuse when no cache match is found

## Key benefits

### Cost reduction
LangCache significantly reduces LLM costs by eliminating redundant API calls. Since up to 90% of LLM requests are repetitive, caching frequently-requested responses provides substantial cost savings.

### Improved performance
Cached responses are retrieved from memory, providing response times up to 15 times faster than LLM API calls. This improvement is particularly beneficial for retrieval-augmented generation (RAG) applications.

### Simple deployment
LangCache is available as a managed service through a REST API. The service includes:

- Automated embedding generation
- Configurable cache controls
- Simple billing structure
- No database management required

### Advanced cache management
The service provides comprehensive cache management features:

- Data access and privacy controls
- Configurable eviction protocols
- Usage monitoring and analytics
- Cache hit rate tracking

## Use cases

### AI assistants and chatbots
Optimize conversational AI applications by caching common responses and reducing latency for frequently asked questions.

### RAG applications
Improve retrieval-augmented generation performance by caching responses to similar queries, reducing both cost and response time.

### AI agents
Enhance multi-step reasoning chains and agent workflows by caching intermediate results and common reasoning patterns.

### AI gateways
Integrate LangCache into centralized AI gateway services to manage and control LLM costs across multiple applications.

## Getting started

LangCache is currently available through a private preview program. The service is accessible via REST API and supports any programming language.

### Prerequisites

To use LangCache, you need:

- An AI application that makes LLM API calls
- A use case involving repetitive or similar queries
- Willingness to provide feedback during the preview phase

### Access

LangCache is offered as a fully-managed cloud service. During the private preview:

- Participation is free
- Usage limits may apply
- Dedicated support is provided
- Regular feedback sessions are conducted

## Data security and privacy

LangCache stores your data on your Redis servers. Redis does not access your data or use it to train AI models. The service maintains enterprise-grade security and privacy standards.

## Support

Private preview participants receive:

- Dedicated onboarding resources
- Documentation and tutorials
- Email and chat support
- Regular check-ins with the product team
- Exclusive roadmap updates

For more information about joining the private preview, visit the [Redis LangCache website](https://redis.io/langcache/).
