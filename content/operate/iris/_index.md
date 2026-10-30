---
title: Redis Iris context engine
description: Run Redis Iris on Redis Cloud or on your own infrastructure, and provision its services with the iris CLI.
linkTitle: Redis Iris context engine
alwaysopen: false
categories:
- docs
- operate
- iris
hideListLinks: true
weight: 45
---

Redis Iris runs as managed services on Redis Cloud or as a self-managed deployment on your own Kubernetes infrastructure. Your agents use the same `redis-iris` SDK and `IRIS_*` settings on either deployment.

Use this section to set up and operate Redis Iris. Developer guides and API references are under [Develop with Redis](/content/develop/ai/context-engine/_index.md).

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Redis Iris on Redis Cloud" description="Create Iris services and their API keys in the Redis Cloud console" url="/operate/iris/cloud" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Self-managed Redis Iris" description="Deploy and operate Iris services on your own Kubernetes cluster" url="/operate/iris/self-managed" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Operate Iris with the CLI" description="Provision services, mint agent keys, and check each hop from a terminal" url="/operate/iris/cli" >}}
</div>

## Agent Mesh SDK beta

Agent Mesh provides Python SDK integrations for shared agent-to-agent task storage and resumable event delivery. Run it in your application with your own Redis connections. See the [Agent Mesh overview](/content/develop/ai/context-engine/agent-mesh/_index.md) and [quickstart](/content/develop/ai/context-engine/agent-mesh/quickstart.md).
