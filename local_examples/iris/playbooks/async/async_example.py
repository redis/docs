# EXAMPLE: iris_playbook_async
# STEP_START playbook-async-search
import asyncio
from redis_iris import Iris


async def main():
    async with Iris.from_env().agent_playbooks() as playbook:
        results = await playbook.client.search_faqs_async(
            query="Where can I see how my refund is progressing?",
            limit=5,
        )
        for match in results.items:
            if match.faq is not None:
                print(match.faq.answer)


asyncio.run(main())
# STEP_END
