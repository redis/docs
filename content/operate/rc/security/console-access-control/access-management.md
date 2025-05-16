---
Title: Access management
alwaysopen: false
categories:
- docs
- operate
- rc
description: Control who can make changes to your databases using the Redis Cloud
  console.
weight: 1
aliases:
    - /operate/rc/security/access-control/access-management/
---

The **Access management** screen helps you manage:

- The team of users allowed to access your subscription and its databases.
- The API keys that authenticate application access to your account.
- [Single sign-on (SSO) with SAML]({{< relref "/operate/rc/security/console-access-control/saml-sso" >}}).

Here, you learn how to manage your team's users and control their level of access. 

For help managing API keys, see [Manage API keys]({{< relref "/operate/rc/api/get-started/manage-api-keys" >}}).

## Manage team access

The **Team** tab lets you manage the people allowed to access your account. Each authorized person is assigned to a role that specifies their privileges.

{{<image filename="images/rc/access-management-team-tab.png" alt="The Access management tab helps you manage the people allowed to access your subscription." >}}

The list contains one entry summarizing the team settings for each user in your team. By default, the list includes the account owner.

The list includes several buttons and icons to help you manage the list:

| Icon | Description |
|------|-------------|
| {{<image filename="images/rc/icon-add.png#no-click" width="30px" alt="Use the Add button to add members to your team." class="inline" >}} | The **Add** button lets you add members to your team |
| {{<image filename="images/rc/icon-edit.png#no-click" width="30px" alt="Use the Edit button change details for a team member." class="inline">}} | The **Edit** button lets you edit the settings for the selected team member |
| {{<image filename="images/rc/icon-delete-teal.png#no-click" width="30px" alt="Use the Delete button to remove a member from your team." class="inline">}} | The **Delete** button lets you remove members from your team
| <nobr>{{<image filename="images/rc/icon-list-sort-asc.png#no-click" width="10px" alt="The Sort ascending button displays members in ascending order according to the values of the selected field." class="inline">}}{{<image filename="images/rc/icon-list-sort-desc.png#no-click" width="10px" alt="The Sort descending button displays members in descending order according to the values of the selected field." class="inline">}}</nobr> | The **Sort ascending** and **Sort descending** icons display the list according to the selected order |

You can also use the list search to find a specific user or filter by **Role**, **User Type**, or **Options**.

### Add user

When you add a member to your team, the **Add user** dialog appears.  

{{<image filename="images/rc/access-mgmt-add-user-dialog.png" width="50%" alt="Use the Add User dialog to specify the details for your new user." >}}

Use the dialog to specify these values.

