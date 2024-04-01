---
Title: Advanced capabilities
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes Redis Cloud Advanced capability options
headerRange: '[1-3]'
toc: 'true'
weight: $weight
---

Advanced capabilities extend Redis database functionality by adding new data types and options.  

Available options depend on your database plan and **Type**.

## Redis Cloud Essentials {#essentials}

All Redis Cloud Essentials databases support [Redis Stack]({{< relref "/operate/oss-and-stack/" >}}), which enables the most frequently used capabilities.

{{<image filename="images/rc/new-database-general-type-free-stack.png" alt="For Essentials, the Type setting in the General section includes an option for Redis Stack." width="75%">}}

When the database **Type** is set to _Redis Stack_, the Advanced capabilities section of the database details page displays the advanced capabilities included with the database and their versions.

{{<image filename="images/rc/database-details-modules-stack-free.png" alt="For Essentials, the Database details page lists the capabilities and versions added by Redis Stack." width="75%">}}

Redis Cloud is updated on a regular basis, which includes the advanced capabilities supported by the service. Versions displayed by the admin console may vary from those shown above.  For the latest details of any capability, see [Redis Stack and Redis Enterprise]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}). 

## Redis Cloud Pro advanced capability options {#pro}

Redis Cloud Pro lets you choose advanced capabilities for each database.

{{<image filename="images/rc/database-details-redis-module-select-flexible.png" alt="For Pro databases, you can select the capabilites included in your database." width="75%">}}

You can select more than one advanced capability for a database, though there are limits:

- The following advanced capabilities can be combined in Pro databases:

    - Search and query
    - JSON
    - Time series
    - Probabilistic

- Graph cannot be combined with other capabilities.
- JSON is the only capability supported for [Active-Active databases]({{< relref "/operate/rc/databases/create-database/create-active-active-database" >}}).

You don't have to combine capabilities.  To remove a selected capability, either clear the checkbox in the menu or select its **Delete** icon.  

{{<image filename="images/rc/icon-checkbox-clear.png" alt="To remove a selected capability, clear the checkbox in the menu." width="30px" class="inline">}}&nbsp;{{<image filename="images/rc/icon-module-delete.png" alt="You can also use the delete icon to remove a capability." width="30px" class="inline">}}

To learn more, see [Redis Stack]({{< relref "/develop/get-started/" >}}) and [Redis Stack and Redis Enterprise]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}).