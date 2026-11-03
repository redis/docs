---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Discover and call Context Gateway tools with Python, TypeScript, or the Iris CLI in search or full mode.
hideListLinks: true
linktitle: Quickstart
title: Redis Context Gateway quickstart
weight: 10
aliases:
- /develop/ai/context-engine/context-retriever/quickstart/
---

Discover tools and query a sample clinic directory through Redis Context Gateway using Python, TypeScript, or the Iris command-line interface (CLI).

You’ll find a tool for filtering healthcare providers, inspect its inputs, and use it to find cardiologists. Choose **Search mode** to discover relevant tools on demand, or **Full mode** to list available tools.

Python and CLI examples use the unified `redis-iris` package. TypeScript examples use the separate `@redis-iris/context-gateway` package. You don’t need an agent framework or a model-provider API key.

## Before you begin

You need a Gateway with the sample clinic directory registered as a Context Surface, its Model Context Protocol (MCP) endpoint, and an agent key with permission to use it. Follow the [sample setup guide](/content/operate/iris/context-gateway/self-managed/api-examples.md), or ask your administrator for a prepared sample.

The setup guide creates two Gateways. Choose **Operations** for search mode or **Front desk** for full mode. You only need one endpoint for this walkthrough. Selecting a documentation tab does not change the Gateway’s configuration.

The directory contains three cardiologists: two at `clinic-a` and one at `clinic-b`. Compression is not required for this query.

## 1. Install the client {#install-the-client}

Choose a client and use it throughout the walkthrough.

{{< multitabs id="gateway-install" tab1="Python" tab2="TypeScript" tab3="CLI" >}}

Use Python 3.11 or later.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-iris==1.0.0b2
```

-tab-sep-

Use Node.js 22 or later. Create a project and install the TypeScript SDK and runner:

```bash
mkdir gateway-quickstart
cd gateway-quickstart
npm init -y
npm install @redis-iris/context-gateway@1.0.0-beta.1
npm install --save-dev tsx
```

-tab-sep-

Use Python 3.11 or later. The same package installs the `iris` command:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-iris==1.0.0b2
```

{{< /multitabs >}}

## 2. Configure the connection {#save-connection-values}

Set the endpoint and key for the Gateway you chose:

```bash
export IRIS_CONTEXT_GATEWAY_URL='<gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'
```

Use the returned `mcpEndpoint`, not the administration URL. The Redis SDKs require HTTPS except for local development on a loopback address such as `localhost`. Keep your key out of source control and model prompts.

