import asyncio
import os
from pathlib import Path

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

INSTRUCTIONS = (
    Path(__file__)
    .with_name("clinic_instructions.txt")
    .read_text(encoding="utf-8")
)

QUESTION = (
    "Which clinic has the most cardiologists, "
    "and how many does it have?"
)


async def main():
    async with MCPServerStreamableHttp(
        name="Clinic Gateway",
        params={
            "url": os.environ["IRIS_CONTEXT_GATEWAY_URL"],
            "headers": {
                "Authorization": (
                    f"Bearer {os.environ['IRIS_CONTEXT_GATEWAY_API_KEY']}"
                )
            },
            "timeout": 30,
        },
        cache_tools_list=False,
    ) as server:
        agent = Agent(
            name="Clinic assistant",
            model=os.environ["OPENAI_MODEL"],
            instructions=INSTRUCTIONS,
            mcp_servers=[server],
        )

        result = await Runner.run(
            agent,
            QUESTION,
            max_turns=12,
        )
        print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
