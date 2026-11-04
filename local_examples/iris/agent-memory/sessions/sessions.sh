# EXAMPLE: iris_agent_memory_sessions
# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"
OWNER_ID=quickstart-user
SESSION_ID=travel-planning-session
# HIDE_END

# STEP_START agent-memory-sessions-add
jq -n --arg owner "$OWNER_ID" --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg key "$(uuidgen)" '{
  actorId: $owner,
  role: "USER",
  content: [{text: "I am vegetarian."}],
  createdAt: $now,
  idempotencyKey: $key
}' > event.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/sessions/$SESSION_ID/events" -H "$AUTH" \
  -H 'Content-Type: application/json' --data-binary @event.json | jq .
# STEP_END

# STEP_START agent-memory-sessions-retrieve
curl --fail-with-body --silent --show-error \
  "$MEMORY_API/sessions/$SESSION_ID" -H "$AUTH" |
  jq '{ownerId, summary: .summary.text, events: [.events[] | {role, actorId, content}]}'
# STEP_END

# STEP_START agent-memory-sessions-list-owner
curl --fail-with-body --silent --show-error --get \
  "$MEMORY_API/sessions" -H "$AUTH" \
  --data-urlencode "ownerId=$OWNER_ID" | jq '.items[].sessionId'
# STEP_END

# STEP_START agent-memory-sessions-list-namespace
jq -n --arg owner "$OWNER_ID" \
  '{name: "example-travel", scope: "PERSONAL", ownerId: $owner}' > namespace.json
NAMESPACE_ID=$(curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/namespaces" -H "$AUTH" \
  -H 'Content-Type: application/json' --data-binary @namespace.json |
  jq -r '.namespace.namespaceId')

jq -n --arg owner "$OWNER_ID" --arg ns "$NAMESPACE_ID" \
  --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg key "$(uuidgen)" '{
  actorId: $owner,
  role: "USER",
  content: [{text: "Plan two days in Kyoto."}],
  createdAt: $now,
  namespaceId: $ns,
  idempotencyKey: $key
}' > trip.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/sessions/example-kyoto-trip/events" -H "$AUTH" \
  -H 'Content-Type: application/json' --data-binary @trip.json > /dev/null

curl --fail-with-body --silent --show-error --get \
  "$MEMORY_API/sessions" -H "$AUTH" \
  --data-urlencode "namespaceId=$NAMESPACE_ID" | jq '.items'
# STEP_END

# STEP_START agent-memory-sessions-list-namespace-owner
curl --fail-with-body --silent --show-error --get \
  "$MEMORY_API/sessions" -H "$AUTH" \
  --data-urlencode "namespaceId=$NAMESPACE_ID" \
  --data-urlencode "ownerId=$OWNER_ID" | jq '.items'
# STEP_END

# STEP_START agent-memory-sessions-list-all
curl --fail-with-body --silent --show-error --get \
  "$MEMORY_API/sessions" -H "$AUTH" \
  --data-urlencode 'includeAll=true' --data-urlencode 'limit=20' |
  jq '{sessions: [.items[] | {sessionId, ownerId}], nextCursor}'
# STEP_END

# STEP_START agent-memory-sessions-add-turns
add_event() {  # add_event ROLE ACTOR_ID TEXT
  jq -n --arg role "$1" --arg actor "$2" --arg text "$3" \
    --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg key "$(uuidgen)" \
    '{actorId: $actor, role: $role, content: [{text: $text}], createdAt: $now, idempotencyKey: $key}' |
    curl --fail-with-body --silent --show-error \
      -X POST "$MEMORY_API/sessions/$SESSION_ID/events" -H "$AUTH" \
      -H 'Content-Type: application/json' --data-binary @- | jq -c '.event | {sessionId, eventId}'
}
add_event ASSISTANT travel-agent "What dates are you traveling?"
add_event USER "$OWNER_ID" "I arrive on October 10 and leave on October 18."
add_event ASSISTANT travel-agent "Would you like formal or casual restaurants?"
add_event USER "$OWNER_ID" "Mostly casual places near public transit."
add_event ASSISTANT travel-agent "Do you have a preferred budget?"
add_event USER "$OWNER_ID" "About 40 euros per person."
# STEP_END

# STEP_START agent-memory-sessions-summary
for _ in $(seq 12); do  # summarization runs in the background
  SESSION=$(curl --fail-with-body --silent --show-error \
    "$MEMORY_API/sessions/$SESSION_ID" -H "$AUTH")
  [ "$(jq '.summary != null' <<< "$SESSION")" = true ] && break
  sleep 10
done
jq '{summary, events: [.events[] | {role, content}]}' <<< "$SESSION"
# STEP_END
