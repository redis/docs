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

To create a Redis Cloud Essentials database, use 

## Redis Cloud Pro

### Create a Redis Cloud Pro database

To create a Redis Cloud Pro database, use `POST /subscriptions/{subscriptionId}/databases`.

This call creates a database in the specified subscription. Use `GET /subscriptions` to get a list of subscriptions and their IDs. 

```shell
POST "https://[host]/v1/subscriptions/{subscriptionId}/databases"
{
  "name": "Basic-database-example",
  "datasetSizeInGb": 1
}
```

This example JSON body contains only the most basic, required parameters in order to create a database:

- `name`: The database name. A unique name per subscription that can contain only alphanumeric characters and hyphens
- `datasetSizeInGb`: Maximum dataset size in GB

There are many additional parameters and settings that can be defined on database creation. Review the database parameters and options in the [full API reference]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/createDatabase" >}}).

### Update a Redis Cloud Pro database

To update a Redis Cloud Pro database, use `PUT /subscriptions/{subscriptionId}/databases/{databaseId}`. 

The primary component of a database update request is the JSON request body that contains the details of the requested database changes. You can see the full set of changes you can make in the [full API reference]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/updateDatabase" >}}).