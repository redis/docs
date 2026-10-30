---
title: Redis Iris on Redis Cloud
description: Create Redis Iris services and their API keys in the Redis Cloud console.
linkTitle: Redis Cloud
alwaysopen: false
categories:
- docs
- operate
- iris
hideListLinks: true
weight: 10
---

On Redis Cloud, Redis runs the Iris services for you. You create each service in the Redis Cloud console, under **Iris** in the menu, on a Redis Cloud database you choose. You create the API keys your agents use in **Access & Identity**.

After you create a service, copy its URL and ID into your agent's `IRIS_*` settings. See [SDK and CLI setup](/content/develop/ai/context-engine/sdk-and-cli.md#set-up-on-redis-cloud).

## Services

- [Redis Agent Memory](/content/operate/iris/cloud/agent-memory/_index.md): create a service, configure its AI models, and view and manage it.

<!-- TODO: add Agent Playbooks, Context Gateway, and Lens on Redis Cloud when #4360 merges, as subsections of this section. -->
