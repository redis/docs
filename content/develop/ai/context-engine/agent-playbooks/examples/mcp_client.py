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
