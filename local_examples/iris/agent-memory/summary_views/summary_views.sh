# EXAMPLE: iris_agent_memory_summary_views
set -euo pipefail

# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
OWNER_ID=quickstart-user
# HIDE_END

# STEP_START summary-view-seed
jq -n --arg owner "$OWNER_ID" --arg key "$(uuidgen)" '{
  memories: [
    {memoryId: "example-diet", ownerId: $owner, text: "The user is vegetarian and prefers spicy food."},
    {memoryId: "example-trip", ownerId: $owner, text: "The user wants to visit Tokyo and Kyoto next month."}
  ],
  idempotencyKey: $key
}' > memories.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @memories.json | jq .
# STEP_END

# STEP_START summary-view-create
jq -n --arg owner "$OWNER_ID" '{
  name: "example-travel-profile",
  source: "LONG_TERM",
  visibility: "PRIVATE",
  groupBy: [],
  filter: {ownerId: {eq: $owner}},
  output: {format: "TEXT", instructions: "Summarize the travel preferences in these memories."},
  refreshPolicy: {mode: "MANUAL"}
}' > view.json
VIEW_ID=$(curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/summary-views" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @view.json | jq -er .viewId)
echo "View ID: $VIEW_ID"
# STEP_END

# STEP_START summary-view-refresh
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/summary-views/$VIEW_ID/refresh" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data '{"target": "FULL"}' | jq .
# STEP_END

# STEP_START summary-view-result
for _ in $(seq 60); do  # generation runs in the background
  RESULT=$(curl --fail-with-body --silent --show-error --get \
    "$MEMORY_API/summary-views/$VIEW_ID/result" \
    -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
    --data-urlencode 'includeSourceMemoryIds=true')
  case "$(jq -r .status <<< "$RESULT")" in
    FAILED) jq . <<< "$RESULT"; exit 1 ;;
    EMPTY) echo "No matching source memories."; break ;;
    READY) if jq -e '.stale == false and .value != null' <<< "$RESULT" > /dev/null; then
        jq '{text: .value.text, sourceMemoryCount, summarizedMemoryCount, truncated}' <<< "$RESULT"
        break
      fi ;;
  esac
  sleep 5
done
# STEP_END

# STEP_START summary-view-update
curl --fail-with-body --silent --show-error \
  -X PATCH "$MEMORY_API/summary-views/$VIEW_ID" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"description": "Travel preferences for trip planning."}' | jq '{name, definitionVersion}'
curl --fail-with-body --silent --show-error --get \
  "$MEMORY_API/summary-views" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  --data-urlencode 'limit=20' | jq '.items[] | {viewId, name, state}'
# STEP_END

# STEP_START summary-view-delete
curl --fail-with-body --silent --show-error \
  -X DELETE "$MEMORY_API/summary-views/$VIEW_ID" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" | jq .
# STEP_END
