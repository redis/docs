# EXAMPLE: iris_playbook_retrieval
# HIDE_START
set -euo pipefail
export IRIS_AGENT_PLAYBOOKS_URL="$PLAYBOOK_URL"
export IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID="$PLAYBOOK_ID"
export IRIS_AGENT_PLAYBOOKS_CONTENT_API_KEY="$PLAYBOOK_API_KEY"
iris agent-playbooks health
# HIDE_END

# STEP_START playbook-retrieval-discover
cat > discover.json <<'JSON'
{
  "query": "Draft a reply for a customer whose refund shows Processing",
  "limit": 5
}
JSON
iris --json agent-playbooks discover --input discover.json | jq .
# STEP_END

# STEP_START playbook-retrieval-pin
jq -n --arg id "$PLAYBOOK_SKILL_ID" '{
  query: "Draft a reply for a customer whose refund shows Processing",
  pinnedEntries: [{entryId: $id}],
  limit: 5
}' > pinned-discover.json
iris --json agent-playbooks discover --input pinned-discover.json > pinned.json
jq '.pinnedEntries[0] | {entryId, version}' pinned.json
# STEP_END

# STEP_START playbook-retrieval-budget
jq '{truncated, budgetTruncated: (.budgetTruncated // false)}' pinned.json
# STEP_END

# STEP_START playbook-retrieval-search
iris --json agent-playbooks faqs search 'Where is my refund?' --limit 5 | jq .
iris --json agent-playbooks skills search 'Draft a reply about a reported refund stage' --limit 5 | jq .
# STEP_END

# STEP_START playbook-retrieval-threshold
iris --json agent-playbooks faqs search 'Where is my refund?' --min-score 0.75 --limit 3 | jq .items
# STEP_END

# STEP_START playbook-retrieval-filter
cat > filtered-search.json <<'JSON'
{
  "query": "Where is my refund?",
  "filter": {
    "and": [
      {"eq": {"name": "locale", "value": "en-US"}},
      {"eq": {"name": "topic", "value": "refund"}}
    ]
  }
}
JSON
iris --json agent-playbooks faqs search --input filtered-search.json | jq .
# STEP_END
