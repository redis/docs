---
LinkTitle: Account settings
Title: Manage account settings
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes the settings for a Redis Cloud account.
weight: $weight
---

To review or manage the settings associated with your Redis Cloud account, sign in to the [Redis Cloud console](https://cloud.redis.io/) and then select **Account Settings** from the menu.

This displays the **Account Settings** screen:

{{<image filename="images/rc/account-settings-account-tab.png" alt="Use the Account tab of the Account Settings screen to review and update settings associated with your Redis Cloud account." width="75%">}}

The available tabs depend on your account, and may include:

- The **Account** tab displays basic information associated with your account, including general info, address details, time zone setting, security settings, and provider integration details.

- The **Cloud Account** tab is displayed if you have self-hosted Pro subscriptions on Amazon Web Services (AWS).  To learn more, see [Manage AWS cloud accounts]({{< relref "/operate/rc/cloud-integrations/aws-cloud-accounts/" >}}).

- The **Integrations** tab lets you manage certain integrations.

You can change some settings by selecting **Edit**. For help changing other settings, [contact Support](https://redis.io/support/).

{{<image filename="images/rc/button-database-edit.png" alt="The Edit button changes account settings." width="100px">}}
    
## Redis account info settings

The **Redis Account Info** section provides basic details about your account, including:

| Setting          | Description |
|------------------|-------------|
| _Redis account name_   | Name associated with the Redis Cloud account | 
| _Redis account number_ | Internal ID of the Redis account |
| _Date created_   | Date the user's Redis Cloud account was created, which may differ from the organization account creation date |
| _Last updated_   | Date of the last administrative change to the owner's account, typically reflects access changes or other administrative updates | 

Select **Edit** to change the Redis Account name.

{{<image filename="images/rc/button-database-edit.png" alt="The Edit button changes account settings." width="100px">}}

After changing the account name, use the **Save changes** button to save changes or **Discard changes** to revert them.

{{<image filename="images/rc/account-settings-buttons-save-discard.png" alt="Use the Discard Changes and the Save Changes buttons to manage changes to account settings." width="300px">}} 

You cannot change the email address associated with a Redis Cloud account.  Instead, create a new account with the updated email address, assign it as an administrator to the organization account, and then use the new account to delete the account with the invalid email address.

## Contacts & Business information 

The **Contacts & Business information** section shows the company name and business address associated with the current Redis Cloud account. The company name and business address are used for invoicing and tax purposes.

In addition, this section may include fields unique to your location.  For example, certain regions require tax IDs or other regulatory details.

Select **Edit** to change the account's company name and business address.

   {{<image filename="images/rc/button-database-edit.png" alt="The Edit button changes account settings." width="100px">}}

   {{<image filename="images/rc/account-settings-change-business-info.png" alt="The Contacts & Business information section, with details changed." width="75%">}}

When you change your business address, you must approve the use of the information in this section for communication and billing purposes before you can save. After approving, select **Save changes** to save your changes or **Discard changes** to revert them. 

{{<image filename="images/rc/account-settings-buttons-save-discard.png" alt="Use the Discard Changes and the Save Changes buttons to manage changes to account settings." width="300px">}}

## Security settings

The **Security** section lets you:

- Manage [multi-factor authentication]({{< relref "/operate/rc/security/access-control/multi-factor-authentication" >}}) (MFA) for your Redis Cloud account.

- Download the [Redis Cloud certificate authority (CA) bundle]({{< relref "/operate/rc/security/database-security/tls-ssl#download-certificates" >}}) as a [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) file, which contains the certificates associated with your Redis Cloud account.

## Time zone settings

To change the time zone settings, select **Edit** and then select the desired time zone from the **Time zone** drop-down.

Select **Save changes** to save your changes or **Discard changes** to revert them. 

{{<image filename="images/rc/account-settings-buttons-save-discard.png" alt="Use the Discard Changes and the Save Changes buttons to manage changes to account settings." width="300px">}}

## Integration settings

The **Integrations** tab includes settings that help you manage integrations of your Redis Cloud account with other services.

For more details, see:
- [Use the Redis Sink Confluent Connector]({{< relref "/integrate/confluent-with-redis-cloud/" >}})
- [Prometheus and Grafana with Redis Cloud]({{< relref "/integrate/prometheus-with-redis-cloud/" >}})

