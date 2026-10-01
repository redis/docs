---
LinkTitle: Create roles
Title: Assign permissions to roles
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
headerRange: '[1-3]'
toc: 'true'
weight: 20
---

To assign [Redis ACLs](/content/operate/rc/security/access-control/data-access-control/configure-acls.md) to a data access role:

1. Go to **Data Access Control** from the [Redis Cloud console](https://cloud.redis.io/#/) menu.

    ![Menu for database access control.](/images/rc/data-access-control-menu.png)
    {width="200px"}

1. Select the **Roles** tab.

    ![Role configuration area.](/images/rc/data-access-control-roles.png)

1. Select `+` to create a new role or point to an existing role and select the pencil icon to edit it.

    ![Add or edit a role.](/images/rc/data-access-control-roles-add-or-edit.png)
    {width="300px"}

1. Enter a name for the role.

    ![Role add screen.](/images/rc/data-access-control-roles-add.png)
    {width="400px"}

1. Select an **ACL rule** to assign to the role.

    ![Select an ACL Rule.](/images/rc/data-access-control-roles-select-acl.png)
    {width="300px"}

1. Select one or more databases from the **Databases** list and click the check mark to confirm the association.

    ![Select databases.](/images/rc/data-access-control-roles-select-databases.png)
    {width="400px"}

1. Select **Save role**.

When you assign a user-defined ACL rule to a role and associate it with one or more databases, we'll verify that the ACL rule will work with the selected databases. The database may go into an Inactive state for a few seconds while we verify the ACL rule.

After you create a role, you can assign it to a user. Users with this role can access the databases according to the role's associated Redis ACLs. For more information, see [Assign roles to users](/content/operate/rc/security/access-control/data-access-control/create-assign-users.md#assign-roles-to-existing-users).

To assign Redis ACLs to a role for an [Active-Active database](/content/operate/rc/databases/active-active/_index.md), see [Active-Active access roles](/content/operate/rc/security/access-control/data-access-control/active-active-roles.md).

> [!NOTE]
> {{< embed-md "rc-acls-note.md" >}}