---
Title: Create and manage databases
alwaysopen: false
categories:
- docs
- operate
- rc
description: This article describes how to create and manage a database using `cURL`
  commands.
linkTitle: Create databases
weight: 20
---

You can use the Redis Cloud REST API to create databases.

These examples use the [`cURL` utility]({{< relref "/operate/rc/api/get-started/use-rest-api#use-the-curl-http-client" >}}). You can use any REST client to work with the Redis Cloud REST API. The examples in this article refer to Redis Cloud Pro databases. 

## Create a database

To create a database, use `POST /subscriptions/{subscription-id}/databases`

The database is created in an existing or a newly created subscription.

When a subscription is created, it is created with at least one database.

You can add databases to the subscription; you can also update or delete existing databases.

Creating a database is an [asynchronous operation]({{< relref "/operate/rc/api/get-started/process-lifecycle" >}}).

The following API call creates a database.

```shell
POST "https://[host]/v1/subscriptions/$SUBSCRIPTION_ID/databases"
{
  "name": "Database-example-basic",
  "memoryLimitInGb": 10,
  "password": "P@ssw0rd"
}
```

The JSON body contains only the most basic, required parameters in order to create a database:

- Database name - A unique name per subscription that can contain only alphanumeric characters and hyphens
- Maximum database size in GB
- Database password

### Additional database parameters

There are many additional parameters and settings that can be defined on database creation. Review the database parameters and options in the [Full API documentation]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/createDatabase" >}}).