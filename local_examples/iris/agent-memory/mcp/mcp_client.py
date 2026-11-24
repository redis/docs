# EXAMPLE: iris_agent_memory_mcp_client
# STEP_START agent-memory-mcp-client
import asyncio
import json
import os
from uuid import uuid4

import httpx2
from mcp import Client
from mcp.client.streamable_http import streamable_http_client

OWNER_ID = "mcp-quickstart-user"


def read_result(result):
    if result.is_error:
        raise RuntimeError(f"Agent Memory tool failed: {result.content}")
    if result.structured_content is not None:
        return result.structured_content
    return json.loads(next(block.text for block in result.content if block.type == "text"))


async def main():
    url = (
        f"{os.environ['IRIS_AGENT_MEMORY_URL'].rstrip('/')}"
        f"/iris/data/v1/agent-memory/stores/{os.environ['IRIS_AGENT_MEMORY_STORE_ID']}/mcp"
    )
    memory_id = f"mcp-example-{uuid4().hex[:12]}"
    async with httpx2.AsyncClient(
        headers={"Authorization": f"Bearer {os.environ['IRIS_AGENT_MEMORY_API_KEY']}"}
    ) as http:
        async with Client(streamable_http_client(url, http_client=http)) as client:
            print("Tools:", [tool.name for tool in (await client.list_tools()).tools])

            created = await client.call_tool(
                "create_long_term_memories",
                {
                    "idempotency_key": str(uuid4()),
                    "memories": [
                        {
                            "id": memory_id,
                            "text": "The user prefers aisle seats on long flights.",
                            "owner_id": OWNER_ID,
                            "topics": ["travel"],
                        }
                    ],
                },
            )
            print(json.dumps(read_result(created), indent=2))

            found = await client.call_tool(
                "search_long_term_memory",
                {"text": "Which seat does the user like?", "owner_id": OWNER_ID, "limit": 3},
            )
            print(json.dumps(read_result(found), indent=2))

            deleted = await client.call_tool(
                "delete_long_term_memories", {"memory_ids": [memory_id]}
            )
            print(json.dumps(read_result(deleted), indent=2))


asyncio.run(main())
# STEP_END
