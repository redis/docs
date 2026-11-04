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

Connect a Model Context Protocol (MCP) client to Redis Context Gateway to discover tools, call them, and retrieve results through one endpoint.

This guide covers connection settings, authentication, tool discovery, and result handling. For a first working program, follow the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md). For framework-specific examples, see [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md).

## Before you begin

You need:

- The Gateway's MCP endpoint.
- An agent key with a `use` grant on the Gateway, or identity-provider sign-in enabled for your deployment.
- An MCP client that supports Streamable HTTP and the authentication method you use.

For agent-key authentication, save your connection values:

```bash
export IRIS_CONTEXT_GATEWAY_URL='<gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'
```

The endpoint must be reachable from the environment where your client runs. Keep credentials in connection settings and out of agent instructions.

## Choose a client {#choose-a-client}

Use `redis-iris` for the Python SDK and Iris command-line interface (CLI). For JavaScript and TypeScript, install the separate `@redis-iris/context-gateway` package.

| Client | Use it for | Installation |
| --- | --- | --- |
| Python 3.11 or later | Discovering and calling tools through `redis_iris.ContextGateway`, or opening a direct MCP session through `gateway.client.connect()`. | `pip install redis-iris` |
| CLI, with Python 3.11 or later | Discovering, inspecting, and calling tools from a shell. | Included in `redis-iris`. |
| TypeScript, with Node.js 22 or later | Opening MCP sessions through `ContextGateway` from `@redis-iris/context-gateway`. | `npm install @redis-iris/context-gateway` |
| An existing MCP client or agent framework | Connecting with the Gateway endpoint and credentials. | Use the client's dependencies. A Redis SDK is not required. |

The npm `beta` tag selects the release used by these examples. The default `latest` tag currently selects an older alpha release.

There is no unified TypeScript package corresponding to `redis-iris`. See the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md#install-the-client) for Python, TypeScript, and CLI examples.

Administration uses separate credentials. Python exposes the administration client through `gateway.service`. The TypeScript package exports `ContextGatewayService`. See [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md).

## Configure the connection

Use the following settings in your MCP client:

| Setting | Value |
| --- | --- |
| Transport | Streamable HTTP |
| Endpoint | `<data-plane-base-url>/iris/data/v1/context-gateway/gateways/<gateway-id>/mcp` |
| Agent-key authentication | `Authorization: Bearer <agent-key>` or `X-Api-Key: <agent-key>` |
| Identity-provider authentication | `Authorization: Bearer <access-token>` |
| Supported protocol versions | `2026-07-28`, `2025-11-25`, `2025-06-18`, and `2025-03-26` |

The Redis SDKs require HTTPS, except for loopback addresses such as `localhost` during local development.

### Authenticate with an agent key

Give the client an agent key with a `use` grant on the Gateway. The key authenticates the caller. Its grants determine which Gateways the caller can use.

In Python, `gateway.client.connect()` sends the key in the `Authorization: Bearer` header.

### Sign in with your identity provider

If your deployment enables identity-provider sign-in, a compatible MCP client can authenticate a user instead of using an agent key.

An unauthenticated request receives `401` with a `WWW-Authenticate` header pointing to the Gateway's protected resource metadata. Clients that support MCP authorization use this metadata to find the identity provider (IdP) and start sign-in.

The client sends the resulting access token as:

```http
Authorization: Bearer <access-token>
```

The Gateway does not accept IdP tokens in `X-Api-Key`.

The token must be issued for the Gateway's own API. A token issued only for the shared Iris audience used by the Iris console does not grant Gateway access. The signed-in user also needs a grant on the Gateway.

