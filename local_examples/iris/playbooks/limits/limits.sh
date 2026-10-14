# EXAMPLE: iris_playbook_limits
set -euo pipefail

# HIDE_START
set -euo pipefail
PLAYBOOK_API="${PLAYBOOK_URL%/}/v1/playbooks/$PLAYBOOK_ID"
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
# HIDE_END

# STEP_START playbook-error-type
STATUS=$(curl --silent --show-error -o response.json -w '%{http_code}' \
  "$PLAYBOOK_API/faqs/$PLAYBOOK_FAQ_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY")
if [[ "$STATUS" == 2* ]]; then
  jq . response.json
else
  printf 'Request failed: HTTP %s\n' "$STATUS" >&2
  jq -r '.type // "unknown"' response.json >&2 2>/dev/null || printf 'unknown\n' >&2
  exit 1
fi
# STEP_END
