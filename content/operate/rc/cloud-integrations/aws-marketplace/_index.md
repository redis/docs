---
LinkTitle: AWS Marketplace
Title: Flexible subscriptions with AWS Marketplace
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to subscribe to Redis Cloud using AWS Marketplace
weight: $weight
---

You can use AWS Marketplace to subscribe to Redis Cloud through AWS Marketplace.  This lets you provision according to your needs and pay using your AWS account.

Here's how to create a new Flexible subscription as part of your AWS Marketplace commitment.

1.  Sign in to the [AWS console](https://console.aws.amazon.com/).

1.  Search AWS Marketplace for [Redis Cloud Flexible - Pay-As-You-Go with 14-day FREE TRIAL](https://aws.amazon.com/marketplace/pp/prodview-mwscixe4ujhkq).

    {{<image filename="images/rc/aws-marketplace-rc-flexible-plan.png" alt="The Redis Cloud - Flexible plan listing on AWS Marketplace" >}}{{< /image >}}

1.  Subscribe to the listing, locate the **Set Up Your Account button**, and then select it to begin mapping your Redis Cloud account with your AWS Marketplace account.

    {{<image filename="images/rc/aws-marketplace-account-setup-button.png" alt="Use the Set Up Your Account button after subscribing to Redis Cloud with your AWS Marketplace account." width="50%">}}{{< /image >}}

1.  Sign in to the Redis Cloud [admin console](https://app.redislabs.com). If you do not yet have an account, you will need to create one.

1.  Select the Redis account to be mapped to your AWS Marketplace account and confirm that your payment method will change and that the connection cannot be undone.

    {{<image filename="images/rc/aws-marketplace-map-account-dialog.png" alt="Use the AWS Marketplace dialog to map your Redis Cloud account to your AWS Marketplace account." width="80%">}}{{< /image >}}

1.  Use the **Connect account** button to confirm your choice.

1.  Once your Redis account is mapped to your AWS Marketplace account, a message appears in the upper, left corner of the account panel.

    {{<image filename="images/rc/aws-marketplace-billing-badge.png" alt="The AWS Marketplace badge appears when your Redis Cloud account is mapped to an AWS Marketplace account." width="150px">}}{{< /image >}}

    In addition, AWS Marketplace is reported as the selected payment method.

At this point, you can create a new Flexible subscription using the [standard workflow]({{< relref "/operate/rc/subscriptions/create-flexible-subscription" >}}), with one important change. You don't need to enter a payment method, as it's automatically assigned to your AWS Marketplace account.

To confirm this, review the payment method associated with your subscription.

{{<image filename="images/rc/aws-marketplace-billing-confirm.png" alt="The AWS Marketplace billing confirmation." width="80%">}}{{< /image >}}

If, for whatever reason, your AWS Marketplace account is disabled or otherwise unavailable, you won't be able to use your Flexible subscription until the billing method is updated.  For help, [contact support](https://redis.com/company/support/).
