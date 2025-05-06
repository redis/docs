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
Follow these steps to manually create IAM resources using the [AWS console](https://console.aws.amazon.com/).

{{< warning >}}
We use the provided credentials to configure your AWS environment and provision required resources.

You **must not** change the configurations of provisioned resources or stop or terminate provisioned instances. If you do, your databases will be inaccessible and Redis will not be able to ensure database stability. See [Avoid service disruption]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings#avoid-service-disruption" >}}) for more details.
{{< /warning >}}

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
                        "ec2:DeleteSecurityGroup",
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
    {{< /expand >}}


1. Validate it and then select **Review Policy**.
1. Enter **RedisLabsInstanceRolePolicy** as the policy name and then select **Create Policy**.

## Step 2: Create the service role

To create the role that uses the policy:

<!-- {{< video "/images/rc/create-cluster-node-role.mp4" "Create a cluster node role" >}} -->

1. In the AWS IAM console, go to **Roles** and click **Create Role**.
1. Select **AWS Service** as the trusted entity, **EC2** as the service
    and use case, and click **Next: Permissions**.
1. Enter `RedisLabsInstanceRolePolicy` in the search box to look up the policy we just created.
    Select it, and click **Next: Review**.
1. Name the role `redislabs-cluster-node-role` and click **Create Role**.

## Step 3: Create the user policy

Now create a policy to assign to the user:

<!-- {{< video "/images/rc/create-instance-user-policy.mp4" "Create an instance user policy" >}} -->

1. In the AWS IAM console, go to **Policies** > **Create policy**.
1. In the **JSON** tab, paste the contents of the RedisLabsIAMUserRestrictedPolicy.json policy file.

    {{< expand "View RedislabsIAMUserRestrictedPolicy.json" >}}
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
                "ec2:DescribeVpcPeeringConnections"
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
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "ec2:ResourceTag/RedisLabsIdentifier": "Redislabs-VPC"
                }
            }
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
            "Sid": "PassRlClusterNodeRole",
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": "arn:aws:iam::*:role/redislabs-cluster-node-role"
        },
        {
            "Sid": "IAMRoleReadAccess",
            "Effect": "Allow",
            "Action": [
                "iam:GetRole",
                "iam:GetPolicy",
                "iam:ListRolePolicies",
                "iam:ListAttachedRolePolicies",
                "iam:ListInstanceProfiles",
                "iam:ListInstanceProfilesForRole",
                "iam:SimulatePrincipalPolicy"
            ],
            "Resource": [
                "arn:aws:iam::*:role/Redislabs-*",
                "arn:aws:iam::*:policy/Redislabs-*"
            ]
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
                "ec2:CreateSubnet"
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
            "Sid": "DenyCreateVpcWithoutRequiredTag",
            "Effect": "Deny",
            "Action": [
                "ec2:CreateVpc"
            ],
            "Resource": "*",
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
                "ec2:CreateSnapshot",
                "ec2:ImportKeyPair",
                "ec2:AttachInternetGateway",
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
                "ec2:DetachInternetGateway",
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
            "Effect": "Allow",
            "Action": [
                "iam:AttachRolePolicy",
                "iam:PutRolePolicy"
            ],
            "Resource": "arn:aws:iam::*:role/aws-service-role/transitgateway.amazonaws.com/AWSServiceRoleForVPCTransitGateway*"
        }
    ]
}
```
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
