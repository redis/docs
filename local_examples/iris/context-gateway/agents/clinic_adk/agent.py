import os
from pathlib import Path

from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_session_manager import (
    StreamableHTTPConnectionParams,
)
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset

INSTRUCTIONS = (
    Path(__file__)
    .resolve()
    .parent.parent
    .joinpath("clinic_instructions.txt")
    .read_text(encoding="utf-8")
)

gateway_tools = McpToolset(
    connection_params=StreamableHTTPConnectionParams(
        url=os.environ["IRIS_CONTEXT_GATEWAY_URL"],
        headers={
            "Authorization": (
                f"Bearer {os.environ['IRIS_CONTEXT_GATEWAY_API_KEY']}"
            )
        },
    )
)

root_agent = Agent(
    name="clinic_assistant",
    model=os.environ["GOOGLE_MODEL"],
    description="Answers questions using the sample clinic directory.",
    instruction=INSTRUCTIONS,
    tools=[gateway_tools],
)
