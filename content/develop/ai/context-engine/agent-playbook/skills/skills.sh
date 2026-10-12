# Generated from skills.md; edit the page, then run examples.py --refresh-downloads.
set -euo pipefail

mkdir -p refund-support-reply/references
cat > refund-support-reply/SKILL.md <<'SKILL'
---
name: refund-support-reply
description: Draft a customer reply for an existing refund using a reported refund stage or a report that no refund is listed. Use the matching reply template. Do not use to request a new refund.
---

# Draft a refund support reply

1. Check whether the customer supplied a displayed refund stage or said no refund is listed. If neither is known, ask what their order history shows before drafting a reply.
2. Read references/reply-template.md for the listed and missing refund templates.
3. If a stage is supplied, choose the listed refund template and replace <displayed-stage> with that exact stage.
4. If no refund is listed, choose the missing refund template. Do not invent a stage.
5. Return only the completed customer reply. Do not leave placeholders in it.

Do not claim to have accessed the order system, claim a refund was issued, or promise a bank posting date.
SKILL
cat > refund-support-reply/references/reply-template.md <<'TEMPLATE'
Refund listed: Your order history shows "<displayed-stage>". Support can help if you need more information about that stage.

Refund missing: Contact support with your order number and explain that no refund appears in your order history.
TEMPLATE
zip -r refund-support-reply.zip refund-support-reply

set -euo pipefail
PLAYBOOK_API="${PLAYBOOK_URL%/}/v1/playbooks/$PLAYBOOK_ID"
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .

base64 < refund-support-reply.zip | tr -d '\r\n' > package.b64
jq -n --rawfile package package.b64 '{
  packageBase64: $package,
  content: {
    intents: ["Draft a refund support reply", "Choose a refund reply template"],
    attributes: {locale: "en-US", topic: "refund"}
  }
}' > skill.json
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/skills" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @skill.json > skill-draft.json
SKILL_ID=$(jq -er '.entry.entryId' skill-draft.json)
SKILL_VERSION=$(jq -er '.version.version' skill-draft.json)
jq .version skill-draft.json

curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/skills/$SKILL_ID/versions/$SKILL_VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .content

curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/skills/$SKILL_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --argjson version "$SKILL_VERSION" '{version: $version}')" | jq .publication

base64 < refund-support-reply.zip | tr -d '\r\n' > package.b64
jq --rawfile package package.b64 \
  '.packageBase64 = $package | .content.attributes.channel = "chat"' \
  skill.json > skill-update.json
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/skills/$SKILL_ID/versions" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @skill-update.json | jq .version

curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/skills/$SKILL_ID/versions/$SKILL_VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" > selected-skill.json
jq -r '.content.payload.skill.instructions' selected-skill.json
RESOURCE_ID=$(jq -er '.content.payload.skill.resources[] | select(.path == "references/reply-template.md") | .resourceId' selected-skill.json)
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/skills/$SKILL_ID/versions/$SKILL_VERSION/resources/$RESOURCE_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY"

CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode sortBy=updatedAt --data-urlencode sortOrder=desc --data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/skills" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > skill-page.json
  if [[ -z "$CURSOR" ]]; then jq '.total // "unknown"' skill-page.json; fi
  jq '.skills[] | {entryId, latestVersion, publication}' skill-page.json
  CURSOR=$(jq -r '.nextCursor // empty' skill-page.json)
  [[ -n "$CURSOR" ]] || break
done

curl --fail-with-body --silent --show-error "$PLAYBOOK_API/skills/$SKILL_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq '{latestVersion, publication}'

CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/skills/$SKILL_ID/versions" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > skill-versions.json
  jq '.versions[] | {version, contentDigest, content}' skill-versions.json
  CURSOR=$(jq -r '.nextCursor // empty' skill-versions.json)
  [[ -n "$CURSOR" ]] || break
done
