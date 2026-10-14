# EXAMPLE: iris_playbook_mcp
set -euo pipefail

# STEP_START playbook-mcp-example
set -euo pipefail
MCP_URL="${PLAYBOOK_URL%/}/v1/playbooks/$PLAYBOOK_ID/mcp"

jq -n --arg url "$MCP_URL" --arg key "$PLAYBOOK_API_KEY" '{
  model: "gpt-5-mini",
  instructions: (
    "Use Agent Playbooks to find published guidance before answering. " +
    "For reply-drafting tasks, call load_skill with the entry identifier and version from discovery. " +
    "Fetch the reply template using its uri from load_skill; never construct a file URI. " +
    "Follow the skill instructions and return the completed customer reply. " +
    "If no relevant knowledge is available or a tool fails, say so."
  ),
  tools: [{
    type: "mcp",
    server_label: "playbook",
    server_url: $url,
    headers: {Authorization: ("Bearer " + $key)},
    allowed_tools: ["discover_entries", "load_skill", "fetch_resource"],
    require_approval: "never"
  }],
  input: (
    "Draft a customer reply using the refund-support-reply skill and template. " +
    "The customer says their refund stage is Processing."
  )
}' | curl --fail-with-body --silent --show-error \
  "${OPENAI_BASE_URL:-https://api.openai.com/v1}/responses" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @- > agent-response.json
jq -r '.output[] | select(.type == "mcp_call") | "Tool: \(.name) \(.arguments)"' agent-response.json
jq -r '.output[] | select(.type == "message") | .content[] | select(.type == "output_text") | .text' agent-response.json
# STEP_END
