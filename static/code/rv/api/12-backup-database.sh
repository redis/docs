curl -s -X POST "https://$HOST/subscriptions/$SUBSCRIPTION_ID/databases/$DATABASE_ID/backup" \
    --header "Content-Type: application/json" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" 
