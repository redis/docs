# EXAMPLE: iris_playbook_async
# STEP_START playbook-async-search
import asyncio
import os

from redis_iris.agent_playbook import AgentPlaybook, AgentPlaybookSettings


async def main():
    async with AgentPlaybook(
        AgentPlaybookSettings(
            url=os.environ["PLAYBOOK_URL"],
            playbook_id=os.environ["PLAYBOOK_ID"],
            api_key=os.environ["PLAYBOOK_API_KEY"],
            timeout=30.0,
        )
    ) as playbook:
        results = await playbook.client.search_faqs_async(
            query="Where can I see how my refund is progressing?",
            limit=5,
        )
        for match in results.matches:
            if match.faq is not None:
                print(match.faq.answer)


asyncio.run(main())
# STEP_END
