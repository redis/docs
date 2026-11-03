---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect a Streamable HTTP MCP client to a Gateway with an agent key or your identity provider, use full or search mode, and read handles.
hideListLinks: true
linktitle: MCP
title: Connect with MCP
weight: 60
aliases:
- /develop/ai/context-engine/context-gateway/connect-agents/
- /develop/ai/context-engine/context-gateway/developer-guide/
---

Connect any Model Context Protocol (MCP) client that supports Streamable HTTP and custom request headers. For framework examples, see [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md). For every tool, argument, and metadata key, see the [API reference](/content/develop/ai/context-engine/context-gateway/api-reference.md).

## Before you begin

Get the Gateway's MCP endpoint and an agent key with a `use` grant. Export `IRIS_CONTEXT_GATEWAY_URL` and `IRIS_CONTEXT_GATEWAY_API_KEY` as shown in [Save connection values](/content/develop/ai/context-engine/context-gateway/quickstart.md#save-connection-values).

## Choose a client {#choose-a-client}

Use `redis-iris` for the unified Python SDK and Iris command-line interface (CLI). For JavaScript and TypeScript, install the separate `@redis-iris/context-gateway` package. There is no unified TypeScript package corresponding to `redis-iris`.

| Client | Use it for | Installation |
| --- | --- | --- |
| Python, 3.11 or later | Discovery and calls through `redis_iris.ContextGateway`, or direct MCP sessions through `gateway.client.connect()`. | `python -m pip install redis-iris==1.0.0b2` |
| CLI, Python 3.11 or later | Discovering, inspecting, and calling tools from a shell. | Installed by the same `redis-iris` package. |
| TypeScript, Node.js 22 or later | Direct MCP sessions through `ContextGateway` from `@redis-iris/context-gateway`. | `npm install @redis-iris/context-gateway@1.0.0-beta.1` |
| An existing MCP client or agent framework | Connecting directly using the Gateway endpoint and credentials. | Use the client's dependencies. A Redis SDK is not required. |

See the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md#install-the-client) for executable Python, TypeScript, and CLI examples. For administration, Python exposes the control-plane client through `gateway.service`, and the TypeScript package exports `ContextGatewayService`. These require separate administration credentials. See [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md).

## Configure the connection

| Setting | Value |
| --- | --- |
| Transport | Streamable HTTP |
| Endpoint | `<data-plane-base-url>/iris/data/v1/context-gateway/gateways/<gateway-id>/mcp` |
| Request header | `Authorization: Bearer <agent-key>` or `X-Api-Key: <agent-key>` |
| Protocol versions | `2026-07-28`, `2025-11-25`, `2025-06-18`, and `2025-03-26` |

The endpoint must be reachable from the client runtime. Keep the agent key in connection settings and out of agent instructions.

In Python, `gateway.client.connect()` opens a session and sends the agent key as `Authorization: Bearer`. The Redis SDKs require HTTPS, except for loopback addresses such as `localhost` during local development.

`redis_iris.ContextGateway.call()` resolves a discovered tool name in either exposure mode. A raw MCP session's `call_tool()` sends the tool name and arguments you supply. TypeScript's `client.callTool()` also uses the raw MCP interface.

The CLI prints the configuration, or merges it into the client's file with `--write`, for Claude Code, Cursor, the Agent Development Kit (ADK), or a generic JSON client. It reads the Gateway's endpoint from the Control Plane, so it needs the Gateway ID and the Control Plane settings:

```bash
export IRIS_CONTEXT_GATEWAY_ID='<gateway-id>'
iris context-gateway connect --client claude-code
```

Use `--client cursor`, `adk`, or `json` for the other clients. The written configuration reads the key from an environment variable and never contains it.

## Use the tools

What the agent sees depends on the Gateway's [tool exposure mode](/content/develop/ai/context-engine/context-gateway/concepts.md#tool-exposure-modes).

### Full mode

`tools/list` returns every tool under its qualified name. Call a tool by that name with `tools/call`.

### Search mode

`tools/list` returns these discovery tools, plus the handle tools when compression is enabled:

| Tool | Input | Result |
| --- | --- | --- |
| `search_tools` | `query`, 1 to 200 characters, or `*` for every tool. Optional `limit`, 1 to 100, default 5. | `matched`, `returned`, `truncated`, and the matching tool definitions in ranked order. |
| `run_tool` | `tool` with `upstreamId` and `originalName`, and the tool's arguments in `toolArgs`. Required. The tool's arguments as an object, `{}` when it takes none. | The tool's result. |

Use the tools in this order:

