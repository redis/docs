---
LinkTitle: Role-based access control
Title: Enable Role-based access control
alwaysopen: false
categories:
- docs
- operate
- rc
description: Lets you define multiple users with fine-grained data authorization features.
headerRange: '[1-3]'
toc: 'true'
weight: 2
aliases:
    - /operate/rc/security/access-control/data-access-control/role-based-access-control/
    - /operate/rc/security/access-control/database-access-control/role-based-access-control/
    - /operate/rc/security/database-access-control/role-based-access-control/
---

Role-based access control (RBAC) lets you define *roles* with specific sets of *permissions*. You can then assign *users* to these roles
to provide appropriate levels of access.

RBAC effectively lets you implement the [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege). For example, you can provide
read-only access to an application whose only job is to display Redis data. Similarly, you can prevent new developers from running dangerous administrative commands.


## Set up RBAC

To set up RBAC, first navigate to the **Data Access Control** screen.

There are three tabs on this screen: **Users**, **Roles**, and **Redis ACLs**.

In the **Redis ACLs** tab, you [define named *permissions*]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/configure-acls" >}}) for specific Redis commands, keys, and pub/sub channels.

{{<image filename="images/rc/data-access-control-acls.png" alt="Data access control screen." >}}

In the **Roles** tab, you [create roles]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/create-roles" >}}). Each role consists of a set of permissions for one or more Redis Cloud databases.

{{<image filename="images/rc/data-access-control-roles.png" alt="Data access control screen." >}}

Finally, in the **Users** tab, you [create users]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/create-assign-users" >}}) and [assign each user a role]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/create-assign-users#assign-roles-to-existing-users" >}}).

{{<image filename="images/rc/data-access-control-users.png" alt="Data access control screen." >}}

{{<note>}}Database access users are different from account access users. To learn more, see [Access management]({{< relref "/operate/rc/security/console-access-control/access-management" >}}).{{</note>}}


## Redis ACLs vs. Redis Cloud RBAC

In Redis, you can create users and assign ACLs to them using the `ACL` command. However, 
Redis does not support generic roles.

In Redis Cloud, you configure RBAC using the Redis Cloud console. As a result, certain Redis ACL
subcommands are not available in Redis Cloud. The following table shows which ACL commands are supported.

{{<embed-md "acl-command-compatibility.md">}}

In Redis, you must explicitly provide access to the `MULTI`, `EXEC`, and `DISCARD` commands.
In Redis Cloud, these commands, which are used in transactions, are always permitted. However, the commands
run within the transaction block are subject to RBAC permissions.

When you run multi-key commands on multi-slot keys, the return value is `failure` but the command runs on the keys that are allowed.



