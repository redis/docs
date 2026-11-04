# EXAMPLE: iris_agent_memory_list_sessions
# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"
OWNER_ID=quickstart-user
# HIDE_END

# STEP_START agent-memory-list-session-ids
curl --fail-with-body --silent --show-error --get \
  "$MEMORY_API/sessions" -H "$AUTH" \
  --data-urlencode "ownerId=$OWNER_ID" | jq -r '.items[].sessionId'
# STEP_END

# STEP_START agent-memory-list-sessions-sorted
CURSOR=''
while :; do
  PAGE=$(curl --fail-with-body --silent --show-error --get \
    "$MEMORY_API/sessions" -H "$AUTH" \
    --data-urlencode "ownerId=$OWNER_ID" \
    --data-urlencode 'sortBy=updatedAt' --data-urlencode 'sortOrder=DESC' \
    --data-urlencode 'limit=20' ${CURSOR:+--data-urlencode "cursor=$CURSOR"})
  jq -c '.items[] | {sessionId, updatedAt, namespaceId}' <<< "$PAGE"
  CURSOR=$(jq -r '.nextCursor // empty' <<< "$PAGE")
  [ -n "$CURSOR" ] || break
done
# STEP_END
