# EXAMPLE: iris_agent_memory_memory_etl
# HIDE_START
set -euo pipefail
MEMORY_API="${IRIS_AGENT_MEMORY_URL%/}/iris/data/v1/agent-memory/stores/$IRIS_AGENT_MEMORY_STORE_ID"
AUTH="Authorization: Bearer $IRIS_AGENT_MEMORY_API_KEY"
OWNER_ID=quickstart-user
: "${EXTRACTOR_ID:?Set EXTRACTOR_ID to the extractor ID from your operator}"
[ -f trip-notes.md ] || echo 'Trip to Kyoto, April 3 to April 10. I am vegetarian and want to try local tofu dishes.' > trip-notes.md
# HIDE_END

# STEP_START memory-etl-submit
jq -n --rawfile text trip-notes.md --arg owner "$OWNER_ID" --arg extractor "$EXTRACTOR_ID" '{
  documentId: "example-trip-notes",
  revision: "1",
  content: ($text | @base64),
  mediaType: "text/markdown",
  ownerId: $owner,
  extractorId: $extractor,
  idempotencyKey: "example-trip-notes-revision-1"
}' > ingestion.json
ACCEPTED=$(curl --fail-with-body --silent --show-error \
  -X POST "$MEMORY_API/document-ingestions" \
  -H "$AUTH" -H 'Content-Type: application/json' --data-binary @ingestion.json)
INGESTION_ID=$(jq -er .ingestionId <<< "$ACCEPTED")
echo "Ingestion ID: $INGESTION_ID"
# STEP_END

# STEP_START memory-etl-status
STATE=''
for _ in $(seq 90); do
  RECORD=$(curl --fail-with-body --silent --show-error \
    "$MEMORY_API/document-ingestions/$INGESTION_ID" -H "$AUTH")
  STATE=$(jq -r .ingestion.status.processing <<< "$RECORD")
  case "$STATE" in
    SUCCEEDED|PARTIAL|FAILED) jq .ingestion.status <<< "$RECORD"; break ;;
  esac
  sleep 10
done
case "$STATE" in
  SUCCEEDED|PARTIAL|FAILED) ;;
  *) echo "Continue polling ingestion $INGESTION_ID" >&2; exit 1 ;;
esac
# STEP_END

# STEP_START memory-etl-outputs
OUTPUT_IDS=()
CURSOR=''
while :; do
  PAGE=$(curl --fail-with-body --silent --show-error --get \
    "$MEMORY_API/document-ingestions/$INGESTION_ID/outputs" -H "$AUTH" \
    --data-urlencode 'limit=100' ${CURSOR:+--data-urlencode "cursor=$CURSOR"})
  while IFS= read -r id; do OUTPUT_IDS+=("$id"); done < <(jq -r '.items[]' <<< "$PAGE")
  CURSOR=$(jq -r '.nextCursor // empty' <<< "$PAGE")
  [ -n "$CURSOR" ] || break
done
echo "Output memory IDs: ${OUTPUT_IDS[*]:-}"
[ "$STATE" = SUCCEEDED ] || { echo "Inspect ingestion $INGESTION_ID: $STATE" >&2; exit 1; }
[ ${#OUTPUT_IDS[@]} -gt 0 ] || { echo "The extractor published no memories from this document." >&2; exit 1; }
# STEP_END

# STEP_START memory-etl-provenance
MEMORY_ID=${OUTPUT_IDS[0]}
SOURCE_CURSOR=''
while :; do
  LINKS=$(curl --fail-with-body --silent --show-error --get \
    "$MEMORY_API/memories/$MEMORY_ID/sources" -H "$AUTH" \
    --data-urlencode 'limit=100' ${SOURCE_CURSOR:+--data-urlencode "cursor=$SOURCE_CURSOR"})
  jq '.items' <<< "$LINKS"
  while IFS= read -r SOURCE; do
    SOURCE_ID=$(jq -r .sourceId <<< "$SOURCE")
    EVIDENCE_CURSOR=$(jq -r '.evidenceNextCursor // empty' <<< "$SOURCE")
    while [ -n "$EVIDENCE_CURSOR" ]; do
      MORE=$(curl --fail-with-body --silent --show-error --get \
        "$MEMORY_API/memories/$MEMORY_ID/sources/$SOURCE_ID/evidence" -H "$AUTH" \
        --data-urlencode 'limit=100' --data-urlencode "cursor=$EVIDENCE_CURSOR")
      jq .source <<< "$MORE"
      EVIDENCE_CURSOR=$(jq -r '.source.evidenceNextCursor // empty' <<< "$MORE")
    done
    [ "$(jq -r .kind <<< "$SOURCE")" = DOCUMENT ] || continue  # reverse lookup covers document sources
    RELATED_CURSOR=''
    while :; do
      RELATED=$(curl --fail-with-body --silent --show-error --get \
        "$MEMORY_API/sources/$SOURCE_ID/memories" -H "$AUTH" \
        --data-urlencode "ownerId=$OWNER_ID" --data-urlencode 'limit=100' \
        ${RELATED_CURSOR:+--data-urlencode "cursor=$RELATED_CURSOR"})
      jq '.items[] | {memoryId, text}' <<< "$RELATED"
      RELATED_CURSOR=$(jq -r '.nextCursor // empty' <<< "$RELATED")
      [ -n "$RELATED_CURSOR" ] || break
    done
  done < <(jq -c '.items[]' <<< "$LINKS")
  SOURCE_CURSOR=$(jq -r '.nextCursor // empty' <<< "$LINKS")
  [ -n "$SOURCE_CURSOR" ] || break
done
# STEP_END
