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

The available tabs depend on your subscription type and may include:

- The **Account** tab displays basic information associated with your account, including general info, address details, time zone setting, security settings, and provider integration details.

- The **Cloud Account** tab is displayed if you have self-hosted Pro subscriptions on Amazon Web Services (AWS).  To learn more, see [Manage AWS cloud accounts]({{< relref "/operate/rc/cloud-integrations/aws-cloud-accounts/" >}}).

- The **Integrations** tab lets you manage certain integrations. For more information on the Confluent Cloud integration, see [Use the Redis Sink Confluent Connector]({{< relref "/integrate/confluent-with-redis-cloud/" >}}).
    
## Account info settings

The **Account Info** section provides basic details about your account, including:

| Setting          | Description |
|------------------|-------------|
| _Account name_   | Organization associated with the Redis Cloud account | 
| _Account number_ | Internal ID of the owner's account |
| _Date created_   | Date the user's Redis Cloud account was created, which may differ from the organization account creation date |
| _Last updated_   | Date of the last administrative change to the owner's account, typically reflects access changes or other administrative updates | 

You cannot change the email address associated with a Redis Cloud account.  Instead, create a new account with the updated email address, assign it as an administrator to the organization account, and then use the new account to delete the account with the invalid email address.

## Account address settings

The **Account address** section shows the billing address associated with the current Redis Cloud account and the current time zone. 

In addition, this section may include fields unique to your location.  For example, certain regions require tax IDs or other regulatory details.

Select **Edit** to change the account's billing address. You must re-enter your payment method details to confirm your address change. 

   {{<image filename="images/rc/account-settings-edit-address-button.png" alt="Select the Edit button to change the account's billing address." width="400px">}}

   {{<image filename="images/rc/account-settings-change-billing-address.png" alt="The Edit account billing address screen." width="75%">}}

{{< note >}}
Changing the billing address for your account will remove any payment methods associated with the old billing address. See [Add payment method]({{< relref "/operate/rc/billing-and-payments#add-payment-method" >}}) to learn how to add a payment method back to your account.
{{< /note >}}

## Time zone settings

To update the time zone, select the desired time zone from the **Time zone** drop-down.

## Security settings

The **Security** section lets you:

- Manage [multi-factor authentication]({{< relref "/operate/rc/security/access-control/multi-factor-authentication" >}}) (MFA) for your Redis Cloud account.

- Download the [Redis Cloud certificate authority (CA) bundle]({{< relref "/operate/rc/security/database-security/tls-ssl#download-certificates" >}}) as a [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) file, which contains the certificates associated with your Redis Cloud account.

## Integration settings

The **Integration** section includes settings that help you manage the integration of your Redis Cloud account with your underlying cloud provider.  Specific settings vary according to the cloud provider.

If this section doesn't appear on the **Account Settings** screen, it generally means that there aren't any integration settings to manage.

## Save or discard changes

Few account settings can be changed; however, you can update a few details, such as **Time Zone** and **MFA enforcement**.  Available settings vary according to your subscription and the underlying cloud provider.  

Use the **Save changes** button to save changes or **Discard changes** to revert them.

{{<image filename="images/rc/account-settings-buttons-save-discard.png" alt="Use the Discard Changes and the Save Changes buttons to manage changes to account settings." width="300px">}}

For help changing other settings, [contact Support](https://redis.io/support/).

