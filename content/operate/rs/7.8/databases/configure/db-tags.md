---
Title: Manage database tags
alwaysopen: false
categories:
- docs
- operate
- rs
description: Manage tags for databases in a Redis Software cluster.
linkTitle: Database tags
toc: 'true'
weight: 17
url: '/operate/rs/7.8/databases/configure/db-tags/'
---

You can create custom tags to categorize databases in a Redis Software cluster. 

The **Databases** screen shows tags for each database in the list.

{{<image filename="images/rs/screenshots/databases/view-db-list-tags.png" alt="The databases screen includes tags for each database.">}}

## Add database tags

You can add tags when you [create a database]({{<relref "/operate/rs/7.8/databases/create">}}) or [edit an existing database's configuration]({{<relref "/operate/rs/7.8/databases/configure#edit-database-settings">}}).

To add tags to a database using the Cluster Manager UI:

1. While in edit mode on the database's configuration screen, click **Add tags**.

    {{<image filename="images/rs/screenshots/databases/add-db-tags-button.png" alt="The Add tags button on the database configuration screen.">}}

1. Enter a key and value for the tag. Keys and values previously used by existing tags will appear as suggestions.

    {{<image filename="images/rs/screenshots/databases/manage-db-tags-dialog-suggestions.png" alt="The Manage tags dialog lets you add, edit, or delete tags.">}}

1. To add additional tags, click **Add tag**.

1. After you finish adding tags, click **Done** to close the tag manager.

1. Click **Create** or **Save**.

## Edit database tags

To edit a database's existing tags using the Cluster Manager UI:

1. Go to the database's **Configuration** screen, then click **Edit**.

1. Next to the existing **Tags**, click {{< image filename="/images/rs/buttons/edit-db-tags-button.png#no-click" alt="Edit tags button" width="22px" class="inline" >}}.

    {{<image filename="images/rs/screenshots/databases/edit-db-tags-button-location.png" alt="The Edit tags button on the database configuration screen.">}}

1. Edit or delete existing tags, or click **Add tag** to add new tags.

1. After you finish editing tags, click **Done** to close the tag manager.

1. Click **Save**.
