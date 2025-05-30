---
alwaysopen: false
categories:
- docs
- operate
- rs
db_type: database
description: Create a database with Redis Enterprise Software.
linkTitle: Create a database
title: Create a Redis Enterprise Software database
toc: 'true'
weight: 10
url: '/operate/rs/7.8/databases/create/'
---
Redis Enterprise Software lets you create databases and distribute them across a cluster of nodes.

To create a new database:

1. Sign in to the Cluster Manager UI at `https://<hostname>:8443`

1. Use one of the following methods to create a new database:

    - [Quick database](#quick-database)

    - [Create database](#create-database) with additional configuration

1. If you did not specify a port number for the database, you can find the port number in the **Endpoint** field in the **Databases > Configuration > General** section.

1. [Test client connectivity]({{< relref "/operate/rs/7.8/databases/connect/test-client-connectivity" >}}).


{{< note >}}
For databases with Active-Active replication for geo-distributed locations,
see [Create an Active-Active database]({{< relref "/operate/rs/7.8/databases/active-active/create.md" >}}). To create and manage Active-Active databases, use the legacy UI.
{{< /note >}}

## Quick database

To quickly create a database and skip additional configuration options during initial creation:

1. On the **Databases** screen, select **Quick database**.

1. Select a Redis version from the **Database version** list.

1. Configure settings that are required for database creation but can be changed later:

    - Database name

    - Memory limit (GB)

2. Configure optional settings that can't be changed after database creation:

    - Endpoint port (set by the cluster if not set manually)

    - Capabilities (previously modules) to enable

1. Optionally select **Full options** to configure [additional settings]({{< relref "/operate/rs/7.8/databases/configure#config-settings" >}}).

1. Select **Create**.

## Create database

To create a new database and configure additional settings:

1. Open the **Create database** menu with one of the following methods:

    - Click the **+** button next to **Databases** in the navigation menu:

        {{<image filename="images/rs/screenshots/databases/create-db-plus-drop-down.png" width="350px" alt="Create database menu has two options: Single Region and Active-Active database.">}}
        
    - Go to the **Databases** screen and select **Create database**:

        {{<image filename="images/rs/screenshots/databases/create-db-button-drop-down.png" width="350px" alt="Create database menu has two options: Single Region and Active-Active database.">}}

1. Select the database type:

    - **Single Region**

    - **Active-Active database** - Multiple participating Redis Enterprise clusters can host instances of the same [Active-Active database]({{< relref "/operate/rs/7.8/databases/active-active" >}}) in different geographic locations. Every instance can receive write operations, which are synchronized across all instances without conflict.

    {{<note>}}
For Active-Active databases, see [Create an Active-Active geo-replicated database]({{< relref "/operate/rs/7.8/databases/active-active/create" >}}).
    {{</note>}}

1. Select a Redis version from the **Database version** list.

1. Enter a **Database name**.

    - Maximum of 63 characters

    - Only letters, numbers, or hyphens (-) are valid characters

    - Must start and end with a letter or digit

    - Case-sensitive

1. To configure additional database settings, expand each relevant section to make changes.

    See [Configuration settings]({{< relref "/operate/rs/7.8/databases/configure#config-settings" >}}) for more information about each setting.

1. Select **Create**.

## Continue learning with Redis University

{{< university-links >}}
