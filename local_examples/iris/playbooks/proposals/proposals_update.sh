# EXAMPLE: iris_playbook_proposals_update
# HIDE_START
set -euo pipefail
# HIDE_END
# STEP_START playbook-update-submit
PLAYBOOK_API="${IRIS_AGENT_PLAYBOOKS_URL%/}/iris/data/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID"

playbook_request() {
  curl --fail-with-body --silent --show-error \
    -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_API_KEY" \
    -H 'Content-Type: application/json' "$@"
}

jq -n --arg entryId "$PLAYBOOK_ENTRY_ID" --argjson basedOnVersion "$PLAYBOOK_BASED_ON_VERSION" \
  --slurpfile candidate proposal-content.json '{action: {update: {
    target: {existingEntry: {$entryId, $basedOnVersion}},
    candidate: {content: $candidate[0]}
  }}}' > proposal-update.json
playbook_request -X POST "$PLAYBOOK_API/proposals" \
  --data-binary @proposal-update.json > proposal-created.json
PROPOSAL_ID=$(jq -er '.proposalId' proposal-created.json)
jq '{proposalId, revision}' proposal-created.json
# STEP_END

# STEP_START playbook-update-review
playbook_request "$PLAYBOOK_API/proposals/$PROPOSAL_ID" > proposal-reviewed.json
jq .action proposal-reviewed.json
jq --slurpfile candidate proposal-content-reviewed.json '{
  expectedRevision: .revision,
  action: {update: {
    target: .action.update.target,
    candidate: {content: $candidate[0]}
  }}
}' proposal-reviewed.json > proposal-replacement.json
playbook_request -X PATCH "$PLAYBOOK_API/proposals/$PROPOSAL_ID" \
  --data-binary @proposal-replacement.json > proposal-revised.json
jq '{action, revision}' proposal-revised.json
if jq -e '.action.update.candidate.content.payload.skill' proposal-revised.json > /dev/null; then
  jq -e '.action.update.candidate.content.payload.skill.resources[] |
    select(.path == "references/reply-template.md")' proposal-revised.json > revised-resource.json
  RESOURCE_ID=$(jq -er '.resourceId' revised-resource.json)
  playbook_request --get "$PLAYBOOK_API/proposals/$PROPOSAL_ID/resources/$RESOURCE_ID" \
    --data-urlencode "expectedRevision=$(jq -er '.revision' proposal-revised.json)" > reviewed-template.md
  [[ "sha256:$(openssl dgst -sha256 reviewed-template.md | awk '{print $NF}')" == \
    "$(jq -er '.digest' revised-resource.json)" ]]
  cat reviewed-template.md
fi
# STEP_END

# STEP_START playbook-update-accept
jq '{expectedRevision: .revision}' proposal-revised.json > proposal-acceptance.json
playbook_request -X POST "$PLAYBOOK_API/proposals/$PROPOSAL_ID/acceptance" \
  --data-binary @proposal-acceptance.json > proposal-accepted.json
ENTRY_ID=$(jq -er '.result.versionCreated.entryId' proposal-accepted.json)
VERSION=$(jq -er '.result.versionCreated.version' proposal-accepted.json)
case $(jq -er '.result.versionCreated.entryKind' proposal-accepted.json) in
  FAQ) ENTRY_COLLECTION=faqs ;;
  SKILL) ENTRY_COLLECTION=skills ;;
  *) exit 1 ;;
esac
playbook_request "$PLAYBOOK_API/$ENTRY_COLLECTION/$ENTRY_ID/versions/$VERSION" | jq .content
# STEP_END

# STEP_START playbook-update-publish
playbook_request -X PUT "$PLAYBOOK_API/$ENTRY_COLLECTION/$ENTRY_ID/publication" \
  --data "$(jq '{version: .result.versionCreated.version}' proposal-accepted.json)" | jq .publication
# STEP_END
