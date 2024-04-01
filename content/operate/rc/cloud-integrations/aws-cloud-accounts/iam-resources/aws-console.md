---
LinkTitle: AWS console
Title: Create IAM resources using AWS console
alwaysopen: false
categories:
- docs
- operate
- rc
weight: $weight
---
To manually create IAM resources using the [AWS console](https://console.aws.amazon.com/), follow these steps.

## Step 1: Create the IAM instance policy

First, create a policy to use for the new instance role:

<!-- {{< video "/images/rc/create-instance-role-policy.mp4" "Create an instance role policy" >}} -->

1. In the AWS IAM console, go to **Policies** > **Create policy**.
1. In the **JSON** tab, paste the contents of the RedisLabsInstanceRolePolicy.json policy file, shown here:

    {{< expand "View RedisLabsInstanceRolePolicy.json" >}}
```js
{
    "Version": "2012-10-17",
    "Statement": [
    {
        "Sid": "EC2",
        "Effect": "Allow",
        "Action": [
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeRegions",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeTags",
        "ec2:DescribeVolumes"
        ],
        "Resource": "*"
    },
    {
        "Sid": "EC2Tagged",
        "Effect": "Allow",
        "Action": [
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:DeleteSecurityGroup",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress"
        ],
        "Resource": "*",
        "Condition": {
        "StringEquals": {
            "ec2:ResourceTag/RedisLabsIdentifier": "Redislabs-VPC"
        }
        }
    },
    {
        "Sid": "EBSVolumeActions",
        "Effect": "Allow",
        "Action": [
        "ec2:AttachVolume",
        "ec2:CreateVolume",
        "ec2:CreateTags",
        "ec2:DescribeTags"
        ],
        "Resource": "*"
    },
    {
        "Sid": "S3Object",
        "Effect": "Allow",
        "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:GetObjectAcl",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
        ],
        "Resource": "*"
    },
    {
        "Sid": "IAM",
        "Effect": "Allow",
        "Action": [
        "iam:GetPolicy",
        "iam:ListPolicies"
        ],
        "Resource": "*"
    }
    {
    "Sid": "ResourceAccessManagerActions",
    "Effect": "Allow",
    "Action": [
        "ram:AcceptResourceShareInvitation",
        "ram:GetResourceShares",
        "ram:RejectResourceShareInvitation",
        "ram:GetResourceShareInvitations",
        "ram:DisassociateResourceShare"
    ],
    "Resource": "*"
    },
    {
        "Sid": "CreateAndChangeServiceLinkedRoleForTransitGateway",
        "Effect": "Allow",
        "Action": "iam:CreateServiceLinkedRole",
        "Resource": "arn:aws:iam::*:role/"
                    "aws-service-role/transitgateway.amazonaws.com/AWSServiceRoleForVPCTransitGateway*",
        "Condition": {"StringLike": {"iam:AWSServiceName": "transitgateway.amazonaws.com"}}
    },
    {
        "Effect": "Allow",
        "Action": [
            "iam:AttachRolePolicy",
            "iam:PutRolePolicy"
        ],
        "Resource": "arn:aws:iam::*:role/"
                    "aws-service-role/transitgateway.amazonaws.com/AWSServiceRoleForVPCTransitGateway*"
    }
    ]
}
```
    {{< /expand >}}


1. Validate it and then select **Review Policy**.
1. Enter **RedisLabsInstanceRolePolicy** as the policy name and then select **Create Policy**.

## Step 2: Create the service role

To create the role that uses the policy:

<!-- {{< video "/images/rc/create-cluster-node-role.mp4" "Create a cluster node role" >}} -->

1. In the AWS IAM console, go to **Roles** and click **Create Role**.
1. Select **AWS Service** as the trusted entity, **EC2** as the service
    and use case, and click **Next: Permissions**.
1. Enter `RedisLabsInstanceRolePolicy` in the search box to look up the policy we just created,
    select it, and click **Next: Review**.
1. Name the role `redislabs-cluster-node-role` and click **Create Role**.

## Step 3: Create the user policy

Now create a policy to assign to the user:

<!-- {{< video "/images/rc/create-instance-user-policy.mp4" "Create an instance user policy" >}} -->

1. In the AWS IAM console, go to **Policies** > **Create policy**.
1. In the **JSON** tab, paste the contents of the RedisLabsIAMUserRestrictedPolicy.json policy file.

    {{< expand "View RedislabsIAMUserRestrictedPolicy.json" >}}
{{% code-include file="rv/RedisLabsIAMUserRestrictedPolicy.json" language="js" %}}
    {{< /expand >}}

1. Validate the policy and click **Review Policy**.
1. Enter `RedislabsIAMUserRestrictedPolicy` as the policy name and click **Create Policy**.

## Step 4: Create the programmatic access user

Create a user and attach the policy you created:

<!-- {{< video "/images/rc/create-programmatic-user.mp4" "Create programmatic user" >}} -->

1. In the AWS IAM console, go to **Users** > select **Add user**.
1. Name it `redislabs-user` and check only the **Programmatic access** checkbox.
1. Click **Next: Permissions**.
1. Select **Attach existing policies directly** and select
    **RedislabsIAMUserRestrictedPolicy** from the list.
1. Click **Next: Review**.
1. Click **Create user**.
1. Download the user credentials and store them in a secure location.

## Step 5: Create the console access role

Last, create a role and attach the policy you created:

<!-- {{< video "/images/rc/create-console-access-role.mp4" "Create console access user" >}} -->

1. In the AWS IAM console, go to **Roles** > select **Create role**.
1. Select **Another AWS account**.
1. Under **Account ID**, enter account number `168085023892` (Redis Cloud's AWS account).
1. Under Options, check the **Require MFA** checkbox only. *Do not check Require external ID*.
1. Click **Next: Permissions**.
1. Attach the policy **RedisLabsIAMUserRestrictedPolicy** to the role.
1. Click **Next: Review**.
1. Name the role `redislabs-role` and then click **Create role**.
