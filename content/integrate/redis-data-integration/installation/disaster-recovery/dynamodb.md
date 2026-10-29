---
Title: Configure a DynamoDB lease
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Create and configure a strongly consistent DynamoDB lease for RDI disaster recovery.
group: di
hideListLinks: false
linkTitle: DynamoDB lease
summary: Set up a shared lease table and install RDI at both sites.
type: integration
weight: 20
---

Use an Amazon DynamoDB global table with multi-Region strong consistency (MRSC) to coordinate
leader election between two Redis Data Integration (RDI) disaster recovery (DR) sites. A global table using the
default multi-Region eventual consistency mode cannot prevent both sites from acquiring
the lease.

Before you begin, [prepare both sites and their values files](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#prepare-both-sites).
The commands use the Amazon Web Services (AWS) command-line interface (CLI), authenticated
as an identity that can create an MRSC global table. Use a current AWS CLI version 2 that
supports `--global-table-witness-updates` and `--multi-region-consistency`. If either option
is unknown, [update the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
The RDI operator needs separate runtime permissions.

To prepare the lease store with Terraform, use the
[DynamoDB lease Terraform example](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-dynamodb-lease).
It creates the MRSC global table and operator access policy, and outputs lease settings for
each replica Region. After applying it, continue with
[Configure both instances](/content/integrate/redis-data-integration/installation/disaster-recovery/dynamodb.md#configure-both-instances).

## Create the table

The table must have a single string partition key named `id`, with no sort key. Do not enable
Time to Live (TTL), which MRSC tables do not support. See
[DynamoDB consistency modes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html).

1. Choose three supported AWS Regions: two for replicas and one for a witness. Each RDI site
   uses a replica endpoint it can reach. The witness cannot serve reads or writes. For
   example, you can use `us-east-1` and `us-east-2` for replicas and `us-west-2` for the witness.
   Check [MRSC Region availability](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html)
   before choosing your Regions.

1. Set the table name and Regions in your shell:

   ```bash
   DR_LEASE_TABLE="<lease-table>"
   DR_LEASE_REGION_A="<aws-replica-region-a>"
   DR_LEASE_REGION_B="<aws-replica-region-b>"
   DR_LEASE_WITNESS_REGION="<aws-witness-region>"
   ```

1. Create the first replica table:

   ```bash
   aws dynamodb create-table --region "$DR_LEASE_REGION_A" \
     --table-name "$DR_LEASE_TABLE" \
     --attribute-definitions AttributeName=id,AttributeType=S \
     --key-schema AttributeName=id,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST

   aws dynamodb wait table-exists --region "$DR_LEASE_REGION_A" \
     --table-name "$DR_LEASE_TABLE"
   ```

1. Convert the empty table to an MRSC global table with a second replica and a witness:

   ```bash
   aws dynamodb update-table --region "$DR_LEASE_REGION_A" \
     --table-name "$DR_LEASE_TABLE" \
     --replica-updates "[{\"Create\":{\"RegionName\":\"$DR_LEASE_REGION_B\"}}]" \
     --global-table-witness-updates "[{\"Create\":{\"RegionName\":\"$DR_LEASE_WITNESS_REGION\"}}]" \
     --multi-region-consistency STRONG
   ```

   Keep the table empty until the conversion finishes. Do not start RDI against it yet.
   You choose the consistency mode when creating the global table; you cannot change it on
   an existing global table. See [Create an MRSC global table](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables.tutorial.html).

1. Check readiness from both replica Regions:

   ```bash
   for DR_LEASE_REGION in "$DR_LEASE_REGION_A" "$DR_LEASE_REGION_B"; do
     aws dynamodb describe-table --region "$DR_LEASE_REGION" \
       --table-name "$DR_LEASE_TABLE" \
       --query 'Table.{Status:TableStatus,Consistency:MultiRegionConsistency,KeySchema:KeySchema,Attributes:AttributeDefinitions,Replicas:Replicas[*].[RegionName,ReplicaStatus],Witnesses:GlobalTableWitnesses[*].[RegionName,WitnessStatus]}'
   done
   ```

   Wait until the table, replicas, and witness report `ACTIVE` and consistency reports
   `STRONG`. Confirm the single `id` partition key with string type `S`. A newly created
   replica can take time to become visible.

## Grant the operator access

Give each operator's AWS identity the `dynamodb:DescribeTable`, `dynamodb:PutItem`, and
`dynamodb:DeleteItem` permissions on the replica it uses. The operator does not need access
to the witness. Creating the table requires separate permissions.

For an identity used at both sites, the following Identity and Access Management (IAM)
policy grants runtime access to the two replica table Amazon Resource Names (ARNs):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeTable",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:<aws-replica-region-a>:<aws-account-id>:table/<lease-table>",
        "arn:aws:dynamodb:<aws-replica-region-b>:<aws-account-id>:table/<lease-table>"
      ]
    }
  ]
}
```

Attach this policy to the operator's role or user using your IAM administration process.
If the sites use different identities, restrict each identity to the replica it uses.

Allow outbound Hypertext Transfer Protocol Secure (HTTPS) access from each operator to
`dynamodb.<aws-replica-region>.amazonaws.com`.

RDI uses the AWS default credential provider chain when you omit a credentials file.
Configure the identity in the operator's environment, not only in your local shell. For
example, an operator running outside AWS can use an AWS shared credentials file passed
when installing RDI.

## Configure both instances

Merge the following settings into the `operator.leaderElection` section of each site's
values file. Keep the local RDI database connection and other installation settings from
[Prepare both sites](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#prepare-both-sites).

In `rdi-values-site-a.yaml`:

```yaml
operator:
  leaderElection:
    enabled: true
    instanceID: site-a
    standbyMode: false
    leaseType: dynamodb
    dynamoDBLease:
      region: <aws-replica-region-a>
      tableName: <lease-table>
      keyName: <lease-item-key>
