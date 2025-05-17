---
Title: Manage API tasks
alwaysopen: false
categories:
- docs
- operate
- rc
description: A task is an API operation that is performed asynchronously because it
  exceeds the time allowed for the synchronous request/response model.
linkTitle: Manage tasks
weight: 50
---

Examples of API operations that use tasks are:

- create subscription
- create database
- update database
- delete database

All create, update, and delete API operations (`POST`, `PUT`, and `DELETE`) and some query operations (`GET`) use tasks.

After you request an asynchronous operation, the operation returns a `taskId` that identities the specific task, and contains contextual and status data on the API operation performed by the task.

Tasks are part of the API [processing and provisioning lifecycle]({{< relref "/operate/rc/api/get-started/process-lifecycle" >}}).

## Task information

When you request an asynchronous operation, the response to the request includes the task status and additional information about the task:

```json
{
  "taskId": "f3ec0e7b-0548-46e3-82f3-1977012ec738",
  "commandType": "subscriptionCreateRequest",
  "status": "received",
  "description": "Task request received and is being queued for processing.",
  "timestamp": "2019-08-08T09:07:39.826Z",
  "_links": {
    "task": {
      "href": "https://api.redislabs.com/v1/tasks/f3ec0e7b-0548-46e3-82f3-1977012ec738",
      "title": "getTaskStatusUpdates",
      "type": "GET"
    }
  }
}
```

Where:

- `taskId` - The unique identifier (UUID) of the specific task
- `commandType` - The request (command) type
- `status` - The [status]({{< relref "/operate/rc/api/get-started/process-lifecycle#task-process-states" >}}) of the task
- `description` - A description of the status
- `timestamp` - The time of the response in ISO-8601 date format and in the UTC timezone
- `_links` - URI links to resources related to the task including:
    - A link to itself
    - Additional links based on the context of the response

## Task status updates

With the task ID, you can query the task status for updates and progress information.
The response in the above example shows a URL with the title `getTaskStatusUpdates`.
The URL in the `href` property returns updates for the specified task.

Use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to check the task status.

This endpoint returns information about the queried task.

```json
{
  "taskId": "36d4b04d-72d4-4404-8600-a223120a553e",
  "commandType": "subscriptionCreateRequest",
  "status": "processing-completed",
  "description": "Request processing completed successfully and its resources are now being provisioned / de-provisioned.",
  "timestamp": "2019-08-08T06:49:15.929Z",
  "response": {
    "resourceId": 77899
  },
  "_links": {
    "resource": {
      "href": "https://api.redislabs.com/v1/subscriptions/77899",
      "title": "getSubscriptionInformation",
      "type": "GET"
    },
    "self": {
      "href": "https://api.redislabs.com/v1/tasks/36d4b04d-72d4-4404-8600-a223120a553e",
      "type": "GET"
    }
  }
}
```

This response example shows:

- The `status` value is `"processing-completed"`.
- The `response` field contains the resource identifier of the subscription resource changed by this task.
- The `links` array contains another `getSubscriptionInformation` URL that links to the newly created subscription.
    This link queries the subscription status during [provisioning]({{< relref "/operate/rc/api/get-started/process-lifecycle.md" >}}))

### Tasks list

You can use the API operation [`GET /tasks`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getAllTasks" >}}) to list the recently submitted and completed tasks for the current account.

This API operation returns a list of tasks for the current account, sorted by most recent status update.

The result returns all the tasks submitted during the past 10 days.
