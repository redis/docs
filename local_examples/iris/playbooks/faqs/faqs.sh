# EXAMPLE: iris_playbook_faqs
set -euo pipefail

# HIDE_START
set -euo pipefail
PLAYBOOK_API="${PLAYBOOK_URL%/}/iris/data/v1/agent-playbooks/playbooks/$PLAYBOOK_ID"
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
# HIDE_END

# STEP_START playbook-faq-create
cat > faq.json <<'JSON'
{
  "entryKey": "refund-status",
  "content": {
    "intents": ["Check a refund", "Find an existing refund"],
    "attributes": {"locale": "en-US", "topic": "refund"},
    "payload": {"faq": {
      "question": "How do I check the status of a refund?",
      "answer": "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number."
    }}
  }
}
JSON
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @faq.json > draft.json
FAQ_ID=$(jq -er '.entry.entryId' draft.json)
VERSION=$(jq -er '.version.version' draft.json)
jq '{entryId: .entry.entryId, version: .version.version, publication: .entry.publication}' draft.json
# STEP_END

# STEP_START playbook-faq-publish
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/faqs/$FAQ_ID/versions/$VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .content
# STEP_END

# STEP_START playbook-faq-publication
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --argjson version "$VERSION" '{version: $version}')" | jq .publication
# STEP_END

# STEP_START playbook-faq-search
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Where can I see how my refund is progressing?","filter":{"eq":{"name":"locale","value":"en-US"}},"limit":5}' \
  | jq '.items[] | {entryId, version, score, answer: .faq.answer}'
# STEP_END

# STEP_START playbook-faq-update
jq 'del(.entryKey) | .content.payload.faq.answer += " Support can check the current stage but cannot guarantee a bank posting date."' \
  faq.json > faq-update.json
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/$FAQ_ID/versions" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @faq-update.json > updated.json
jq .version updated.json
# STEP_END

# STEP_START playbook-faq-republish
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{version: .version.version}' updated.json)" | jq .publication
# STEP_END

# STEP_START playbook-faq-rollback
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --argjson version "$VERSION" '{version: $version}')" | jq .publication
# STEP_END

# STEP_START playbook-faq-list
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode sortBy=updatedAt --data-urlencode sortOrder=DESC --data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/faqs" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > faq-page.json
  jq '.items[] | {entryId, latestVersion, publication}' faq-page.json
  CURSOR=$(jq -r '.nextCursor // empty' faq-page.json)
  [[ -n "$CURSOR" ]] || break
done
# STEP_END

# STEP_START playbook-faq-history
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/faqs/$FAQ_ID/versions" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > faq-versions.json
  jq '.items[] | {version, contentDigest, content}' faq-versions.json
  CURSOR=$(jq -r '.nextCursor // empty' faq-versions.json)
  [[ -n "$CURSOR" ]] || break
done
# STEP_END

# STEP_START playbook-faq-lookup
jq -n --arg id "$FAQ_ID" '{references: [{entryId: $id}, {entryKey: "refund-status"}]}' \
  | curl --fail-with-body --silent --show-error \
    -X POST "$PLAYBOOK_API/entries/lookup" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
    -H 'Content-Type: application/json' --data-binary @- \
  | jq '{maxVersions, items}'
# STEP_END
