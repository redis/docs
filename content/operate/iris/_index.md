---
title: Redis Iris context engine
description: Deploy and operate Redis Iris context engine services.
linkTitle: Redis Iris context engine
alwaysopen: false
categories:
- docs
- operate
- iris
hideListLinks: true
weight: 45
aliases:
- /operate/rc/context-engine/
---

Redis Iris context engine provides managed and self-managed services for building AI applications with persistent memory, semantic caching, and governed access to business data.

Use this section to deploy, configure, and operate Redis Iris services. Developer guides and API integration documentation remain under [Develop with Redis]({{< relref "/develop/ai/context-engine" >}}).

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< image-card image="images/ai-brain.svg" alt="Redis Agent Memory icon" title="Redis Agent Memory" url="/operate/iris/agent-memory" description="Create and manage a service on Redis Cloud or deploy it on your own infrastructure." >}}
  {{< image-card image="images/ai-cube.svg" alt="Redis Context Retriever icon" title="Redis Context Retriever" url="/operate/iris/context-retriever" description="Create and manage governed retrieval tools for AI agents." >}}
  {{< image-card image="images/ai-LLM-memory.svg" alt="LangCache icon" title="LangCache" url="/operate/iris/langcache" description="Create, configure, and monitor semantic caches for AI applications." >}}
</div>

## Deployment options

Redis Iris services are available as managed services on Redis Cloud. Redis Agent Memory and Redis Context Retriever are also available for self-managed deployment.

### Redis Cloud

Create and manage Redis Iris services through the Redis Cloud console without deploying the supporting infrastructure yourself.

### Self-managed

Deploy supported Redis Iris services on Kubernetes when you need to operate them on your own infrastructure.
