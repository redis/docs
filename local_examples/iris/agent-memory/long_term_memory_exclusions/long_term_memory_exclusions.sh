# EXAMPLE: iris_agent_memory_long_term_memory_exclusions
# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"
OWNER_ID=quickstart-user
SESSION_ID=travel-planning-session
# HIDE_END

# STEP_START exclusion-event
jq -n --arg owner "$OWNER_ID" --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg key "$(uuidgen)" '{
  actorId: $owner,
  role: "USER",
  content: [{text: "I booked Hotel Sakura in Tokyo. For this example, the fictional booking confirmation code is DEMO-7QX9."}],
  createdAt: $now,
  idempotencyKey: $key
}' > event.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/sessions/$SESSION_ID/events" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @event.json | jq .
# STEP_END

# STEP_START exclusion-search
jq -n --arg owner "$OWNER_ID" '{
  query: "Where is the user staying in Tokyo?",
  filter: {ownerId: {eq: $owner}},
  limit: 5
}' > search.json
for _ in $(seq 30); do  # extraction runs in the background
  RESULTS=$(curl --fail-with-body --silent --show-error \
    -X POST "$MEMORY_API/memories/search" \
    -H "$AUTH" -H 'Content-Type: application/json' --data-binary @search.json)
  jq -e 'any(.items[]; .text | contains("Sakura"))' <<< "$RESULTS" > /dev/null && break
  sleep 10
done
jq '.items[] | {memoryId, text}' <<< "$RESULTS"
# STEP_END
