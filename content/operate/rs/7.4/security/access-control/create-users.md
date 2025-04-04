---
Title: Create users
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create users and assign access control roles.
linkTitle: Create users
weight: 10
aliases:
    - /operate/rs/security/access-control/manage-users/add-users/
    - /operate/rs/security/access-control/rbac/assign-user-role/
url: '/operate/rs/7.4/security/access-control/create-users/'
---

## Prerequisites

Before you create other users:

1. Review the [access control overview]({{<relref "/operate/rs/7.4/security/access-control">}}) to learn how to use role-based access control (RBAC) to manage users' cluster access and database access.

1. Create roles you can assign to users. See [Create roles with cluster access only]({{<relref "/operate/rs/7.4/security/access-control/create-cluster-roles">}}), [Create roles with database access only]({{<relref "/operate/rs/7.4/security/access-control/create-db-roles">}}), or [Create roles with combined access]({{<relref "/operate/rs/7.4/security/access-control/create-combined-roles">}}) for instructions.

## Add users

To add a user to the cluster:

1. From the **Access Control > Users** tab in the Cluster Manager UI, select **+ Add user**.

    {{<image filename="images/rs/access-control-user-panel.png" alt="Add role with name" >}}

1. Enter the name, email, and password of the new user.

    {{<image filename="images/rs/access-control-user-add.png" alt="Add role with name" >}}

1. Assign a **Role** to the user to grant permissions for cluster management and data access.

    {{<image filename="images/rs/access-control-user-role-select.png" width="300px" alt="Add role to user." >}}

1. Select the **Alerts** the user should receive by email:

    - **Receive alerts for databases** - The alerts that are enabled for the selected databases will be sent to the user. Choose **All databases** or **Customize** to select the individual databases to send alerts for.
    
    - **Receive cluster alerts** - The alerts that are enabled for the cluster in **Cluster > Alerts Settings** are sent to the user.

1. Select **Save**.

## Assign roles to users

Assign a role, associated with specific databases and access control lists (ACLs), to a user to grant database access:

1. From the **Access Control > Users** tab in the Cluster Manager UI, you can:

    - Point to an existing user and select {{< image filename="/images/rs/buttons/edit-button.png#no-click" alt="The Edit button" width="25px" class="inline" >}} to edit the user.
    
    - Select **+ Add user** to [create a new user]({{< relref "/operate/rs/7.4/security/access-control/create-users" >}}).

1. Select a role to assign to the user.

    {{<image filename="images/rs/access-control-user-role-select.png" width="300px" alt="Add role to user." >}}

1. Select **Save**.

## Next steps

Depending on the type of the user's assigned role (cluster management role or data access role), the user can now:

- [Connect to a database]({{< relref "/operate/rs/7.4/databases/connect" >}}) associated with the role and run limited Redis commands, depending on the role's Redis ACLs.

- Sign in to the Redis Enterprise Software Cluster Manager UI.

- Make a [REST API]({{< relref "/operate/rs/7.4/references/rest-api" >}}) request.
