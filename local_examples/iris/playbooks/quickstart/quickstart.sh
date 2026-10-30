# EXAMPLE: iris_playbook_quickstart
set -euo pipefail

# STEP_START playbook-connect
set -euo pipefail
PLAYBOOK_API="${PLAYBOOK_URL%/}/iris/data/v1/agent-playbooks/playbooks/$PLAYBOOK_ID"
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
# STEP_END

# STEP_START playbook-quickstart-create
cat > faq.json <<'JSON'
{
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

# STEP_START playbook-quickstart-publish
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/faqs/$FAQ_ID/versions/$VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .content
# STEP_END

# STEP_START playbook-quickstart-publication
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --argjson version "$VERSION" '{version: $version}')" | jq .publication
# STEP_END

# STEP_START playbook-quickstart-search
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Where can I see how my refund is progressing?","filter":{"eq":{"name":"locale","value":"en-US"}},"limit":5}' \
  | jq '.items[] | {entryId, version, score, answer: .faq.answer}'
# STEP_END

# STEP_START playbook-quickstart-discover
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/entries/discover" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Help a customer find their refund status","filter":{"eq":{"name":"topic","value":"refund"}},"limit":5}' | jq .
# STEP_END

# STEP_START playbook-quickstart-update
jq '.content.payload.faq.answer += " Support can check the current stage but cannot guarantee a bank posting date."' \
  faq.json > faq-update.json
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/$FAQ_ID/versions" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @faq-update.json > updated.json
jq .version updated.json
# STEP_END

# STEP_START playbook-quickstart-republish
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{version: .version.version}' updated.json)" | jq .publication
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Where can I see how my refund is progressing?","filter":{"eq":{"name":"locale","value":"en-US"}},"limit":5}' \
  | jq --arg id "$FAQ_ID" '.items[] | select(.entryId == $id) | {version, answer: .faq.answer}'
# STEP_END
