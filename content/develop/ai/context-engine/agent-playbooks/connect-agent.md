---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Discover published knowledge and load a skill using a read-only Model Context Protocol client.
hideListLinks: true
linktitle: Connect an agent
title: Connect an agent
weight: 20
---

Use Model Context Protocol (MCP) to discover knowledge, load a skill, and fetch its files.

## Prepare the connection

1. Complete [Publish your first skill]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart" >}}). Keep `PLAYBOOK_URL`, `PLAYBOOK_ID`, and the printed `PLAYBOOK_SKILL_ID` in your shell.
1. Keep `PLAYBOOK_READ_API_KEY` from [the access setup]({{< relref "/operate/iris/agent-playbooks/authentication#issue-a-reader-key" >}}). If an administrator supplied a reader application programming interface (API) key instead, set it now:

   ```sh
   export PLAYBOOK_READ_API_KEY='<your-read-only-key>'
   ```

1. Install the MCP client in your virtual environment:

   ```sh
   python -m pip install 'mcp==1.30.0'
   ```

## Verify retrieval

Save this as `mcp_client.py`, or [download it]({{< relref "/develop/ai/context-engine/agent-playbooks/examples/" >}}mcp_client.py). It exercises the agent's tool calls without calling a language model.

```python
"""Discover and load one published Skill over MCP without invoking a model."""

import asyncio
import os

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


def content(result):
    if result.isError:
        detail = "\n".join(item.text for item in result.content if item.type == "text")
        raise RuntimeError(f"Playbook tool failed: {detail or 'No error detail returned.'}")
    if result.structuredContent is None:
        raise RuntimeError("Expected structuredContent from the Playbook tool.")
    return result.structuredContent


async def run():
    endpoint = (
        f"{os.environ['PLAYBOOK_URL'].rstrip('/')}"
        f"/v1/playbooks/{os.environ['PLAYBOOK_ID']}/mcp"
    )
    async with httpx.AsyncClient(
        headers={"Authorization": f"Bearer {os.environ['PLAYBOOK_READ_API_KEY']}"},
        timeout=30,
    ) as http_client:
        async with streamable_http_client(endpoint, http_client=http_client) as streams:
            async with ClientSession(streams[0], streams[1]) as session:
                await session.initialize()
                tools = await session.list_tools()
                print("Tools:", ", ".join(tool.name for tool in tools.tools))

                discovered = content(await session.call_tool("discover_entries", {
                    "query": "Where is my refund?",
                    "pinned_entries": [{"entry_id": os.environ["PLAYBOOK_SKILL_ID"]}],
                    "limit": 1,
                }))
                selected = discovered["pinnedEntries"][0]
                loaded = content(await session.call_tool("load_skill", {
                    "entry_id": selected["entryId"],
                    "version": selected["version"],
                }))
                print("Instructions:", loaded["content"]["instructions"])

                resource = next(
                    item for item in loaded["content"]["resources"]
                    if item["path"] == "references/reply-template.md"
                )
                fetched = content(await session.call_tool("fetch_resource", {
                    "uri": resource["uri"],
                }))
                print("Reference:", fetched["text"])


if __name__ == "__main__":
    asyncio.run(run())
```

Run `python mcp_client.py`. Expect three tool names, skill instructions, and the reply template. The pin makes this a connectivity check independent of similarity scoring.

Copy the entry ID and version from discovery, then the resource's uniform resource identifier (URI) from the loaded skill. Keep these returned values together; do not invent file addresses or substitute versions.

## Configure your agent framework

In a client that supports Streamable HTTP and authorization headers, register an MCP server with these settings:

| Setting | Value |
|:--------|:------|
| Transport | Streamable HTTP |
| Endpoint | `<PLAYBOOK_URL>/v1/playbooks/<PLAYBOOK_ID>/mcp` |
| Request header | `Authorization: Bearer <PLAYBOOK_READ_API_KEY>` |

The endpoint must be reachable from the process that runs the MCP client. The Helm guide's `127.0.0.1` address works for a client on your machine; a hosted client needs a reachable HTTPS endpoint.

Pass the user's task to `discover_entries` without the sample pin. Frequently asked question (FAQ) results contain answers. For a relevant skill, call `load_skill`, then `fetch_resource` only for files needed by the task. Your application controls model context and actions; Playbooks serves content.

## Handle retrieval failures

Check `isError` before reading an MCP result's `structuredContent`.

- If a discovered version is no longer published, rediscover once and reassess the result.
- If results are empty, check publication, filters, and similarity thresholds. `budgetTruncated: true` means the [preview budget]({{< relref "/develop/ai/context-engine/agent-playbooks/discovery#limit-preview-size" >}}) omitted matching content.
- If a pin is missing or unpublished, correct the pin or publish the entry. Invalid pins fail the request.
- If authentication fails, check the endpoint and key instead of retrying the same request.

After the walkthrough, [delete the sample skill]({{< relref "/develop/ai/context-engine/agent-playbooks/publish-knowledge#delete-the-example" >}}) with the author key.
