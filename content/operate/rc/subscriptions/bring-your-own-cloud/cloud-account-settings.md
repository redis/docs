---
Title: Create and edit Cloud accounts
LinkTitle: Create and edit Cloud accounts
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
weight: 2
aliases:
  - /operate/rc/how-to/view-edit-cloud-account/cloud-account-settings
  - /operate/rc/cloud-accounts/cloud-account-settings
  - /operate/rc/cloud-integrations/aws-cloud-accounts/cloud-account-settings
---

Redis Cloud Bring your own Cloud (BYOC) lets you use your own cloud infrastructure to deploy Redis Cloud.

You can associate your existing AWS account as a _cloud account_ for your subscription.  This requires setting up and entering credentials that enable monitoring, maintenance, and technical support of your subscription.

To do this, you need:

1. A programmatic user with an access key and a secret access key for that user.
1. A console role that allows administrative access to the cloud account.

You need to create these resources before adding the cloud account to your subscription.  To learn more, see [Create IAM resources]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/iam-resources" >}}).

{{<warning>}}
After an AWS account has been configured as a cloud account, you **must not** change the configurations of provisioned resources or stop or terminate provisioned instances. If you do, your databases will be inaccessible and Redis will not be able to ensure database stability. See [Avoid service disruption]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings#avoid-service-disruption" >}}) for more details.
{{</warning>}}

## View cloud account settings

To create or edit a cloud account in Redis Cloud:

1. Sign in to the [Redis Cloud console](https://cloud.redis.io/) and then select the target subscription.

1. From the console menu, select **Account Settings** and then select the **Cloud Account** tab.

    This displays a list of cloud accounts associated with your Redis Cloud subscription.

    {{<image filename="images/rc/account-settings-cloud-account-tab.png" alt="Use the Cloud Account tab of the Account Settings screen to define cloud accounts for your Redis Cloud subscription." width="80%">}}

The **Cloud account** tab lets you manage cloud accounts associated with your Redis Cloud subscription.

The **Cloud Account** tab is only available for accounts with Redis Cloud Bring your own Cloud (BYOC) subscriptions.

## Add a new cloud account

To add a new cloud account to your Redis Cloud subscription, select the **Add** button from the Cloud Account tab of the Account Settings screen.

{{<image filename="images/rc/icon-add.png" width="30px" alt="Use the Add button to add new cloud accounts to your Redis Cloud subscription." width="36px">}}

This displays the **Add cloud account** dialog.

{{<image filename="images/rc/account-settings-prompt-add-cloud-account.png" alt="Use the Add cloud account prompt to enter the details of the cloud account." width="75%">}}

Each of the following fields are required.

|Setting|Description|
|-------|-----------|
| _Account name_ | A descriptive name for your cloud account settings |
| _AWS&nbsp;access&nbsp;key_ | The AWS access key for the programmatic user created to support your cloud account settings |
| _AWS&nbsp;secret&nbsp;key_ | The AWS secret key for the programmatic user created to support your cloud account settings |
| _IAM role name_ | The name of the AWS console role with access to the AWS console |

Use the **Add account** button to save your cloud account details.

{{<image filename="images/rc/button-cloud-account-add.png" alt="Use the Add account button to save the details of your new cloud account." width="140px">}}

Be sure to create the resources before adding the cloud account to your subscription, as they're used to verify access to the cloud account.  The details can be saved only after access is verified.

When problems occur, an information icon appears and the field is highlighted in red.  When this happens, the icon includes a tooltip that explains the issue.

If the **Add account** button is inactive, verify that:

- You've specified all field values correctly
- The resources exist in your AWS account
- Each resource provides the required level of access

For help, see [Create IAM resources]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/iam-resources" >}}).

## Edit cloud account details

To update the details of a cloud account associated with your Redis Cloud subscription, select the cloud account from the **Cloud account** tab and then select the **Edit** button.

{{<image filename="images/rc/icon-edit.png" alt="Use the Edit button to update cloud account details." width="36px">}}

This displays the **Edit cloud account** dialog:

{{<image filename="images/rc/account-settings-prompt-edit-cloud-account.png" alt="Use the Edit cloud account prompt to update the details of the cloud account." width="75%">}}

|Setting|Description|
|-------|-----------|
| _Account name_ | A descriptive name for your cloud account settings |
| _AWS access key_ | The AWS access key for the programmatic user created to support your cloud account settings |
| _AWS secret key_ | The AWS secret key for the programmatic user created to support your cloud account settings |
| _IAM role name_ | The name of the AWS console role with access to the AWS console |

Use the **Update account** button to save your changes.

{{<image filename="images/rc/button-cloud-account-update.png" alt="Use the Update account button to save the updated cloud account details." width="140px">}}

## Delete cloud account

To remove a cloud account from your Redis cloud subscription, select the cloud account from the **Cloud account** tab and then select the **Delete** button.

{{<image filename="images/rc/icon-delete-teal.png" alt="Use the Delete button to remove cloud account details." width="36px">}}

## Dedicated IAM resources

We strongly recommend using dedicated identity and access management (IAM) resources to manage your AWS cloud accounts.  These resources should not be shared with any other task, account, or process.

To learn more, see [Create IAM resources for AWS cloud accounts]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/iam-resources" >}}).