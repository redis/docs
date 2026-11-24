set -euo pipefail

# Use GATEWAY_MODE=full for a full-mode Gateway.
case "${GATEWAY_MODE:-search}" in
  search) iris --json context-gateway tools search filter_provider ;;
  full) iris --json context-gateway tools list ;;
  *) echo 'Choose search or full mode.' >&2; exit 2 ;;
esac

cat > provider-filter.json <<'JSON'
{"tag_conditions":[{"field":"specialty","value":"cardiology"}],"limit":100}
JSON
iris --json context-gateway tools call scheduling__filter_provider --input provider-filter.json
