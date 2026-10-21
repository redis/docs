# EXAMPLE: iris_playbook_skills
# HIDE_START
set -euo pipefail
export IRIS_AGENT_PLAYBOOK_URL="$PLAYBOOK_URL"
export IRIS_AGENT_PLAYBOOK_ID="$PLAYBOOK_ID"
export IRIS_AGENT_PLAYBOOK_CONTENT_API_KEY="$PLAYBOOK_API_KEY"
iris agent-playbook health
# HIDE_END

# STEP_START playbook-skill-create
cat > refund-support-reply/.iris-playbook.json <<'JSON'
{
  "intents": ["Draft a refund support reply", "Choose a refund reply template"],
  "attributes": {"locale": "en-US", "topic": "refund"}
}
JSON
iris agent-playbook skills validate refund-support-reply
iris --json agent-playbook skills push refund-support-reply > skill-draft.json
SKILL_ID=$(jq -er '.results[0].entryId' skill-draft.json)
SKILL_VERSION=$(jq -er '.results[0].version' skill-draft.json)
jq . skill-draft.json
# STEP_END

# STEP_START playbook-skill-review
iris --json agent-playbook skills get "$SKILL_ID" --version "$SKILL_VERSION" | jq .content
# STEP_END

# STEP_START playbook-skill-publish
iris agent-playbook skills publish "$SKILL_ID" --version "$SKILL_VERSION"
# STEP_END

# STEP_START playbook-skill-append
jq '.attributes.channel = "chat"' refund-support-reply/.iris-playbook.json > skill-context.json
mv skill-context.json refund-support-reply/.iris-playbook.json
iris --json agent-playbook skills push refund-support-reply > skill-updated.json
UPDATED_VERSION=$(jq -er '.results[0].version' skill-updated.json)
iris --json agent-playbook skills get "$SKILL_ID" --version "$UPDATED_VERSION" | jq .content
# STEP_END

# STEP_START playbook-skill-load
iris --json agent-playbook skills get "$SKILL_ID" --version "$SKILL_VERSION" > selected-skill.json
jq -r '.content.payload.skill.instructions' selected-skill.json
iris agent-playbook skills resource get "$SKILL_ID" references/reply-template.md \
  --version "$SKILL_VERSION" --output reply-template.txt --force
cat reply-template.txt
# STEP_END

# STEP_START playbook-skill-list
iris --json agent-playbook skills list --sort-by updatedAt --sort-order desc --page-size 50 | jq .
# STEP_END

# STEP_START playbook-skill-state
iris --json agent-playbook skills list --sort-by updatedAt --sort-order desc --page-size 50 \
  | jq --arg id "$SKILL_ID" '.[] | select(.entryId == $id)'
# STEP_END

# STEP_START playbook-skill-history
iris --json agent-playbook skills versions "$SKILL_ID" --page-size 50 | jq .
# STEP_END
