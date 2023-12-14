curl -X GET "https://$HOST/subscriptions/$SUBSCRIPTION_ID/databases/$DATABASE_ID/metrics?metricSpan=1hour" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY"
