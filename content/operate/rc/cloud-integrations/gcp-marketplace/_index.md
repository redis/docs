---
LinkTitle: Google Cloud Marketplace
Title: Sign up for Redis Cloud with Google Cloud Marketplace
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to subscribe to Redis Cloud using Google Cloud marketplace
hideListLinks: true
weight: 30
---

You can use Google Cloud marketplace to subscribe to Redis Cloud. This lets you provision according to your needs and pay using your Google Cloud account.

## Subscribe to Redis Cloud using Google Cloud marketplace

Here's how to subscribe to Redis Cloud with Google Cloud marketplace:

1.  Sign in to the [Google Cloud console](https://console.cloud.google.com/).

1. Identify the Google Cloud Billing account that will subscribe to Redis Cloud. This account must have one of the following sets of Identity and Access Management (IAM) Roles:

    - [Billing Administrator](https://cloud.google.com/billing/docs/how-to/billing-access#overview-of-cloud-billing-roles-in-cloud-iam) (`roles/billing.admin`), OR
    - [Billing User](https://cloud.google.com/billing/docs/how-to/billing-access#overview-of-cloud-billing-roles-in-cloud-iam) (`roles/billing.user`) AND [Consumer Procurement Order Administrator](https://cloud.google.com/marketplace/docs/access-control#roles-permissions)

    If you don't have the correct roles, request access from your Google Cloud Billing Administrator or Organization Administrator. For more information about granting roles, see [Access control for Google Cloud Marketplace](https://cloud.google.com/marketplace/docs/access-control).

1.  Search Google Cloud Marketplace for [Redis® Cloud Cache and Vector Database](https://console.cloud.google.com/marketplace/product/redis-marketplace-isaas/redis-enterprise-cloud-flexible-plan).

    {{<image filename="images/rc/gcp-marketplace-rc-payg-plan.png" alt="The Redis Cloud - Pay as You Go plan listing on Google Cloud Marketplace" >}}

    Alternatively, in the navigation panel, select **View all products** and select **Redis Cloud** under **Databases**. You can pin Redis Cloud for easy access.

    Or, click on the URL provided by your Redis seller for a private offer for [Redis® Cloud Cache and Vector Database](https://console.cloud.google.com/marketplace/product/redis-marketplace-isaas/redis-enterprise-cloud-flexible-plan) and accept the private offer.

1.  Select the **Subscribe** button. This redirects you to the subscription details page.

1. Under **Purchase Details**, select the Google Cloud Billing account that will subscribe to Redis Cloud. Review the subscription details, accept the terms, and select **Subscribe**.

1. When you subscribe for the first time, select **Sign Up with Redis**. This will redirect you to the [Redis Cloud console](https://cloud.redis.io).

1. Create a Redis Cloud account or sign in to an existing account. You must have the **Account Owner** role.

1.  Select the Redis account to be mapped to your GCP Marketplace account and confirm that your Marketplace account will pay for your Redis Cloud resources going forward.

    {{<image filename="images/rc/gcp-marketplace-map-account-dialog.png" alt="Use the GCP Marketplace dialog to map your Redis Cloud account to your Google Cloud Marketplace account." width="75%">}}

1.  Select **Connect account** to confirm your choice.

    {{< note >}}
You must complete this step to bill your Redis Cloud resources to your Google Cloud Marketplace account.
    {{< /note >}}

1.  After you connect your Redis account to your Google Cloud Marketplace account, a message appears in the upper left corner of the account panel.

    {{<image filename="images/rc/gcp-marketplace-billing-badge.png" alt="The Google Cloud Marketplace badge appears when your Redis Cloud account is mapped to a Google Cloud Marketplace account.">}}

1. On the Google Cloud Marketplace listing, select **Manage on provider** to go to the [Redis Cloud console](https://cloud.redis.io).

    {{<image filename="images/rc/gcp-marketplace-manage-on-provider.png" alt="The Manage on Provider button" >}}

At this point, you can create a new database using the [standard workflow]({{< relref "/operate/rc/databases/create-database" >}}), with one important change. You don't need to enter a payment method, as it automatically uses your Google Cloud Marketplace account.

To confirm this, review the payment method associated with your subscription.

Additional users can be added on the Redis Cloud console using the [Access Management]({{< relref "/operate/rc/security/access-control/access-management" >}}) page.

If your Google Cloud Marketplace account is deactivated or otherwise unavailable, you can't use your subscription until you update the billing method.  For help, [contact support](https://redis.io/support/).

## Add additional Redis accounts to Google Cloud marketplace

If you are the owner of more than one Redis Cloud account and have already associated your Google Cloud marketplace account with one or more of your Redis accounts, you can add your Google Cloud marketplace account to your other Redis Cloud accounts.

{{< embed-md "rc-marketplace-account-add.md" >}}

## Disconnect Google Cloud marketplace account

See [Disconnect Google Cloud Marketplace account](https://support.redislabs.com/hc/en-us/articles/29209085344018-Disconnect-Redis-Cloud-from-Google-Cloud-Marketplace) on the Redis knowledge base for help disconnecting your Google Cloud Marketplace account from your Redis Cloud account.
