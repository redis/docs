# EXAMPLE: iris_agent_memory_developer_guide
# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"
OWNER_ID=quickstart-user
SESSION_ID=travel-planning-session
# HIDE_END

# STEP_START agent-memory-turn
MESSAGE="Where should I eat in Kyoto?"

# 1. Retrieve the conversation and the user's relevant memories.
SESSION=$(curl --fail-with-body --silent --show-error \
  "$MEMORY_API/sessions/$SESSION_ID" -H "$AUTH")
jq -n --arg query "$MESSAGE" --arg owner "$OWNER_ID" \
  '{query: $query, filter: {ownerId: {eq: $owner}}, limit: 5}' > search.json
MEMORIES=$(curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/search" -H "$AUTH" \
  -H 'Content-Type: application/json' --data-binary @search.json)

# 2. Build the model context.
jq -n --argjson session "$SESSION" --argjson memories "$MEMORIES" --arg message "$MESSAGE" '{
  summary: $session.summary.text,
  history: [$session.events[] | {role, text: ([.content[].text] | join(" "))}],
  memories: [$memories.items[].text],
  message: $message
}'

# 3. Call your model. This example uses a fixed answer.
REPLY="Try a shojin ryori lunch near Tenryu-ji in Arashiyama."

# 4. Save both messages to the session.
add_event() {
  jq -n --arg role "$1" --arg actor "$2" --arg text "$3" \
    --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg key "$(uuidgen)" \
    '{actorId: $actor, role: $role, content: [{text: $text}], createdAt: $now, idempotencyKey: $key}' |
    curl --fail-with-body --silent --show-error \
      -X POST "$MEMORY_API/sessions/$SESSION_ID/events" -H "$AUTH" \
      -H 'Content-Type: application/json' --data-binary @- | jq -r '.event.eventId'
}
add_event USER "$OWNER_ID" "$MESSAGE"
add_event ASSISTANT travel-agent "$REPLY"
# STEP_END

# STEP_START agent-memory-remember
jq -n --arg owner "$OWNER_ID" --arg key "$(uuidgen)" '{
  idempotencyKey: $key,
  memories: [{
    memoryId: "example-seat-preference",
    text: "Prefers aisle seats on long flights.",
    ownerId: $owner,
    topics: ["travel"]
  }]
}' > memory.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories" -H "$AUTH" \
  -H 'Content-Type: application/json' --data-binary @memory.json | jq .
# STEP_END
