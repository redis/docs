---
LinkTitle: Database access control (Default user, RBAC)
Title: Database access control
alwaysopen: false
categories:
- docs
- operate
- rc
description: Control who can access your databases using the default user database
  password and role-based access control.
headerRange: '[1-3]'
hideListLinks: true
toc: 'true'
weight: 3
aliases:
    - /operate/rc/security/access-control/data-access-control/
    - /operate/rc/security/access-control/database-access-control/
    - /operate/rc/security/database-access-control/
---

## Default user

When you create a Redis Cloud database, your database is given a randomly generated password called the [**Default user password**]({{< relref "/operate/rc/security/data-access-control/default-user" >}}). Learn how to [change the default user password]({{< relref "/operate/rc/security/data-access-control/default-user#change-password" >}}) or [turn off default user access]({{< relref "/operate/rc/security/data-access-control/default-user#turn-off-default-user" >}}).

## Role-based access control

With [role-based access control (RBAC)]({{< relref "/operate/rc/security/data-access-control/role-based-access-control.md" >}}), you create roles and assign users to those roles to grant different levels of access to the database.

- [Enable RBAC]({{< relref "/operate/rc/security/data-access-control/role-based-access-control" >}})
- [Configure ACLs]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/configure-acls" >}})
- [Create roles]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/create-roles" >}})
- [Create and edit database users]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/create-assign-users" >}})
- [Active-Active roles]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/active-active-roles" >}})