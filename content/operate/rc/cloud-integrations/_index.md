---
LinkTitle: Marketplace integrations
Title: Manage marketplace integrations
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes how to integrate Redis Cloud subscriptions into existing cloud
  provider services, whether existing subscriptions or through vendor marketplaces.
hideListLinks: true
weight: 40
---

By default, Redis Cloud subscriptions are hosted in cloud vendor accounts owned and managed by Redis, Inc.

To integrate Redis Cloud into an existing cloud vendor account, you can:

- Subscribe to Redis Cloud through [AWS Marketplace]({{< relref "/operate/rc/cloud-integrations/aws-marketplace/" >}}).

- Subscribe to Redis Cloud through [Google Cloud Marketplace]({{< relref "/operate/rc/cloud-integrations/gcp-marketplace/" >}}).

When you subscribe to Redis Cloud through a cloud vendor marketplace, billing is handled through the marketplace.

## Marketplace billing considerations

Cloud vendor marketplaces provide a convenient way to handle multiple subscription fees.  However, this also means that billing issues impact multiple subscriptions, including Redis Cloud.

When billing details change, you should verify that each service is operating normally and reflects the updated billing details.  Otherwise, you might experience unexpected consequences, such as data loss or subscription removal.

For best results, we recommend:

- Backing up all data _before_ updating billing details.

- Verifying that all accounts operate normally after updating billing details, especially after updating payment methods.

- Making sure that billing alerts are sent to actively monitored accounts.

## Update marketplace billing details


### AWS Marketplace
To change billing details for an AWS marketplace subscription, we recommend creating a second subscription using the updated billing details and then migrating your existing data to the new subscription. 

### Google Cloud
You can migrate a Google Cloud project to a new billing account without creating a new subscription.  To do so:

1. Create a second project and associate with it your new billing account.
2. With your second project, purchase Redis Enterprise via the Google Cloud Marketplace.
3. Activate the service by signing in to Redis Enterprise console using your original SSO credentials.
4. Change the billing account for your original project to the new billing account.
5. (Optional) Remove your second project.