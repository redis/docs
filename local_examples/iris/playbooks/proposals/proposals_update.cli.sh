# EXAMPLE: iris_playbook_proposals_update
# STEP_START playbook-update-submit
set -euo pipefail
iris --json --no-input agent-playbooks proposals create "$PLAYBOOK_UPDATE_CANDIDATE" \
  --entry-type "$PLAYBOOK_ENTRY_TYPE" --update "$PLAYBOOK_ENTRY_ID" \
  --based-on "$PLAYBOOK_BASED_ON_VERSION" > proposal-created.json
PROPOSAL_ID=$(jq -er '.proposalId' proposal-created.json)
jq '{proposalId, revision}' proposal-created.json
# STEP_END

# STEP_START playbook-update-review
iris --json --no-input agent-playbooks proposals show "$PROPOSAL_ID" > proposal-reviewed.json
jq .action proposal-reviewed.json
iris --json --no-input agent-playbooks proposals replace "$PROPOSAL_ID" "$PLAYBOOK_UPDATE_REVISED" \
  --entry-type "$PLAYBOOK_ENTRY_TYPE" \
  --expected-revision "$(jq -er '.revision' proposal-reviewed.json)" > proposal-revised.json
jq '{action, revision}' proposal-revised.json
# STEP_END

# STEP_START playbook-update-accept
iris --json --no-input agent-playbooks proposals accept "$PROPOSAL_ID" \
  --expected-revision "$(jq -er '.revision' proposal-revised.json)" > proposal-accepted.json
ENTRY_ID=$(jq -er '.result.versionCreated.entryId' proposal-accepted.json)
VERSION=$(jq -er '.result.versionCreated.version' proposal-accepted.json)
case $(jq -er '.result.versionCreated.entryKind' proposal-accepted.json) in
  FAQ) ENTRY_COLLECTION=faqs ;;
  SKILL) ENTRY_COLLECTION=skills ;;
  *) exit 1 ;;
esac
iris --json --no-input agent-playbooks "$ENTRY_COLLECTION" show "$ENTRY_ID" --version "$VERSION" | jq .content
# STEP_END

# STEP_START playbook-update-publish
iris --no-input agent-playbooks "$ENTRY_COLLECTION" publish "$ENTRY_ID" --version "$VERSION"
# STEP_END
