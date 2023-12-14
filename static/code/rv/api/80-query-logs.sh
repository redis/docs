curl -X GET "https://$HOST/logs?limit=100&offset=0" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY"
