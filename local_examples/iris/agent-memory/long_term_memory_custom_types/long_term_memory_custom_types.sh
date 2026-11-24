# EXAMPLE: iris_agent_memory_long_term_memory_custom_types
# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"
OWNER_ID=quickstart-user
# HIDE_END

# STEP_START custom-memory-event
jq -n --arg owner "$OWNER_ID" --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg key "$(uuidgen)" '{
  actorId: $owner,
  role: "USER",
  content: [{text: "I am visiting Tokyo and Kyoto next month. I am vegetarian."}],
  createdAt: $now,
  idempotencyKey: $key
}' > event.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/sessions/example-trip-preference-session/events" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @event.json | jq .
# STEP_END

# STEP_START custom-memory-search
jq -n --arg owner "$OWNER_ID" --arg query "What are the requirements for the user's trip?" '{
  query: $query,
  filter: {ownerId: {eq: $owner}, memoryType: {eq: "trip_preference"}},
  limit: 5
}' > search.json
for _ in $(seq 30); do  # extraction runs in the background
  RESULTS=$(curl --fail-with-body --silent --show-error \
    -X POST "$MEMORY_API/memories/search" \
    -H "$AUTH" -H 'Content-Type: application/json' --data-binary @search.json)
  [ "$(jq '.items | length' <<< "$RESULTS")" -gt 0 ] && break
  sleep 10
done
jq '.items[] | {memoryId, memoryType, attributes}' <<< "$RESULTS"
# STEP_END

# STEP_START custom-memory-fields
jq -r '[.items[].attributes.dietary_requirements // empty | .[] | strings] | unique
  | if length == 0 then "No matching trip preferences yet. Retry after a short wait."
    else "Restaurant requirements: \(join(", "))" end' <<< "$RESULTS"
# STEP_END

# STEP_START custom-memory-direct
jq -n --arg owner "$OWNER_ID" --arg key "$(uuidgen)" '{
  idempotencyKey: $key,
  memories: [{
    memoryId: "example-trip-form-1",
    text: "The user plans to visit Tokyo and Kyoto next month and requires vegetarian food.",
    ownerId: $owner,
    memoryType: "trip_preference",
    attributes: {
      destinations: ["Tokyo", "Kyoto"],
      travel_period: "next month",
      dietary_requirements: ["vegetarian"],
      food_preferences: ["spicy food"]
    }
  }]
}' > direct.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @direct.json | jq .
# STEP_END

