---
Title: Create a Cloud RDI pipeline with the API
linkTitle: API quick start
alwaysopen: false
categories:
- docs
- operate
- rc
description: Create a Pro subscription, a Redis cache database, an RDI workspace, and a data pipeline with the Redis Cloud API.
hideListLinks: true
weight: 2
---

Use the Redis Cloud application programming interface (API) to create a Pro subscription and cache database, provision a Redis Data Integration (RDI) workspace, and deploy a pipeline. This guide uses PostgreSQL as an example. See [all supported source databases](/content/operate/rc/rdi/_index.md#prerequisites) and their [preparation instructions](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/_index.md).

Terraform creates only the source database's Amazon Web Services (AWS) connectivity and secrets.

## Before you start

You need a Redis Cloud account with a payment method, [API account and user keys](/content/operate/rc/api/get-started/manage-api-keys.md), Bash, `curl`, `jq`, Git, Terraform, and the AWS command-line interface (CLI). Use an Owner's API user key: the [role permissions table](/content/operate/rc/security/access-control/access-management.md#team-management-roles) shows that Managers cannot use the REST API and Viewers have read-only access. Use the same AWS region for the subscription and source connectivity.

Prepare an existing [Amazon Relational Database Service (RDS) PostgreSQL source](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/aws-aurora-rds/aws-aur-pgsql.md) with logical replication, a replication user, and a publication containing your selected tables. This example captures `public.products`, with columns `id`, `name`, and `price`, using `id` as its primary key and `rdi_publication` as its publication.

## Fill in your inputs

Edit this block once. Find `PAYMENT_METHOD_ID` with [`GET /v1/payment-methods`](/content/operate/rc/api/api-reference.md#tag/Account/operation/getAccountPaymentMethods). Choose an unused `/24` Classless Inter-Domain Routing (CIDR) range for `SUBSCRIPTION_CIDR`. The region and availability zone IDs default to `eu-central-1`.

Use the RDS instance identifier for `SOURCE_RDS_ID`, or the cluster identifier and `db-cluster` for Aurora. Enter the passwords when prompted, then run the remaining blocks in the same Bash session.

```bash
set -euo pipefail
umask 077
export SUBSCRIPTION_NAME=rdi-api-example
export PAYMENT_METHOD_ID='<payment-method-id>'
export SUBSCRIPTION_CIDR=10.0.0.0/24
export DATABASE_NAME=rdi-api-cache PIPELINE_NAME=postgres-example
export AWS_REGION=eu-central-1 AWS_PROFILE='<aws-profile>'
export AWS_AVAILABILITY_ZONES='["euc1-az1","euc1-az2","euc1-az3"]'
export RESOURCE_NAME=rdi-api-example
export AWS_RESOURCE_TAGS='{"owner":"<owner>","team":"<team>"}'
export SOURCE_HOST='<rds-hostname>' SOURCE_PORT=5432
export SOURCE_DATABASE='<database-name>' SOURCE_USERNAME='<replication-user>'
export SOURCE_VPC_ID='<vpc-id>'
export SOURCE_SUBNET_IDS='["<subnet-id>","<subnet-id>"]'
export SOURCE_SECURITY_GROUP_IDS='["<database-security-group-id>"]'
export SOURCE_RDS_ID='<rds-instance-identifier>' SOURCE_RDS_EVENT_TYPE=db-instance
export SOURCE_SCHEMA=public SOURCE_TABLE=products SOURCE_KEY_COLUMN=id
export SOURCE_COLUMNS='["id","name","price"]'
export PUBLICATION_NAME=rdi_publication SLOT_NAME=rdi_api_postgres
read -rsp 'API account key: ' REDIS_CLOUD_API_KEY; echo
read -rsp 'API user key: ' REDIS_CLOUD_API_SECRET_KEY; echo
read -rsp 'Source database password: ' TF_VAR_existing_db_password; echo
export REDIS_CLOUD_API_KEY REDIS_CLOUD_API_SECRET_KEY TF_VAR_existing_db_password
```

<details>
<summary>Load the API and polling helpers</summary>

Creation requests can return before resources are ready. These helpers retry temporary read failures, stop on an error, and limit each resource wait to 30 minutes.

```bash
API=https://api.redislabs.com/v1
RUN_DIR="$PWD/rdi-api-example"
mkdir -p "$RUN_DIR"
cd "$RUN_DIR"

cloud() {
  local method=$1 response rc=0; shift
  response=$(mktemp)
  curl --fail-with-body --silent --show-error --connect-timeout 10 --max-time 60 \
    -H "x-api-key: $REDIS_CLOUD_API_KEY" \
    -H "x-api-secret-key: $REDIS_CLOUD_API_SECRET_KEY" \
    -H 'Content-Type: application/json' -X "$method" -o "$response" "$@" || rc=$?
  if ((rc)); then cat "$response" >&2; else cat "$response"; fi
  rm -f "$response"
  return "$rc"
}
```

```bash
wait_for() {
  local url=$1 ready=$2 failed=$3 body end=$((SECONDS + 1800))
  while ((SECONDS < end)); do
    body=$(cloud GET "$url" --retry 3 --retry-delay 2 --retry-max-time 30) || return
    if jq -e "$failed" <<<"$body" >/dev/null; then
      printf '%s\n' "$body" >&2; return 1
    fi
    if jq -e "$ready" <<<"$body" >/dev/null; then
      printf '%s\n' "$body"; return 0
    fi
    sleep 15
  done
  printf 'Timed out waiting for %s\n%s\n' "$url" "$body" >&2; return 1
}
```

</details>

## Create the subscription

[Create an AWS Pro subscription](/content/operate/rc/api/examples/manage-subscriptions.md#create-a-pro-subscription) with multi-zone replication. The API requires an initial database; this example creates a 0.1 GB bootstrap database.

```bash
jq -n '{name:env.SUBSCRIPTION_NAME, paymentMethodId:(env.PAYMENT_METHOD_ID|tonumber),
  cloudProviders:[{provider:"AWS", regions:[{region:env.AWS_REGION,
    multipleAvailabilityZones:true,
    preferredAvailabilityZones:(env.AWS_AVAILABILITY_ZONES|fromjson),
    networking:{deploymentCIDR:env.SUBSCRIPTION_CIDR}}]}],
  databases:[{name:(env.DATABASE_NAME+"-bootstrap"), protocol:"redis",
    datasetSizeInGb:0.1, replication:true,
    throughputMeasurement:{by:"operations-per-second", value:1000}}]
}' > subscription-request.json
cloud POST "$API/subscriptions" --data-binary @subscription-request.json > subscription-task.json
TASK_ID=$(jq -er '.taskId' subscription-task.json)
wait_for "$API/tasks/$TASK_ID" '.status == "processing-completed"' \
  '.status == "processing-error"' > subscription-task.json
SUBSCRIPTION_ID=$(jq -er '.response.resourceId' subscription-task.json)
export SUBSCRIPTION_ID
wait_for "$API/subscriptions/$SUBSCRIPTION_ID" '.status == "active"' \
  '.status == "error"' > subscription.json
WORKSPACE="$API/subscriptions/$SUBSCRIPTION_ID/data-integration-workspace"
```

## Create the cache database

Create a 1 GB database with replication, 1,000 operations per second, least recently used eviction, no persistence, and Transport Layer Security (TLS). Set throughput explicitly; the API default is higher.

```bash
cloud POST "$API/subscriptions/$SUBSCRIPTION_ID/databases" \
  -d "{\"name\":\"$DATABASE_NAME\",\"datasetSizeInGb\":1,\"replication\":true,
       \"dataEvictionPolicy\":\"allkeys-lru\",\"dataPersistence\":\"none\",
       \"enableTls\":true,
       \"throughputMeasurement\":{\"by\":\"operations-per-second\",\"value\":1000}}" > database-task.json
TASK_ID=$(jq -er '.taskId' database-task.json)
wait_for "$API/tasks/$TASK_ID" '.status == "processing-completed"' \
  '.status == "processing-error"' > database-task.json
DATABASE_ID=$(jq -er '.response.resourceId' database-task.json)
export DATABASE_ID
DATABASE_URL="$API/subscriptions/$SUBSCRIPTION_ID/databases/$DATABASE_ID"
wait_for "$DATABASE_URL" '.status == "active"' \
  '.status == "error"' > database.json
```

## Create the workspace

Ask for an unused CIDR range, then create the workspace. See [workspace network requirements](/content/operate/rc/rdi/create-workspace.md#create-a-data-integration-workspace) before overriding the suggestion. The workspace returns the roles needed for source connectivity and secrets.

During provisioning, the subscription can become `pending`, and its workspace URL returns `404`. Poll the account-level workspace list during that period, then confirm the subscription and workspace are ready:

```bash
CIDR=$(cloud GET "$WORKSPACE/network/suggested-cidrs" | jq -er '.nextFreeCidr')
cloud POST "$WORKSPACE" -d "{\"cidr\":\"$CIDR\"}" > workspace-task.json
SELECT_WORKSPACE=".workspaces[] | select(.subscriptionId == $SUBSCRIPTION_ID)"
wait_for "$API/data-integration-workspaces" \
  "$SELECT_WORKSPACE | .infrastructure.state == \"Ready\" and .capabilities.readyForPipeline == true" \
  "$SELECT_WORKSPACE | .infrastructure.state == \"Failed\" or .infrastructure.state == \"Deleting\"" \
  | jq "$SELECT_WORKSPACE" > workspace.json
wait_for "$API/subscriptions/$SUBSCRIPTION_ID" '.status == "active"' '.status == "error"' >/dev/null
cloud GET "$WORKSPACE" > workspace.json
TF_VAR_redis_privatelink_arn=$(jq -c '[.infrastructure.iam.privateLinkAllowedPrincipal]' workspace.json)
TF_VAR_redis_secrets_arn=$(jq -er '.infrastructure.iam.secretsRoleArn' workspace.json)
export TF_VAR_redis_privatelink_arn TF_VAR_redis_secrets_arn
```

## Connect your source

Use the public [`rdi-cloud-automation` existing RDS database example](https://github.com/redis/rdi-cloud-automation/tree/main/examples/aws-rds-privatelink-failover#existing-database-configuration). The script generates its inputs from your values and the workspace role Amazon Resource Names (ARNs). It creates an internal Network Load Balancer (NLB), endpoint service, secrets, encryption key, and Lambda function for RDS target registration.

<details>
<summary>Set up AWS connectivity and share the source secrets</summary>

The example uses your existing database with RDS Proxy disabled. See [source credentials and certificates](/content/operate/rc/rdi/setup.md#share-source-database-credentials) for the secret requirements.

```bash
AUTOMATION="$RUN_DIR/rdi-cloud-automation"
git clone https://github.com/redis/rdi-cloud-automation.git "$AUTOMATION"
TF_DIR="$AUTOMATION/examples/aws-rds-privatelink-failover"
jq -n '{region:env.AWS_REGION, aws_profile:env.AWS_PROFILE,
  name:env.RESOURCE_NAME, tags:(env.AWS_RESOURCE_TAGS|fromjson),
  source_db_mode:"existing", db_engine:"postgres", port:(env.SOURCE_PORT|tonumber),
  use_rds_proxy:false, nlb_internal:true, manage_existing_db_security_group_ingress:true,
  existing_db:{hostname:env.SOURCE_HOST, database:env.SOURCE_DATABASE,
    username:env.SOURCE_USERNAME, vpc_id:env.SOURCE_VPC_ID,
    subnet_ids:(env.SOURCE_SUBNET_IDS|fromjson),
    db_security_group_ids:(env.SOURCE_SECURITY_GROUP_IDS|fromjson),
    rds_event_source_id:env.SOURCE_RDS_ID,
    rds_event_source_type:env.SOURCE_RDS_EVENT_TYPE}
}' > source.tfvars.json
terraform -chdir="$TF_DIR" init
terraform -chdir="$TF_DIR" apply -var-file="$RUN_DIR/source.tfvars.json"
SERVICE_NAME=$(terraform -chdir="$TF_DIR" output -raw vpc_endpoint_service_name)
CREDENTIALS_ARN=$(terraform -chdir="$TF_DIR" output -raw secret_arn)
KMS_KEY_ARN=$(terraform -chdir="$TF_DIR" output -raw kms_key_arn)
export SERVICE_NAME CREDENTIALS_ARN KMS_KEY_ARN

curl --fail --silent --show-error --connect-timeout 10 --max-time 60 \
  "https://truststore.pki.rds.amazonaws.com/$AWS_REGION/$AWS_REGION-bundle.pem" \
  -o rds-ca.pem
jq -n --rawfile ca rds-ca.pem '{Name:(env.RESOURCE_NAME+"-rds-ca"),
  KmsKeyId:env.KMS_KEY_ARN, SecretString:$ca,
  Tags:(env.AWS_RESOURCE_TAGS|fromjson|to_entries|map({Key:.key,Value:.value}))
}' > ca-secret.json
CA_CERT_ARN=$(aws secretsmanager create-secret --cli-input-json file://ca-secret.json \
  --query ARN --output text)
export CA_CERT_ARN
jq -n '{Version:"2012-10-17", Statement:[{Effect:"Allow", Principal:"*",
  Action:["secretsmanager:GetSecretValue","secretsmanager:DescribeSecret"], Resource:"*",
  Condition:{StringLike:{"aws:PrincipalArn":env.TF_VAR_redis_secrets_arn}}}]
}' > ca-policy.json
aws secretsmanager put-resource-policy --secret-id "$CA_CERT_ARN" \
  --resource-policy file://ca-policy.json --block-public-policy
```

</details>

Create the Redis Cloud side of the PrivateLink connection:

```bash
cloud POST "$WORKSPACE/network/private-link" \
  -d "{\"serviceName\":\"$SERVICE_NAME\"}" > endpoint-task.json
ENDPOINT_ID=$(jq -er '.response.endpointId' endpoint-task.json)
export ENDPOINT_ID
wait_for "$WORKSPACE/network/private-link/$ENDPOINT_ID" '.state == "Available"' \
  '.state == "Failed" or .state == "Rejected"' > endpoint.json
```

## Deploy the pipeline

Build the configuration with the **endpoint ID returned by Redis Cloud**. The compose API resolves the PrivateLink hostname and target database details:

```bash
jq -n '{pipelineName:env.PIPELINE_NAME, targetDataType:"hash",
  target:{targetBdbId:(env.DATABASE_ID|tonumber)},
  source:{name:"postgres", databaseType:"postgresql", endpointId:env.ENDPOINT_ID,
    database:env.SOURCE_DATABASE, port:(env.SOURCE_PORT|tonumber),
    secretArns:{credentials:env.CREDENTIALS_ARN, tlsCa:env.CA_CERT_ARN},
    sourceAdvanced:{"publication.name":env.PUBLICATION_NAME,
      "publication.autocreate.mode":"disabled", "slot.name":env.SLOT_NAME}},
  schemas:[{name:env.SOURCE_SCHEMA, tables:[{name:env.SOURCE_TABLE,
    columns:(env.SOURCE_COLUMNS|fromjson|map(
      if . == env.SOURCE_KEY_COLUMN then {name:.,uniqueConstraint:true} else {name:.} end))}]}]
}' > source.json
PIPELINES="$WORKSPACE/rdi/api/v2/pipelines"
cloud POST "$PIPELINES" -d "{\"name\":\"$PIPELINE_NAME\",\"active\":false}"
cloud POST "$WORKSPACE/compose/mount-secrets" --max-time 180 --data-binary @source.json
jq '{direction:"cloud-to-rdi", cloud:.}' source.json > translate.json
cloud POST "$WORKSPACE/compose/translate" --data-binary @translate.json \
  | jq -e '.rdi | .active = true' > pipeline.json
cloud PATCH "$PIPELINES/$PIPELINE_NAME" --data-binary @pipeline.json
wait_for "$PIPELINES/$PIPELINE_NAME/status" '.status == "started" and .current == true' \
  '.status == "error"' > pipeline-status.json
```

The first secrets mount can take a few minutes. Use a unique pipeline name and replication slot name for each pipeline.

Open the pipeline's [Dashboard](/content/operate/rc/rdi/view-edit.md#dashboard) and wait for the initial snapshot. For a row with `id = 1`, this configuration creates the hash key `products:id:1`. Read it with `HGETALL products:id:1` in Redis Insight. Insert, update, and delete a test row in PostgreSQL and confirm each change in Redis.

## Troubleshoot and clean up

| Symptom | Check |
|---|---|
| Authentication or permission error | Supply both API keys and use an Owner's API user key. |
| Workspace creation rejects the CIDR | Use the suggested unused range and check the workspace network requirements. |
| Workspace URL returns `404` during provisioning | Check the subscription status and use the account-level workspace poll shown in this guide. |
| Secret validation fails | Check the secret ARN, region, resource policy, and key permissions for the workspace secrets role. |
| Secrets mount times out | Read the existing pipeline and wait for reconciliation. Retry the mount step, not pipeline creation. |
| Pipeline name already exists | Read or update the existing pipeline instead of repeating its creation request. |

See [billing](/content/operate/rc/rdi/faq.md#billing). When finished, [delete the pipeline](/content/operate/rc/rdi/view-edit.md#delete-pipeline), delete the [workspace](/content/operate/rc/rdi/create-workspace.md#delete-workspace), and remove unused source connectivity with `terraform -chdir="$TF_DIR" destroy -var-file="$RUN_DIR/source.tfvars.json"`. Delete the target database, bootstrap database, and separate CA secret if you no longer need them. Then [delete the empty subscription](/content/operate/rc/api/examples/manage-subscriptions.md#delete-a-pro-subscription). The existing source database remains intact.