1. Search with words that a tool's name, title, or description would contain. Search matches words, not meaning.
2. Pick a definition and read its input schema. When `truncated` is `true`, narrow the query. If `returned` equals `limit`, you can also raise `limit`, up to 100. If `returned` is below `limit`, the response-size cap stopped the results, so increasing `limit` will not help.
3. Call it through `run_tool`, copying `upstreamId` and `originalName` from the definition's `_meta["com.redis.context-gateway/tool"]`. Do not construct them, and send no other members of that metadata. `run_tool` refuses extra members, such as the catalog revision.

## Connect a client

The [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md#complete-examples) provides complete programs for each client. To access an initialized Python MCP session through the unified package:

```python
import asyncio

from redis_iris import ContextGateway

async def main():
    gateway = ContextGateway.from_env()
    async with gateway.client.connect() as session:
        listed = await session.list_tools()
        print([tool.name for tool in listed.tools])

asyncio.run(main())
```

Save as `list_tools.py` and run `python list_tools.py` with the connection values configured. In search mode, this lists the discovery tools rather than the Upstream tool catalog.

### Read client results

The unified Python wrapper and raw MCP clients return different result objects:

| Information | Unified Python result | Python MCP result | TypeScript MCP result / JSON |
| --- | --- | --- | --- |
| Tool error flag | `is_error` | `is_error` | `isError` |
| Result data | `data` | `structured_content` | `structuredContent` |
| Metadata | `meta` | `meta` | `_meta` |

The unified wrapper's `data` contains structured content, or JSON parsed from text when structured content is absent. It is not an alias for the raw `structured_content` field. Use `as_text()` for a text representation.

Check the error flag before reading successful results. Protocol and connection failures can raise exceptions. See [Python client errors](/content/develop/ai/context-engine/context-gateway/limits.md#python-client-errors) for the difference between raw sessions and unified calls.

## Read handles

When compression is on for the Gateway, it lists these tools in both modes:

| Tool | What it does |
| --- | --- |
| `run_tool_as_handle` | Runs one tool and requests a handle even below the automatic threshold. Returns a tool error if capture is refused. In full mode it takes the tool's `name`. In search mode it takes a `tool` reference, as `run_tool` does. |
| `page_results` | Reads a held result in order. |
| `query_results` | Selects from a held JSON result with a JSONPath expression. |
| `count_results` | Counts items, selected nodes, or items for each value of one field. |
| `aggregate_results` | Computes the count, sum, minimum, maximum, or average of selected numbers. |
| `describe_result` | Describes a held result's shape, size, fields, and expiry. |
| `release_results` | Deletes a held result before it expires. |

![A large tool result is stored in the Gateway database, automatically or through run_tool_as_handle, and the agent receives a small stub. The agent reads a page or a query from the stored result, then releases the handle.](/images/ai/context-engine/context-gateway-handles.svg)
{width="700"}

An ordinary tool call whose result exceeds the handle threshold can also return a stub, unless the tool's policy opts out. The stub carries the handle in `_meta["com.redis.context-gateway/handle"]`, a short preview, and the next call to make. Automatic capture can still return the whole result, for example when the Gateway database is low on memory, so check for the handle before you read it. Explicit `run_tool_as_handle` calls return a tool error instead of falling back inline.

Follow the [stored-result example](#stored-result-example) for page, count, and release calls. Use `query_results` with a `jsonpath` expression to select nodes. Always inspect `completeness` and `warning`: results can represent only part of the source, and paging a stored handle does not fetch uncaptured source records.

Handles are bound to the caller. Another caller's handle, or one that expired or was released, returns a tool error with the reason `unknown_handle`.

### Query and release a stored result {#stored-result-example}

This example uses both Gateways from the [sample setup](/content/operate/iris/context-gateway/self-managed/api-examples.md). The search-mode Gateway must have compression enabled, with a compatible Gateway database and compression enabled in the deployment. Set both endpoints and an agent key granted access to them:

```bash
export IRIS_CONTEXT_GATEWAY_URL='<full-mode-gateway-mcp-endpoint>'
export SEARCH_GATEWAY_URL='<search-mode-gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'
```

Save the program as `gateway_mcp.py` and run `python gateway_mcp.py` using the Python installation in [Choose a client](#choose-a-client). It performs four operations:

1. Discover and call the provider filter in full mode.
2. Search for the same filter and call it through `run_tool` in search mode.
3. Explicitly capture the result, read a page, and count providers by clinic.
4. Release the handle in `finally`.

The sample is deliberately small, so it requests a handle explicitly rather than relying on automatic capture. The count should report two providers for `clinic-a` and one for `clinic-b`. Inspect completeness and warnings in each response before treating counts as totals.

<details>
<summary>Complete Python example</summary>

```python
import asyncio
import os

from redis_iris import ContextGateway

HANDLE_META_KEY = "com.redis.context-gateway/handle"

TOOL_META = "com.redis.context-gateway/tool"
FILTER = {
    "tag_conditions": [{"field": "specialty", "value": "cardiology"}],
    "limit": 100,
}


def checked(result):
    if result.is_error:
        raise RuntimeError(result.model_dump_json(by_alias=True))
    return result


async def main():
    key = os.environ["IRIS_CONTEXT_GATEWAY_API_KEY"]
    full = ContextGateway.from_env()
    async with full.client.connect() as session:
        listed = (await session.list_tools()).tools
        print("Full-mode tools:", [tool.name for tool in listed])
        provider_filter = next(
            tool for tool in listed
            if (tool.meta or {}).get(TOOL_META, {}).get("originalName")
            == "filter_provider"
        )
        print("Filter schema:", provider_filter.input_schema)
        result = checked(await session.call_tool(provider_filter.name, FILTER))
        print("Cardiologists:", result.model_dump_json(by_alias=True))

    search = ContextGateway.from_env({
        "IRIS_CONTEXT_GATEWAY_URL": os.environ["SEARCH_GATEWAY_URL"],
        "IRIS_CONTEXT_GATEWAY_API_KEY": key,
    })
    async with search.client.connect() as session:
        found = checked(await session.call_tool(
            "search_tools", {"query": "filter_provider", "limit": 100}
        ))
        provider_filter = next(
            tool for tool in found.structured_content["tools"]
            if tool.get("_meta", {}).get(TOOL_META, {}).get("originalName")
            == "filter_provider"
        )
        identity = provider_filter["_meta"][TOOL_META]
        reference = {
            "upstreamId": identity["upstreamId"],
            "originalName": identity["originalName"],
        }
        result = checked(await session.call_tool(
            "run_tool", {"tool": reference, "toolArgs": FILTER}
        ))
        print("Search-mode call:", result.model_dump_json(by_alias=True))

        stub = checked(await session.call_tool(
            "run_tool_as_handle", {"tool": reference, "toolArgs": FILTER}
        ))
        held = (stub.meta or {}).get(HANDLE_META_KEY)
        if held is None:
            raise RuntimeError("Explicit capture returned no handle")
        handle = held["handle"]
        try:
            for name, arguments in [
                ("describe_result", {"handle": handle}),
                ("page_results", {"handle": handle, "offset": 0, "limit": 2}),
                ("count_results", {"handle": handle, "groupBy": "location_id"}),
            ]:
                answer = checked(await session.call_tool(name, arguments))
                print(name, answer.model_dump_json(by_alias=True))
        finally:
            checked(await session.call_tool("release_results", {"handle": handle}))


if __name__ == "__main__":
    asyncio.run(main())
```

</details>

## Sign in with your identity provider

When the deployment turns on sign-in, an MCP client can use an access token from your identity provider (IdP) instead of an agent key. Send it as `Authorization: Bearer <token>`. The Gateway does not accept an IdP token in `X-Api-Key`.

A request without a credential receives `401` and a `WWW-Authenticate` header that points to the Gateway's protected resource metadata. Clients that support MCP authorization read that document, find the IdP, and sign the user in. The IdP's token never reaches an Upstream.

The token must be issued for the Gateway's own API, not for the shared Iris audience that the Iris console uses. A token for the shared audience alone doesn't open a Gateway.

The signed-in user still needs a grant on the Gateway. See [Identity provider sign-in](/content/operate/iris/context-gateway/self-managed/authentication.md#identity-provider-sign-in).

## Troubleshoot the connection

| Response | Meaning | Action |
| --- | --- | --- |
| `401` | No credential, or the key or token was not accepted. | Check the key, its expiry, and the header. |
| `403` | The credential has no grant for this Gateway, or the Gateway or its tenant is suspended. | Ask your administrator for a `use` grant. |
| `503` | The Gateway's records could not be read. | Retry with backoff. |
| `404` | No Gateway answers at this URL for your tenant. | Check the full endpoint. |
| JSON-RPC error with `reason` `unknown_tool` | A direct call names a tool the Gateway does not expose. | List the tools again and use a returned name. |
| Tool error with `reason` `unknown_tool` and `completion` `not_dispatched` | A target passed through `run_tool` or `run_tool_as_handle` is unknown or inaccessible. | Discover the tools again and copy the returned identity. |
| Tool result with its error flag set | The tool or its Upstream failed. | Read `reason` and `completion` in the failure metadata. See [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md). |

Give your platform team the `traceId` from a JSON-RPC error's `data` or from a tool result's `_meta["com.redis.context-gateway/invocation"]` to find the failure in their logs. With the Control Plane token and the Identity Service settings (`--identity` and `--identity-token`), they can run `iris context-gateway service check <gateway-id>`, which checks the token, the Gateway, the Identity Service, the agent key, and one `tools/list`, in that order, and stops at the first failure. `iris context-gateway service diagnose <gateway-id>` prints a report of the Gateway's setup.

Keep diagnostic details without logging keys or tool results that hold private data.
