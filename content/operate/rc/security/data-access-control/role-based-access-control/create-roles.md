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
weight: 2
aliases:
    - /operate/rc/security/access-control/data-access-control/create-roles/
    - /operate/rc/security/access-control/database-access-control/create-roles/
    - /operate/rc/security/database-access-control/create-roles/
---

To assign [Redis ACLs]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/configure-acls" >}}) to a data access role:

1. Go to **Data Access Control** from the [Redis Cloud console](https://cloud.redis.io/#/) menu.

    {{<image filename="images/rc/data-access-control-menu.png" width="200px" alt="Menu for database access control." >}}

1. Select the **Roles** tab.

    {{<image filename="images/rc/data-access-control-roles.png" alt="Role configuration area." >}}

1. Select `+` to create a new role or point to an existing role and select the pencil icon to edit it.

    {{<image filename="images/rc/data-access-control-roles-add-or-edit.png" width="300px" alt="Add or edit a role." >}}

1. Enter a name for the role.

    {{<image filename="images/rc/data-access-control-roles-add.png" width="400px" alt="Role add screen." >}}

1. Select an **ACL rule** to assign to the role.

    {{<image filename="images/rc/data-access-control-roles-select-acl.png" width="300px" alt="Select an ACL Rule." >}}

1. Select one or more databases from the **Databases** list and click the check mark to confirm the association.

    {{<image filename="images/rc/data-access-control-roles-select-databases.png" width="400px" alt="Select databases." >}}

1. Select **Save role**.

When you assign a user-defined ACL rule to a role and associate it with one or more databases, we'll verify that the ACL rule will work with the selected databases. 

After you create a role, you can assign it to a user. Users with this role can access the databases according to the role's associated Redis ACLs. For more information, see [Assign roles to users]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/create-assign-users#assign-roles-to-existing-users" >}}).

To assign Redis ACLs to a role for an [Active-Active database]({{< relref "/operate/rc/databases/active-active" >}}), see [Active-Active access roles]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/active-active-roles" >}}).

{{< note >}}
{{< embed-md "rc-acls-note.md" >}}
{{< /note >}}