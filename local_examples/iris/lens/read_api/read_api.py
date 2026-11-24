# EXAMPLE: iris_lens_read_api
# STEP_START connect
import os

from redis_agent_lens import Lens

client = Lens(
    server_url=os.environ["LENS_URL"],
    instance_id=os.environ["LENS_INSTANCE_ID"],
)
# STEP_END

# STEP_START list_agents
agents = client.list_agents()
for agent in agents.items:
    print(agent.agent_id)
# STEP_END

# STEP_START list_sessions
page = client.list_sessions(agent_id="support-bot", range="24h", outcome=["FAILED"])
print(f"Showing {page.effective_range} of sessions")

sessions = list(page.items)
while page.next_cursor:
    page = client.list_sessions(
        agent_id="support-bot", range="24h", outcome=["FAILED"], cursor=page.next_cursor
    )
    sessions.extend(page.items)

for session in sessions:
    print(session.session_id, session.turn_count, session.last_seen)
# STEP_END

# STEP_START get_session
if not sessions:
    raise SystemExit("No matching sessions in the last 24 hours")

session = client.get_session(session_id=sessions[0].session_id)
for summary in session.turns:
    outcome = summary.outcome.value if summary.outcome else "no outcome"
    print(summary.trace_id, outcome, summary.duration_ms, summary.tokens.total)
# STEP_END

# STEP_START get_turn
turn = client.get_turn(turn_id=session.turns[0].trace_id)
for entry in turn.manifest.entries:
    print(f"{entry.source}: {entry.state.value}, fetched {entry.fetched_count}, used {entry.used_count}")
    for candidate in entry.candidates:
        print(f"  {candidate.id} score={candidate.score} used={candidate.used}")
# STEP_END

# STEP_START get_content
for entry in turn.manifest.entries:
    for candidate in entry.candidates:
        if candidate.content and candidate.content.hash:
            content = client.get_content(turn_id=turn.trace_id, hash=candidate.content.hash)
            print(candidate.id, content.availability.value, content.body)
# STEP_END

# STEP_START gateway_result
for step in turn.context_retriever_tool_steps:
    result = client.get_context_retriever_result(turn_id=turn.trace_id, span_id=step.span_id)
    print(step.tool_name, result.outcome.value, result.classification.value)
# STEP_END
