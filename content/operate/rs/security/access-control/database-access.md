---
Title: Control database access using RBAC
alwaysopen: false
categories:
- docs
- operate
- rs
description: Use role-based access control (RBAC) to configure the user's level of
  access to a database.
linkTitle: Database access
weight: 10
---

## Default user

When you create a database, [default user access]({{< relref "/operate/rs/security/access-control/manage-users/default-user" >}}) is enabled automatically.

If you set up [role-based access controls]({{< relref "/operate/rs/security/access-control/rbac" >}}) for your database and don't require compatibility with versions earlier than Redis 6, you can [deactivate the default user]({{< relref "/operate/rs/security/access-control/manage-users/default-user" >}}).

{{<warning>}}
Before you [deactivate default user access]({{< relref "/operate/rs/security/access-control/manage-users/default-user#deactivate-default-user" >}}), make sure the role associated with the database is [assigned to a user]({{< relref "/operate/rs/security/access-control/rbac/assign-user-role" >}}). Otherwise, the database will be inaccessible.
{{</warning>}}

## Role-based access control

To control a user's level of access to a database, use [role-based access control]({{< relref "/operate/rs/security/access-control/rbac" >}}) (RBAC).

1. [Configure Redis ACLs]({{< relref "/operate/rs/security/access-control/rbac/configure-acl" >}}).

1. [Create or edit a role]({{< relref "/operate/rs/security/access-control/rbac/create-roles" >}}) and associate it with specific Redis ACLs and databases.

1. [Assign the role to a user]({{< relref "/operate/rs/security/access-control/rbac/assign-user-role" >}}) to grant access to the database with the permissions defined by the role's associated ACLs.

## More info

- [Add users]({{< relref "/operate/rs/security/access-control/manage-users/add-users" >}})

- [Role-based access control (RBAC) overview]({{< relref "/operate/rs/security/access-control/rbac" >}})