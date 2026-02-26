---
LinkTitle: Tag database
Title: Manage database tags
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
weight: 33
---

Tags are key-value pairs that let you categorize your databases. You can create tags and add them to your databases to associate them with each other. Once you've added tags, you can filter your databases in the [database list]({{< relref "/operate/rc/databases/view-edit-database#manage-the-database-list" >}}) or in the [cost report]({{< relref "/operate/rc/billing-and-payments/cost-report" >}}) by tag key or value. 

## Manage tags

You can manage tags from the [Redis Cloud console](https://cloud.redis.io/#/) in the [tag manager](#tag-manager). You can find the tag manager in the following places: 

- [From your database in the **Configuration** tab](#configuration-tab)
- [From the database list](#database-list)

After you open the [tag manager](#tag-manager), you can use it to add, edit, or delete tags.

### Open tag manager from the Configuration tab {#configuration-tab}

To learn how to navigate to your database, see [View and edit databases]({{< relref "/operate/rc/databases/view-edit-database" >}}). Select the **Configuration** tab and go to the **General** section to view the tags that are set for your database.

{{<image filename="images/rc/database-details-configuration-tab-general-flexible.png" alt="The Configuration tab of the Database details screen." >}}

Select **Manage Tags** to open the [tag manager](#tag-manager).

{{<image filename="images/rc/tags-button-manage-tags.png" width=120px alt="The Manage tags button." >}}

### Open tag manager from the database list {#database-list}

Using the database list allows you to manage tags for multiple databases without having to go into each database's **Tags** tab.

To get to the database list, select **Databases** from the main menu. 

{{<image filename="images/rc/tags-database-list.png" alt="The database list with databases that are tagged." >}}

Hover over the database and select **Manage tags**, or select **More actions** > **Manage tags** to open the [tag manager](#tag-manager).

{{<image filename="images/rc/tags-icon-manage-tags.png#no-click" width=30px alt="Manage tags button." class="inline">}}
{{<image filename="images/rc/tags-icon-more-actions.png#no-click" width=30px alt="More actions button." class="inline">}}

### Use the tag manager {#tag-manager}

The tag manager shows any tags that are associated with the database and allows you to create, edit, or delete tags.

{{<image filename="images/rc/tags-tag-manager.png" alt="The tag manager." >}}

{{< embed-md "rc-tags-tag-module.md" >}}

Select **Save tags** to save your changes.

{{<image filename="images/rc/tags-button-save-tags.png" width=100px alt="The Save tags button." >}}
