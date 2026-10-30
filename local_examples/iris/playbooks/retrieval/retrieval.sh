# EXAMPLE: iris_playbook_retrieval
set -euo pipefail

# HIDE_START
set -euo pipefail
PLAYBOOK_API="${PLAYBOOK_URL%/}/iris/data/v1/agent-playbooks/playbooks/$PLAYBOOK_ID"
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
# HIDE_END

# STEP_START playbook-retrieval-discover
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/entries/discover" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Draft a reply for a customer whose refund shows Processing","limit":5}' | jq .
# STEP_END

# STEP_START playbook-retrieval-pin
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/entries/discover" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg id "$PLAYBOOK_SKILL_ID" '{query: "Draft a reply for a customer whose refund shows Processing", pinnedEntries: [{entryId: $id}], limit: 5}')" > discovery.json
jq '.pinnedEntries[0] | {entryId, version}' discovery.json
# STEP_END

# STEP_START playbook-retrieval-budget
jq '{truncated, budgetTruncated: (.budgetTruncated // false)}' discovery.json
# STEP_END

# STEP_START playbook-retrieval-load
SKILL_ID=$(jq -er '.pinnedEntries[0].entryId' discovery.json)
SKILL_VERSION=$(jq -er '.pinnedEntries[0].version' discovery.json)
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/skills/$SKILL_ID/versions/$SKILL_VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" > selected-skill.json
jq -r '.content.payload.skill.instructions' selected-skill.json
RESOURCE_ID=$(jq -er '.content.payload.skill.resources[] | select(.path == "references/reply-template.md") | .resourceId' selected-skill.json)
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/skills/$SKILL_ID/versions/$SKILL_VERSION/resources/$RESOURCE_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY"
# STEP_END

# STEP_START playbook-retrieval-search
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Where is my refund?","limit":5}' | jq .
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/skills/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Draft a reply about a reported refund stage","limit":5}' | jq .
# STEP_END

# STEP_START playbook-retrieval-threshold
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Where is my refund?","minScore":0.75,"limit":3}' | jq .items
# STEP_END

# STEP_START playbook-retrieval-filter
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Where is my refund?","filter":{"and":[{"eq":{"name":"locale","value":"en-US"}},{"eq":{"name":"topic","value":"refund"}}]}}' | jq .
# STEP_END
