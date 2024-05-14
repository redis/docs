---
Title: Add users
alwaysopen: false
categories:
- docs
- operate
- rs
description: Add users to the cluster and assign access control roles (ACLs) to them.
linkTitle: Add users
weight: 20
---

To add a user to the cluster:

1. From the **Access Control > Users** tab in the Cluster Manager UI, select **+ Add user**.

    {{<image filename="images/rs/access-control-user-panel.png" alt="Add role with name" >}}

1. Enter the name, email, and password of the new user.

    {{<image filename="images/rs/access-control-user-add.png" alt="Add role with name" >}}

1. Assign a **Role** to the user to grant permissions for cluster management and data access.

    {{<image filename="images/rs/access-control-user-role-select.png" width="300px" alt="Add role with name" >}}

1. Select the **Alerts** the user should receive by email:

    - **Receive alerts for databases** - The alerts that are enabled for the selected databases will be sent to the user. Choose **All databases** or **Customize** to select the individual databases to send alerts for.
    
    - **Receive cluster alerts** - The alerts that are enabled for the cluster in **Cluster > Alerts Settings** are sent to the user.

1. Select **Save**.

## More info

- [Grant Cluster Manager UI and REST API access for cluster management]({{< relref "/operate/rs/security/access-control/admin-console-access" >}})

- [Control database access using RBAC]({{< relref "/operate/rs/security/access-control/database-access" >}})