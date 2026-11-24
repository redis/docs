# EXAMPLE: iris_agent_memory_quickstart
set -euo pipefail

# STEP_START agent-memory-connect
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
OWNER_ID=quickstart-user
SESSION_ID=travel-planning-session
curl --fail-with-body --silent --show-error \
  "$MEMORY_API/health" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" | jq .
# STEP_END

# STEP_START agent-memory-quickstart-save
jq -n --arg owner "$OWNER_ID" --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg key "$(uuidgen)" '{
  actorId: $owner,
  role: "USER",
  content: [{text: "I am visiting Tokyo and Kyoto next month. I am vegetarian and prefer spicy food."}],
  createdAt: $now,
  idempotencyKey: $key
}' > event.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/sessions/$SESSION_ID/events" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @event.json | jq .
# STEP_END

# STEP_START agent-memory-quickstart-transcript
curl --fail-with-body --silent --show-error \
  "$MEMORY_API/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" | jq '.events[] | {role, actorId, content}'
# STEP_END

# STEP_START agent-memory-quickstart-recall
jq -n --arg owner "$OWNER_ID" '{
  query: "What dietary requirements and food preferences does the user have?",
  filter: {ownerId: {eq: $owner}},
  limit: 5
}' > search.json
for _ in $(seq 30); do  # extraction runs in the background
  RESULTS=$(curl --fail-with-body --silent --show-error \
    -X POST "$MEMORY_API/memories/search" \
    -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
    -H 'Content-Type: application/json' --data-binary @search.json)
  [ "$(jq '.items | length' <<< "$RESULTS")" -gt 0 ] && break
  sleep 10
done
jq '.items[] | {memoryId, text, memoryType}' <<< "$RESULTS"
# STEP_END
