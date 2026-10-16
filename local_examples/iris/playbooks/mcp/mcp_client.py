# EXAMPLE: iris_playbook_mcp_client
# STEP_START playbook-mcp-client
import asyncio
import json
import os

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
            result = await client.call_tool(
                "discover_entries",
                {
                    "query": "Draft a reply to a customer whose refund status shows Processing.",
                    "limit": 3,
                },
            )
            print(json.dumps(read_result(result), indent=2))


asyncio.run(main())
# STEP_END
