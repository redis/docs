---
Title: Create IAM resources for AWS cloud accounts
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
linkTitle: Create IAM resources
weight: 1
---
For Redis Cloud Bring your Own Cloud (BYOC) on Amazon Web Services (AWS), we manage the supporting infrastructure for you in dedicated AWS accounts.

You can manage this infrastructure with your own AWS accounts.  

You'll want these accounts to be separate from any AWS application accounts 
and you'll need to create dedicated [identity and access management](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html) (IAM) resources to allow us to manage the infrastructure.

In the new AWS account, you need to create:

- An **instance role**
- A user with an **access key**
- A role that grants **AWS console access**

Save the access key in a secure location so that you can enter it when you [register the cloud account]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings" >}}) with your Redis Cloud subscription.

{{< warning >}}
We use the provided credentials to configure your AWS environment and provision required resources.

You **must not** change the configurations of provisioned resources or stop or terminate provisioned instances. If you do, your databases will be inaccessible and Redis will not be able to ensure database stability. See [Avoid service disruption]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings#avoid-service-disruption" >}}) for more details.
{{< /warning >}}

For help creating an AWS user, see the [AWS IAM documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html).

You can use one of the following tools to create IAM resources:

- [CloudFormation]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/iam-resources/cloudformation" >}})
- [Terraform]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/iam-resources/terraform" >}})
- The [AWS Console]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/iam-resources/aws-console" >}})
