---
Title: Grant admin console and REST API access for cluster management
alwaysopen: false
categories:
- docs
- operate
- rs
description: Grant admin console access to a user.
linkTitle: Cluster management access
weight: 10
---

To grant a user access to a Redis Enterprise cluster's admin console and [REST API]({{< relref "/operate/rs/references/rest-api" >}}), assign a predefined management role to the user.

## Grant cluster management access

1. [Create a new user]({{< relref "/operate/rs/security/access-control/manage-users/add-users" >}}) or edit an existing one.

2. [Assign the user a role]({{< relref "/operate/rs/security/access-control/rbac/assign-user-role" >}}) associated with the appropriate [cluster management role](#default-management-roles).

## Default management roles

Redis Enterprise Software includes five predefined roles that determine a user's level of access to the admin console and [REST API]({{< relref "/operate/rs/references/rest-api" >}}).

1. **DB Viewer** - Read database settings
2. **DB Member** - Administer databases
3. **Cluster Viewer** - Read cluster settings
4. **Cluster Member** - Administer the cluster
5. **Admin** - Full cluster access
6. **None** - For data access only - cannot access the admin console or use the REST API

For more details about the privileges granted by each of these roles, see [admin console permissions](#admin-console-permissions) or [REST API permissions]({{< relref "/operate/rs/references/rest-api/permissions" >}}).

## Admin console permissions

Here's a summary of the admin console actions permitted by each default management role:

| Action | DB Viewer | DB Member | Cluster Viewer | Cluster Member | Admin |
|--------|:---------:|:---------:|:--------------:|:-----------:|:------:|
| Edit database configuration | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| Reset slow log | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| View cluster configuration | <span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| View cluster logs | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span><br /> |
| View cluster metrics | <span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| View database configuration | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| View database metrics | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| View node configuration | <span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| View node metrics | <span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| View Redis database password | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| View and edit cluster settings |<span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> |

## More info

- [Add users]({{< relref "/operate/rs/security/access-control/manage-users/add-users" >}})

- [Role-based access control (RBAC) overview]({{< relref "/operate/rs/security/access-control/rbac" >}})