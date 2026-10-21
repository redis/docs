# EXAMPLE: iris_playbook_proposals
# HIDE_START
set -euo pipefail
playbook_cli() {
  IRIS_AGENT_PLAYBOOK_CONTENT_API_KEY="$PLAYBOOK_API_KEY" \
    iris --json --no-input agent-playbook \
    --url "$PLAYBOOK_URL" --playbook-id "$PLAYBOOK_ID" "$@"
}
playbook_cli health
# HIDE_END

# STEP_START playbook-proposal-inbox
playbook_cli proposals list --view inbox --sort-by updatedAt --sort-order desc \
  --page-size 50 | jq .
# STEP_END

# STEP_START playbook-proposal-search
playbook_cli proposals search 'Contact support about a missing refund' \
  --minimum-score 0.7 --action-type add --entry-type faq --limit 5 | jq .matches
# STEP_END

# STEP_START playbook-proposal-create
cat > proposal-faq.json <<'JSON'
{
  "question": "What should I send support about a missing refund?",
  "answer": "Send your order number and the date you requested the refund.",
  "intents": ["Contact support about a missing refund"],
  "attributes": {"locale": "en-US", "topic": "refund"}
}
JSON
cat > proposal-source.json <<'JSON'
{
  "type": "document",
  "reference": {"documentId": "sample-refund-policy"}
}
JSON
playbook_cli proposals create proposal-faq.json --source proposal-source.json > proposal-created.json
PROPOSAL_ID=$(jq -er '.proposalId' proposal-created.json)
jq '{proposalId, proposalRevision}' proposal-created.json
# STEP_END

# STEP_START playbook-proposal-evidence
EVIDENCE_ID="evd_$(openssl rand -hex 16)"
jq -n --arg observedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '{
  observedAt: $observedAt,
  producer: {name: "docs-example", promptVersion: "refund-review-v1"},
  source: {
    type: "document",
    reference: {documentId: "sample-refund-policy"},
    content: {
      excerpt: "For refund inquiries, collect the order number and request date. Do not request full card details."
    }
  }
}' > evidence.json
playbook_cli proposals evidence "$PROPOSAL_ID" "$EVIDENCE_ID" --input evidence.json | jq .disposition
# STEP_END

# STEP_START playbook-proposal-read
playbook_cli proposals get "$PROPOSAL_ID" > reviewed.json
jq . reviewed.json
# STEP_END

# STEP_START playbook-proposal-replace
REVISION=$(jq -er '.proposalRevision' reviewed.json)
jq '
  .action.add.candidate.content |
  {
    question: .payload.faq.question,
    answer: (.payload.faq.answer + " Do not send full card details."),
    intents: (.intents // []),
    attributes: (.attributes // {}),
    metadata: .metadata
  }
' reviewed.json > proposal-update.json
ENTRY_KEY=$(jq -r '.action.add.target.newEntry.entryKey // empty' reviewed.json)
if [[ -n "$ENTRY_KEY" ]]; then
  jq --arg key "$ENTRY_KEY" '.entryKey = $key' proposal-update.json > proposal-keyed.json
  mv proposal-keyed.json proposal-update.json
fi
playbook_cli proposals replace "$PROPOSAL_ID" proposal-update.json \
  --expected-revision "$REVISION" > revised.json
jq '{proposalRevision, action}' revised.json
# STEP_END

# STEP_START playbook-proposal-trash
REVISION=$(jq -er '.proposalRevision' revised.json)
playbook_cli proposals dismiss "$PROPOSAL_ID" --expected-revision "$REVISION"
playbook_cli proposals restore "$PROPOSAL_ID"
# To purge a trashed proposal instead of restoring it:
# playbook_cli proposals purge "$PROPOSAL_ID" --yes
# STEP_END

# STEP_START playbook-proposal-final-review
playbook_cli proposals get "$PROPOSAL_ID" > final-review.json
jq '{action, evidence, proposalRevision}' final-review.json
# STEP_END

# STEP_START playbook-proposal-accept
REVISION=$(jq -er '.proposalRevision' final-review.json)
playbook_cli proposals accept "$PROPOSAL_ID" --expected-revision "$REVISION" > accepted.json
ACCEPTED_FAQ_ID=$(jq -er '.result.versionCreated.entryId' accepted.json)
ACCEPTED_VERSION=$(jq -er '.result.versionCreated.version' accepted.json)
playbook_cli faqs get "$ACCEPTED_FAQ_ID" --version "$ACCEPTED_VERSION" | jq '{entryId, version, content}'
# STEP_END

# STEP_START playbook-proposal-publish
playbook_cli faqs publish "$ACCEPTED_FAQ_ID" --version "$ACCEPTED_VERSION"
# STEP_END

# STEP_START playbook-proposal-history
playbook_cli proposals list --view trash --sort-by updatedAt --sort-order desc \
  --page-size 50 | jq .
# STEP_END
