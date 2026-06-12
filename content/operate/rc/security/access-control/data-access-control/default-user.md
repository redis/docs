---
Title: Default user
alwaysopen: false
categories:
- docs
- operate
- rc
description: Learn how to change your default user password or turn off access using
  the default user password.
linkTitle: Default user
weight: 5
---

Password-based authentication is a basic but essential Redis security feature. When you create a Redis Cloud database, your database is given a randomly generated password called the **Default user password**.

This password appears in the **Security** section of the **Configuration** tab of the database details screen for Pro databases. For Essentials databases, go to **Security > Default user** and select **Configure** to view the default user password.

Use the copy button to copy the password to the clipboard:

{{<image filename="images/rc/button-copy.png"  alt="Use the Copy button to copy the default user password." >}}

You'll need to use this password whenever you connect to your database using a Redis client. See [Connect to a database]({{< relref "/operate/rc/databases/connect" >}}) for more info.

If you have [blocked the public endpoint]({{< relref "/operate/rc/security/database-security/block-public-endpoints" >}}) for your Redis Cloud Pro subscription, you can also turn on passwordless authentication for the default user. See [Block public endpoints]({{< relref "/operate/rc/security/database-security/block-public-endpoints#turn-on-passwordless-authentication-for-the-default-user" >}}) for more info.

See your [Redis client's documentation]({{< relref "/develop/clients" >}}) to learn how to provide your password when connecting.

## Change password

How you change the default user password depends on your plan.

{{< multitabs id="change-default-user-password"
    tab1="Essentials"
    tab2="Pro" >}}

1. In the **Security** section of the **Configuration** tab, select **Configure** for the default user.

1. Enter the new password. Database passwords must be less than 50 characters long.

1. Select **OK** to save your changes.

-tab-sep-

1. From the database **Configuration** tab, select **Edit**.

    <img src="../../../../../../images/rc/button-database-edit.png" width="100px" alt="The Edit button lets you change the database's default user password.">

1. Under the **Security** section, enter the new password in the **Default user password** field. Database passwords must be less than 50 characters long.

1. Select **Save database** to update the password.

    <img src="../../../../../../images/rc/button-database-save.png" width="150px" alt="Use the Save database button to save the new password.">

{{< /multitabs >}}

## Turn off default user

After you set up [role-based access control]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control" >}}) to limit who can access your database, we recommend that you turn off default user access.

How you turn off the default user depends on your plan.

{{< multitabs id="turn-off-default-user"
    tab1="Essentials"
    tab2="Pro" >}}

1. In the **Security** section of the **Configuration** tab, select **Configure** for the default user.

1. Turn off the **Default user** switch.

1. Select **OK** to save your changes.

-tab-sep-

1. From the database **Configuration** tab, select **Edit**.

    <img src="../../../../../../images/rc/button-database-edit.png" width="100px" alt="The Edit database button lets you change the database's default user password.">

1. Under the **Security** section, select the **Default User** switch to turn it off.

1. Select **Save database**.

    <img src="../../../../../../images/rc/button-database-save.png" width="150px" alt="Use the Save database button to save your changes.">

{{< /multitabs >}}