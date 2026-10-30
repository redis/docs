---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect an application to Redis Context Gateway and work with its tools through Python, the Iris CLI, TypeScript, or HTTP.
hideListLinks: true
linktitle: Developer guide
title: Redis Context Gateway developer guide
weight: 5
---

Use the Python package, the Iris command-line interface (CLI), the TypeScript client, or HTTP to list and call a Gateway's tools, read large results, and administer Gateways.

## Integration workflow

1. Get a Gateway's Model Context Protocol (MCP) endpoint and an agent key with a `use` grant on it.
1. Connect an MCP client, or your agent framework, to the endpoint.
1. List the Gateway's tools, or search them when the Gateway runs in `search` mode.
1. Call a tool, and read a large result through its handle.

Platform teams create the Gateway and register its Upstreams through the Control Plane. See [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md).

## Choose a client

| Client | Use it when | Package and guide |
|:-------|:------------|:------------------|
| Python | Your application or agent uses Python. | Install [`redis-iris`](https://pypi.org/project/redis-iris/) and follow the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md). `ContextGateway` lists, searches, and calls tools, and its `service` property administers Gateways. |
| CLI | You work from a shell, a script, or continuous integration. | The `iris context-gateway` commands ship in the same [`redis-iris`](https://pypi.org/project/redis-iris/) package. |
| TypeScript | Your application or agent uses JavaScript or TypeScript. | Install [`@redis-iris/context-gateway`](https://www.npmjs.com/package/@redis-iris/context-gateway) with the `alpha` tag. `ContextGateway` opens MCP sessions, and `ContextGatewayService` calls the Control Plane. |
| HTTP | You need language-independent access or don't want a package dependency. | No package required. Send MCP requests to the Gateway endpoint as shown in [MCP](/content/develop/ai/context-engine/context-gateway/mcp.md). |

The `redis-iris` package requires Python 3.11 or later. The TypeScript client requires Node.js 22 or later.

## Connect to a Gateway

Every client requires:

* The Gateway's MCP endpoint, its `mcpEndpoint`, ending in `/mcp`.
* An agent key with a `use` grant on the Gateway, or an identity provider access token when the deployment turns on sign-in.

The Python package and the CLI read both from `IRIS_CONTEXT_GATEWAY_URL` and `IRIS_CONTEXT_GATEWAY_API_KEY`. When you use HTTP, send the key as a bearer token on every request.

Ask your platform team for these values, or [create a Gateway and an agent key](/content/operate/iris/self-managed/context-gateway/api-examples.md) on a self-managed deployment.

## Work with tools

In `full` mode, `tools/list` returns every tool under its qualified name. In `search` mode it returns `search_tools` and `run_tool`. In Python, `ContextGateway.call()` takes the qualified name in either mode and calls `run_tool` for you in `search` mode. See [Tool exposure modes](/content/develop/ai/context-engine/context-gateway/concepts.md#tool-exposure-modes).

## Work with large results

When result handles are on for the Gateway, a large result comes back as a stub with a handle. Read the parts you need with the handle tools, then release it. See [Read result handles](/content/develop/ai/context-engine/context-gateway/mcp.md#read-result-handles).

## References

* [Quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md)
* [Python and CLI package reference](https://pypi.org/project/redis-iris/)
* [TypeScript client reference](https://www.npmjs.com/package/@redis-iris/context-gateway)
* [Redis Context Gateway MCP API reference](/content/develop/ai/context-engine/context-gateway/api-reference.md)
* [Control Plane API reference](/content/operate/iris/self-managed/context-gateway/control-plane-api-reference.md)
