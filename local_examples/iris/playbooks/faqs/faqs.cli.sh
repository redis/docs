# EXAMPLE: iris_playbook_faqs
# HIDE_START
set -euo pipefail
playbook_cli() {
  IRIS_AGENT_PLAYBOOK_CONTENT_API_KEY="$PLAYBOOK_API_KEY" \
    iris --json --no-input agent-playbook \
    --url "$PLAYBOOK_URL" --playbook-id "$PLAYBOOK_ID" "$@"
}
playbook_cli health
# HIDE_END

# STEP_START playbook-faq-create
cat > faq.json <<'JSON'
{
  "entryKey": "refund-status",
  "question": "How do I check the status of a refund?",
  "answer": "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number.",
  "intents": ["Check a refund", "Find an existing refund"],
  "attributes": {"locale": "en-US", "topic": "refund"}
}
JSON
playbook_cli faqs validate faq.json
playbook_cli faqs push faq.json > faq-draft.json
FAQ_ID=$(jq -er '.results[0].entryId' faq-draft.json)
VERSION=$(jq -er '.results[0].version' faq-draft.json)
jq . faq-draft.json
# STEP_END

# STEP_START playbook-faq-publish
playbook_cli faqs get "$FAQ_ID" --version "$VERSION" | jq .content
# STEP_END

# STEP_START playbook-faq-publication
playbook_cli faqs publish "$FAQ_ID" --version "$VERSION"
# STEP_END

# STEP_START playbook-faq-search
cat > search.json <<'JSON'
{
  "query": "Where can I see how my refund is progressing?",
  "filter": {"eq": {"name": "locale", "value": "en-US"}},
  "limit": 5
}
JSON
playbook_cli faqs search --input search.json | jq .matches
# STEP_END

# STEP_START playbook-faq-update
jq '.answer += " Support can check the current stage but cannot guarantee a bank posting date."' \
  faq.json > faq-update.json
playbook_cli faqs push faq-update.json > faq-updated.json
UPDATED_VERSION=$(jq -er '.results[0].version' faq-updated.json)
playbook_cli faqs get "$FAQ_ID" --version "$UPDATED_VERSION" | jq .content
# STEP_END

# STEP_START playbook-faq-republish
playbook_cli faqs publish "$FAQ_ID" --version "$UPDATED_VERSION"
# STEP_END

# STEP_START playbook-faq-rollback
playbook_cli faqs publish "$FAQ_ID" --version "$VERSION"
# STEP_END

# STEP_START playbook-faq-list
playbook_cli faqs list --sort-by updatedAt --sort-order desc --page-size 50 | jq .
# STEP_END

# STEP_START playbook-faq-history
playbook_cli faqs versions "$FAQ_ID" --page-size 50 | jq .
# STEP_END
