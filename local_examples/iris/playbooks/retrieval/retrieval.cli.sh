# EXAMPLE: iris_playbook_retrieval
# HIDE_START
set -euo pipefail
playbook_cli() {
  IRIS_AGENT_PLAYBOOK_CONTENT_API_KEY="$PLAYBOOK_API_KEY" \
    iris --json --no-input agent-playbook \
    --url "$PLAYBOOK_URL" --playbook-id "$PLAYBOOK_ID" "$@"
}
playbook_cli health
# HIDE_END

# STEP_START playbook-retrieval-discover
cat > discover.json <<'JSON'
{
  "query": "Draft a reply for a customer whose refund shows Processing",
  "limit": 5
}
JSON
playbook_cli discover --input discover.json | jq .
# STEP_END

# STEP_START playbook-retrieval-pin
jq -n --arg id "$PLAYBOOK_SKILL_ID" '{
  query: "Draft a reply for a customer whose refund shows Processing",
  pinnedEntries: [{entryId: $id}],
  limit: 5
}' > pinned-discover.json
playbook_cli discover --input pinned-discover.json > pinned.json
jq '.pinnedEntries[0] | {entryId, version}' pinned.json
# STEP_END

# STEP_START playbook-retrieval-budget
jq '{truncated, budgetTruncated: (.budgetTruncated // false)}' pinned.json
# STEP_END

# STEP_START playbook-retrieval-search
playbook_cli faqs search 'Where is my refund?' --limit 5 | jq .
playbook_cli skills search 'Draft a reply about a reported refund stage' --limit 5 | jq .
# STEP_END

# STEP_START playbook-retrieval-threshold
playbook_cli faqs search 'Where is my refund?' --minimum-score 0.75 --limit 3 | jq .matches
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
playbook_cli faqs search --input filtered-search.json | jq .
# STEP_END
