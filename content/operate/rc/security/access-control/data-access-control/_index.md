---
LinkTitle: Data access control
Title: Data access control
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
weight: 25
---

## Default user

When you create a Redis Cloud database, your database is given a randomly generated password called the [**Default user password**](/content/operate/rc/security/access-control/data-access-control/default-user.md). Learn how to [change the default user password](/content/operate/rc/security/access-control/data-access-control/default-user.md#change-password) or [turn off default user access](/content/operate/rc/security/access-control/data-access-control/default-user.md#turn-off-default-user).

## Role-based access control

With [role-based access control (RBAC)](/content/operate/rc/security/access-control/data-access-control/role-based-access-control.md), you create roles and assign users to those roles to grant different levels of access to the database.

- [Enable RBAC](/content/operate/rc/security/access-control/data-access-control/role-based-access-control.md)
- [Configure ACLs](/content/operate/rc/security/access-control/data-access-control/configure-acls.md)
- [Create roles](/content/operate/rc/security/access-control/data-access-control/create-roles.md)
- [Create and edit database users](/content/operate/rc/security/access-control/data-access-control/create-assign-users.md)
- [Active-Active roles](/content/operate/rc/security/access-control/data-access-control/active-active-roles.md)