---
LinkTitle: Data access control
Title: Data access control
alwaysopen: false
categories:
- docs
- operate
- rc
description: Secure access to the data in your Redis Cloud databases.
headerRange: '[1-3]'
toc: 'true'
weight: 25
---

## [Default user]({{< relref "/operate/rc/security/access-control/data-access-control/default-user" >}})

When you create a Redis Cloud database, your database is given a randomly generated password called the **Default user password**. Learn how to [change the default user password]({{< relref "/operate/rc/security/access-control/data-access-control/default-user#change-password" >}}) or [turn off default user access]({{< relref "/operate/rc/security/access-control/data-access-control/default-user#turn-off-default-user" >}}).

## [Role-based access control]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control.md" >}})

With role-based access control (RBAC), you create roles and assign users to those roles to grant different levels of access to the database.

- [Enable RBAC]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control" >}})
- [Configure ACLs]({{< relref "/operate/rc/security/access-control/data-access-control/configure-acls" >}})
- [Create roles]({{< relref "/operate/rc/security/access-control/data-access-control/create-roles" >}})
- [Create and edit database users]({{< relref "/operate/rc/security/access-control/data-access-control/create-assign-users" >}})
- [Active-Active roles]({{< relref "/operate/rc/security/access-control/data-access-control/active-active-roles" >}})