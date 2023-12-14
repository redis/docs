curl -s -X GET "https://$HOST/subscriptions/{subscription-id}" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    | jq -r .