The IdP token is not forwarded to an Upstream. See [Identity provider sign-in](/content/operate/iris/context-gateway/self-managed/authentication.md#identity-provider-sign-in) for deployment configuration.

### Connect a coding assistant

Use an existing coding assistant to discover and call Gateway tools without writing an agent application. These examples use agent-key authentication and the search-mode clinic Gateway from the [sample setup](/content/operate/iris/context-gateway/self-managed/api-examples.md). Compression is not required for this first request.

Keep the connection values from [Before you begin](#before-you-begin) in the environment that starts the client. The configuration files reference the key's environment variable rather than storing the key. Merge new server entries into existing configuration files.

{{< multitabs id="gateway-coding-assistants" tab1="Claude Code" tab2="Cursor" tab3="Codex" selector="dropdown" label="Assistant" >}}

#### Register the Gateway

Set the endpoint and agent key before starting Claude Code:

```bash
export IRIS_CONTEXT_GATEWAY_URL='<search-mode-gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'
```

Add this server entry to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "context-gateway": {
      "type": "http",
      "url": "${IRIS_CONTEXT_GATEWAY_URL}",
      "headers": {
        "Authorization": "Bearer ${IRIS_CONTEXT_GATEWAY_API_KEY}"
      }
    }
  }
}
```

Start Claude Code from that directory and environment:

```bash
claude
```

Approve the project MCP configuration when prompted. Run `/mcp`, open `context-gateway`, and inspect its connection status and tools. For search mode, expect `search_tools` and `run_tool`. See [Claude Code MCP configuration](https://code.claude.com/docs/en/mcp#environment-variable-expansion-in-mcpjson).

#### Make a first request

```text
Use context-gateway to find the provider filter in the sample clinic
directory. Inspect its input schema and filter for cardiologists.
Copy the discovered upstreamId and originalName into run_tool's tool
reference. Report the returned provider IDs and any completeness
limitations. If the intended tool is ambiguous, ask me to choose it.
```

Inspect the tool calls in the conversation to confirm that Claude discovered and invoked the filter.

-tab-sep-

#### Register the Gateway

Set these variables in the environment that starts Cursor, then restart Cursor from that environment:

```bash
export IRIS_CONTEXT_GATEWAY_URL='<search-mode-gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'
```

Add this server entry to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "context-gateway": {
      "url": "${env:IRIS_CONTEXT_GATEWAY_URL}",
      "headers": {
        "Authorization": "Bearer ${env:IRIS_CONTEXT_GATEWAY_API_KEY}"
      }
    }
  }
}
```

