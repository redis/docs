# EXAMPLE: iris_playbook_mcp_client
# STEP_START playbook-mcp-client
set -euo pipefail
MCP_URL="${PLAYBOOK_URL%/}/v1/playbooks/$PLAYBOOK_ID/mcp"
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

PREVIEWS=$(rpc tools/call '{
  "name": "discover_entries",
  "arguments": {
    "query": "Draft a reply to a customer whose refund status shows Processing.",
    "limit": 3
  }
}' 3 | read_result)
ENTRIES=$(jq -e '
  if (.pinnedEntries | type) == "array" and (.discoveredEntries | type) == "array"
  then .pinnedEntries + .discoveredEntries
  else error("Invalid discovery response") end
' <<< "$PREVIEWS")
jq -r '.[] | select(.entryType == "faq") | "FAQ: \(.faq.answer)"' <<< "$ENTRIES"
SKILL=$(jq '[.[] | select(.entryType == "skill")][0]' <<< "$ENTRIES")
if [[ "$SKILL" == null ]]; then
  printf 'No skill preview returned; check the query, publication, and discovery budget.\n'
  exit 0
fi

LOAD_PARAMS=$(jq '{name: "load_skill", arguments: {entry_id: .entryId, version: .version}}' <<< "$SKILL")
LOADED=$(rpc tools/call "$LOAD_PARAMS" 4 | read_result)
jq -er '.content.instructions | select(type == "string")' <<< "$LOADED"
RESOURCE=$(jq '[.content.resources[] | select(.path == "references/reply-template.md")][0]' <<< "$LOADED")
if [[ "$RESOURCE" == null ]]; then
  printf 'This skill has no refund reply template.\n'
  exit 0
fi
FETCH_PARAMS=$(jq '{name: "fetch_resource", arguments: {uri: .uri}}' <<< "$RESOURCE")
FILE=$(rpc tools/call "$FETCH_PARAMS" 5 | read_result)
if jq -e 'has("text")' <<< "$FILE" > /dev/null; then
  jq -er '.text | select(type == "string")' <<< "$FILE"
else
  jq -er '.blob | select(type == "string")' <<< "$FILE" | base64 --decode > resource.bin
  printf 'Saved binary resource to resource.bin\n'
fi
# STEP_END
