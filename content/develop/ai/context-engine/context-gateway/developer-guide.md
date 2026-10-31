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

Use a Gateway's Model Context Protocol (MCP) endpoint to discover and call tools. Use its Control Plane to administer Gateways and Upstreams.

## Integration workflow

1. Get a Gateway's MCP endpoint and an agent key with a `use` grant on it.
1. Connect an MCP client or agent framework to that endpoint.
1. List the tools, or search for them when the Gateway runs in search mode.
1. Call a discovered tool and check its error flag.
1. If the result is a handle, read the parts you need and release it.

Platform teams create the Gateway and register its Upstreams through the Control Plane. See [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md).

## Choose a client

| Client | Package | What it provides |
|:-------|:--------|:-----------------|
| Python SDK | [`redis-context-gateway==1.0.0b1`](https://pypi.org/project/redis-context-gateway/1.0.0b1/) | `ContextGateway` opens MCP sessions. `ContextGatewayService` administers Gateways through REST. The [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md) uses this SDK. |
| Python convenience API and CLI | [`redis-iris==1.0.0b2`](https://pypi.org/project/redis-iris/1.0.0b2/) | The `redis_iris.ContextGateway` wrapper and the `iris context-gateway` command-line interface (CLI). The wrapper reads environment variables and resolves discovered tool names in either exposure mode. |
| TypeScript SDK | [`@redis-iris/context-gateway@1.0.0-beta.1`](https://www.npmjs.com/package/@redis-iris/context-gateway/v/1.0.0-beta.1) | `ContextGateway` opens MCP sessions. `ContextGatewayService` calls the Control Plane. |
| HTTP | No package required | Send MCP requests to the Gateway endpoint as shown in [MCP](/content/develop/ai/context-engine/context-gateway/mcp.md). |

The Python SDK requires Python 3.10 or later. The CLI requires Python 3.11 or later. The TypeScript SDK requires Node.js 22 or later. These are beta prerelease versions. Pin a version instead of the npm `alpha` or `latest` tag, which can point at an older API.

Install the TypeScript SDK with:

```bash
npm install @redis-iris/context-gateway@1.0.0-beta.1
```

The examples use released clients with the updated Gateway service. Generic MCP clients pass discovered names and arguments through without regeneration. Newly generated REST methods, such as additional public service-health methods, require the SDK release that includes them. Do not assume a merged SDK change is already in the package registry.

## Connect to a Gateway

Every MCP client requires:

- The Gateway's returned `mcpEndpoint`, ending in `/iris/data/v1/context-gateway/gateways/<gateway-id>/mcp`.
- An agent key with a `use` grant on that Gateway, or an identity provider access token when the deployment enables sign-in.

The CLI and the `redis_iris` convenience wrapper read `IRIS_CONTEXT_GATEWAY_URL` and `IRIS_CONTEXT_GATEWAY_API_KEY`. With the public Python SDK, pass these values to `ContextGateway(url, agent_key)` as the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md) shows. With HTTP, send the credential as a bearer token on every request.

Ask your platform team for these values, or [create a Gateway and an agent key](/content/operate/iris/context-gateway/self-managed/api-examples.md) on a self-managed deployment. Agent credentials do not administer the Control Plane. The SDK requires an `https://` endpoint. Plain HTTP works only for `localhost` or a loopback address.

## Work with tools

In full mode, `tools/list` returns tools under names such as `scheduling__filter_provider`. Use the discovered name unchanged. In search mode, discover tools through `search_tools`, then pass the returned `upstreamId` and `originalName` to `run_tool`. Both modes also expose the handle tools when compression is enabled.

The `redis_iris.ContextGateway` wrapper's `call()` method resolves a qualified name in either mode. The public SDK's MCP session uses `call_tool()` and sends exactly the name and arguments you provide. See [Tool exposure modes](/content/develop/ai/context-engine/context-gateway/concepts.md#tool-exposure-modes).

A Python MCP tool result has `is_error`, `structured_content`, and `meta` attributes. Their JSON wire names are `isError`, `structuredContent`, and `_meta`. Check the error flag before consuming a result. Transport and protocol failures can raise exceptions instead.

## Work with large results

When compression is enabled, an eligible large result can come back as a handle. Read the parts you need and release it. Inspect completeness before treating counts as whole-query totals. An explicit `run_tool_as_handle` request returns a tool error if capture is refused. Ordinary calls can return the original result when automatic capture is unavailable.

MCP `count_results` supports JSONPath selection followed by grouping in one call. The `redis-iris` CLI `1.0.0b2` accepts either `--jsonpath` or `--group-by`, but not both. Use direct MCP for the combined operation. See [Read handles](/content/develop/ai/context-engine/context-gateway/mcp.md#read-handles).

## References

- [Quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md)
- [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md)
- [MCP API reference](/content/develop/ai/context-engine/context-gateway/api-reference.md)
- [Control Plane API reference](/content/operate/iris/context-gateway/self-managed/control-plane-api-reference.md)
