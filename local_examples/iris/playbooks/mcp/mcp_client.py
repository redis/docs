# EXAMPLE: iris_playbook_mcp_client
# STEP_START playbook-mcp-client
import asyncio
import base64
import json
import os
from pathlib import Path

import httpx2
from mcp import Client
from mcp.client.streamable_http import streamable_http_client


def read_result(result):
    if result.is_error:
        raise RuntimeError(f"Playbook tool failed: {result.content}")
    if result.structured_content is not None:
        return result.structured_content
    return json.loads(next(block.text for block in result.content if block.type == "text"))


async def main():
    url = f"{os.environ['PLAYBOOK_URL'].rstrip('/')}/v1/playbooks/{os.environ['PLAYBOOK_ID']}/mcp"
    async with httpx2.AsyncClient(
        headers={"Authorization": f"Bearer {os.environ['PLAYBOOK_API_KEY']}"}
    ) as http:
        async with Client(streamable_http_client(url, http_client=http)) as client:
            print("Tools:", [tool.name for tool in (await client.list_tools()).tools])
            previews = read_result(await client.call_tool("discover_entries", {
                "query": "Draft a reply to a customer whose refund status shows Processing.",
                "limit": 3,
            }))
            entries = previews["pinnedEntries"] + previews["discoveredEntries"]
            for entry in entries:
                if entry["entryType"] == "faq":
                    print("FAQ:", entry["faq"]["answer"])
            skill = next((entry for entry in entries if entry["entryType"] == "skill"), None)
            if skill is None:
                print("No skill preview returned; check the query, publication, and discovery budget.")
                return
            loaded = read_result(await client.call_tool("load_skill", {
                "entry_id": skill["entryId"], "version": skill["version"],
            }))
            instructions = loaded["content"]["instructions"]
            if not isinstance(instructions, str):
                raise RuntimeError("Skill response has no valid instructions.")
            print(instructions)
            resource = next((item for item in loaded["content"]["resources"]
                             if item["path"] == "references/reply-template.md"), None)
            if resource is None:
                print("This skill has no refund reply template.")
                return
            file = read_result(await client.call_tool("fetch_resource", {"uri": resource["uri"]}))
            if "text" in file:
                print(file["text"])
            else:
                Path("resource.bin").write_bytes(base64.b64decode(file["blob"]))
                print("Saved binary resource to resource.bin")


asyncio.run(main())
# STEP_END
