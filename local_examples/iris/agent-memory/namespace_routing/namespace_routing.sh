# EXAMPLE: iris_agent_memory_namespace_routing
set -euo pipefail

# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
OWNER_ID=quickstart-user
# HIDE_END

# STEP_START namespace-routing-destination
TRAVEL_NAMESPACE_ID=$(curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/namespaces" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"name": "example-team-travel", "scope": "SHARED"}' | jq -er '.namespace.namespaceId')
echo "Destination: $TRAVEL_NAMESPACE_ID"
# STEP_END

# STEP_START namespace-routing-get
curl --fail-with-body --silent --show-error \
  "$MEMORY_API/namespace-routing" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" > current-policy.json
jq .policy current-policy.json
# STEP_END

# STEP_START namespace-routing-put
# PUT replaces the whole policy, so keep the rules that are already there.
jq --arg ns "$TRAVEL_NAMESPACE_ID" '{policy: {
  enabled: true,
  rules: ([(.policy.rules // [])[] | select(.id != "example-travel")] + [{
    id: "example-travel",
    enabled: true,
    action: "ACCEPT",
    destinationNamespaceId: $ns,
    strategies: [{kind: "MATCHER_SPEC", matcher: {kind: "REGEX", regex: {pattern: "(?i)travel"}}}]
  }])
}}' current-policy.json > policy.json
curl --fail-with-body --silent --show-error \
  -X PUT "$MEMORY_API/namespace-routing" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @policy.json | jq .policy
# STEP_END

# STEP_START namespace-routing-source
SOURCE_NAMESPACE_ID=$(curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/namespaces" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"name": "example-routing-source", "scope": "SHARED"}' | jq -er '.namespace.namespaceId')
jq -n --arg owner "$OWNER_ID" --arg ns "$SOURCE_NAMESPACE_ID" --arg key "$(uuidgen)" '{
  memories: [{
    memoryId: "example-routing-travel",
    ownerId: $owner,
    namespaceId: $ns,
    text: "Travel policy allows train tickets."
  }],
  idempotencyKey: $key
}' > memories.json
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @memories.json | jq .
# STEP_END

# STEP_START namespace-routing-move
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/move" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"memoryIds": ["example-routing-travel"]}' | jq '{moved, errors}'
# STEP_END

# STEP_START namespace-routing-explicit
curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/memories/move" \
  -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg ns "$TRAVEL_NAMESPACE_ID" '{memoryIds: ["example-routing-travel"], namespaceId: $ns}')" | jq '{moved, errors}'
# STEP_END
