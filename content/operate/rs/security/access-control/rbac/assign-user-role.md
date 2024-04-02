---
Title: Assign roles to users
alwaysopen: false
categories:
- docs
- operate
- rs
description: Assign access control roles to users.
linkTitle: Assign roles to users
weight: 40
---

Assign a role, associated with specific databases and access control lists (ACLs), to a user to grant database access:

1. From the **Access Control > Users** tab in the admin console, you can:

    - Point to an existing user and select {{< image filename="/images/rs/buttons/edit-button.png#no-click" alt="The Edit button" width="25px" class="inline" >}} to edit the user.
    
    - Select **+ Add user** to [create a new user]({{< relref "/operate/rs/security/access-control/manage-users/add-users" >}}).

1. Select a role to assign to the user.

1. Select **Save**.

## Next steps

Depending on the type of the user's assigned role (cluster management role or data access role), the user can now:

- [Connect to a database]({{< relref "/operate/rs/databases/connect" >}}) associated with the role and run limited Redis commands, depending on the role's Redis ACLs.

- Sign in to the Redis Enterprise Software admin console.

- Make a [REST API]({{< relref "/operate/rs/references/rest-api" >}}) request.
