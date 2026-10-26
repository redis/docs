# EXAMPLE: iris_lens_openai_agents
# STEP_START openai_agents_turn
import asyncio

from agents import Agent, Runner

from redis_iris import lens

lens.init(agent_id="support-bot")
agent = Agent(name="Support", instructions="Answer refund questions in two sentences.")


async def handle(session_id, user_id, message):
    with lens.turn(session_id, user_id=user_id) as turn:
        result = await Runner.run(agent, message)
        turn.set_outcome("completed")
    return result.final_output


print(asyncio.run(handle("session-1", "user-1042", "Where can I see my refund status?")))
# STEP_END

lens.shutdown()
