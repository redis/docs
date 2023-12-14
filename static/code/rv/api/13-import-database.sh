curl -s -X POST "https://$HOST/subscriptions/$SUBSCRIPTION_ID/databases/$DATABASE_ID/import" \
    --header "Content-Type: application/json" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    --data-binary "@./static/code/rv/api/import-database-s3.json" 