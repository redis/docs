---
Title: Create and manage databases
alwaysopen: false
categories:
- docs
- operate
- rc
description: This article describes how to create and manage a database using `cURL`
  commands.
linkTitle: Create and manage databases
weight: 20
---

You can use the Redis Cloud REST API to create and manage databases.

## Redis Cloud Essentials

## Redis Cloud Pro

### Create a Redis Cloud Pro database

To create a Redis Cloud Pro database, use `POST /subscriptions/{subscriptionId}/databases`.

This call creates a database in the specified subscription. Use `GET /subscriptions` to get a list of subscriptions and their IDs. 

Creating a database is an [asynchronous operation]({{< relref "/operate/rc/api/get-started/process-lifecycle" >}}).

The following API call creates a database.

```shell
POST "https://[host]/v1/subscriptions/{subscriptionId}/databases"
{
  "name": "Database-example-basic",
  "memoryLimitInGb": 10,
  "password": "P@ssw0rd"
}
```

The example JSON body contains only the most basic, required parameters in order to create a database:

- Database name - A unique name per subscription that can contain only alphanumeric characters and hyphens
- Maximum database size in GB
- Database password

There are many additional parameters and settings that can be defined on database creation. Review the database parameters and options in the [Full API documentation]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/createDatabase" >}}).