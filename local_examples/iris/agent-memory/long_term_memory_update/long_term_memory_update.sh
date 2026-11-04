# EXAMPLE: iris_agent_memory_long_term_memory_update
# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"
OWNER_ID=quickstart-user
MEMORY_ID=example-seat-preference
jq -n --arg owner "$OWNER_ID" --arg id "$MEMORY_ID" '{
  memories: [{memoryId: $id, text: "The user prefers a window seat.", ownerId: $owner, topics: ["travel"]}]
}' > seed.json
curl --fail-with-body --silent --show-error -X POST "$MEMORY_API/memories" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @seed.json > /dev/null
# HIDE_END

# STEP_START ltm-get
curl --fail-with-body --silent --show-error \
  "$MEMORY_API/memories/$MEMORY_ID" -H "$AUTH" > current.json
jq '{text, topics, revision}' current.json
REVISION=$(jq -r .revision current.json)
# STEP_END

# STEP_START ltm-patch
jq -n --arg revision "$REVISION" --arg key "$(uuidgen)" '{
  text: "The user prefers an aisle seat on long flights.",
  topics: ["travel", "flights"],
  expectedRevision: $revision,
  idempotencyKey: $key
}' > patch.json
curl --fail-with-body --silent --show-error \
  -X PATCH "$MEMORY_API/memories/$MEMORY_ID" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @patch.json > updated.json
jq '{text, topics, revision}' updated.json
# STEP_END

# STEP_START ltm-put
jq -n --arg owner "$OWNER_ID" --arg revision "$(jq -r .revision updated.json)" --arg key "$(uuidgen)" '{
  text: "The user prefers an aisle seat and travels with a carry-on bag only.",
  ownerId: $owner,
  topics: ["travel", "flights"],
  expectedRevision: $revision,
  idempotencyKey: $key
}' > replace.json
curl --fail-with-body --silent --show-error \
  -X PUT "$MEMORY_API/memories/$MEMORY_ID" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @replace.json | jq .
# STEP_END

# STEP_START ltm-stale-revision
jq -n --arg owner "$OWNER_ID" --arg revision "$REVISION" '{
  text: "The user prefers a window seat.",
  ownerId: $owner,
  expectedRevision: $revision
}' > stale.json
STATUS=$(curl --silent --show-error -o conflict.json -w '%{http_code}' \
  -X PUT "$MEMORY_API/memories/$MEMORY_ID" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @stale.json)
echo "HTTP $STATUS"
jq '{status, type, detail}' conflict.json
# STEP_END

# HIDE_START
curl --fail-with-body --silent --show-error -X POST "$MEMORY_API/memories/bulk-delete" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  --data "$(jq -n --arg id "$MEMORY_ID" '{memoryIds: [$id]}')" > /dev/null
# HIDE_END
