---
title: Redis Context Gateway
description: Deploy and operate Redis Context Gateway on Redis Cloud or your own infrastructure.
linkTitle: Context Gateway
alwaysopen: false
categories:
- docs
- operate
- iris
weight: 22
hideListLinks: true
aliases:
- /operate/iris/context-retriever/
- /operate/rc/context-engine/context-retriever/
---

Redis Context Gateway gives agents one Model Context Protocol (MCP) endpoint for the tools of any MCP server, plus tools over your Redis data.

## Deployment options

### Redis Cloud

Use Redis Context Gateway as a managed service on Redis Cloud.

[Create a Context Gateway](/content/operate/iris/context-gateway/create-gateway.md) and connect an agent, or [view and manage an existing Gateway](/content/operate/iris/context-gateway/manage-gateway.md).

### Self-managed

Deploy Redis Context Gateway on Kubernetes to run it on your own infrastructure.

[Start with the self-managed deployment guide](/content/operate/iris/context-gateway/self-managed/_index.md).

After setup, use the [developer quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md) to list and call your first tools. The [developer guides](/content/develop/ai/context-engine/context-gateway/_index.md) cover Upstream registration, tool policies, and agent integration.
