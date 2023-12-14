
echo "Step 1: Post a request to create a cloud account"

TASK_ID=$(curl -s -X POST "https://$HOST/cloud-accounts" \
    --header "Content-Type: application/json" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    --data-binary "@./static/code/rv/api/create-cloud-account-basic.json" \
    | jq -r .taskId )

echo "TASK_ID=$TASK_ID"


echo "Step 2: wait for processing completion"

STATUS=
while [ "$STATUS" != 'processing-completed' ] || [ "$STATUS" != 'processing-error' ]
do
    sleep 3 # seconds   
    STATUS=$(curl -s -X GET "https://$HOST/tasks/$TASK_ID" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    | jq -r .status)
    echo "STATUS=$STATUS"
done

echo "Step 3: print the response, containing the create resource Id"

echo "Response: "
curl -s -X GET "https://$HOST/tasks/$TASK_ID" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    | jq -r .



