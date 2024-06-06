---
Title: Create roles with combined access
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create roles with both cluster and database access.
linkTitle: Create roles with combined access
weight: 70
---

From **Access Control** > **Roles**, you can create custom user roles that determine cluster management permissions, data access permissions, or a combination of both.

- [**Management roles**](#default-management-roles) - Management roles define user access to the Cluster Manager UI and API.

- **Data access controls** - Data access controls define the permissions each role has for each database in the cluster.

## Default management roles

Redis Enterprise Software includes five predefined roles that determine a user's level of access to the Cluster Manager UI and [REST API]({{< relref "/operate/rs/references/rest-api" >}}).

1. **DB Viewer** - Read database settings
1. **DB Member** - Administer databases
1. **Cluster Viewer** - Read cluster settings
1. **Cluster Member** - Administer the cluster
1. **Admin** - Full cluster access
1. **None** - For data access only - cannot access the Cluster Manager UI or use the REST API

For more details about the privileges granted by each of these roles, see [Cluster Manager UI permissions]({{< relref "/operate/rs/security/access-control/create-roles/create-cluster-roles#cluster-manager-ui-permissions" >}}) or [REST API permissions]({{< relref "/operate/rs/references/rest-api/permissions" >}}).

## Create roles for database access {#create-db-role}

To create a role that grants database access to users but blocks access to the Redis Enterprise Cluster Manager UI and REST API, set the **Cluster management role** to **None**.

To define a role for database access:

1. From **Access Control** > **Roles**, you can:

    - Point to a role and select {{< image filename="/images/rs/buttons/edit-button.png#no-click" alt="The Edit button" width="25px" class="inline" >}} to edit an existing role.

    - Select **+ Add role** to create a new role.

    {{<image filename="images/rs/access-control-role-panel.png" alt="Add role with name" >}}

1. Enter a descriptive name for the role. This will be used to reference the role when configuring users.

    {{<image filename="images/rs/access-control-role-name.png" alt="Add role with name" >}}

1. Choose a **Cluster management role**. The default is **None**.
    
1. Select **+ Add ACL**.

    {{<image filename="images/rs/access-control-role-acl.png" alt="Add role database acl" >}}

1.  Choose a Redis ACL and databases to associate with the role.

    {{<image filename="images/rs/access-control-role-databases.png" alt="Add databases to access" >}}

1. Select the check mark {{< image filename="/images/rs/buttons/checkmark-button.png#no-click" alt="The Check button" width="25px" class="inline" >}} to confirm.

1. Select **Save**.

    {{<image filename="images/rs/access-control-role-save.png" alt="Add databases to access" >}}

## Next steps

- [Assign the role to a user]({{< relref "/operate/rs/security/access-control/create-users" >}}).