Cursor uses `${env:NAME}` for environment variables. Remote server entries do not load an `envFile`. See [Cursor MCP configuration](https://cursor.com/docs/mcp#config-interpolation).

Open **Customize**, enable `context-gateway`, and inspect **Available Tools**. For search mode, expect `search_tools` and `run_tool`.

#### Make a first request

In an Agent chat, enter:

```text
Use context-gateway to find the provider filter in the sample clinic
directory. Inspect its input schema and filter for cardiologists.
Copy the discovered upstreamId and originalName into run_tool's tool
reference. Report the returned provider IDs and any completeness
limitations. If the intended tool is ambiguous, ask me to choose it.
```

Expand the tool calls to inspect their arguments and results.

-tab-sep-

#### Register the Gateway

Set the connection values in the terminal where you run Codex:

```bash
export IRIS_CONTEXT_GATEWAY_URL='<search-mode-gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'

codex mcp add context-gateway \
  --url "$IRIS_CONTEXT_GATEWAY_URL" \
  --bearer-token-env-var IRIS_CONTEXT_GATEWAY_API_KEY
```

The native Codex command saves the endpoint and the key's environment-variable name in `~/.codex/config.toml`. The Iris CLI does not have a `--client codex` option. See [Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp#streamable-http-servers).

Check the saved registration, then start Codex from the same environment:

```bash
codex mcp get context-gateway
codex
```

Run `/mcp` to inspect the active server and its tools. For search mode, expect `search_tools` and `run_tool`. Registration alone does not verify that the Gateway is reachable.

#### Make a first request

```text
Use context-gateway to find the provider filter in the sample clinic
directory. Inspect its input schema and filter for cardiologists.
Copy the discovered upstreamId and originalName into run_tool's tool
reference. Report the returned provider IDs and any completeness
limitations. If the intended tool is ambiguous, ask me to choose it.
```

Inspect the tool calls to confirm that Codex used the Gateway's returned tool identity.

{{< /multitabs >}}

In full mode, expect qualified tool names instead of `search_tools` and `run_tool`. Ask the assistant to inspect and call the discovered provider filter directly. See [Discover and call tools](#use-the-tools).

### Generate client configuration with the CLI

If you have administration access, the Iris CLI can look up a Gateway's endpoint and generate configuration for Claude Code, Cursor, Google Agent Development Kit (ADK), or a generic JSON client. For self-managed deployments, configure the administration connection described in [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md#before-you-begin), then set the Gateway ID:

```bash
export IRIS_CONTEXT_GATEWAY_ID='<gateway-id>'

iris context-gateway connect --client claude-code
```

Use `--client cursor`, `adk`, or `json` for another format. By default, the command prints configuration or a registration command. For Claude Code or Cursor, add `--write <path>` to merge the entry into a file, such as `--write .mcp.json` or `--write .cursor/mcp.json`. The parent directory must exist.

Generated client templates reference the agent-key environment variable. The generic JSON format describes the header value your client must supply rather than assuming it supports environment-variable expansion.

### Open a Python MCP session {#connect-a-client}

The unified Python package provides access to an initialized MCP session:

```python
import asyncio

from redis_iris import ContextGateway


async def main():
    gateway = Iris.from_env().context_gateway()

    async with gateway.client.connect() as session:
        listed = await session.list_tools()
        print([tool.name for tool in listed.tools])


if __name__ == "__main__":
    asyncio.run(main())
```

Save this as `list_tools.py` and run:

```bash
python list_tools.py
```

The tools returned depend on the Gateway's exposure mode. In search mode, this lists the discovery tools rather than the complete Upstream tool catalog.

## Discover and call tools {#use-the-tools}

The Gateway's [tool exposure mode](/content/develop/ai/context-engine/context-gateway/concepts.md#tool-exposure-modes) determines how clients discover and invoke Upstream tools.

### Search mode

In search mode, the client first finds relevant tool definitions, then calls a selected tool. This lets an agent discover the tools it needs without loading the entire catalog.

`tools/list` returns the discovery tools below, along with stored-result tools when compression is enabled.

| Tool | Arguments | Result |
| --- | --- | --- |
| `search_tools` | Required `query`: 1 to 200 characters, or `*` to search across all tools. Optional `limit`: 1 to 100, default 5. | Matching tool definitions in ranked order, plus `matched`, `returned`, and `truncated`. |
| `run_tool` | Required `tool`: an object containing `upstreamId` and `originalName`. Required `toolArgs`: the selected tool's arguments, or `{}` if it takes none. | The selected tool's result. |

Follow this sequence:

1. **Find relevant tools.** Search for words that appear in a tool's name, title, or description. Search matches words, not semantic meaning.
2. **Inspect a definition.** Read its input schema before preparing arguments.
3. **Copy the tool identity.** Read `upstreamId` and `originalName` from the definition's `_meta["com.redis.context-gateway/tool"]`.
4. **Call `run_tool`.** Pass those two identity fields in `tool` and the arguments in `toolArgs`.

Do not construct the identity yourself or copy the entire metadata object. `run_tool` rejects additional identity fields, including the catalog revision.

#### Handle truncated discovery results

A wildcard query is still subject to result limits. When `truncated` is `true`, narrow the query or adjust the limit:

| Response | What to do |
| --- | --- |
| `returned` equals `limit`. | Narrow the query, or increase `limit` up to 100. |
| `returned` is below `limit`. | The response-size cap stopped the results. Narrow the query. Increasing `limit` will not help. |

### Full mode

In full mode, `tools/list` returns every exposed tool under its qualified name. Inspect the tool's input schema, then call that name with `tools/call`.

For example, a Context Surface in the `scheduling` namespace can expose a tool named `scheduling__filter_provider`. Use the name returned by discovery.

### Choose the invocation interface

The unified Python wrapper and direct MCP sessions provide different levels of abstraction:

| Interface | Calling behavior |
| --- | --- |
| `redis_iris.ContextGateway.call()` | Resolves a discovered tool name in either exposure mode. |
| Python MCP session's `call_tool()` | Sends the tool name and arguments you provide. In search mode, use `run_tool` to invoke an Upstream tool. |
| TypeScript MCP client's `callTool()` | Uses the direct MCP interface. In search mode, use `run_tool` to invoke an Upstream tool. |

See the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md#complete-examples) for complete examples.

## Read tool results {#read-client-results}

Check whether a tool returned an error before reading its result data. Field names differ between the unified Python wrapper and direct MCP clients:

| Information | Unified Python result | Python MCP result | TypeScript MCP result / JSON |
| --- | --- | --- | --- |
| Tool error flag | `is_error` | `is_error` | `isError` |
| Result data | `data` | `structured_content` | `structuredContent` |
| Metadata | `meta` | `meta` | `_meta` |

The unified wrapper's `data` contains structured content, or JSON parsed from text when structured content is absent. It is not an alias for the direct MCP result's `structured_content` field. Use `as_text()` for a text representation.

A tool error is different from a connection or protocol failure, which can raise an exception. See [Python client errors](/content/develop/ai/context-engine/context-gateway/limits.md#python-client-errors) for how the interfaces report these failures.

When compression is enabled, a successful call may return a handle to a stored result instead of the entire result.

## Work with stored results {#read-handles}

<a id="work-with-stored-results"></a>

Stored results let an agent inspect a large tool response without bringing all of it into its context. The Gateway stores the result and returns a small response containing a handle, a preview, and a suggested next call.

![A large tool result is stored in the Gateway database, automatically or through run_tool_as_handle, and the agent receives a small stub. The agent reads a page or a query from the stored result, then releases the handle.](/images/ai/context-engine/context-gateway-handles.svg)
{width="700"}

When compression is enabled on the Gateway, the following tools are available in both exposure modes:

| Tool | Purpose |
| --- | --- |
| `run_tool_as_handle` | Call a tool and explicitly request a stored result, even below the automatic capture threshold. |
| `describe_result` | Inspect a stored result's shape, size, fields, and expiry. |
| `page_results` | Read a stored result in order. |
| `query_results` | Select nodes from a stored JSON result with a JSONPath expression. |
| `count_results` | Count items, selected nodes, or items grouped by a field's value. |
| `aggregate_results` | Calculate the count, sum, minimum, maximum, or average of selected numbers. |
| `release_results` | Delete a stored result before it expires. |

See the [MCP API Reference](/content/develop/ai/context-engine/context-gateway/api-reference.md) for argument schemas.

### Detect a stored result

An ordinary tool call can return a handle when its result exceeds the configured threshold, unless the tool's policy opts out of capture.

Look for the handle metadata at:

```text
_meta["com.redis.context-gateway/handle"]
```

In Python MCP results, read this from `result.meta`.

Automatic capture can fall back to returning the complete result inline, for example, when the Gateway database is low on memory. Always check whether handle metadata is present before attempting to read a stored result.

### Request a stored result explicitly

Use `run_tool_as_handle` when you want to work with a handle even for a small result.

The tool identity depends on the exposure mode:

| Mode | Tool identity |
| --- | --- |
| Search | Pass a `tool` object with `upstreamId` and `originalName`, as you would for `run_tool`. |
| Full | Pass the discovered tool's qualified name in `name`. |

Unlike automatic capture, an explicit capture request returns a tool error if capture is refused. It does not fall back to an inline result.

### Inspect, retrieve, and release

Start with `describe_result` to understand the stored result. Then retrieve the information your agent needs:

- Use `page_results` to read items in order.
- Use `query_results` with a `jsonpath` expression to select nodes.
- Use `count_results` or `aggregate_results` to compute a summary.

Inspect `completeness` and `warning` before treating any result as complete. A handle can contain only part of the source data. Paging through it does not fetch records that were never captured.

Release the result when you finish, or let it expire. Handles are bound to the caller: another caller's handle, an expired handle, or a released handle returns a tool error with reason `unknown_handle`.

### Example: inspect providers by clinic {#stored-result-example}

This example uses the search-mode Gateway and clinic records from the [sample setup](/content/operate/iris/context-gateway/self-managed/api-examples.md).

The Gateway must have compression enabled, a compatible Gateway database, and compression support enabled in the deployment. Use an agent key with access to this Gateway:

```bash
export IRIS_CONTEXT_GATEWAY_URL='<search-mode-gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'
```

The example:

1. Finds the provider filter and reads its input schema.
2. Calls the filter through `run_tool`.
3. Calls it again with explicit capture to obtain a handle.
4. Describes the result, reads a page, and counts providers by clinic.
5. Releases the handle in `finally`.

The sample data is small, so the example requests capture explicitly. With the unchanged sample records, the count should report two cardiologists for `clinic-a` and one for `clinic-b`. Check completeness and warnings before treating those counts as totals.

Save the following program as `gateway_mcp.py`:

```python
import asyncio

from redis_iris import ContextGateway

TOOL_META_KEY = "com.redis.context-gateway/tool"
HANDLE_META_KEY = "com.redis.context-gateway/handle"

FILTER = {
    "tag_conditions": [
        {"field": "specialty", "value": "cardiology"}
    ],
    "limit": 100,
}


def checked(result):
    if result.is_error:
        raise RuntimeError(result.model_dump_json(by_alias=True))
    return result


async def main():
    gateway = Iris.from_env().context_gateway()

    async with gateway.client.connect() as session:
        # Find the filter and inspect its schema.
        found = checked(
            await session.call_tool(
                "search_tools",
                {"query": "filter_provider", "limit": 100},
            )
        )
        matches = [
            tool
            for tool in found.structured_content["tools"]
            if tool.get("_meta", {})
            .get(TOOL_META_KEY, {})
            .get("originalName") == "filter_provider"
        ]
        if len(matches) != 1:
            raise RuntimeError(
                "Expected one provider filter from the sample setup. "
                "Inspect the discovered tools and select the intended Upstream."
            )

        provider_filter = matches[0]
        print("Filter schema:", provider_filter["inputSchema"])

        identity = provider_filter["_meta"][TOOL_META_KEY]
        reference = {
            "upstreamId": identity["upstreamId"],
            "originalName": identity["originalName"],
        }

        # Call the tool normally.
        result = checked(
            await session.call_tool(
                "run_tool",
                {"tool": reference, "toolArgs": FILTER},
            )
        )
        print("Cardiologists:", result.model_dump_json(by_alias=True))

        # Call it again and explicitly request a stored result.
        captured = checked(
            await session.call_tool(
                "run_tool_as_handle",
                {"tool": reference, "toolArgs": FILTER},
            )
        )
        handle_metadata = (captured.meta or {}).get(HANDLE_META_KEY)
        if handle_metadata is None:
            raise RuntimeError("Explicit capture returned no handle")

        handle = handle_metadata["handle"]
        try:
            operations = [
                ("describe_result", {"handle": handle}),
                (
                    "page_results",
                    {"handle": handle, "offset": 0, "limit": 2},
                ),
                (
                    "count_results",
                    {"handle": handle, "groupBy": "location_id"},
                ),
            ]

            for name, arguments in operations:
                answer = checked(
                    await session.call_tool(name, arguments)
                )
                # Inspect completeness and warning in the responses
                # before interpreting pages or counts as complete.
                print(name, answer.model_dump_json(by_alias=True))
        finally:
            checked(
                await session.call_tool(
                    "release_results",
                    {"handle": handle},
                )
            )


if __name__ == "__main__":
    asyncio.run(main())
```

Run it with:

```bash
python gateway_mcp.py
```

## Troubleshoot the connection

Start with the response type to distinguish connection failures from tool failures.

| Response | Meaning | Action |
| --- | --- | --- |
| `401` | The credential is missing or was not accepted. | Check the authentication header and whether the key or token has expired. For IdP tokens, also check the audience. |
| `403` | The caller lacks a grant, or the Gateway or its tenant is suspended. | Ask your administrator to check the caller's `use` grant and the suspension state. |
| `404` | No Gateway is available at this URL for your tenant. | Check the complete MCP endpoint. |
| `503` | The Gateway's records could not be read. | Retry with backoff. |
| JSON-RPC error with reason `unknown_tool` | A direct call names a tool the Gateway does not expose. | List the tools again and use a returned name. In search mode, invoke Upstream tools through `run_tool`. |
| Tool error with reason `unknown_tool` and completion `not_dispatched` | The target passed through `run_tool` or `run_tool_as_handle` is unknown or inaccessible. | Discover tools again and copy the returned identity. |
| Tool result with its error flag set | The tool or its Upstream failed. | Read `reason` and `completion` in the failure metadata. See [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md). |

### Find the trace for a failed request

Give your platform team the `traceId` from either:

- A JSON-RPC error's `data`.
- A tool result's `_meta["com.redis.context-gateway/invocation"]`.

They can use it to find the request in their logs.

With the Control Plane token and Identity Service settings (`--identity` and `--identity-token`), an administrator can run:

```bash
iris context-gateway service check <gateway-id>
```

This checks the token, Gateway, Identity Service, agent key, and one `tools/list` request, in that order. It stops at the first failure.

To inspect the Gateway's configuration, run:

```bash
iris context-gateway service diagnose <gateway-id>
```

Keep the diagnostic information needed to investigate the failure without logging credentials or tool results containing private data.
