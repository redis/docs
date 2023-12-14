echo "Step 1: Post a request to create a subscription"

TASK_ID=$(curl -s -X POST "https://$HOST/subscriptions" \
    --header "Content-Type: application/json" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    --data-binary "@./static/code/rv/api/create-subscription-basic.json" \
    | jq -r .taskId )

echo "TASK_ID=$TASK_ID"


echo "Step 2: wait for processing completion"

STATUS=received
while [ "$STATUS" == "processing-in-progress" ] || [ "$STATUS" == "received" ]
do
    sleep 3 # seconds   
    STATUS=$(curl -s -X GET "https://$HOST/tasks/$TASK_ID" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    | jq -r .status)
    echo "STATUS=$STATUS"
done

echo "Step 3: print the response, containing the created resource Id / error" 

echo "Response: "
curl -s -X GET "https://$HOST/tasks/$TASK_ID" \
    -H "accept: application/json" \
    -H "x-api-key: $ACCOUNT_KEY" \
    -H "x-api-secret-key: $SECRET_KEY" \
    | jq -r .

