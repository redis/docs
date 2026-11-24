# EXAMPLE: iris_agent_memory_quickstart_delete
# STEP_START agent-memory-quickstart-delete
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"

curl --fail-with-body --silent --show-error -X DELETE \
  "$MEMORY_API/sessions/travel-planning-session" -H "$AUTH"

jq -n '{filter: {ownerId: {eq: "quickstart-user"}}, limit: 100}' > owned.json
IDS=$(curl --fail-with-body --silent --show-error -X POST "$MEMORY_API/memories/search" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @owned.json | jq -c '[.items[].memoryId]')
if [ "$IDS" != "[]" ]; then
  curl --fail-with-body --silent --show-error -X POST "$MEMORY_API/memories/bulk-delete" \
    -H "$AUTH" -H 'Content-Type: application/json' \
    --data "$(jq -n --argjson ids "$IDS" '{memoryIds: $ids}')" | jq .
fi
# STEP_END
