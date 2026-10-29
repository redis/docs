# EXAMPLE: iris_playbook_proposals
# HIDE_START
set -euo pipefail
export IRIS_AGENT_PLAYBOOKS_URL="$PLAYBOOK_URL"
export IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID="$PLAYBOOK_ID"
export IRIS_AGENT_PLAYBOOKS_CONTENT_API_KEY="$PLAYBOOK_API_KEY"
iris agent-playbooks health
# HIDE_END

# STEP_START playbook-proposal-inbox
iris --json agent-playbooks proposals list --view inbox --sort-by updatedAt --sort-order desc \
  --page-size 50 | jq .
# STEP_END

# STEP_START playbook-proposal-search
iris --json agent-playbooks proposals search 'Contact support about a missing refund' \
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
iris --json agent-playbooks proposals create proposal-faq.json --source proposal-source.json > proposal-created.json
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
iris --json agent-playbooks proposals evidence "$PROPOSAL_ID" "$EVIDENCE_ID" --input evidence.json | jq .disposition
# STEP_END

# STEP_START playbook-proposal-read
iris --json agent-playbooks proposals get "$PROPOSAL_ID" > reviewed.json
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
iris --json agent-playbooks proposals replace "$PROPOSAL_ID" proposal-update.json \
  --expected-revision "$REVISION" > revised.json
jq '{proposalRevision, action}' revised.json
# STEP_END

# STEP_START playbook-proposal-trash
REVISION=$(jq -er '.proposalRevision' revised.json)
iris agent-playbooks proposals dismiss "$PROPOSAL_ID" --expected-revision "$REVISION"
iris agent-playbooks proposals restore "$PROPOSAL_ID"
# To purge a trashed proposal instead of restoring it:
# iris agent-playbooks proposals purge "$PROPOSAL_ID" --yes
# STEP_END

# STEP_START playbook-proposal-final-review
iris --json agent-playbooks proposals get "$PROPOSAL_ID" > final-review.json
jq '{action, evidence, proposalRevision}' final-review.json
# STEP_END

# STEP_START playbook-proposal-accept
REVISION=$(jq -er '.proposalRevision' final-review.json)
iris --json agent-playbooks proposals accept "$PROPOSAL_ID" --expected-revision "$REVISION" > accepted.json
ACCEPTED_FAQ_ID=$(jq -er '.result.versionCreated.entryId' accepted.json)
ACCEPTED_VERSION=$(jq -er '.result.versionCreated.version' accepted.json)
iris --json agent-playbooks faqs get "$ACCEPTED_FAQ_ID" --version "$ACCEPTED_VERSION" | jq '{entryId, version, content}'
# STEP_END

# STEP_START playbook-proposal-publish
iris agent-playbooks faqs publish "$ACCEPTED_FAQ_ID" --version "$ACCEPTED_VERSION"
# STEP_END

# STEP_START playbook-proposal-history
iris --json agent-playbooks proposals list --view trash --sort-by updatedAt --sort-order desc \
  --page-size 50 | jq .
# STEP_END
