curl -s -X POST "https://$HOST/subscriptions/$SUBSCRIPTION_ID/databases" \
    --header "Content-Type: application/json" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    --data-binary "@./static/code/rv/api/create-database-basic.json" \
    | jq -r . 
