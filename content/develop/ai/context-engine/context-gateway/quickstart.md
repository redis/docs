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
---

Connect to a Gateway, list its tools, call one, and switch to search mode, all with one agent key.

## Before you begin

Get a Gateway's MCP endpoint and an agent key with a `use` grant on it. For self-managed setup, [create a Gateway and an agent key](/content/operate/iris/context-gateway/self-managed/api-examples.md). The Gateway needs at least one Upstream: any MCP server or a Context Surface.

This walkthrough needs no agent framework or model-provider key.

Follow one tab throughout the page. The Python package and command-line interface (CLI) are alpha prereleases pinned to the version used here. Both require Python 3.11 or later. The cURL and CLI examples use Bash and jq.

<!-- TODO: Update the pin to redis-iris 0.1.0a5 when it publishes. In a5 the SDK's data-plane client is renamed from ContextGatewayClient to ContextGateway. Recheck the client property sentence below. -->

**Python and CLI**

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-iris==0.1.0a4
```

{{< note >}}
For TypeScript, see the [Context Gateway SDK on npm](https://www.npmjs.com/package/@redis-iris/context-gateway). It is a generated client, not a unified SDK equivalent to Python's `redis-iris` package.
{{< /note >}}

**HTTP**

```bash
curl --version
jq --version
```

## Save connection values

Export these values in the shell where you run the examples. `IRIS_CONTEXT_GATEWAY_URL` is the Gateway's full `mcpEndpoint`, ending in `/mcp`.

```bash
export IRIS_CONTEXT_GATEWAY_URL='<gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'
```

Keep the agent key out of source control and model prompts.

The Python examples use `ContextGateway` from the unified `redis-iris` package. `ContextGateway.from_env()` reads both variables, and its `client` property exposes the SDK's MCP client. The CLI tab runs `iris context-gateway` commands directly and reads the same variables. Commands use `--json` when saving a response or processing it with jq.

## Connect to the Gateway

Expand an example to copy the complete program. Save it as `quickstart.py`, `quickstart.sh` (cURL), or `quickstart.cli.sh`, then run `python quickstart.py`, `bash quickstart.sh`, or `bash quickstart.cli.sh`.

*Example set `iris_gateway_quickstart`, step `gateway-connect`, in Python (Iris), cURL (Iris), and CLI (Iris): open a session and list the Gateway's tools.*

A `401` means the key was not accepted, `403` means it has no grant for this Gateway, and `404` means no Gateway answers at the URL.

## 1. List the Gateway's tools

List the tools the Gateway serves. In `full` mode, each tool appears under its qualified name, such as `billing.get_invoice`.

*Example step `gateway-quickstart-list`.*

## 2. Call a tool

Call one listed tool by its qualified name.

*Example step `gateway-quickstart-call`.*

A tool's own failure comes back as a result with its error flag set, not as a request error. Read the result's text or structured content either way.

## 3. Search for tools

Ask your administrator to set the Gateway's tool exposure mode to `search`, or use a Gateway that already runs in `search` mode. List the tools again: only `search_tools` and `run_tool` remain.

Search by task, then call the best match through `run_tool` with the `upstreamId` and `originalName` from its definition.

*Example step `gateway-quickstart-search`.*

## 4. Read a large result through a handle

If the deployment turns on result handles, run a tool as a handle and read the first page of its result. Release the handle when you finish.

*Example step `gateway-quickstart-handle`.*

Skip this step when the tool list contains no `run_tool_as_handle`. See [Result handles](/content/develop/ai/context-engine/context-gateway/concepts.md#result-handles).

## Clean up

The quickstart creates no data. Ask your administrator to revoke the agent key when you no longer need it.

## Next steps

- [Connect with MCP](/content/develop/ai/context-engine/context-gateway/connect-agents.md) to configure any MCP client and sign in with your identity provider.
- [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md) to give an OpenAI Agents SDK or LangGraph agent the Gateway's tools.
- [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md) to add MCP servers and Context Surfaces.
- Review the [redis-iris package](https://pypi.org/project/redis-iris/) for the full Python and CLI reference.
