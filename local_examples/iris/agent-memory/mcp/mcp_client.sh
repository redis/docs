# EXAMPLE: iris_agent_memory_mcp_client
# STEP_START agent-memory-mcp-client
set -euo pipefail
MCP_URL="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID/mcp"
PROTOCOL_VERSION=2025-11-25
OWNER_ID=mcp-quickstart-user
MEMORY_ID="mcp-example-$(openssl rand -hex 6)"

post() {
  curl --fail-with-body --silent --show-error "$MCP_URL" \
    -H "Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -H "MCP-Protocol-Version: $PROTOCOL_VERSION" \
    --data-binary "$1"
}

rpc() {
  local request response
  request=$(jq -n --arg method "$1" --argjson params "$2" --argjson id "$3" \
    '{jsonrpc: "2.0", id: $id, method: $method, params: $params}') || return $?
  response=$(post "$request") || return $?
  jq -e '
    if .error then error("MCP request failed: " + .error.message)
    elif .result.isError then error("Agent Memory tool failed: " + (.result.content | tostring))
    elif has("result") | not then error("MCP response has no result")
    else .result end
  ' <<< "$response"
}

read_result() {
  jq -e '.structuredContent // ([.content[] | select(.type == "text")][0].text | fromjson)'
}

INITIALIZED=$(rpc initialize '{
  "protocolVersion": "2025-11-25",
  "capabilities": {},
  "clientInfo": {"name": "agent-memory-curl-example", "version": "1.0.0"}
}' 1)
PROTOCOL_VERSION=$(jq -er '.protocolVersion' <<< "$INITIALIZED")
post '{"jsonrpc":"2.0","method":"notifications/initialized"}' > /dev/null
rpc tools/list '{}' 2 | jq -r '.tools[].name'

rpc tools/call "$(jq -n --arg id "$MEMORY_ID" --arg owner "$OWNER_ID" --arg key "$(uuidgen)" '{
  name: "create_long_term_memories",
  arguments: {idempotency_key: $key, memories: [{
    id: $id, text: "The user prefers aisle seats on long flights.",
    owner_id: $owner, topics: ["travel"]
  }]}
}')" 3 | read_result

rpc tools/call "$(jq -n --arg owner "$OWNER_ID" '{
  name: "search_long_term_memory",
  arguments: {text: "Which seat does the user like?", owner_id: $owner, limit: 3}
}')" 4 | read_result

rpc tools/call "$(jq -n --arg id "$MEMORY_ID" '{
  name: "delete_long_term_memories", arguments: {memory_ids: [$id]}
}')" 5 | read_result
# STEP_END