```

In `rdi-values-site-b.yaml`:

```yaml
operator:
  leaderElection:
    enabled: true
    instanceID: site-b
    standbyMode: false
    leaseType: dynamodb
    dynamoDBLease:
      region: <aws-replica-region-b>
      tableName: <lease-table>
      keyName: <lease-item-key>
```

Use identical `tableName` and `keyName` values at both sites, distinct `instanceID` values,
and each site's selected replica Region. The `keyName` default is `rdi-lease`. Use a different
item key for every independent DR setup that shares the table. RDI creates the lease item.

## Install RDI and check access

1. With the AWS identity configured for both operators, install RDI in each Kubernetes cluster:

   ```bash
   helm upgrade --install rdi "rdi-<version>.tgz" \
     --kube-context "<site-a-kube-context>" --namespace rdi --create-namespace \
     --values rdi-values-site-a.yaml

   helm upgrade --install rdi "rdi-<version>.tgz" \
     --kube-context "<site-b-kube-context>" --namespace rdi --create-namespace \
     --values rdi-values-site-b.yaml
   ```

   If you use an AWS shared credentials file, append this option to each site's command,
   using that site's file:

   ```text
   --set-file operator.leaderElection.dynamoDBLease.credentials="<aws-credentials-file>"
   ```

   For example, the file can contain:

   ```ini
   [default]
   aws_access_key_id = <access-key-id>
   aws_secret_access_key = <secret-access-key>
   ```

   If the credentials are temporary, also include their `aws_session_token`. Renew temporary
   credentials before they expire.

1. Check the operator at each site:

   ```bash
   kubectl --context "<site-a-kube-context>" --namespace rdi get pods
   kubectl --context "<site-b-kube-context>" --namespace rdi get pods
   kubectl --context "<site-a-kube-context>" --namespace rdi logs deployment/rdi-operator
   kubectl --context "<site-b-kube-context>" --namespace rdi logs deployment/rdi-operator
   ```

   Check for authentication, permission, table-schema, consistency, or connectivity errors.
   A successful `describe-table` from your shell does not confirm the operator's runtime
   permissions.

Continue with [Deploy pipelines and secrets](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#deploy-pipelines-and-secrets)
to configure RDI CLI contexts and confirm that one instance is the leader and the other is
a follower.
