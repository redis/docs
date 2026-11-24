import asyncio
import os
from pathlib import Path

from langchain.agents import create_agent
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI

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
    client = MultiServerMCPClient(
        {
            "clinic": {
                "url": os.environ["IRIS_CONTEXT_GATEWAY_URL"],
                "transport": "streamable_http",
                "headers": {
                    "Authorization": (
                        f"Bearer "
                        f"{os.environ['IRIS_CONTEXT_GATEWAY_API_KEY']}"
                    )
                },
            }
        }
    )

    tools = await client.get_tools()
    agent = create_agent(
        model=ChatOpenAI(model=os.environ["OPENAI_MODEL"]),
        tools=tools,
        system_prompt=INSTRUCTIONS,
    )

    result = await agent.ainvoke(
        {
            "messages": [
                {"role": "user", "content": QUESTION}
            ]
        },
        config={"recursion_limit": 30},
    )
    print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(main())
