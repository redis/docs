"""Create, publish, search, and remove one FAQ in an existing Playbook."""

import os
import time
from uuid import uuid4

from redis_agent_playbook import Playbook


def run(playbook):
    run_id = uuid4().hex
    question = "How can I check the status of my refund?"
    answer = "Check the refund status in your order history."
    scope = {"eq": {"name": "exampleRun", "value": run_id}}
    created = playbook.create_faq(
        entry_key=f"refund-status-{run_id}",
        content={
            "intents": [question, "Where is my refund?"],
            "attributes": {"exampleRun": run_id, "locale": "en-US"},
            "payload": {"faq": {"question": question, "answer": answer}},
        },
    )
    faq_id = created.entry.entry_id
    print(f"Created FAQ: {faq_id}")

    try:
        assert created.entry.publication is None
        before = playbook.search_faqs(
            query=question, filter_=scope, minimum_score=0.0, limit=1,
        )
        assert not before.matches, "An unpublished FAQ must not be searchable."
        print("Before publication: no matches")

        playbook.publish_faq(faq_id=faq_id, version=created.version.version)
        deadline = time.monotonic() + 30
        while True:
            result = playbook.search_faqs(
                query=question, filter_=scope, minimum_score=0.0, limit=1,
            )
            if result.matches:
                match = result.matches[0]
                assert match.entry_id == faq_id
                assert match.version == created.version.version
                assert match.faq is not None and match.faq.answer == answer
                print(f"After publication: {match.faq.answer}")
                break
            if time.monotonic() >= deadline:
                raise TimeoutError("Published FAQ was not searchable within 30 seconds.")
            time.sleep(1)
    finally:
        # Delete only the entry this invocation created, including its versions.
        playbook.delete_faq(faq_id=faq_id)
        print(f"Deleted example FAQ: {faq_id}")


if __name__ == "__main__":
    with Playbook(
        os.environ["PLAYBOOK_URL"],
        playbook_id=os.environ["PLAYBOOK_ID"],
        api_key=os.environ["PLAYBOOK_API_KEY"],
        retry_config=None,
        timeout_ms=10000,
    ) as client:
        run(client)
