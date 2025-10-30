---
Title: Self-managed persistent storage encryption
LinkTitle: Self-managed encryption keys
alwaysopen: false
categories:
- docs
- operate
- rc
description: Learn how to use your own keys for persistent storage encryption on Redis Cloud.
weight: $weight
bannerText: Self-managed encryption keys are available in Private Preview.
---

Redis Cloud databases write their data to disk whenever [persistence]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}}) is enabled. 

All data on Redis Cloud is [encrypted at rest]({{< relref "/operate/rc/security/encryption-at-rest" >}}). By default, disk storage is encrypted by keys managed by the cloud provider.

Redis Cloud Pro users can choose to use self-managed encryption keys for persistent storage for all databases in a subscription. 

## Self-managed encryption use cases and benefits

Self-managed persistent storage encryption allows you to:
- **Shield sensitive data**: With Self-managed persistent storage encryption, you can stop sensitive data exposure by revoking key access at any time.
- **Meet security and compliance requirements**: With self-managed persistent storage encryption, you may be able to easier meet compliance standards for data security and privacy protection.

Consider using self-managed persistent storage encryption if you have specific organizational needs or requirements for data security.

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

<!-- You can activate self-managed encryption on a [new](#new-subscription) or [existing](#existing-subscription) Redis Cloud Pro subscription.

#### New subscription-->

To activate self-managed encryption when you [create a new Pro subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}):

1. Follow the instructions to [create a Pro database with custom settings]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#custom-settings" >}}). 
1. On the **Setup** tab, go to **Advanced options > Security** to select persistent storage encryption options. 
1. Select **Customer managed key** to activate self-managed encryption. 
1. Select **Continue** to go to the [Sizing tab]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#sizing-tab" >}}). Follow the instructions to provision your database(s).

After you set up your subscription and database(s), your subscription will be **Pending** until you [grant Redis access to your encryption key](#grant-key-permissions). You won't be charged for your subscription while it's pending. 

If you don't grant key permissions after 7 days, we'll remove your initial setup.

<!-- #### Existing subscription

To activate self-managed encryption on an existing Redis Cloud Pro subscription:

1. From the [Redis Cloud console](https://cloud.redis.io/), select the **Subscriptions** menu and then select your subscription from the list. 

1. Open the **Security** tab to view security settings.

1. In the **Persistent storage encryption** section, select **Edit**.

1. Select **Customer managed key**.

1. Select **Save changes** to save your changes. -->

### Grant key permissions

After you activate self-managed encryption, you must grant Redis access to your encryption key on your cloud provider so we can use it for storage encryption. 

Follow the steps for your cloud provider:
- [Amazon Web Services](#amazon-web-services)
- [Google Cloud](#google-cloud)

#### Amazon Web Services 

To grant Redis access to a key on AWS:

1. From your subscription page on the Redis Cloud console, copy the provided objects to add to the key policy.

    {{<image filename="images/rc/cmek-access-roles-aws.png" alt="The Grant Redis your customer-managed key section shows the IAM role that needs access to your key and objects to add to your key policy." width=80% >}}

2. Go to the [Key management service](https://console.aws.amazon.com/kms) on the AWS console and locate your key.

3. [Modify the key policy](https://docs.aws.amazon.com/kms/latest/developerguide/key-policy-modifying.html) using the policy view. Add the provided objects in the **Statement** section and then save your changes.

4. Return to the Redis Cloud console. In your subscription page, enter your key's ARN in the **Key resource name** field.

    {{<image filename="images/rc/cmek-provide-resource-name-aws.png" alt="The Provide the name of your customer-managed key section lets you provide your key to Redis." width=80% >}}

    At this point, Redis Cloud will check to see if it can access your key. If it can't access your key, make sure that you've added the correct permissions to your key, that the key is available in the database's cloud provider region, and that you have correctly entered your key's resource name.

{{< embed-md "rc-cmek-final-steps.md" >}}

#### Google Cloud

To grant Redis access to a key on Google Cloud:

1. From your subscription page on the Redis Cloud console, copy the provided Redis service account name.

    {{<image filename="images/rc/cmek-access-roles-google.png" alt="The Grant Redis your customer-managed key section shows the service account needed to add as a principal." width=80% >}}

2. Go to [Key management](https://console.cloud.google.com/security/kms) on the Google Cloud console and locate your key.

3. Add the provided service account as a principal for your key, with one of the following Role options:

    - Add the pre-defined IAM roles [Cloud KMS CryptoKey Encrypter/Decrypter](https://cloud.google.com/kms/docs/reference/permissions-and-roles#cloudkms.cryptoKeyEncrypterDecrypter) and [Cloud KMS Viewer](https://cloud.google.com/kms/docs/reference/permissions-and-roles#cloudkms.viewer), OR
    - [Create a custom IAM role](https://cloud.google.com/iam/docs/creating-custom-roles#creating) with the following minimal permissions needed to use the key, and then assign that custom role to the principal:
        - cloudkms.cryptoKeyVersions.useToDecrypt
        - cloudkms.cryptoKeyVersions.useToEncrypt
        - cloudkms.cryptoKeys.get

4. Return to the Redis Cloud console. In your subscription page, enter your key's resource name in the **Key resource name** field.

    {{<image filename="images/rc/cmek-provide-resource-name-google.png" alt="The Provide the name of your customer-managed key section lets you provide your key to Redis." width=80% >}}

At this point, Redis Cloud will check to see if it can access your key. If it can't access your key, make sure that you've added the correct permissions to your key, that the key is available in the database's cloud provider region, and that you have correctly entered your key's resource name.

{{< embed-md "rc-cmek-final-steps.md" >}}

## Revoke key access

When you have set up self-managed encryption, you can revoke Redis's access to your encryption key at any time through your cloud provider. 

If you selected **Immediate** as the deletion grace period, Redis will immediately delete your database if we lose access to your key. If you selected **Alert only (No deletion, limited SLA)**, Redis will notify you but will not delete your database.

{{<warning>}}
If you selected **Alert only (No deletion, limited SLA)**, Redis will not be able to make changes to your database if we lose access to your key. This includes database upgrades, failovers to persistent storage, and other operations that require access to your key. Because of this, Redis will not be able to meet its [Service Level Agreement (SLA)](https://redis.io/legal/redis-cloud-service-level-agreement/) if we lose access to your key.

Provide a new key as soon as possible to avoid service disruption.
{{</warning>}}



