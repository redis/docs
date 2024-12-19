---
Title: Create and manage databases
alwaysopen: false
categories:
- docs
- operate
- rc
description: This article describes how to create and manage a database using the Redis Cloud API.
linkTitle: Create and manage databases
weight: 20
---

You can use the Redis Cloud REST API to create and manage databases.

## Redis Cloud Essentials

### Create an Essentials database

To create a Redis Cloud Essentials database, use [`POST /fixed/subscriptions/{subscriptionId}/databases`]({{< relref "/operate/rc/api/api-reference#tag/Databases-Essentials/operation/createFixedDatabase" >}}).

This call creates a database in the specified subscription. Use [`GET /fixed/subscriptions`]({{< relref "/operate/rc/api/api-reference#tag/Subscriptions-Essentials/operation/getAllSubscriptions_1" >}}) to get a list of Essentials subscriptions and their IDs. 

```shell
POST "https://[host]/v1/fixed/subscriptions/{subscriptionId}/databases"
{
  "name": "Basic-essentials-database-example"
}
```

This example JSON body contains only the most basic, required parameters to create a database:

- `name`: The database name. A unique name per subscription that can contain only alphanumeric characters and hyphens

There are other additional parameters and settings that can be defined on database creation. Review the database parameters and options in the [full API reference]({{< relref "/operate/rc/api/api-reference#tag/Databases-Essentials/operation/createFixedDatabase" >}}). 

Some options may not be compatible with your selected plan. Use [`GET /fixed/subscriptions/{subscriptionId}`]({{< relref "/operate/rc/api/api-reference#tag/Subscriptions-Essentials/operation/getFixedSubscriptionsPlansBySubscriptionId" >}}) to view the plan you have selected and what options it supports.

The response body contains the `taskId` for the task that creates the database. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.

### Update an Essentials database

To update a Redis Cloud Essentials database, use [`PUT /fixed/subscriptions/{subscriptionId}/databases/{databaseId}`]({{< relref "/operate/rc/api/api-reference#tag/Databases-Essentials/operation/deleteFixedDatabaseByID" >}}). 

The primary component of a database update request is the JSON request body that contains the details of the requested database changes. You can see the full set of changes you can make in the [full API reference]({{< relref "/operate/rc/api/api-reference#tag/Databases-Essentials/operation/deleteFixedDatabaseByID" >}}).

Some options may not be compatible with your selected plan. Use [`GET /fixed/subscriptions/{subscriptionId}`]({{< relref "/operate/rc/api/api-reference#tag/Subscriptions-Essentials/operation/getFixedSubscriptionsPlansBySubscriptionId" >}}) to view the plan you have selected and what options it supports.

The response body contains the `taskId` for the task that updates the database. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.

## Redis Cloud Pro

### Create a Pro database

If you want to create a Pro database in a new subscription, see [Create a Pro subscription]({{< relref "/operate/rc/api/examples/manage-subscriptions#create-a-pro-subscription" >}}).

To create a Redis Cloud Pro database in an existing subscription, use [`POST /subscriptions/{subscriptionId}/databases`]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/createDatabase" >}}).

This call creates a database in the specified subscription. Use [`GET /subscriptions`]({{< relref "/operate/rc/api/api-reference#tag/Subscriptions-Pro/operation/getAllSubscriptions" >}}) to get a list of subscriptions and their IDs. 

```shell
POST "https://[host]/v1/subscriptions/{subscriptionId}/databases"
{
  "name": "Basic-database-example",
  "datasetSizeInGb": 1
}
```

This example JSON body contains only the most basic, required parameters to create a database:

- `name`: The database name. A unique name per subscription that can contain only alphanumeric characters and hyphens
- `datasetSizeInGb`: Maximum dataset size in GB

There are many additional parameters and settings that can be defined on database creation. Review the database parameters and options in the [full API reference]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/createDatabase" >}}).

The response body contains the `taskId` for the task that creates the database. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.

### Update a Redis Cloud Pro database

To update a Redis Cloud Pro database, use [`PUT /subscriptions/{subscriptionId}/databases/{databaseId}`]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/updateDatabase" >}}). 

The primary component of a database update request is the JSON request body that contains the details of the requested database changes. You can see the full set of changes you can make in the [full API reference]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/updateDatabase" >}}).

The response body contains the `taskId` for the task that updates the database. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.