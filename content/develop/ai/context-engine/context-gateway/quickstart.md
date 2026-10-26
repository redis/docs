---
alwaysopen: false
categories:
- docs
- develop
- ai
description: List, search, and call a Gateway's tools, and read a large result through a handle, with Python, HTTP, or the Iris CLI.
hideListLinks: true
linktitle: Quickstart
title: Redis Context Gateway quickstart
weight: 10
aliases:
- /develop/ai/context-engine/context-retriever/quickstart/
---

Use Redis Context Gateway to give a clinic front-desk assistant the tools of a clinic directory: find a provider by specialty, look up a clinic, and count providers without loading every record into the agent's context.

## Before you begin

Get two Gateways over the sample clinic directory from your administrator, and one agent key with a `use` grant on both:

- A `full` mode Gateway, which lists every tool.
- A `search` mode Gateway with a Gateway database, which lists `search_tools` and `run_tool` and holds large results as handles.

For self-managed setup, [create the Gateways and the agent key](/content/operate/iris/context-gateway/self-managed/api-examples.md).

This walkthrough needs no agent framework or model-provider key.

Follow one tab throughout the page. The Python package and command-line interface (CLI) are prereleases. Both require Python 3.11 or later. The cURL and CLI examples use Bash and jq.

<!-- TODO: Recheck the client property sentence below. Do this when a redis-iris release depends on redis-context-gateway 0.1.0a5, where the SDK's data-plane client is renamed from ContextGatewayClient to ContextGateway. -->

**Python and CLI**

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-iris
```

> [!NOTE]
> For TypeScript, use the generated client [@redis-iris/context-gateway](https://www.npmjs.com/package/@redis-iris/context-gateway). Install it with `npm install @redis-iris/context-gateway@alpha`. It opens Model Context Protocol (MCP) sessions with `ContextGateway` and calls the Control Plane with `ContextGatewayService`. See the [developer guide](/content/develop/ai/context-engine/context-gateway/developer-guide.md).

**HTTP**

```bash
curl --version
jq --version
```

## Save connection values

Export these values in the shell where you run the examples. Each endpoint is a Gateway's full `mcpEndpoint`, ending in `/mcp`.

```bash
export IRIS_CONTEXT_GATEWAY_URL='<full-mode-gateway-mcp-endpoint>'
export SEARCH_GATEWAY_URL='<search-mode-gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'
```

Keep the agent key out of source control and model prompts.

The Python examples use `ContextGateway` from the unified `redis-iris` package. `ContextGateway.from_env()` reads the endpoint and the key, and `ContextGateway.call()` takes a tool's qualified name in either mode. Its `client` property exposes the SDK's MCP client. The CLI tab runs `iris context-gateway` commands directly and reads the same variables. Commands use `--json` when saving a response or processing it with jq.

## Connect to the Gateway

Expand an example to copy the complete program. Save it as `quickstart.py`, `quickstart.sh` (cURL), or `quickstart.cli.sh`, then run `python quickstart.py`, `bash quickstart.sh`, or `bash quickstart.cli.sh`.

*Example set `iris_gateway_quickstart`, step `gateway-connect`, in Python (Iris), cURL (Iris), and CLI (Iris): open a session with the full mode Gateway.*

A `401` means the key was not accepted, `403` means it has no grant for this Gateway, and `404` means no Gateway answers at the URL. A key with no `context-gateway` grant at all gets `403` for every Gateway.

## 1. List the Gateway's tools

List the tools the full mode Gateway serves. Each tool appears under its qualified name, the Upstream's namespace and the tool's name.

*Example step `gateway-quickstart-list`.*

*Expected output: the clinic directory's tools, such as a provider search and a clinic lookup, each under the directory's namespace.*

## 2. Call a tool

Search the directory for cardiologists by calling one listed tool by its qualified name.

*Example step `gateway-quickstart-call`.*

*Expected output: a JSON list of provider records with their specialty and clinic.*

A tool's own failure comes back as a result with its error flag set. Read the failure's `reason` and `completion`, described in [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md).

## 3. Search for tools

Switch to the search mode Gateway and list its tools: only `search_tools` and `run_tool` appear. Search with words a tool's name or description contains, then call the best match through `run_tool` with the `upstreamId` and `originalName` from its definition.

*Example step `gateway-quickstart-search`.*

*Expected output: `matched` and `returned` counts, then the matching tool definitions, then the call's result.*

In Python, `ContextGateway.call()` with the qualified name does the search and the `run_tool` call for you.

## 4. Read a large result through a handle

On the search mode Gateway, list every provider as a handle, read the first page, and count providers by specialty without loading the full list. Release the handle when you finish.

*Example step `gateway-quickstart-handle`.*

*Expected output: a stub with the handle and a short preview, one page of providers, then a count for each specialty.*

See [Result handles](/content/develop/ai/context-engine/context-gateway/concepts.md#result-handles).

## Clean up

The quickstart creates no data. Ask your administrator to revoke the agent key when you no longer need it. A key minted with the CLI expires after 90 days unless it was created with another lifetime.

## Use Python asynchronously

Every `ContextGateway` method has an async twin, such as `atools()`, `asearch()`, `acall()`, and `acall_as_handle()`. This standalone example lists and calls tools from an `asyncio` program.

*Example set `iris_gateway_async`, step `gateway-async-call`, in Python (Iris).*

## Next steps

- [Connect with MCP](/content/develop/ai/context-engine/context-gateway/mcp.md) to configure any MCP client and sign in with your identity provider.
- [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md) to give an OpenAI Agents SDK or LangGraph agent the Gateway's tools.
- [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md) to add MCP servers and Context Surfaces.
- Review the [redis-iris package](https://pypi.org/project/redis-iris/) for the full Python and CLI reference.
