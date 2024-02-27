---
Title: Role-based access control (RBAC)
alwaysopen: false
categories:
- docs
- operate
- rs
description: An overview of role-based access control (RBAC) in Redis Enterprise Software.
hideListLinks: true
linkTitle: Role-based access control
weight: 40
---

Role-based access control (RBAC) allows you to configure the level of access each user has to a Redis Enterprise cluster's [admin console]({{< relref "/operate/rs/security/access-control/admin-console-access" >}}), [REST API]({{< relref "/operate/rs/references/rest-api" >}}), and [databases]({{< relref "/operate/rs/security/access-control/database-access" >}}). To grant permissions, assign [predefined]({{< relref "/operate/rs/security/access-control/rbac/create-roles#default-management-roles" >}}) or custom roles to a user. You can create a role once and then deploy it across multiple databases in the cluster.

## Role types

You can create custom user roles that determine cluster management permissions, data access permissions, or a combination of both.

- [Management roles]({{< relref "/operate/rs/security/access-control/admin-console-access" >}}) determine user access to the cluster’s admin console and [REST API]({{< relref "/operate/rs/references/rest-api" >}}).

- [Data access controls]({{< relref "/operate/rs/security/access-control/database-access" >}}) determine the permissions each role grants for each database in the cluster.

Multiple users can share the same role.

## Access control screen

The **Access Control** screen has the following tabs:

- **Users** - [Create users]({{< relref "/operate/rs/security/access-control/manage-users/add-users" >}}) and [assign a role to each user]({{< relref "/operate/rs/security/access-control/rbac/assign-user-role" >}}) to grant access to the admin console, REST API, or databases.

- **Roles** - [Create roles]({{< relref "/operate/rs/security/access-control/rbac/create-roles" >}}). Each role consists of a set of permissions (Redis ACLs) for one or more Redis databases. You can reuse these roles for multiple users.

- **Redis ACLs** - [Define named permissions]({{< relref "/operate/rs/security/access-control/rbac/configure-acl" >}}) for specific Redis commands, keys, and pub/sub channels. Redis version 7.2 lets you specify read and write access for key patterns and use selectors to define multiple sets of rules in a single Redis ACL. You can use defined Redis ACLs for multiple databases and roles.

- **LDAP Mappings** - Map LDAP groups to access control roles.

- **Settings** - Additional access control settings, such as default permissions for pub/sub ACLs.

## Active-Active databases

Users, roles, and Redis ACLs are cluster-level entities, which means:

- They apply to the local participating cluster and Active-Active database instance.

- They do not replicate or propagate to the other participating clusters and instances.

- ACLs are enforced according to the instance connected to the client. The Active-Active replication mechanism propagates all the effects of the operation.

## More info

- [Grant admin console and REST API access for cluster management]({{< relref "/operate/rs/security/access-control/admin-console-access" >}})

- [Control database access using RBAC]({{< relref "/operate/rs/security/access-control/database-access" >}})

- [Redis ACL rules](https://redis.io/docs/manual/security/acl/#acl-rules)
