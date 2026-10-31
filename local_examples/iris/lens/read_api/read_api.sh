# EXAMPLE: iris_lens_read_api
set -euo pipefail

# STEP_START connect
LENS_API="${LENS_URL%/}/iris/data/v1beta1/lens/instances/$LENS_INSTANCE_ID"
AUTH="Authorization: Bearer $LENS_API_KEY"
# STEP_END

# STEP_START list_agents
curl --fail-with-body --silent --show-error "$LENS_API/agents" -H "$AUTH" \
  | jq -r '.items[].agentId'
# STEP_END

# STEP_START list_sessions
curl --fail-with-body --silent --show-error -G "$LENS_API/sessions" -H "$AUTH" \
  --data-urlencode "agentId=support-bot" \
  --data-urlencode "range=24h" \
  --data-urlencode "outcome=FAILED" > sessions.json
jq '{effectiveRange, nextCursor, sessions: [.items[] | {sessionId, turnCount, lastSeen}]}' sessions.json
SESSION_ID=$(jq -er '.items[0].sessionId' sessions.json)
# STEP_END

# STEP_START get_session
curl --fail-with-body --silent --show-error "$LENS_API/sessions/$SESSION_ID" -H "$AUTH" > session.json
jq '[.turns[] | {traceId, outcome, durationMs, tokens: .tokens.total}]' session.json
TURN_ID=$(jq -er '.turns[0].traceId' session.json)
# STEP_END

# STEP_START get_turn
curl --fail-with-body --silent --show-error "$LENS_API/turns/$TURN_ID" -H "$AUTH" > turn.json
jq '[.manifest.entries[] | {source, state, fetchedCount, usedCount}]' turn.json
# STEP_END

# STEP_START get_content
HASH=$(jq -r '.manifest.entries[0].candidates[0].content.hash // empty' turn.json)
if [ -n "$HASH" ]; then
  curl --fail-with-body --silent --show-error "$LENS_API/turns/$TURN_ID/content/$HASH" -H "$AUTH" \
    | jq '{availability, body}'
fi
# STEP_END

# STEP_START gateway_result
for SPAN_ID in $(jq -r '.contextRetrieverToolSteps[].spanId' turn.json); do
  curl --fail-with-body --silent --show-error \
    "$LENS_API/turns/$TURN_ID/tools/$SPAN_ID/result" -H "$AUTH" \
    | jq '{spanId, outcome, classification}'
done
# STEP_END