| Setting | Description |
|---------|-------------|
| **First name** | First name of the user displayed in the Redis Cloud console and in email messages |
| **Last name** | Last name of the user displayed in the Redis Cloud console and in email messages |
| **Role** | The role identifies their subscription and account privileges.  For details, see [Team management roles](#team-management-roles). |
| **Email** | The address used for alerts and other email messages regarding the account | 
| **Alert emails** | Enable to be notified when subscription databases cross certain thresholds, such as exceeding memory limits or latency requirements |
| **Operational emails** | Notifications about subscription and database changes, such as creating or deleting a database, and [subscription and database maintenance]({{< relref "/operate/rc/subscriptions/maintenance" >}}) |
| **Billing emails** | Notifications about billing, such as when bills are issued and paid |
| **Multi-factor authentication** | Whether MFA is enabled for the member.  This is deactivated when members have not enabled or confirmed MFA in their user profile settings. |

Use the **Add user** button to save your new team member details. 

Redis will send an activation email to the user once their details are saved. After following the activation link, they can sign in.

### Edit user

To edit user team details, select the user from the list and then select the **Edit** button.
The **Edit user** dialog displays the details you can change.  

{{<image filename="images/rc/access-mgmt-edit-user-dialog.png" width="50%" alt="Use the Edit User dialog to change the details for a user" >}}

You can change any detail except the team member's email address.

Select **Save user** to save your changes.

### Delete user

To remove a member from your team, select them from the list and then select the **Delete** button. A confirmation dialog appears.  

{{<image filename="images/rc/access-management-delete-user-dialog.png" width="50%" alt="Confirm that you want to remove a user from your team" >}}

Select **Delete user** to confirm removal. This is a permanent action that cannot be undone.

## Team management roles

Each team member is assigned a role that identifies their privileges and limits their activities in the Redis Cloud console.

Roles and responsibilities are:

- **Owner** can view, create, and edit any settings in the account.

    Each subscription must have at least one account owner. Accounts can have multiple owners.

    Owners can also manage subscriptions, databases, and API keys.

- **Billing Admin** can view and edit settings related to billing and payments.

    Billing Admins can add and remove payment methods and change the payment method for a subscription, but they cannot change any other subscription or database settings.

- **Manager** can view, create, and edit any setting in the subscription. 

    Managers can change subscription costs and change payment methods associated with a subscription, but they cannot add or remove available payment methods.

- **Member** can view, create, and edit databases in ways that do not impact costs.

    Members cannot create databases or edit databases in ways that impact costs.

- **Viewer** can view all databases and their configurations, including database secrets.

- **Logs viewer** can not access the Redis Cloud console. They are only allowed access to the [Redis Cloud API]({{< relref "/operate/rc/api" >}}) [`GET logs/`]({{< relref "/operate/rc/api/api-reference#tag/Account/operation/getAccountSystemLogs" >}}) endpoint. 

This table shows each role's ability to perform common tasks.

| **Task** | **Owner** | **Billing Admin** | **Manager** | **Member** | **Viewer** | **Logs Viewer** |
|---|---|---|---|---|---|---|
| Access management | <span title="Owners can manage account access">&#x2705; Yes</span> | <span title="Billing Admins may not manage account access">&#x274c; No</span> | <span title="Managers may not manage account access">&#x274c; No</span> | <span title="Members may not manage account access">&#x274c; No</span> | <span title="Viewers may not manage account access">&#x274c; No</span> | <span title="Logs Viewers may not manage account access">&#x274c; No</span> |
| Account settings | <span title="Owners can change account settings">&#x2705; Yes</span> | <span title="Billing Admins can change the billing address in account settings">&#x2705; Yes<sup>[1](#table-note-1)</sup></span> | <span title="Managers may not manage account settings">&#x274c; No</span> | <span title="Members may not manage account settings">&#x274c; No</span> | <span title="Viewers may not manage account settings">&#x274c; No</span> | <span title="Logs Viewers may not manage account settings">&#x274c; No</span> |
| Billing & payments | <span title="Owners can add/remove payment methods and view history">&#x2705; Yes</span> | <span title="Billing Admins can add/remove payment methods and view history">&#x2705; Yes</span> | <span title="Managers may not add/remove payment methods or view billing history (Managers may change subscription payment methods between those available to the account)">&#x274c; No</span> | <span title="Members may not add/remove payment methods or view billing history">&#x274c; No</span> | <span title="Viewers may not add/remove payment methods or view billing history">&#x274c; No</span> | <span title="Logs viewers may not add/remove payment methods or view billing history">&#x274c; No</span> |
| Create subscription | <span title="Owners can create new subscriptions">&#x2705; Yes</span> | <span title="Billing Admins may not create subscriptions">&#x274c; No</span> | <span title="Managers can create new subscriptions">&#x2705; Yes</span> | <span title="Members may not create subscriptions">&#x274c; No</span> | <span title="Viewers may not create subscriptions">&#x274c; No</span> | <span title="Logs viewers may not create subscriptions">&#x274c; No</span> |
| Edit subscription | <span title="Owners can edit subscriptions">&#x2705; Yes</span> | <span title="Billing Admins can edit subscriptions to change the payment method">&#x2705; Yes<sup>[2](#table-note-2)</sup></span> | <span title="Managers can edit subscriptions">&#x2705; Yes</span> | <span title="Members may not edit subscriptions">&#x274c; No</span> | <span title="Viewers may not edit subscriptions">&#x274c; No</span> | <span title="Logs viewers may not edit subscriptions">&#x274c; No</span> |
| Create database (affects cost) | <span title="Owners can create databases when doing so will impact costs">&#x2705; Yes</span> | <span title="Billing Admins may not create databases when doing so will impact costs">&#x274c; No</span> | <span title="Managers can create databases when doing so will impact costs">&#x2705; Yes</span> | <span title="Members may not create databases when doing so will impact costs">&#x274c; No</span> | <span title="Viewers may not create databases when doing so will impact costs">&#x274c; No</span> | <span title="Logs viewers may not create databases when doing so will impact costs">&#x274c; No</span> |
| Edit database (affects cost) | <span title="Owners can edit databases in ways that will impact costs">&#x2705; Yes</span> | <span title="Billing Admins may not edit databases in ways that impact costs">&#x274c; No</span> | <span title="Managers can edit databases in ways that impact costs">&#x2705; Yes</span> | <span title="Members may not edit databases in ways that impact costs">&#x274c; No</span> | <span title="Viewers may not edit databases in ways that impact costs">&#x274c; No</span> | <span title="Logs viewers may not edit databases in ways that impact costs">&#x274c; No</span> |
| Create database (no cost impact) | <span title="Owners can create databases when doing so will not impact costs">&#x2705; Yes</span> | <span title="Billing Admins may not create databases when doing so will not impact costs">&#x274c; No</span> | <span title="Managers can create databases when doing so will not impact costs">&#x2705; Yes</span> | <span title="Members can not create databases when doing so will not impact costs">&#x274c; No</span> | <span title="Viewers may not create databases when doing so will not impact costs">&#x274c; No</span> | <span title="Logs viewers may not create databases when doing so will not impact costs">&#x274c; No</span> |
| Edit database (no cost impact) | <span title="Owners can edit databases in ways that do not impact costs">&#x2705; Yes</span> | <span title="Billing Admins may not change databases in ways that do not affect costs">&#x274c; No</span> | <span title="Managers can change databases in ways that do not affect costs">&#x2705; Yes</span> | <span title="Members can change databases in ways that do not affect costs">&#x2705; Yes</span> | <span title="Viewers may not change databases in ways that do not affect costs">&#x274c; No</span> | <span title="Logs viewers may not change databases in ways that do not affect costs">&#x274c; No</span> |
| View subscription | <span title="Owners can view subscription details">&#x2705; Yes</span> | <span title="Billing Admins can view subscription details">&#x2705; Yes</span> | <span title="Managers can view subscription details">&#x2705; Yes</span> | <span title="Members can view subscription details">&#x2705; Yes</span> | <span title="Viewers can view subscription details">&#x2705; Yes</span> | <span title="Logs viewers may not view subscriptions">&#x274c; No</span> |
| View database | <span title="Owners can view database details">&#x2705; Yes</span> | <span title="Billing Admins can view the list of databases but not database details">&#x2705; Yes<sup>[3](#table-note-3)</sup></span> | <span title="Managers can view database details">&#x2705; Yes</span> | <span title="Members can view database details">&#x2705; Yes</span> | <span title="Viewers can view database details">&#x2705; Yes</span> | <span title="Logs viewers may not view databases">&#x274c; No</span> |
| Use the [REST API]({{< relref "/operate/rc/api" >}}) | <span title="Owners can use the Redis Cloud API">&#x2705; Yes</span> | <span title="Billing Admins may not use the Redis Cloud API">&#x274c; No</span> | <span title="Managers may not use the REST API">&#x274c; No</span> | <span title="Members may not use the REST API">&#x274c; No</span> | <span title="Viewers can use the REST API for GET requests only">&#x2705; Yes<sup>[4](#table-note-4)</sup></span> | <span title="Logs viewers can use the REST API for GET /logs only">&#x2705; Yes<sup>[5](#table-note-5)</sup></span> |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>Billing Admins can only edit the account billing address in Account Settings.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>Billing Admins can only change the payment method when editing a subscription.

3. <a name="table-note-3" style="display: block; height: 80px; margin-top: -80px;"></a>Billing Admins can see the list of databases, but can not see database details, including connection details.

4. <a name="table-note-4" style="display: block; height: 80px; margin-top: -80px;"></a>Viewers can use the REST API for GET requests, but can not modify subscription or database details.

5. <a name="table-note-5" style="display: block; height: 80px; margin-top: -80px;"></a>Logs viewers can only use the [`GET logs/`]({{< relref "/operate/rc/api/api-reference#tag/Account/operation/getAccountSystemLogs" >}}) endpoint of the REST API.
