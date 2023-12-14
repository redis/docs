---
Title: System logs
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
weight: 35
---
The **Logs** page contains events, alerts, and logs from the activities, databases, and subscriptions associated with your account.

{{<image filename="images/rc/system-logs.png" alt="Choose the Logs command from the Redis Cloud admin console menu to view your subscription system log." width="100%">}}{{< /image >}} 

You can:

* Sort the list by a specific field in descending or ascending order. Supported fields include *Time*, *Originator*, *Database name*, *API key name*, and *Activity*.

    {{<image filename="images/rc/icon-database-list-sort-ascending.png" alt="Use the arrows in the list header to sort the list." width="30px">}}{{< /image >}}&nbsp;{{<image filename="images/rc/icon-database-list-sort-descending.png" alt="The direction of the arrow corresponds to the direction of the sort." width="30px">}}{{< /image >}}    
    
    Select the arrow icon to change the sort order.  You can only sort by one field at a time.

* Use the **Export all** button to export all logs as a comma-separated values (CSV) file for use in other systems and programs.

    {{<image filename="images/rc/system-logs-export.png" alt="Use the export all button in the top right to export all logs to a CSV file" width="130px">}}{{< /image >}} 

* Use the refresh button to refresh the system logs.

    {{<image filename="images/rc/system-logs-refresh.png" alt="Use the refresh button in the top right to refresh the system logs" width="40px">}}{{< /image >}}

* Use the search bar to search for specific entries. Supported fields include *Originator*, *Database name*, *API key name*, *Activity*, and *Description*.