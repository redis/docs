---
Title: Update databases
alwaysopen: false
categories:
- docs
- operate
- rc
description: How to construct requests that update an existing database.
weight: 30
---

The API operation that updates an existing database is: `PUT /subscriptions/{subscription-id}/databases/{database-id}`

This API operation uses the same [provisioning lifecycle]({{< relref "/operate/rc/api/get-started/process-lifecycle.md" >}}) as the [create database]({{< relref "/operate/rc/api/examples/create-database.md" >}}) operation. The examples in this article refer to databases that are part of Flexible subscriptions. 

## Database update request JSON body

The primary component of a database update request is the JSON request body that contains the details of the requested database changes.

You can see [the complete set of JSON elements]({{< relref "/operate/rc/api/get-started/use-rest-api#inputs-for-operations-in-swagger" >}}) accepted by the database update API operation in the [Swagger UI](https://api.redislabs.com/v1/swagger-ui.html).
To see the JSON elements, expand the specific API operation and, in the request section, click **Model**.

Here are several examples of JSON requests to update a database:

### Add or remove Replica Of

Setting one or more source Redis databases configures the updated database as a Replica Of destination database for the specified Redis databases.

#### Add a source database

The following JSON request specifies two source databases for the updated database:

```json
{
  "replicaOf": [
    "redis://redis-12345.c9876.us-east-1-mz.ec2.cloud.rlrcp.com:12345"
    , "redis://redis-54321.internal.c9876.us-east-1-mz.ec2.cloud.rlrcp.com:54321"
  ]
}
```

- The `replicaOf` array contains one or more URIs with the format: `redis://user:password@host:port`
- If the URI provided belongs to the same account, you can provide just the host and port (example: `["redis://endpoint1:6379', "redis://endpoint2:6380"]`)

{{< warning >}}
If a source database is already defined for a specific database, and the goal is to add an additional source database, the source databases URI for the existing source must be included in the database updates JSON request.
{{< /warning >}}

#### Remove a source database

To remove a source database from the `replicaOf` list, submit a JSON request that does not include the specific source database URI.

##### Example:

Given a database that has two defined source databases:

```json
{
  "replicaOf": [
    "redis://redis-12345.c9876.us-east-1-mz.ec2.cloud.rlrcp.com:12345"
    , "redis://redis-54321.internal.c9876.us-east-1-mz.ec2.cloud.rlrcp.com:54321"
  ]
}
```

- You can use this JSON request to remove one of the two source databases:

```json
{
  "replicaOf": [
    "redis://redis-12345.c9876.us-east-1-mz.ec2.cloud.rlrcp.com:12345"
  ]
}
```

- You can use this JSON request to remove all source databases:

```json
{
  "replicaOf": []
}
```

#### Viewing database Replica Of information

The API operation `GET /subscriptions/{subscription-id}/databases/{database-id}` returns information on a specific database, including the Replica Of endpoints defined for the specific database.
