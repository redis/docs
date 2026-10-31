# EXAMPLE: iris_playbook_mcp_client
# STEP_START playbook-mcp-client
set -euo pipefail
MCP_URL="${PLAYBOOK_URL%/}/iris/data/v1/agent-playbooks/playbooks/$PLAYBOOK_ID/mcp"
PROTOCOL_VERSION=2025-11-25

post() {
  curl --fail-with-body --silent --show-error "$MCP_URL" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
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
    elif .result.isError then error("Playbook tool failed: " + (.result.content | tostring))
    elif has("result") | not then error("MCP response has no result")
    else .result end
  ' <<< "$response"
}

INITIALIZED=$(rpc initialize '{
  "protocolVersion": "2025-11-25",
  "capabilities": {},
  "clientInfo": {"name": "playbook-curl-example", "version": "1.0.0"}
}' 1)
PROTOCOL_VERSION=$(jq -er '.protocolVersion' <<< "$INITIALIZED")
case "$PROTOCOL_VERSION" in
  2025-11-25|2025-06-18|2025-03-26|2024-11-05) ;;
  *) printf 'Unsupported MCP protocol version: %s\n' "$PROTOCOL_VERSION" >&2; exit 1 ;;
esac
post '{"jsonrpc":"2.0","method":"notifications/initialized"}' > /dev/null
rpc tools/list '{}' 2 | jq -r '.tools[].name'

read_result() {
  jq -e '.structuredContent // ([.content[] | select(.type == "text")][0].text | fromjson)'
}

rpc tools/call '{
  "name": "discover_entries",
  "arguments": {
    "query": "Draft a reply to a customer whose refund status shows Processing.",
    "limit": 3
  }
}' 3 | read_result
# STEP_END
