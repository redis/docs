---
Title: Create roles with cluster access only
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create access control roles.
linkTitle: Create roles with cluster access only
weight: 20
aliases:
    - /operate/rs/security/access-control/admin-console-access/
---

Roles with cluster access let the user access the Cluster Management UI and REST API.

## Default management roles

Redis Enterprise Software includes five predefined roles that determine a user's level of access to the Cluster Manager UI and [REST API]({{< relref "/operate/rs/references/rest-api" >}}).

1. **DB Viewer** - Read database settings
1. **DB Member** - Administer databases
1. **Cluster Viewer** - Read cluster settings
1. **Cluster Member** - Administer the cluster
1. **Admin** - Full cluster access
1. **None** - For data access only - cannot access the Cluster Manager UI or use the REST API

For more details about the privileges granted by each of these roles, see [Cluster Manager UI permissions]({{< relref "/operate/rs/security/access-control/create-roles/create-cluster-roles#cluster-manager-ui-permissions" >}}) or [REST API permissions]({{< relref "/operate/rs/references/rest-api/permissions" >}}).

## Create roles for cluster access {#create-cluster-role}

To create a role that grants access to the Redis Enterprise Cluster Manager UI and REST API but does not grant access to any databases:

1. From **Access Control** > **Roles**, you can:

    - Point to a role and select {{< image filename="/images/rs/buttons/edit-button.png#no-click" alt="The Edit button" width="25px" class="inline" >}} to edit an existing role.

    - Select **+ Add role** to create a new role.

    {{<image filename="images/rs/access-control-role-panel.png" alt="Add role with name" >}}

1. Enter a descriptive name for the role. This will be used to reference the role when configuring users.

    {{<image filename="images/rs/access-control-role-name.png" alt="Add role with name" >}}

1. Choose a **Cluster management role**. The default is **None**.
    
1. Do not add any ACLs, so databases cannot be accessed when using this role.

1. Select **Save**.

    {{<image filename="images/rs/access-control-role-save.png" alt="Add databases to access" >}}

## Next steps

- [Assign the role to a user]({{< relref "/operate/rs/security/access-control/create-users" >}}).