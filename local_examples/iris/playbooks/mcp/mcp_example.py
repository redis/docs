# EXAMPLE: iris_playbook_mcp
# STEP_START playbook-mcp-example
import asyncio
import os
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

async def main():
    url = f"{os.environ['PLAYBOOK_URL'].rstrip('/')}/v1/playbooks/{os.environ['PLAYBOOK_ID']}/mcp"
    async with MCPServerStreamableHttp(
        name="Agent Playbooks",
        params={
            "url": url,
            "headers": {"Authorization": f"Bearer {os.environ['PLAYBOOK_API_KEY']}"},
        },
        cache_tools_list=True,
        client_session_timeout_seconds=30,
    ) as playbook:
        agent = Agent(
            name="Support assistant",
            model="gpt-5-mini",
            instructions=(
                "Use Agent Playbooks to find published guidance before answering. "
                "For reply-drafting tasks, call load_skill with the entry identifier and version from discovery. "
                "Fetch the reply template using its uri from load_skill; never construct a file URI. "
                "Follow the skill instructions and return the completed customer reply. "
                "If no relevant knowledge is available or a tool fails, say so."
            ),
            mcp_servers=[playbook],
        )

        result = await Runner.run(
            agent,
            "Draft a customer reply using the refund-support-reply skill and template. "
            "The customer says their refund stage is Processing.",
        )
        for item in result.new_items:
            if item.type == "tool_call_item" and getattr(item.raw_item, "type", None) == "function_call":
                print("Tool:", item.raw_item.name, item.raw_item.arguments)
        print(result.final_output)

asyncio.run(main())
# STEP_END
