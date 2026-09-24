---
Title: Manage default user
alwaysopen: false
categories:
- docs
- operate
- rs
description: Manage a database's default user.
linkTitle: Manage default user
toc: 'true'
weight: 60
---

When you [create a database](/content/operate/rs/databases/create.md), default user database access is enabled by default (**Unauthenticated access** is selected). This gives the default user full access to the database and enables compatibility with versions of Redis before Redis 6.

Select **Password-only authentication**, then enter and confirm a default database password to require authentication for connections to the database.

{{<image filename="images/rs/screenshots/databases/security-access-control-password-only.png" alt="Select Password-only authentication to require a password to access the database." >}}

## Authenticate as default user

When you configure a password for your database, all connections to the database must authenticate using the [AUTH](/content/commands/auth.md) command. See Redis security's [authentication](/content/operate/oss_and_stack/management/security/_index.md#authentication) section for more information.

```sh
AUTH <default-database-password>
```

## Change default database password

To change the default user's password:

1. From the database's **Security** tab, select **Edit**.

1. In the **Access Control** section, select **Password-only authentication** as the **Access method**.

1. Enter and re-enter the new password.

1. Select **Save**.

## Deactivate default user

If you set up [role-based access control](/content/operate/rs/security/access-control/_index.md) with [access control lists](/content/operate/rs/security/access-control/create-db-roles.md) (ACLs) for your database and don't require backwards compatibility with versions earlier than Redis 6, you can [deactivate the default user](/content/operate/rs/security/access-control/manage-users/default-user.md).

> [!WARNING]
> - Before you deactivate default user access, make sure the role associated with the database is [assigned to a user](/content/operate/rs/security/access-control/create-users.md). Otherwise, the database will be inaccessible.
>
> - If you enabled the default database password during the creation of an [Active-Active database](/content/operate/rs/databases/active-active/_index.md), you should not turn off the default database password because it could prevent the removal of participating database instances.

To deactivate the default user:

1. From the database's **Security** tab, select **Edit**.

1. In the **Access Control** section, select **Using ACL only** as the **Access method**.

    {{<image filename="images/rs/screenshots/databases/security-access-control-acl-only.png" alt="Select Using ACL only to deactivate default user access to the database." >}}

1. Choose at least one role and Redis ACL to access the database.

1. Select **Save**.
