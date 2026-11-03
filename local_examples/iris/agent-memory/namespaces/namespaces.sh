# EXAMPLE: iris_agent_memory_namespaces
set -euo pipefail

# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
OWNER_ID=quickstart-user
curl --fail-with-body --silent --show-error \
  "$MEMORY_API/health" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" | jq -r .status
# HIDE_END

# STEP_START namespace-personal-create
jq -n --arg owner "$OWNER_ID" \
  '{name: "example-travel", scope: "PERSONAL", ownerId: $owner}' > namespace.json
NAMESPACE_ID=$(curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/namespaces" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @namespace.json | jq -er '.namespace.namespaceId')
echo "Personal namespace: $NAMESPACE_ID"
# STEP_END

# STEP_START namespace-personal-session
jq -n --arg owner "$OWNER_ID" --arg ns "$NAMESPACE_ID" \
  --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg key "$(uuidgen)" '{
  actorId: $owner,
  role: "USER",
  content: [{text: "I am visiting Tokyo and Kyoto next month."}],
  createdAt: $now,
  namespaceId: $ns,
  idempotencyKey: $key
}' > event.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/sessions/example-travel-namespace-session/events" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @event.json | jq .
# STEP_END

# STEP_START namespace-shared-create
SHARED_NAMESPACE_ID=$(curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/namespaces" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"name": "example-team-travel", "scope": "SHARED"}' | jq -er '.namespace.namespaceId')
echo "Shared namespace: $SHARED_NAMESPACE_ID"
# STEP_END

# STEP_START namespace-shared-remember
jq -n --arg owner "$OWNER_ID" --arg ns "$SHARED_NAMESPACE_ID" --arg key "$(uuidgen)" '{
  memories: [{
    memoryId: "example-rail-passes",
    ownerId: $owner,
    namespaceId: $ns,
    text: "The team books refundable rail passes for every Japan trip."
  }],
  idempotencyKey: $key
}' > memories.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @memories.json | jq .
# STEP_END

# STEP_START namespace-shared-recall
jq -n --arg ns "$SHARED_NAMESPACE_ID" '{
  query: "What travel requirements has the team discussed?",
  filter: {namespaceId: {eq: $ns}},
  limit: 5
}' > search.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/search" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @search.json | jq '.items[] | {memoryId, ownerId, text}'
# STEP_END

# STEP_START namespace-place-patch
jq -n --arg owner "$OWNER_ID" --arg key "$(uuidgen)" '{
  memories: [{memoryId: "example-kyoto-hotel", ownerId: $owner, text: "The user is staying at a hotel near Gion in Kyoto."}],
  idempotencyKey: $key
}' > hotel.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @hotel.json > /dev/null
curl --fail-with-body --silent --show-error \
  -X PATCH "$MEMORY_API/memories/example-kyoto-hotel" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg ns "$NAMESPACE_ID" '{namespaceId: $ns}')" | jq '{memoryId, namespaceId}'
# STEP_END

# STEP_START namespace-place-move
jq -n --arg owner "$OWNER_ID" --arg key "$(uuidgen)" '{
  memories: [{memoryId: "example-tokyo-arrival", ownerId: $owner, text: "The user lands in Tokyo on a Friday evening."}],
  idempotencyKey: $key
}' > arrival.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @arrival.json > /dev/null
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/move" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg ns "$NAMESPACE_ID" '{memoryIds: ["example-tokyo-arrival"], namespaceId: $ns}')" | jq '{moved, errors}'
# STEP_END

# STEP_START namespace-place-search
jq -n --arg owner "$OWNER_ID" --arg ns "$NAMESPACE_ID" '{
  query: "Where is the user staying?",
  filter: {ownerId: {eq: $owner}, namespaceId: {in: [$ns]}},
  limit: 5
}' > placed.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/search" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @placed.json | jq '.items[] | {memoryId, namespaceId, text}'
# STEP_END

# STEP_START namespace-child-create
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/namespaces" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg parent "$NAMESPACE_ID" '{name: "japan", parentId: $parent}')" | jq '.namespace | {path, namespaceId}'
# STEP_END

# STEP_START namespace-path-create
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/namespaces" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg owner "$OWNER_ID" '{path: "example-travel/kyoto", scope: "PERSONAL", ownerId: $owner}')" | jq '.namespace | {path, namespaceId}'
# STEP_END

# STEP_START namespace-list-children
curl --fail-with-body --silent --show-error --get \
  "$MEMORY_API/namespaces" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  --data-urlencode "parentId=$NAMESPACE_ID" | jq '.items[] | {path, namespaceId, state}'
# STEP_END

# STEP_START namespace-sort
curl --fail-with-body --silent --show-error --get \
  "$MEMORY_API/namespaces" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  --data-urlencode 'scope=SHARED' --data-urlencode 'limit=20' \
  --data-urlencode 'sortBy=name' --data-urlencode 'sortOrder=ASC' | jq '{names: [.items[].name], nextCursor}'
# STEP_END
