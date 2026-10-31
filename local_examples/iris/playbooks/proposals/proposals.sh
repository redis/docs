# EXAMPLE: iris_playbook_proposals
set -euo pipefail

# HIDE_START
set -euo pipefail
PLAYBOOK_API="${PLAYBOOK_URL%/}/iris/data/v1/agent-playbooks/playbooks/$PLAYBOOK_ID"
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
# HIDE_END

# STEP_START playbook-proposal-inbox
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode view=INBOX --data-urlencode sortBy=updatedAt --data-urlencode sortOrder=DESC --data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/proposals" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > inbox.json
  jq '.items[] | {proposalId, state, evidenceCount, action}' inbox.json
  CURSOR=$(jq -r '.nextCursor // empty' inbox.json)
  [[ -n "$CURSOR" ]] || break
done
# STEP_END

# STEP_START playbook-proposal-search
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/proposals/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Contact support about a missing refund","minScore":0.7,"actionType":"ADD","entryKind":"FAQ","limit":5}' \
  | jq '.items[] | {proposalId: .proposal.proposalId, score, action: .proposal.action}'
# STEP_END

# STEP_START playbook-proposal-create
cat > proposal.json <<'JSON'
{"source":{"kind":"document","reference":{"documentId":"sample-refund-policy"}},
"action":{"add":{
  "target":{"newEntry":{}},
  "candidate":{"content":{
    "intents":["Contact support about a missing refund"],
    "attributes":{"locale":"en-US","topic":"refund"},
    "payload":{"faq":{
      "question":"What should I send support about a missing refund?",
      "answer":"Send your order number and the date you requested the refund."
    }}
  }}
}}}
JSON
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/proposals" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @proposal.json > proposal-created.json
PROPOSAL_ID=$(jq -er '.proposalId' proposal-created.json)
jq '{proposalId, revision}' proposal-created.json
# STEP_END

# STEP_START playbook-proposal-evidence
EVIDENCE_ID="evd_$(openssl rand -hex 16)"
jq -n --arg observedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '{
  observedAt: $observedAt,
  producer: {name: "docs-example", promptVersion: "refund-review-v1"},
  source: {
    kind: "document",
    reference: {documentId: "sample-refund-policy"},
    content: {excerpt: "For refund inquiries, collect the order number and request date. Do not request full card details."}
  }
}' > evidence.json
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/proposals/$PROPOSAL_ID/evidence/$EVIDENCE_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @evidence.json | jq .disposition
# STEP_END

# STEP_START playbook-proposal-read
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/proposals/$PROPOSAL_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" > reviewed.json
jq . reviewed.json
# STEP_END

# STEP_START playbook-proposal-replace
jq --argjson revision "$(jq -er '.revision' reviewed.json)" '
  {action} |
  .action.add.candidate.content.payload.faq.answer += " Do not send full card details." |
  .expectedRevision = $revision
' reviewed.json > proposal-update.json
curl --fail-with-body --silent --show-error \
  -X PATCH "$PLAYBOOK_API/proposals/$PROPOSAL_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @proposal-update.json > revised.json
jq '{revision, action}' revised.json
# STEP_END

# STEP_START playbook-proposal-trash
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/proposals/$PROPOSAL_ID/dismissal" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{expectedRevision: .revision}' revised.json)" | jq .state
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_API/proposals/$PROPOSAL_ID/dismissal" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .state
# To purge instead of restoring, DELETE /proposals/$PROPOSAL_ID.
# STEP_END

# STEP_START playbook-proposal-final-review
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/proposals/$PROPOSAL_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" > final-review.json
jq '{action, evidence, revision}' final-review.json
# STEP_END

# STEP_START playbook-proposal-accept
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/proposals/$PROPOSAL_ID/acceptance" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{expectedRevision: .revision}' final-review.json)" > accepted.json
ACCEPTED_FAQ_ID=$(jq -er '.result.versionCreated.entryId' accepted.json)
ACCEPTED_VERSION=$(jq -er '.result.versionCreated.version' accepted.json)
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/faqs/$ACCEPTED_FAQ_ID/versions/$ACCEPTED_VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  | jq '{entryId, version, content}'
# STEP_END

# STEP_START playbook-proposal-publish
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$ACCEPTED_FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{version: .result.versionCreated.version}' accepted.json)" | jq .publication
# STEP_END

# STEP_START playbook-proposal-history
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode view=TRASH --data-urlencode sortBy=updatedAt --data-urlencode sortOrder=DESC --data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/proposals" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > trash.json
  jq '.items[] | {proposalId, state, evidenceCount, action}' trash.json
  CURSOR=$(jq -r '.nextCursor // empty' trash.json)
  [[ -n "$CURSOR" ]] || break
done
# STEP_END
