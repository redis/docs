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

By default, Redis Cloud subscriptions are hosted in cloud vendor accounts owned and managed by Redis.

To integrate Redis Cloud into an existing cloud vendor account, you can:

- Subscribe to Redis Cloud through [AWS Marketplace]({{< relref "/operate/rc/cloud-integrations/aws-marketplace/" >}}).

- Subscribe to Redis Cloud through [Google Cloud Marketplace]({{< relref "/operate/rc/cloud-integrations/gcp-marketplace/" >}}).

When you subscribe to Redis Cloud through a cloud vendor marketplace, billing is handled through the marketplace.

Redis also offers monthly and annual commitments through cloud vendor marketplaces. [Contact sales](https://redis.io/meeting/) if you're interested in a monthly or annual offer.

## Marketplace billing considerations

Cloud vendor marketplaces provide a convenient way to handle multiple subscription fees.  However, this also means that billing issues impact multiple subscriptions, including Redis Cloud.

When billing details change, you should verify that each service is operating normally and reflects the updated billing details.  Otherwise, you might experience unexpected consequences, such as data loss or subscription removal.

For best results, we recommend:

- [Backing up all data]({{< relref "/operate/rc/databases/back-up-data" >}}) _before_ updating billing details.

- Contacting [support](https://redis.io/support/) or your account team for assistance.