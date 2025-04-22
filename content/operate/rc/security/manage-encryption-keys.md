---
Title: Self-managed persistent storage encryption
LinkTitle: Self-managed encryption
alwaysopen: false
categories:
- docs
- operate
- rc
description: Learn how to use your own keys for persistent storage encryption on Redis Cloud.
weight: $weight
---

Redis Cloud databases write their data to disk whenever [persistence]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}}) is enabled. 

All data on Redis Cloud is [encrypted at rest]({{< relref "/operate/rc/security/encryption-at-rest" >}}). By default, disk storage is encrypted by keys managed by the cloud provider.

Redis Cloud Pro users can choose to use self-managed encryption keys for persistent storage for all databases in a subscription. 

## Benefits of self-managed encryption

## Prerequisites

Before you set up self-managed encryption, you must have a self-managed encryption key. 

The encryption key must be hosted by the same cloud provider as your database and must be available in your database's cloud provider region.

Refer to the provider's documentation to create a key:
- [Amazon Web Services - Create a KMS key](https://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html)
- [Google Cloud - Create a key](https://cloud.google.com/kms/docs/create-key)

## Set up self-managed encryption

To set up self-managed encryption:

1. [Activate self-managed encryption](#activate-self-managed-encryption) for a new or existing subscription.
2. [Grant Redis permission to access your encryption key](#grant-key-permissions).

### Activate self-managed encryption

You can activate self-managed encryption on a [new](#new-subscription) or [existing](#existing-subscription) Redis Cloud Pro subscription.

#### New subscription

To activate self-managed encryption when you [create a new Pro subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}):

1. Follow the instructions to [create a Pro database with custom settings]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#custom-settings" >}}). 
1. On the **Setup** tab, go to **Advanced options > Security** to select persistent storage encryption options. 
1. Select **Customer managed key** to activate self-managed encryption. 
1. Select **Continue** to go to the [Sizing tab]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#sizing-tab" >}}). Follow the instructions to provision your database(s).

After you set up your subscription and database(s), your subscription will be **Pending** until you [grant Redis access to your encryption key](#grant-key-permissions). You won't be charged for your subscription while it's pending. 

If you don't grant key permissions after 7 days, we'll remove your initial setup.

#### Existing subscription

To activate self-managed encryption on an existing Redis Cloud Pro subscription:

1. From the [Redis Cloud console](https://cloud.redis.io/), select the **Subscriptions** menu and then select your subscription from the list. 

1. Open the **Security** tab to view security settings.

1. In the **Persistent storage encryption** section, select **Edit**.

1. Select **Customer managed key**.

1. Select **Save changes** to save your changes.

### Grant key permissions

After you activate self-managed encryption, you must grant Redis access to your encryption key so we can use it for storage encryption. 

#### Amazon Web Services



#### Google Cloud



## Revoke key access

When you have set up self-managed encryption, you can revoke Redis's access to your encryption key at any time through AWS or Google Cloud.

Redis will delete your plan after the selected grace period if we can't access your key. During the grace period, you must provide a new key to prevent data loss.



