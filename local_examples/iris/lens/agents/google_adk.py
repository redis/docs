# EXAMPLE: iris_lens_google_adk
# STEP_START google_adk_turn
import asyncio

from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from google.genai import types

from redis_iris import lens

lens.init(agent_id="support-bot")
agent = Agent(
    name="support",
    model="gemini-2.0-flash",
    instruction="Answer refund questions in two sentences.",
)
runner = InMemoryRunner(agent, app_name="support")


async def handle(session_id, user_id, message):
    await runner.session_service.create_session(
        app_name="support", user_id=user_id, session_id=session_id
    )
    content = types.Content(role="user", parts=[types.Part(text=message)])
    answer = ""
    with lens.turn(session_id, user_id=user_id) as turn:
        async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=content
        ):
            if event.is_final_response() and event.content:
                answer = event.content.parts[0].text
        turn.set_outcome("completed")
    return answer


print(asyncio.run(handle("session-1", "user-1042", "Where can I see my refund status?")))
# STEP_END

lens.shutdown()
