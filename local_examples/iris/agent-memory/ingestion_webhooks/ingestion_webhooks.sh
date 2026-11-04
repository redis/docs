# EXAMPLE: iris_agent_memory_ingestion_webhooks
# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"
OWNER_ID=quickstart-user
# HIDE_END

# STEP_START ingestion-webhooks-test-create
SUFFIX=$(openssl rand -hex 6)
jq -n --arg id "example-hook-test-$SUFFIX" --arg key "example-hook-request-$SUFFIX" --arg owner "$OWNER_ID" '{
  idempotencyKey: $key,
  memories: [{memoryId: $id, ownerId: $owner, text: "[reject] synthetic webhook test"}]
}' > hook-test.json
for attempt in first retry; do  # the retry repeats the identical request
  echo "$attempt:"
  curl --fail-with-body --silent --show-error \
    -X POST "$MEMORY_API/memories" \
    -H "$AUTH" -H 'Content-Type: application/json' --data-binary @hook-test.json | jq .
done
# STEP_END

# STEP_START ingestion-webhooks-status
CURSOR=''
FIRST_EVENT_ID=''
while :; do
  PAGE=$(curl --fail-with-body --silent --show-error --get \
    "$MEMORY_API/ingestion-hook-events" -H "$AUTH" \
    --data-urlencode 'limit=20' ${CURSOR:+--data-urlencode "cursor=$CURSOR"})
  jq -c '.items[] | {eventId, path, state, applyState}' <<< "$PAGE"
  [ -n "$FIRST_EVENT_ID" ] || FIRST_EVENT_ID=$(jq -r '.items[0].eventId // empty' <<< "$PAGE")
  CURSOR=$(jq -r '.nextCursor // empty' <<< "$PAGE")
  [ -n "$CURSOR" ] || break
done

if [ -n "$FIRST_EVENT_ID" ]; then
  curl --fail-with-body --silent --show-error \
    "$MEMORY_API/ingestion-hook-events/$FIRST_EVENT_ID" -H "$AUTH" | jq .
fi
# STEP_END

# HIDE_START
jq '{memoryIds: [.memories[].memoryId]}' hook-test.json | curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/bulk-delete" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- > /dev/null
# HIDE_END
