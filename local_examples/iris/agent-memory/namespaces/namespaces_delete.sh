# EXAMPLE: iris_agent_memory_namespaces_delete
set -euo pipefail

# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
OWNER_ID=quickstart-user
# HIDE_END

# STEP_START namespace-delete
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"

curl --fail-with-body --silent --show-error -X DELETE \
  "$MEMORY_API/sessions/example-travel-namespace-session" -H "$AUTH"

jq -n --arg owner "$OWNER_ID" '{filter: {ownerId: {eq: $owner}}, limit: 100}' > owned.json
IDS=$(curl --fail-with-body --silent --show-error -X POST "$MEMORY_API/memories/search" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @owned.json | jq -c '[.items[].memoryId]')
if [ "$IDS" != "[]" ]; then
  curl --fail-with-body --silent --show-error -X POST "$MEMORY_API/memories/bulk-delete" \
    -H "$AUTH" -H 'Content-Type: application/json' \
    --data "$(jq -n --argjson ids "$IDS" '{memoryIds: $ids}')" | jq .
fi

delete_tree() {  # only an empty leaf can be deleted, so remove children first
  local child
  for child in $(curl --fail-with-body --silent --show-error --get "$MEMORY_API/namespaces" \
      -H "$AUTH" --data-urlencode "parentId=$1" | jq -r '.items[].namespaceId'); do
    delete_tree "$child"
  done
  curl --fail-with-body --silent --show-error -X DELETE "$MEMORY_API/namespaces/$1" -H "$AUTH"
  echo "Deleted $1"
}

PERSONAL_ID=$(curl --fail-with-body --silent --show-error --get "$MEMORY_API/namespaces" -H "$AUTH" \
  --data-urlencode 'scope=PERSONAL' --data-urlencode "ownerId=$OWNER_ID" \
  | jq -r '.items[] | select(.name == "example-travel") | .namespaceId')
SHARED_ID=$(curl --fail-with-body --silent --show-error --get "$MEMORY_API/namespaces" -H "$AUTH" \
  --data-urlencode 'scope=SHARED' --data-urlencode 'limit=200' \
  | jq -r '.items[] | select(.name == "example-team-travel") | .namespaceId')
for id in $PERSONAL_ID $SHARED_ID; do
  delete_tree "$id"
done
# STEP_END