The snippets explain each step of the [complete examples](#complete-examples). Use those programs to run the walkthrough without assembling fragments.

{{< multitabs id="gateway-connect" tab1="Python" tab2="TypeScript" tab3="CLI" >}}

```python
import json

from redis_iris import ContextGateway

gateway = ContextGateway.from_env()
```

`from_env()` reads the connection values. The SDK manages MCP sessions for discovery and calls.

-tab-sep-

```typescript
import { ContextGateway } from "@redis-iris/context-gateway";

const gateway = new ContextGateway({
  url: process.env.IRIS_CONTEXT_GATEWAY_URL!,
  agentKey: process.env.IRIS_CONTEXT_GATEWAY_API_KEY!,
});
const client = await gateway.connect();
```

The TypeScript SDK opens an MCP session. The complete program closes it in a `finally` block.

-tab-sep-

The CLI reads the same environment variables. Run commands in the shell where you set them.

{{< /multitabs >}}

## 3. Discover a tool {#discover-a-tool}

![In full mode, the agent lists all tool definitions and calls a tool by name. In search mode, the agent searches for matching definitions and calls the selected tool through run_tool.](/images/ai/context-engine/context-gateway-exposure-modes.svg)
{width="650"}

Choose the mode configured on your Gateway. In the results, look for `scheduling__filter_provider`.

{{< multitabs id="gateway-discovery" tab1="Search mode" tab2="Full mode" >}}

Search matches words in tool names, titles, and descriptions. This example searches for the sample filter.

**Python**

```python
tools = gateway.search("filter_provider")
for tool in tools:
    print(tool.name, tool.description)
```

**TypeScript**

```typescript
const found = await client.callTool({
  name: "search_tools",
  arguments: { query: "filter_provider", limit: 5 },
});
if (found.isError) throw new Error(JSON.stringify(found.content));
const data = found.structuredContent as { tools?: ToolDefinition[] } | undefined;
if (!Array.isArray(data?.tools)) throw new Error("Search returned no tool definitions.");
const tools = data.tools;
```

`ToolDefinition` is a local type declared in the complete example.

**CLI**

```bash
iris --json context-gateway tools search filter_provider
```

-tab-sep-

List the available tool definitions.

**Python**

```python
tools = gateway.tools()
for tool in tools:
    print(tool.name, tool.description)
```

**TypeScript**

```typescript
const tools: ToolDefinition[] = [];
let cursor: string | undefined;
do {
  const page = await client.listTools(cursor ? { cursor } : {});
  tools.push(...page.tools);
  cursor = page.nextCursor;
} while (cursor);
```

The loop follows the catalog’s pages. `ToolDefinition` is declared in the complete example.

**CLI**

```bash
iris --json context-gateway tools list
```

{{< /multitabs >}}

## 4. Inspect the tool

The input schema describes the arguments the tool accepts. You’ll use `tag_conditions` to match the `specialty` field and `limit` to bound the number of returned records.

{{< multitabs id="gateway-inspect" tab1="Python" tab2="TypeScript" tab3="CLI" >}}

```python
provider_filter = next(
    (tool for tool in tools if tool.name == "scheduling__filter_provider"),
    None,
)
if provider_filter is None:
    raise RuntimeError("The sample tool was not found. Check the scheduling Upstream.")

print(json.dumps(provider_filter.input_schema, indent=2))
```

-tab-sep-

```typescript
const providerFilter = tools.find(
  (tool) => tool.name === "scheduling__filter_provider",
);
if (!providerFilter) throw new Error("The sample tool was not found.");
console.log(JSON.stringify(providerFilter.inputSchema, null, 2));
```

-tab-sep-

Find the tool’s `inputSchema` in the discovery output. Save these arguments in `provider-filter.json`:

```json
{
  "tag_conditions": [{"field": "specialty", "value": "cardiology"}],
  "limit": 100
}
```

{{< /multitabs >}}

## 5. Find cardiologists

Python and CLI use the same call in either mode. TypeScript uses the MCP session directly: call `run_tool` with the discovered identity in search mode, or call the tool’s name in full mode.

{{< multitabs id="gateway-call" tab1="Python" tab2="TypeScript" tab3="CLI" >}}

```python
result = gateway.call(
    provider_filter.name,
    tag_conditions=[{"field": "specialty", "value": "cardiology"}],
    limit=100,
)
if result.is_error:
    raise RuntimeError(result.as_text())

print(json.dumps(result.data, indent=2))
```

-tab-sep-

```typescript
const toolArgs = {
  tag_conditions: [{ field: "specialty", value: "cardiology" }],
  limit: 100,
};
```

**Search mode**

```typescript
const identity = providerFilter._meta?.["com.redis.context-gateway/tool"] as
  | { upstreamId?: string; originalName?: string }
  | undefined;
if (!identity?.upstreamId || !identity.originalName) {
  throw new Error("The discovered tool has no identity.");
}
const result = await client.callTool({
  name: "run_tool",
  arguments: {
    tool: { upstreamId: identity.upstreamId, originalName: identity.originalName },
    toolArgs,
  },
});
```

**Full mode**

```typescript
const result = await client.callTool({
  name: providerFilter.name,
  arguments: toolArgs,
});
```

Check the result in either mode:

```typescript
if (result.isError) throw new Error(JSON.stringify(result.content));
console.log(JSON.stringify(result.structuredContent ?? result.content, null, 2));
```

-tab-sep-

```bash
iris --json context-gateway tools call scheduling__filter_provider \
  --input provider-filter.json
```

{{< /multitabs >}}

Check the tool’s error flag before using its result. Connection and protocol failures can also raise exceptions. See [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md#python-client-errors).

## 6. Check the result

With the sample data, the result contains three providers whose specialty is cardiology:

| Clinic | Matching providers |
| --- | ---: |
| `clinic-a` | 2 |
| `clinic-b` | 1 |

Python exposes the returned data through `result.data`. TypeScript and CLI return MCP responses containing structured content and text content.

You’ve discovered and called a tool through Context Gateway. An agent can use the same tool definitions and results to answer questions about the directory.

## Complete examples {#complete-examples}

Run one program using the connection values you set. Each defaults to search mode. Selecting a mode in the program does not reconfigure the Gateway.

{{< multitabs id="gateway-complete" tab1="Python" tab2="TypeScript" tab3="CLI" >}}

Save as `quickstart.py`. Change `mode` to `"full"` for a full-mode Gateway. Run `python quickstart.py`.

```python
import json

from redis_iris import ContextGateway

gateway = ContextGateway.from_env()

mode = "search"  # Use "full" for a full-mode Gateway.
if mode == "search":
    tools = gateway.search("filter_provider")
elif mode == "full":
    tools = gateway.tools()
else:
    raise ValueError("Choose search or full mode.")

for tool in tools:
    print(tool.name, tool.description)

provider_filter = next(
    (tool for tool in tools if tool.name == "scheduling__filter_provider"),
    None,
)
if provider_filter is None:
    raise RuntimeError("The sample tool was not found. Check the scheduling Upstream.")

print(json.dumps(provider_filter.input_schema, indent=2))

result = gateway.call(
    provider_filter.name,
    tag_conditions=[{"field": "specialty", "value": "cardiology"}],
    limit=100,
)
if result.is_error:
    raise RuntimeError(result.as_text())

print(json.dumps(result.data, indent=2))
```

-tab-sep-

Save as `quickstart.mts`. Run `npx tsx quickstart.mts`, or `GATEWAY_MODE=full npx tsx quickstart.mts` for full mode.

```typescript
import { ContextGateway } from "@redis-iris/context-gateway";

const gateway = new ContextGateway({
  url: process.env.IRIS_CONTEXT_GATEWAY_URL!,
  agentKey: process.env.IRIS_CONTEXT_GATEWAY_API_KEY!,
});
const client = await gateway.connect();

type ToolDefinition = {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  _meta?: Record<string, unknown>;
};

// Set GATEWAY_MODE=full to use a full-mode Gateway.
const mode = process.env.GATEWAY_MODE ?? "search";

try {
  let tools: ToolDefinition[];
  if (mode === "search") {
    const found = await client.callTool({
      name: "search_tools",
      arguments: { query: "filter_provider", limit: 5 },
    });
    if (found.isError) throw new Error(JSON.stringify(found.content));
    const data = found.structuredContent as { tools?: ToolDefinition[] } | undefined;
    if (!Array.isArray(data?.tools)) throw new Error("Search returned no tool definitions.");
    tools = data.tools;
  } else if (mode === "full") {
    tools = [];
    let cursor: string | undefined;
    do {
      const page = await client.listTools(cursor ? { cursor } : {});
      tools.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);
  } else {
    throw new Error("Choose search or full mode.");
  }
  for (const tool of tools) console.log(tool.name, tool.description);

  const providerFilter = tools.find(
    (tool) => tool.name === "scheduling__filter_provider",
  );
  if (!providerFilter) throw new Error("The sample tool was not found.");
  console.log(JSON.stringify(providerFilter.inputSchema, null, 2));

  const toolArgs = {
    tag_conditions: [{ field: "specialty", value: "cardiology" }],
    limit: 100,
  };

  if (mode === "search") {
    const identity = providerFilter._meta?.["com.redis.context-gateway/tool"] as
      | { upstreamId?: string; originalName?: string }
      | undefined;
    if (!identity?.upstreamId || !identity.originalName) {
      throw new Error("The discovered tool has no identity.");
    }
    const result = await client.callTool({
      name: "run_tool",
      arguments: {
        tool: { upstreamId: identity.upstreamId, originalName: identity.originalName },
        toolArgs,
      },
    });
    if (result.isError) throw new Error(JSON.stringify(result.content));
    console.log(JSON.stringify(result.structuredContent ?? result.content, null, 2));
  } else {
    const result = await client.callTool({
      name: providerFilter.name,
      arguments: toolArgs,
    });
    if (result.isError) throw new Error(JSON.stringify(result.content));
    console.log(JSON.stringify(result.structuredContent ?? result.content, null, 2));
  }
} finally {
  await client.close();
}
```

-tab-sep-

Save as `quickstart.cli.sh`. Run `bash quickstart.cli.sh`, or `GATEWAY_MODE=full bash quickstart.cli.sh` for full mode. The script writes `provider-filter.json` in the current directory.

```bash
set -euo pipefail

# Use GATEWAY_MODE=full for a full-mode Gateway.
case "${GATEWAY_MODE:-search}" in
  search) iris --json context-gateway tools search filter_provider ;;
  full) iris --json context-gateway tools list ;;
  *) echo 'Choose search or full mode.' >&2; exit 2 ;;
esac

cat > provider-filter.json <<'JSON'
{"tag_conditions":[{"field":"specialty","value":"cardiology"}],"limit":100}
JSON
iris --json context-gateway tools call scheduling__filter_provider --input provider-filter.json
```

{{< /multitabs >}}

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Connection or authentication fails | Check the MCP endpoint, key, and the key’s access to this Gateway. |
| Search reports that the Gateway is in full mode | Use the Full mode example or the search-mode endpoint. |
| The sample tool is missing | Confirm that the `scheduling` Context Surface is enabled and its catalog contains `filter_provider`. |
| No records match | Confirm that the sample data is loaded and indexing has completed. |

See [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md) for further troubleshooting.

## Next steps

- [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md): Connect the Gateway to an agent framework.
- [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md): Add tool sources and configure caching and compression.
- [Connect with MCP](/content/develop/ai/context-engine/context-gateway/mcp.md): Work directly with sessions and stored results.
