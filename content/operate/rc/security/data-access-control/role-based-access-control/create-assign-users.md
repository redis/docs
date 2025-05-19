---
LinkTitle: Create users
Title: Create and edit database users
alwaysopen: false
categories:
- docs
- operate
- rc
description: Create a database user and assign it a role.
headerRange: '[1-3]'
toc: 'true'
weight: 4
aliases:
    - /operate/rc/security/access-control/data-access-control/create-assign-users/
    - /operate/rc/security/access-control/database-access-control/create-assign-users/
    - /operate/rc/security/database-access-control/create-assign-users/
---

Before you create a database user, you must [create a data access role]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/create-roles" >}}) to assign to that user.

## Create a user

To create a user:

1. Go to **Data Access Control** from the [Redis Cloud console](https://cloud.redis.io/#/) menu.

    {{<image filename="images/rc/data-access-control-menu.png" width="200px" alt="Menu for database access control." >}}

1. Select the **Users** tab.

    {{<image filename="images/rc/data-access-control-users-no-users.png" alt="User configuration area." >}}

2. Select `+` to create a new user.

    {{<image filename="images/rc/data-access-control-users-add-or-edit.png" width="300px" alt="User add or edit." >}}

3. Enter a username in the **Username** field.

    {{<image filename="images/rc/data-access-control-users-add.png" alt="User add username." >}}

    {{<note>}}
An error occurs if a user tries to connect to a memcached database with the username `admin`. Do not use `admin` for a username if the user will be connecting to a memcached database.
    {{</note>}}

1. Select a [**Role**]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/create-roles" >}}) from the list.

    {{<image filename="images/rc/data-access-control-users-add-role.png" width="300px" alt="User select role." >}}

1. Enter and confirm the user's password. ACL user passwords must be between 8 and 128 characters long.

    Then, select the check mark to save the user. 

    {{<image filename="images/rc/data-access-control-users-password-and-finish.png" width="300px" alt="User add password and finish." >}}


## Assign roles to existing users

To assign a data access role to an existing user:

1. Go to **Data Access Control** from the [Redis Cloud console](https://cloud.redis.io/#/) menu.

    {{<image filename="images/rc/data-access-control-menu.png" width="200px" alt="Menu for database access control." >}}

1. Select the **Users** tab.

    {{<image filename="images/rc/data-access-control-users.png" alt="User configuration area." >}}

1. Point to the user and select the **Edit*** icon when it appears.

    {{<image filename="images/rc/data-access-control-users-add-or-edit.png" width="300px" alt="User add or edit." >}}

1. Select a [**Role**]({{< relref "/operate/rc/security/data-access-control/role-based-access-control/create-roles" >}}) from the list.

    {{<image filename="images/rc/data-access-control-users-add-role.png" width="300px" alt="User select role." >}}

1. Select the check mark to save the user. 

    {{<image filename="images/rc/data-access-control-users-password-and-finish.png" width="300px" alt="User add password and finish." >}}