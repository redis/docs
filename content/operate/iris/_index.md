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
bannerText: LangCache, Agent Memory, and Context Retriever are currently available in preview. Features and behavior are subject to change.
---

Redis Iris context engine provides managed and self-managed services for building AI applications with persistent memory, semantic caching, and governed access to business data.

Use this section to deploy, configure, and operate Redis Iris services. Developer guides and API integration documentation remain under [Develop with Redis]({{< relref "/develop/ai/context-engine" >}}).

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card color="bg-violet-300" title="Redis Agent Memory" description="Create and manage a service on Redis Cloud or deploy it on your own infrastructure" url="/operate/iris/agent-memory" >}}
  {{< tile-card color="bg-rose-300" title="Redis Context Retriever" description="Create and manage governed retrieval tools for AI agents" url="/operate/iris/context-retriever" >}}
  {{< tile-card color="bg-teal-300" title="LangCache" description="Create, configure, and monitor semantic caches for AI applications" url="/operate/iris/langcache" >}}
</div>

## Deployment options

Redis Iris services are available as managed services on Redis Cloud. All Redis Iris services are also available for self-managed deployment.

### Redis Cloud

Create and manage Redis Iris services through the Redis Cloud console without deploying the supporting infrastructure yourself.

### Self-managed

Deploy Redis Iris services on Kubernetes when you need to operate them on your own infrastructure.
