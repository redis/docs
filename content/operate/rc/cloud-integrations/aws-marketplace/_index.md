---
LinkTitle: AWS Marketplace
Title: Sign up for Redis Cloud with AWS Marketplace
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to subscribe to Redis Cloud using AWS Marketplace
hideListLinks: true
weight: 20
---

You can use AWS Marketplace to subscribe to Redis Cloud through AWS Marketplace.  This lets you provision according to your needs and pay using your AWS account.

## Subscribe to Redis Cloud with AWS Marketplace

Here's how to subscribe to Redis Cloud with AWS Marketplace:

1.  Sign in to the [AWS console](https://console.aws.amazon.com/).

1.  Search AWS Marketplace for [Redis Cloud (Pay-As-You-Go with 14-day FREE TRIAL)](https://aws.amazon.com/marketplace/pp/prodview-mwscixe4ujhkq) and subscribe to the listing.

    {{<image filename="images/rc/aws-marketplace-rc-flexible-plan.png" alt="The Redis Cloud listing on AWS Marketplace" >}}

    Or, click on the URL provided by your Redis seller for a private offer for [Redis Cloud - Annual Commits](https://aws.amazon.com/marketplace/pp/prodview-e6y7ork67pjwg?sr=0-3&ref_=beagle&applicationId=AWSMPContessa) and accept the private offer.

1.  Locate the **Set Up Your Account button**, and then select it to begin mapping your Redis Cloud account with your AWS Marketplace account.

    {{<image filename="images/rc/aws-marketplace-account-setup-button.png" alt="Use the Set Up Your Account button after subscribing to Redis Cloud with your AWS Marketplace account." width="50%">}}

1.  Sign in to the [Redis Cloud console](https://cloud.redis.io). If you do not yet have an account, you will need to create one. You must have the **Account Owner** role.

1.  Select the Redis account(s) to be mapped to your AWS Marketplace account and confirm that your Marketplace account will pay for your Redis Cloud resources going forward.

    {{<image filename="images/rc/aws-marketplace-map-account-dialog.png" alt="Use the AWS Marketplace dialog to map your Redis Cloud account to your AWS Marketplace account." width="80%">}}

1.  Use the **Connect account** button to confirm your choice.

    {{< note >}}
You must complete this step to bill your Redis Cloud resources to your AWS Marketplace account.
    {{< /note >}}

1.  Once your Redis account is mapped to your AWS Marketplace account, a message appears in the upper, left corner of the account panel.

    {{<image filename="images/rc/aws-marketplace-billing-badge.png" alt="The AWS Marketplace badge appears when your Redis Cloud account is mapped to an AWS Marketplace account." width="150px">}}

    In addition, AWS Marketplace is reported as the selected payment method.

At this point, you can create a new database using the [standard workflow]({{< relref "/operate/rc/databases/create-database" >}}), with one important change. You don't need to enter a payment method, as it's automatically assigned to your AWS Marketplace account.

To confirm this, review the payment method associated with your subscription.

If your AWS Marketplace account is deactivated or otherwise unavailable, you won't be able to use your databases until the billing method is updated.  For help, [contact support](https://redis.io/support/).

## Add additional Redis accounts to AWS Marketplace

If you are the owner of more than one Redis Cloud account and have already associated your AWS marketplace account with one or more of your Redis accounts, you can add your AWS marketplace account to your other Redis Cloud accounts.

{{< embed-md "rc-marketplace-account-add.md" >}}

## Disconnect AWS Marketplace account

See [Disconnect AWS Marketplace account](https://support.redislabs.com/hc/en-us/articles/29215779949074-Disconnect-Redis-Cloud-from-AWS-Marketplace) on the Redis knowledge base for help disconnecting your AWS Marketplace account from your Redis Cloud account.
