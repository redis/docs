---
title: Redis Iris context engine
description: Create, deploy, and operate Redis Iris context engine services on Redis Cloud or your own infrastructure.
linkTitle: Redis Iris context engine
alwaysopen: false
categories:
- docs
- operate
- iris
hideListLinks: true
weight: 45
---

Redis Iris context engine provides managed and self-managed services that give AI agents persistent memory, answers and procedures your business approved, governed access to business data, and turn-by-turn tracing.

Use this section to deploy, configure, and operate Redis Iris services. Developer guides and API integration documentation remain under [Develop with Redis]({{< relref "/develop/ai/context-engine" >}}).

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card icon="images/dev/icons/icon-redis-agent-memory-64-duotone.png" title="Redis Agent Memory" description="Create and manage a service on Redis Cloud or deploy it on your own infrastructure" url="/operate/iris/agent-memory" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Redis Agent Playbooks" description="Create a playbook of approved answers and procedures on Redis Cloud" url="/operate/iris/agent-playbook" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Redis Context Gateway" description="Create one MCP endpoint for your agents' tools on Redis Cloud or your own infrastructure" url="/operate/iris/context-gateway" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Lens" description="Trace your agents' turns on Redis Cloud" url="/operate/iris/lens" >}}
</div>

## Deployment options

Redis Iris services are available as managed services on Redis Cloud. Agent Memory and Context Gateway are also available for self-managed deployment.

### Redis Cloud

Create and manage Redis Iris services through the Redis Cloud console without deploying the supporting infrastructure yourself.

- [Create a Redis Agent Memory service]({{< relref "/operate/iris/agent-memory/create-service" >}})
- [Create a Redis Agent Playbooks playbook]({{< relref "/operate/iris/agent-playbook/create-playbook" >}})
- [Create a Redis Context Gateway]({{< relref "/operate/iris/context-gateway/create-gateway" >}})
- [Create Lens]({{< relref "/operate/iris/lens/create-lens" >}})

### Self-managed

Deploy Redis Iris services on Kubernetes when you need to operate them on your own infrastructure.

- [Self-managed Redis Agent Memory]({{< relref "/operate/iris/agent-memory/self-managed" >}})
- [Self-managed Redis Context Gateway]({{< relref "/operate/iris/context-gateway/self-managed" >}})
