curl -s -X GET "https://$HOST/tasks/$TASK_ID" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    | jq -r .
