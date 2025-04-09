---
Title: Create roles with cluster access only
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create roles with cluster access only.
linkTitle: Create roles with cluster access only
weight: 14
aliases:
    - /operate/rs/security/access-control/admin-console-access/
url: '/operate/rs/7.4/security/access-control/create-cluster-roles/'
---

Roles with cluster access allow access to the Cluster Management UI and REST API.

## Default management roles

Redis Enterprise Software includes five predefined roles that determine a user's level of access to the Cluster Manager UI and [REST API]({{<relref "/operate/rs/7.4/references/rest-api">}}).

1. **DB Viewer** - Read database settings
1. **DB Member** - Administer databases
1. **Cluster Viewer** - Read cluster settings
1. **Cluster Member** - Administer the cluster
1. **Admin** - Full cluster access
1. **None** - For data access only - cannot access the Cluster Manager UI or use the REST API

For more details about the privileges granted by each of these roles, see [Cluster Manager UI permissions](#cluster-manager-ui-permissions) or [REST API permissions]({{<relref "/operate/rs/7.4/references/rest-api/permissions">}}).

## Cluster Manager UI permissions

Here's a summary of the Cluster Manager UI actions permitted by each default management role:

| Action | DB Viewer | DB Member | Cluster Viewer | Cluster Member | Admin |
|--------|:---------:|:---------:|:--------------:|:-----------:|:------:|
| Create support package | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
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
| View slow log | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> | <span title="Allowed">&#x2705; Yes</span> |
| View and edit cluster settings |<span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Not allowed">&#x274c; No</span> | <span title="Allowed">&#x2705; Yes</span> |

## Create roles for cluster access {#create-cluster-role}

To create a role that grants cluster access but does not grant access to any databases:

1. From **Access Control** > **Roles**, you can:

    - Point to a role and select {{< image filename="/images/rs/buttons/edit-button.png#no-click" alt="The Edit button" width="25px" class="inline" >}} to edit an existing role.

    - Select **+ Add role** to create a new role.

    {{<image filename="images/rs/access-control-role-panel.png" alt="Add role with name" >}}

1. Enter a descriptive name for the role.

1. Choose a **Cluster management role** to determine cluster management permissions.

    {{<image filename="images/rs/screenshots/access-control/rbac-create-role-cluster-only.png" alt="Select a cluster management role to set the level of cluster management permissions for the new role." >}}
    
1. To prevent database access when using this role, do not add any ACLs.

1. Select **Save**.

You can [assign the new role to users]({{<relref "/operate/rs/7.4/security/access-control/create-users#assign-roles-to-users">}}) to grant cluster access.
