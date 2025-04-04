---
Title: View and edit databases
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linkTitle: Edit and view
weight: 15
---

Use the **Databases** menu of the Redis Cloud console to manage your databases.

To view the details of a database:

1. Sign in to the [Redis Cloud console](https://cloud.redis.io/).  (Create an account if you don't already have one.)

2. Select the **Databases** menu to display a [searchable list of all databases](#manage-the-database-list).
 
3. Locate the database in the list.

4. Select the database name to open the **Database** page.

    {{<image filename="images/rc/database-details-configuration-tab-general-flexible.png" alt="The Configuration tab of the Database details screen." >}}

The **Database** screen lets you review:
- Configuration details of a database
- Graphs showing performance metrics
- Recent activity via a "[slowlog]({{< relref "/commands/slowlog" >}})," which lists queries that exceed a certain execution time.

For help changing database settings, see [Edit database details](#edit-database-details).

## Configuration tab

The **Configuration** screen is divided into sections, each dedicated to a specific category.  Note that not every section or setting is available to every [subscription plan]({{< relref "/operate/rc/subscriptions/" >}}).

### General settings

The **General** section defines basic properties about your database.

The available settings vary according to your plan, cloud provider, and design choices.  For example, if you do not select an Advanced Capability when creating a database, the **Advanced Capabilities** setting is not displayed when you view its configuration details.

| Setting name              | Description                                                                                                                                                 |
|:--------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Database Name**         | The name given to your database                                                                                                                             |
| **Subscription Name**     | The name for the subscription your database is a part of                                                                                                    |
| **Public endpoint**       | Public URI used by any application or client to access the database.                                                                                        |
| **Private endpoint**      | Private endpoint URI available to approved clients; use CIDR allow list, VPC peering, or other connectivity options to enable access. (_Redis Cloud Pro only_) |
| **Tags**                  | A list of the [tags]({{< relref "/operate/rc/databases/tag-database" >}}) associated with the database. Select [Manage tags]({{< relref "/operate/rc/databases/tag-database#configuration-tab" >}}) to manage the database tags. |
| **Vendor**                | The Cloud vendor hosting your database: AWS, Google Cloud, or Azure.                                                   |
| **Region**                | The Cloud vendor region hosting your database                                                  |
| **Type**                  | Displays 'Redis', 'Redis Stack' or 'memcached' based on the value selected when the database was created                                                    |
| **Redis version**         | Redis version of the database                                                                                                                  |
| **Auto Tiering**          | Checked when the subscription supports Auto Tiering (_Redis Cloud Pro only_)                                                               |
| **Active-Active Redis**   | Checked when the database is part of an [Active-Active]({{< relref "/operate/rc/databases/configuration/active-active-redis" >}}) relationship (_Redis Cloud Pro only_)                                                                                         |
| **Creation time**         | Date and time the database was created                                                                                                                      |
| **Last changed**          | Date and time of last update                                                                                                                                |
| **Supported Protocol(s)** | Shows which version of RESP the database uses. See [Redis serialization protocol]({{< relref "/develop/reference/protocol-spec" >}}#resp-versions) for details |
| **Advanced Capabilites**  | This setting appears when an [advanced capability]({{< relref "/operate/rc/databases/configuration/advanced-capabilities" >}}) is enabled for a database                                                  |

### Performance section

The **Performance** section describes the memory size, throughput, and hashing policy for a database.

{{<image filename="images/rc/database-details-configuration-tab-scalability-flexible.png" alt="Use the Performance section to control the size, throughput, and hashing policy for a database." >}}

| Setting name          |Description|
|:----------------------|:----------|
| **Dataset size** | Maximum size (in GB) for your dataset. See [Dataset size]({{< relref "/operate/rc/databases/configuration/sizing#dataset-size" >}}).  |
| **Throughput**        | Defines [throughput]({{< relref "/operate/rc/databases/configuration/sizing#throughput" >}}) in terms of maximum operations per second for the database (_Redis Cloud Pro only_). |
| **Memory used**       | Memory currently used for your database.  |
| **High availability**    | Replicates your data across multiple nodes; [available options]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) depend on your plan type  |
| **Hashing policy**    | Defines the [hashing policy]({{< relref "/operate/rc/databases/configuration/clustering#manage-the-hashing-policy" >}}) (_Redis Cloud Pro only_).  |
| **OSS Cluster API**       | Enables the [Cluster API]({{< relref "/operate/rc/databases/configuration/clustering#oss-cluster-api" >}}) for a database (_Redis Cloud Pro only_).<br/><br/>When this option is enabled, you cannot define a custom hashing policy.|

To learn more about these settings and when to use them, see [Sizing]({{< relref "/operate/rc/databases/configuration/sizing" >}}) and [Database clustering]({{< relref "/operate/rc/databases/configuration/clustering" >}}).

### Durability section

The Durability section helps protect your data when problems occur.  These settings define replication, persistence, backup, and eviction policies.

{{<image filename="images/rc/database-details-configuration-tab-durability-flexible.png" alt="Use the Durability  section to protect your data from unexpected problems." >}}

| Setting name             | Description                                                                                                                                                     |
|:-------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Data persistence**     | Defines whether (and how) data is saved to disk; [available options]({{< relref "/operate/rc/databases/configuration/data-persistence" >}}) depend on your plan type |
| **Data eviction policy** | Configures which [policy]({{< relref "/operate/rc/databases/configuration/data-eviction-policies" >}}) is applied when your database reaches its memory limit        |
| **Remote backup**        | When enabled, identifies a location and interval for [data backups]({{< relref "/operate/rc/databases/back-up-data" >}}). (_Paid plans only_)                |
| **Active-Passive Redis** | When enabled, identifies a path to the [linked database]({{< relref "/operate/rc/databases/migrate-databases#sync-using-active-passive" >}}). (_Redis Cloud Pro only_)                                                               |

### Security section

The **Security** section helps you control access to your database.

{{<image filename="images/rc/database-details-configuration-tab-security-flexible.png" alt="Use the Security settings to control access to your database." >}}


|Setting name| Description                                                                                                                                                                    |
|:-----------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Default user** | When enabled, permits access using a simple password                                                                                                                           |
| **Default user password** | Password for default user. A default password is assigned to the database on creation and may be updated.                                                                      |
| **CIDR allow list** | [Allow list]({{< relref "/operate/rc/security/cidr-whitelist.md" >}}) of IP addresses/security groups permitted to access the database. (_Paid plans only_)                    |
| **Transport layer security (TLS)** | Enables [transport layer security]({{< relref "/operate/rc/security/database-security/tls-ssl.md" >}}) (TLS) encryption for database access. (_Pro plans only_)  |

### Alerts section


The **Alerts** section defines notification emails sent to your account and the conditions that trigger them.

{{<image filename="images/rc/database-details-configuration-tab-alerts-flexible.png" alt="The Alerts section defines the notification emails and their triggering conditions." >}}

The available alerts vary according to the plan type.

|Setting name| Description                                                                                                                                   |
|:-----------|:----------------------------------------------------------------------------------------------------------------------------------------------|
| **Dataset size has reached** | When enabled, sends an an email when the database reaches the defined memory limit (_Free Essentials or Pro only_)                  |
| **Total size of datasets under this plan reached** | When enabled, sends an an email when the database reaches the defined memory limit (_Paid Essentials plans only_)                                  |
| **Throughput is higher than** | When enabled, sends an email when the operations per second exceed the defined threshold (_Paid Essentials or Pro plans only_)      |
| **Throughput is lower than** | When enabled, sends an email when the operations per second falls below the defined threshold (_Paid Essentials or Pro plans only_) |
| **Latency is higher than** | When enabled, sends an an email when the latency exceeds the defined limit (_Paid Essentials plans only_)                                          |
| **Number of connections** | When enabled, sends an email when the connections exceeds the defined limit.  (_Essentials plans only_)                                   |
| **Replica Of - database unable to sync with source** | When enabled, sends email when the replica database cannot sync with the primary (source) database (_Pro plans only_)         |
| **Replica Of - sync lag is higher than** | When enabled, sends email when the sync lag exceeds the defined threshold (_Pro plans only_)                                  |

### Danger zone

Actions in the **Danger Zone** are permanent and should not be taken lightly.

{{<image filename="images/rc/database-details-configuration-tab-danger-flexible.png" alt="The Danger Zone includes activities that impact data, such as deleting a database.  Use with care." >}}

Here, you can:

- Delete the database. Databases must be active before they can be deleted.  To learn more, see [Delete a database]({{< relref "/operate/rc/databases/delete-database.md" >}}).
- Flush the database (_Active-Active databases only_).

For best results, we recommend [backing up data]({{< relref "/operate/rc/databases/back-up-data" >}}) before any danger zone actions.

## Manage the database list

The **Databases** list summarizes the status of all databases associated with your account.  

You can:

- Search by typing into the search box located above the database list.

    {{<image filename="images/rc/database-list-search.png" alt="Use the search bar to filter the list." >}}

- Filter by selecting a filter type and then selecting the checkbox next to the options you want to include from the dropdown.  Select the Filter toggle, located on the right of the search bar, if the filter types are hidden.

    {{<image filename="images/rc/database-list-filter.png" alt="Use the filter toggle to display filter options." >}}

    You can filter the list on **Status**, **Subscription**, **Subscription Type**, **Capabilities**, **Options**, and **Tags**.  String matches are _not_ case-sensitive.  You can specify more than one filter expression at a time.  

    A list of selected filters appears below the filter types.

    To remove a filter click the **x** to the right of the name of that filter.  To remove all filters, select **Clear all**.

    {{<image filename="images/rc/database-list-filter-selected.png" alt="Use the filter toggle to display filter options." >}}

- Select **Columns** to change what information is displayed on the list.

    {{<image filename="images/rc/database-list-columns.png" alt="Use the columns toggle to display column options." >}}

- Select the **Export** button to export the current view as a CSV file.

    {{<image filename="images/rc/icon-export-to-csv.png" alt="The Export button exports the current list view to CSV." >}}

- Sort the list in descending or ascending order using the arrow displayed to right of the field name in the header.  Supported fields include **Subscription**, **Database name**, **Memory usage**, and **Version**.

    {{<image filename="images/rc/icon-list-sort-asc.png#no-click" alt="Use the arrows in the list header to sort the list." class="inline">}} {{<image filename="images/rc/icon-list-sort-desc.png#no-click" alt="The direction of the arrow corresponds to the direction of the sort." class="inline">}}

    Select the arrow icon to change the sort order.  One sort order can be active at any given time.

- Use the controls in the list footer to change the number of items displayed in the list or to navigate.

Sort orders and filter expressions are not saved between console sessions.

## Other actions and info

The **View Database** screen also has tabs that let you view:

- **Metrics**: a series of graphs showing database performance over time.  See [Monitor performance]({{< relref "/operate/rc/databases/monitor-performance" >}}) for more information.

- **Slowlog**: a log showing recent [slow queries]({{< relref "/commands/slowlog" >}}) run against your database.  The log displays when the action started, the duration, the complexity of the operation, and any parameters passed to the operation.


## Edit database details

Use the **Edit** button to edit database details.

{{<image filename="images/rc/button-database-edit.png" alt="The Edit button lets you change selected database properties." width=100px >}}

Because databases exist within the context of a deployment, certain fields cannot be updated, especially those that might lead to data loss.

Here's what you can change:

| Section | Setting                        | Comments |
|:-----------|:-------------------------------|:---------|
| General | Database name                  ||
| | Supported protocol(s)                  ||
| | Tags                                   ||
| Performance | Dataset size                   | |
| | High-availability                     | _Paid plans only_ |
| | Throughput                     | _Pro plans only_ |
| | Hashing policy                 | _Pro plans only_ |
| | OSS Cluster API                | _Pro plans only_ |
| Durability | Data persistence                | _Paid plans only_ |
| | Data eviction policy           | |
| | Remote backup                  | _Paid plans only_ |
| | Active-Passive Redis           | _Pro plans only_ |
| Security | Default user                   | |
| | Default user password          |
| | CIDR allow list                | _Paid plans only_ |
| | Transport layer security (TLS) | _Pro plans only_ |
| Alerts | all available for plan type |

Choose **Save database** to save your changes.

{{<image filename="images/rc/button-database-save.png" alt="Use the Save database button to save database changes." >}}

If you need to change other details, create a new database and then migrate existing data.
