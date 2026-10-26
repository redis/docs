# EXAMPLE: iris_lens_quickstart
set -euo pipefail

# STEP_START find_turn
curl --fail-with-body --silent --show-error \
  "${LENS_URL%/}/v1/instances/$LENS_INSTANCE_ID/turns/$TURN_ID" \
  -H "Authorization: Bearer $LENS_API_KEY" \
  | jq '{outcome, sources: [.manifest.entries[] | {source, fetchedCount, usedCount}]}'
# STEP_END
