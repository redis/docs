---
Title: Delete database
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linkTitle: Delete database
weight: 45
---

Deleting a database requires the Account Owner role.

Deleted databases cannot be recovered.  We recommend [making a backup]({{< relref "/operate/rc/databases/back-up-data.md" >}}), just in case.

Sign in to the [Redis Cloud console](https://cloud.redis.io/), then follow the steps for your plan to open the **Delete database** confirmation dialog.

{{< multitabs id="delete-database"
    tab1="Essentials"
    tab2="Pro" >}}

1. Select the database from the list to open the **Database** screen.

1. Select **More actions** > **Delete database**.

    <img src="../../../../images/rc/database-more-actions-delete-essentials.png" alt="The More actions menu on the database screen, with Delete database selected." width=40%>

-tab-sep-

1. Select the database from the list. The **Configuration** tab is selected by default.

1. Scroll to the **Danger zone**.

    <img src="../../../../images/rc/database-details-configuration-tab-danger-flexible.png" width="75%" alt="The Danger zone of the database details screen.">

1. Select the **Delete** button.

    <img src="../../../../images/rc/button-danger-zone-delete.png" alt="The Delete button is located in the Danger zone section of the database Configuration tab." width="100px">

{{< /multitabs >}}

The **Delete database** confirmation dialog appears. If this database is the only one in the subscription, you can also delete the subscription at this time.

- Select **Delete my subscription and stop my payment** to delete both the database and the subscription.

- Clear **Delete my subscription and stop my payment** to delete the database but keep the subscription.

{{< note >}}
You will continue to be charged for your subscription until you delete it, even if there are no databases in your subscription.
{{< /note >}}

{{<image filename="images/rc/database-delete-last-dialog.png" alt="A delete database confirmation dialog asks you to consider deleting the subscription as well." width="75%" >}}

Select **Delete database** to confirm your choice.

{{<image filename="images/rc/button-database-delete.png" alt="The Delete database button." width="150px" >}}

When the operation completes, the database and its data are deleted.
