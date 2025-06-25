---
LinkTitle: AWS console
Title: Create IAM resources using AWS console
alwaysopen: false
categories:
- docs
- operate
- rc
weight: $weight
aliases:
  - /operate/rc/how-to/view-edit-cloud-account/iam-resources/aws-console
  - /operate/rc/cloud-accounts/iam-resources/aws-console
  - /operate/rc/cloud-integrations/aws-cloud-accounts/iam-resources/aws-console
---
Follow these steps to manually create IAM resources using the [AWS console](https://console.aws.amazon.com/).

{{< warning >}}
We use the provided credentials to configure your AWS environment and provision required resources.

You **must not** change the configurations of provisioned resources or stop or terminate provisioned instances. If you do, your databases will be inaccessible and Redis will not be able to ensure database stability. See [Avoid service disruption]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings#avoid-service-disruption" >}}) for more details.
{{< /warning >}}

## Step 1: Create the IAM instance policy

The IAM instance policy controls the permissions for the instances that Redis Cloud creates in your AWS account.

Follow the steps to [create an IAM policy using the JSON editor](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_create-console.html#access_policies_create-json-editor) with the following settings:

- In **Specify permissions**, select **JSON**, and then enter the contents of the RedisLabsInstanceRolePolicy.json policy file:

    {{< scrollable-code >}}
```js
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DescribeReadOnlyEc2Resources",
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeAvailabilityZones",
                "ec2:DescribeRegions",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeTags",
                "ec2:DescribeVolumes"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Sid": "EC2EBSActions",
            "Effect": "Allow",
            "Action": [
                "ec2:AttachVolume",
                "ec2:CreateVolume"
            ],
            "Resource": [
                "*"
            ],
            "Condition": {
                "StringEquals": {
                    "ec2:ResourceTag/RedisLabsIdentifier": "Redislabs-VPC"
                }
            }
        },
        {
            "Sid": "SecurityGroupAccessActions",
            "Effect": "Allow",
            "Action": [
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:DeleteSecurityGroup"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "ec2:ResourceTag/RedisLabsIdentifier": "Redislabs-VPC"
                }
            }
        },
        {
            "Sid": "TagResourcesCreation",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateTags"
            ],
            "Resource": [
                "*"
            ]
        },
        {
        "Sid": "TagResourcesDelete",
        "Effect": "Allow",
        "Action": [
                "ec2:DeleteTags"
        ],
        "Resource": [
                "*"
        ],
        "Condition": {
            "StringEquals": {
                "ec2:ResourceTag/RedisLabsIdentifier": "Redislabs-VPC"
            }
        }
        }
    ]
}
```
    {{< /scrollable-code >}}

- In **Review and Create**, enter `RedisLabsInstanceRolePolicy` in the **Policy name** field.

Select **Create policy** to finish policy creation.

## Step 2: Create the service role

After creating the instance role policy, you must create a role to assign the policy.

Follow the steps to [create a role for an AWS service](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-service.html#roles-creatingrole-service-console) with the following settings:

- In **Select trusted entity**:
    - **Trusted entity**: Select **AWS service**.
    - **Service or use case**: Select **EC2**.
    - **Use case**: Select **EC2**.
- In **Add permissions**, select the **RedisLabsInstanceRolePolicy** you created.
- In **Name, review, and create**, enter `redislabs-cluster-node-role` in the **Role name** field.

Select **Create role** to finish role creation.

## Step 3: Create the user policy

The user policy controls the permissions for the user that Redis Cloud uses to manage your AWS account.

Follow the steps to [create an IAM policy using the JSON editor](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_create-console.html#access_policies_create-json-editor) with the following settings:

- In **Specify permissions**, select **JSON**, and then enter the contents of the RedisLabsIAMUserRestrictedPolicy.json policy file:

    {{< scrollable-code >}}
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DescribeReadOnlyEc2Resources",
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeAvailabilityZones",
                "ec2:DescribeInstanceTypeOfferings",
                "ec2:DescribeRegions",
                "ec2:DescribeInstances",
                "ec2:DescribeVolumes",
                "ec2:DescribeSnapshots",
                "ec2:DescribeVpcs",
                "ec2:DescribeSubnets",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeRouteTables",
                "ec2:DescribeInternetGateways",
                "ec2:DescribeImages",
                "ec2:DescribeTransitGatewayVpcAttachments",
                "ec2:DescribeVpcPeeringConnections",
                "ec2:DescribeKeyPairs",
                "ec2:DescribeTransitGateways",
                "ec2:DescribeInstanceStatus",
                "ec2:DescribeNetworkAcls"
            ],
            "Resource": "*"
        },
        {
            "Sid": "CloudWatchReadOnly",
            "Effect": "Allow",
            "Action": [
                "cloudwatch:Describe*",
                "cloudwatch:Get*",
                "cloudwatch:List*"
            ],
            "Resource": "*"
        },
        {
            "Sid": "IamUserOperations",
            "Effect": "Allow",
            "Action": [
                "iam:GetUser",
                "iam:GetUserPolicy",
                "iam:ChangePassword"
            ],
            "Resource": "arn:aws:iam::*:user/${aws:username}"
        },
        {
            "Sid": "RolePolicyUserReadActions",
            "Action": [
                "iam:GetRole",
                "iam:GetPolicy",
                "iam:ListUsers",
                "iam:ListPolicies",
                "iam:ListRolePolicies",
                "iam:ListAttachedRolePolicies",
                "iam:ListInstanceProfiles",
                "iam:ListInstanceProfilesForRole",
                "iam:SimulatePrincipalPolicy"
            ],
            "Effect": "Allow",
            "Resource": "*"
        },
        {
            "Sid": "PassRlClusterNodeRole",
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": "arn:aws:iam::*:role/redislabs-cluster-node-role"
        },
        {
            "Sid": "CreateEc2ResourcesWithoutTag",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateTags",
                "ec2:RunInstances",
                "ec2:ImportKeyPair",
                "ec2:CreateKeyPair",
                "ec2:CreateVpc",
                "ec2:CreateSecurityGroup",
                "ec2:CreateInternetGateway",
                "ec2:CreateRouteTable",
                "ec2:CreateSubnet",
                "ec2:CreateSnapshot",
                "ec2:CreateTransitGateway",
                "ec2:AssociateVpcCidrBlock",
                "ec2:CreateTransitGatewayVpcAttachment",
                "ec2:AttachInternetGateway",
                "ec2:ReplaceRoute"
            ],
            "Resource": "*"
        },
        {
            "Sid": "ForceUnderlyingResourcesToHaveIdentifierTags",
            "Effect": "Deny",
            "Action": [
                "ec2:RunInstances",
                "ec2:CreateKeyPair"
            ],
            "Resource": [
                "arn:aws:ec2:*:*:instance/*",
                "arn:aws:ec2:*:*:volume/*",
                "arn:aws:ec2:*:*:keypair/*"
            ],
            "Condition": {
                "Null": {
                    "aws:RequestTag/RedisLabsIdentifier": "true"
                }
            }
        },
        {
            "Sid": "AllowVpcPeeringManagement",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateVpcPeeringConnection",
                "ec2:AcceptVpcPeeringConnection"
            ],
            "Resource": "*"
        },
        {
            "Sid": "AllowVpcPeeringDeletion",
            "Effect": "Allow",
            "Action": [
                "ec2:DeleteVpcPeeringConnection"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "ec2:ResourceTag/RedisLabsIdentifier": "Redislabs-VPC"
                }
            }
        },
        {
            "Sid": "CreateEc2Resources",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateVolume",
                "ec2:CreateRoute",
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:AuthorizeSecurityGroupEgress"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "ec2:ResourceTag/RedisLabsIdentifier": "Redislabs-VPC"
                }
            }
        },
        {
            "Sid": "ModifyEc2Resources",
            "Effect": "Allow",
            "Action": [
                "ec2:AttachVolume",
                "ec2:ModifyInstanceAttribute",
                "ec2:ModifySubnetAttribute",
                "ec2:AssociateRouteTable",
                "ec2:StartInstances",
                "ec2:StopInstances",
                "ec2:RebootInstances"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "ec2:ResourceTag/RedisLabsIdentifier": "Redislabs-VPC"
                }
            }
        },
        {
            "Sid": "DeleteEc2Resources",
            "Effect": "Allow",
            "Action": [
                "ec2:TerminateInstances",
                "ec2:DeleteVolume",
                "ec2:DeleteSnapshot",
                "ec2:DetachVolume",
                "ec2:DeleteKeyPair",
                "ec2:DeleteTags",
                "ec2:DeleteSubnet",
                "ec2:DeleteSecurityGroup",
                "ec2:DeleteRouteTable",
                "ec2:DeleteRoute",
                "ec2:DeleteInternetGateway",
                "ec2:DeleteVpc"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "ec2:ResourceTag/RedisLabsIdentifier": "Redislabs-VPC"
                }
            }
        },
        {
            "Sid": "DeleteEc2ResourcesWithoutTag",
            "Effect": "Allow",
            "Action": [
                "ec2:RevokeSecurityGroupIngress",
                "ec2:RejectVpcPeeringConnection",
                "ec2:DeleteTransitGatewayVpcAttachment",
                "ec2:DeleteTransitGateway",
                "ec2:DetachInternetGateway"
            ],
            "Resource": "*"
        },
        {
            "Sid": "CreateAndChangeServiceLinkedRoleForTransitGateway",
            "Effect": "Allow",
            "Action": "iam:CreateServiceLinkedRole",
            "Resource": "arn:aws:iam::*:role/aws-service-role/transitgateway.amazonaws.com/AWSServiceRoleForVPCTransitGateway*",
            "Condition": {
                "StringLike": {
                    "iam:AWSServiceName": "transitgateway.amazonaws.com"
                }
            }
        },
        {
            "Sid": "RolePolicyForTransitGateway",
            "Effect": "Allow",
            "Action": [
                "iam:AttachRolePolicy",
                "iam:PutRolePolicy"
            ],
            "Resource": "arn:aws:iam::*:role/aws-service-role/transitgateway.amazonaws.com/AWSServiceRoleForVPCTransitGateway*"
        },
        {
            "Sid": "AllowEncryptedVolumeCreation",
            "Effect": "Allow",
            "Action": [
                "kms:GenerateDataKeyWithoutPlaintext",
                "kms:DescribeKey"
            ],
            "Resource": "*"
        },
        {
            "Sid": "AllowAttachDetachOfEncryptedVolumes",
            "Effect": "Allow",
            "Action": [
                "kms:CreateGrant",
                "kms:ListGrants",
                "kms:RevokeGrant"
            ],
            "Resource": "*",
            "Condition": {
                "Bool": {
                    "kms:GrantIsForAWSResource": "true"
                }
            }
        }
    ]
}
```
    {{< /scrollable-code >}}

- In **Review and Create**, enter `RedislabsIAMUserRestrictedPolicy` in the **Policy name** field.

Select **Create policy** to finish policy creation.

## Step 4: Create the programmatic access user

After you create the user policy, you must create a programmatic access user and attach the policy to it.

Follow the steps to [create a user on the AWS console](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html), with the following settings:

- In **Specify user details**, For **User name**, enter `redislabs-user`.
- In **Set permissions**:
    - **Permissions options**: Select **Attach existing policies directly**.
    - **Permissions policies**: Select the **RedislabsIAMUserRestrictedPolicy** you created from the list.

Select **Create user** to create the user.

After you create the user, you need to add an access key for the user.

Follow the steps to [create an access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-keys-admin-managed.html#admin-create-access-key) for the user you just created. Save the access key ID and secret access key in a secure location.

## Step 5: Create the console access role

The console access role controls the permissions for the user that Redis Cloud uses to access the AWS console.

Follow the steps to [Create a role for an IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user.html) with the following settings:

- In **Select trusted entity**:
    - **Trusted entity**: Select **AWS account**.
    - **An AWS account**: Select **Another AWS account**.
    - **Account ID**: Enter account number `168085023892` (Redis Cloud's AWS account).
    - **Options**: Select **Require MFA**.
    {{< warning >}}
Do not check the **Require external ID** checkbox.
    {{< /warning >}}
- In **Add permissions**, select the **RedisLabsInstanceRolePolicy** you created.
- In **Name, review, and create**, enter `redislabs-role` in the **Role name** field.

Select **Create role** to finish role creation. Save the Role name for later.

## Next steps

When you've finished creating all of the resources, you can [create a Cloud Account]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings" >}}) in the Redis Cloud console. To do this, you'll need the following information:

- **Access Key ID**: The Access Key ID for the [programmatic user you created](#step-4-create-the-programmatic-access-user).
- **Secret Access Key**: The Secret Access Key for the [programmatic user you created](#step-4-create-the-programmatic-access-user).
- **IAM Role Name**: The name of the [console access role you created](#step-5-create-the-console-access-role).
