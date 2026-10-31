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

Use Redis Context Gateway to find cardiologists in a sample clinic directory and count them by clinic without loading every record into an agent's context.

## Before you begin

Ask your administrator to [create the sample Gateways and agent key](/content/operate/iris/context-gateway/self-managed/api-examples.md). The sample has three cardiologists: two at `clinic-a` and one at `clinic-b`. It registers the same `scheduling` Context Surface on two Gateways:

- A full mode Gateway exposes each Surface tool directly.
- A search mode Gateway exposes `search_tools` and `run_tool`, plus the handle tools when compression is enabled. It needs a Gateway database and compression enabled on both the Gateway and the deployment.

The Python walkthrough uses the public Gateway SDK. It needs Python 3.10 or later and no model-provider key. The optional command-line interface (CLI) needs Python 3.11 or later.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-context-gateway==1.0.0b1
```

These are beta prerelease packages. The examples use the released MCP client against the updated Gateway service. A newer server contract does not mean a newer SDK package has been published. See [Choose a client](/content/develop/ai/context-engine/context-gateway/developer-guide.md#choose-a-client) for the CLI and TypeScript packages.

## Save connection values

Use each Gateway's returned `mcpEndpoint`, not its Control Plane URL:

```bash
export IRIS_CONTEXT_GATEWAY_URL='<full-mode-gateway-mcp-endpoint>'
export SEARCH_GATEWAY_URL='<search-mode-gateway-mcp-endpoint>'
export IRIS_CONTEXT_GATEWAY_API_KEY='<agent-key>'
```

Keep the agent key out of source control and model prompts. The key needs a `context-gateway` / `gateway` / `use` grant on both Gateways.

## Connect to the Gateway

Save this complete program as `quickstart.py` and run `python quickstart.py`. `ContextGateway.connect()` negotiates a Model Context Protocol (MCP) session and closes it when the block ends.

```python
import asyncio
import os

from redis_context_gateway import ContextGateway
from redis_context_gateway.mcp import HANDLE_META_KEY

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
    full = ContextGateway(os.environ["IRIS_CONTEXT_GATEWAY_URL"], key)
    async with full.connect() as session:
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

    search = ContextGateway(os.environ["SEARCH_GATEWAY_URL"], key)
    async with search.connect() as session:
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

A `401` means the credential was not accepted, `403` means it has no grant for this Gateway, and `404` means the Gateway was not found. A tool failure is different: the Python result has `is_error=True`. The program checks that flag before reading the result. See [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md).

## 1. List the Gateway's tools

The program prints the full-mode catalog and selects the provider filter by the metadata's `originalName`. It calls the discovered name unchanged, such as `scheduling__filter_provider`. Inspect `input_schema` before changing the sample arguments.

## 2. Call a tool

The sample filter sends `tag_conditions` for the `specialty` field. With the sample records, it returns three cardiologists. The full-mode call goes directly to the discovered tool name.

## 3. Search for tools

The search-mode call first discovers the filter with `search_tools`. It copies only `upstreamId` and `originalName` into the `run_tool` reference. Do not copy the catalog revision or other metadata into that reference.

Search mode can also list the handle tools. It does not list every Surface tool individually.

## 4. Read a large result through a handle

The program explicitly captures the filter result with `run_tool_as_handle`, even though this three-record sample is smaller than the automatic capture threshold. It describes the handle, reads two items, counts all captured providers by `location_id`, and releases the handle in `finally`.

The sample count should report two providers for `clinic-a` and one for `clinic-b`. Read the result's completeness and warnings before treating counts as totals: a bounded capture can be partial. Explicit capture returns a tool error if the Gateway cannot hold the result. Only ordinary calls with automatic capture can fall back to returning the result inline.

Direct MCP calls also support `jsonpath` and `groupBy` together, selecting first and grouping second. The released `redis-iris` CLI version `1.0.0b2` still rejects that combination. The example uses only `groupBy`, which both support.

## Use the CLI

In a Python 3.11 or later environment, install the CLI:

```bash
python -m pip install redis-iris==1.0.0b2
```

List the tools and copy the provider filter's discovered name. The sample namespace produces `scheduling__filter_provider`:

```bash
iris --json context-gateway tools list
cat > provider-filter.json <<'JSON'
{"tag_conditions":[{"field":"specialty","value":"cardiology"}],"limit":100}
JSON
iris --json context-gateway tools call scheduling__filter_provider \
  --input provider-filter.json
```

To inspect search mode without changing your full-mode setting:

```bash
IRIS_CONTEXT_GATEWAY_URL="$SEARCH_GATEWAY_URL" \
  iris --json context-gateway tools search filter_provider
```

`--json` is a global flag immediately after `iris`. For language-independent HTTP requests, see [MCP](/content/develop/ai/context-engine/context-gateway/mcp.md).

## Clean up

The program releases its handle and changes no sample records. Ask your administrator to revoke the agent key and remove the sample Gateways when you no longer need them.

## Next steps

- [Connect with MCP](/content/develop/ai/context-engine/context-gateway/mcp.md) to configure another MCP client or sign in with your identity provider.
- [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md) to use the Gateway from OpenAI Agents SDK or LangGraph.
- [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md) to add MCP servers and Context Surfaces.
