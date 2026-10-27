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
bannerText: Agent Memory and Context Retriever are currently available in preview. Features and behavior are subject to change.
---

Redis Iris context engine provides managed and self-managed services for building AI applications with persistent memory, semantic caching, and governed access to business data.

![The Redis Iris overview page in the Redis Cloud console, with cards for Data Pipelines, Context Retriever, Agent Memory, and LangCache.](/images/rc/iris-overview.png)
{width="100%" class="border border-redis-pen-300 rounded-lg"}

Use this section to deploy, configure, and operate Redis Iris services. Developer guides and API integration documentation remain under [Develop with Redis]({{< relref "/develop/ai/context-engine" >}}).

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card icon="images/dev/icons/icon-redis-agent-memory-64-duotone.png" title="Redis Agent Memory" description="Create and manage a service on Redis Cloud or deploy it on your own infrastructure" url="/operate/iris/agent-memory" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Redis Context Gateway" description="Deploy one MCP endpoint for your agents' tools on your own infrastructure" url="/operate/iris/context-gateway" >}}
</div>

## Deployment options

Redis Iris services are available as managed services on Redis Cloud. All Redis Iris services are also available for self-managed deployment.

### Redis Cloud

Create and manage Redis Iris services through the Redis Cloud console without deploying the supporting infrastructure yourself.

- [Create a Redis Agent Memory service]({{< relref "/operate/iris/agent-memory/create-service" >}})

### Self-managed

Deploy Redis Iris services on Kubernetes when you need to operate them on your own infrastructure.

- [Self-managed Redis Agent Memory]({{< relref "/operate/iris/agent-memory/self-managed" >}})
- [Self-managed Redis Context Gateway]({{< relref "/operate/iris/context-gateway/self-managed" >}})

## Agent Mesh SDK preview

Agent Mesh provides Python SDK integrations for shared A2A task storage and resumable event delivery. Run it in your application with your own Redis connections. See the [Agent Mesh overview](/content/develop/ai/context-engine/agent-mesh/_index.md) and [quickstart](/content/develop/ai/context-engine/agent-mesh/quickstart.md).
