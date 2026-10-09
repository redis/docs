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
weight: 25
---

Before you create a database user, you must [create a data access role](/content/operate/rc/security/access-control/data-access-control/create-roles.md) to assign to that user.

## Create a user

To create a user:

1. Go to **Data Access Control** from the [Redis Cloud console](https://cloud.redis.io/#/) menu.

    ![Menu for database access control.](/images/rc/data-access-control-menu.png)
    {width="200px"}

1. Select the **Users** tab.

    ![User configuration area.](/images/rc/data-access-control-users-no-users.png)

2. Select `+` to create a new user.

    ![User add or edit.](/images/rc/data-access-control-users-add-or-edit.png)
    {width="300px"}

3. Enter a username in the **Username** field.

    ![User add username.](/images/rc/data-access-control-users-add.png)

    > [!NOTE]
    > An error occurs if a user tries to connect to a memcached database with the username `admin`. Do not use `admin` for a username if the user will be connecting to a memcached database.
    >

1. Select a [**Role**](/content/operate/rc/security/access-control/data-access-control/create-roles.md) from the list.

    ![User select role.](/images/rc/data-access-control-users-add-role.png)
    {width="300px"}

1. Enter and confirm the user's password. ACL user passwords must be between 8 and 128 characters long.

    Then, select the check mark to save the user. 

    ![User add password and finish.](/images/rc/data-access-control-users-password-and-finish.png)
    {width="300px"}


## Assign roles to existing users

To assign a data access role to an existing user:

1. Go to **Data Access Control** from the [Redis Cloud console](https://cloud.redis.io/#/) menu.

    ![Menu for database access control.](/images/rc/data-access-control-menu.png)
    {width="200px"}

1. Select the **Users** tab.

    ![User configuration area.](/images/rc/data-access-control-users.png)

1. Point to the user and select the **Edit*** icon when it appears.

    ![User add or edit.](/images/rc/data-access-control-users-add-or-edit.png)
    {width="300px"}

1. Select a [**Role**](/content/operate/rc/security/access-control/data-access-control/create-roles.md) from the list.

    ![User select role.](/images/rc/data-access-control-users-add-role.png)
    {width="300px"}

1. Select the check mark to save the user. 

    ![User add password and finish.](/images/rc/data-access-control-users-password-and-finish.png)
    {width="300px"}