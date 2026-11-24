# EXAMPLE: iris_agent_memory_long_term_memory
# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"
OWNER_ID=quickstart-user
# HIDE_END

# STEP_START ltm-create
jq -n --arg owner "$OWNER_ID" --arg key "$(uuidgen)" '{
  idempotencyKey: $key,
  memories: [
    {memoryId: "example-diet", text: "The user is vegetarian.", ownerId: $owner, topics: ["food"]},
    {memoryId: "example-cuisine", text: "The user prefers spicy food.", ownerId: $owner, topics: ["food"]},
    {memoryId: "example-seat", text: "The user prefers a window seat.", ownerId: $owner, topics: ["travel"]}
  ]
}' > memories.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @memories.json | jq .
# STEP_END

# STEP_START ltm-search
jq -n --arg owner "$OWNER_ID" '{
  query: "What dietary requirements and food preferences does the user have?",
  filter: {ownerId: {eq: $owner}},
  limit: 5
}' > search.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/search" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @search.json \
  | jq '.items[] | {memoryId, text, memoryType}'
# STEP_END

# STEP_START ltm-filter
jq -n --arg owner "$OWNER_ID" '{
  filter: {ownerId: {eq: $owner}},
  sortBy: "updatedAt",
  sortOrder: "DESC",
  limit: 10
}' > recent.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/search" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @recent.json \
  | jq '.items[] | {updatedAt, memoryId, text}'
# STEP_END

# STEP_START ltm-delete
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/bulk-delete" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  --data '{"memoryIds": ["example-diet", "example-cuisine", "example-seat"]}' | jq .
# STEP_END
