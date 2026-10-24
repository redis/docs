# EXAMPLE: iris_lens_instrument
# STEP_START init
from redis_iris import lens

lens.init(agent_id="support-bot", service_name="support-api")
# STEP_END

# STEP_START open_turn
import uuid

session_id = f"session-{uuid.uuid4().hex[:8]}"

with lens.turn(session_id, thread_id="thread-1", user_id="user-1042") as turn:
    turn.set_attribute("app.channel", "web")
    answer = "Your refund was issued on May 2."
    turn.set_outcome("completed")
# STEP_END

# STEP_START retrieval
question = "How long do refunds take?"
documents = [
    ("doc-17", 0.88, "Refunds post within 5 to 7 business days."),
    ("doc-04", 0.61, "Store credit is available immediately."),
]

with lens.turn(session_id) as turn:
    with lens.retrieval(query=question, data_source="help-center") as search:
        search.results(documents)
    turn.set_outcome("completed")
# STEP_END

# STEP_START memory_recall
memories = [
    ("mem-1", 0.91, "The customer prefers email updates."),
    ("mem-2", 0.42, "The customer asked about gift wrapping in March."),
]

with lens.turn(session_id) as turn:
    with lens.memory_recall(query=question, store_id="support-memories") as recall:
        recall.results(memories)
    turn.set_outcome("completed")
# STEP_END

# STEP_START prompt_assembly
with lens.turn(session_id) as turn:
    with lens.retrieval(query=question, data_source="help-center") as search:
        search.results(documents)
    with lens.memory_recall(query=question, store_id="support-memories") as recall:
        recall.results(memories)

    with lens.prompt_assembly() as prompt:
        prompt.fetched(documents + memories)
        prompt.used([documents[0], memories[0]])
    turn.set_outcome("completed")
# STEP_END

# STEP_START custom_span
with lens.turn(session_id) as turn:
    with lens.span("rank_documents", candidates=len(documents)) as step:
        ranked = sorted(documents, key=lambda d: d[1], reverse=True)
        step.set_attribute("app.top_document", ranked[0][0])
    turn.set_outcome("completed")
# STEP_END

# STEP_START include
@lens.include()
def search_vector_store(query):
    # Spans that another OpenTelemetry instrumentation creates in here are exported to Lens.
    return documents
# STEP_END

# STEP_START turn_id
with lens.turn(session_id) as turn:
    print(f"Turn ID: {lens.current_trace_id()}")
    turn.set_outcome("completed")
print(f"Turn ID after the turn: {turn.trace_id}")
# STEP_END

# STEP_START cross_process
def enqueue(job):
    print(f"Queued job with {len(job['lens'])} Lens headers")
    return job


def worker(job):
    with lens.continue_from(job["lens"]):
        with lens.span("summarize_case"):
            pass


with lens.turn(session_id) as turn:
    job = enqueue({"case": "case-881", "lens": lens.inject()})
    worker(job)
    turn.set_outcome("completed")
# STEP_END

# STEP_START shutdown
if not lens.shutdown(timeout_millis=10_000):
    print("Lens did not finish exporting before the timeout")
# STEP_END
