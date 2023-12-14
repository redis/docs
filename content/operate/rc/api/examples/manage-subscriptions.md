---
Title: Create and manage subscriptions
alwaysopen: false
categories:
- docs
- operate
- rc
description: This article describes how to create and manage a subscription using
  `cURL` commands.
weight: 10
---

The Redis Cloud REST API lets you create and manage all kinds of subscriptions. The examples in this article refer to Flexible subscriptions.

## Create a subscription

Use `POST /v1/subscriptions` to create a subscription.

```sh
POST "https://[host]/v1/subscriptions"
{
    "name": "Basic subscription example",
    "paymentMethodId": <payment_id>,
    "cloudProviders": [
      {
        "cloudAccountId": <account_id>,
        "regions": [
          {
            "region": "us-east-1",
            "networking": {
              "deploymentCIDR": "10.0.0.0/24"
            }
          }
        ]
      }
    ],
    "databases": [
      {
        "name": "Redis-database-example",
        "memoryLimitInGb": 1.1
      }
    ]
}
```

Modify the following parameters in the sample JSON document to create a subscription on your own account:

- **`paymentMethodId`** - Specify a payment method connected to your account.

    Use `GET /payment-methods` to find a payment method ID.

    You don't need to pass this field in your API request if you subscribed to Redis Cloud through Google Cloud Marketplace.

- **`cloudAccountId`** - Set a cloud account ID connected to your account.

    To list cloud account IDs, use `GET /cloud-accounts`. To use internal resources, set it to `"cloudAccountId": 1`.

    If you subscribed to Redis Cloud through Google Cloud Marketplace, use `1` for this field.

The request JSON body contains two primary segments: subscription specification and databases specification. When you create a subscription, you must specify one or more databases in the "`databases`" array.

You can include the contents of the JSON document in the `POST /subscriptions` operation in the [Swagger UI](https://api.redislabs.com/v1/swagger-ui.html). See [Swagger user interface]({{< relref "/operate/rc/api/get-started/use-rest-api#swagger-user-interface" >}}) for more details.

{{< note >}}
The Swagger UI generates default JSON examples for `POST` and `PUT` operations. You can reference these examples and modify them to fit your specific needs and account settings. The examples will fail if used as-is.
{{< /note >}}

The response body contains the `taskId` for the task that creates the subscription. You can use `GET /v1/tasks/<taskId>` to track the task's status.

## Update a subscription

Use `PUT /v1/subscriptions/<subscriptionId>` to update a subscription.

```sh
PUT "https://[host]/v1/subscriptions/<subscriptionId>"
{
    "name": "new-subscription-name",
    "paymentMethodId": <payment_id>
}
```

You can only change the following settings with this endpoint:
- **`name`** - Specify a new name for your subscription.

- **`paymentMethodId`** - Specify a different payment method connected to your account.

    Use `GET /payment-methods` to find a payment method ID.

The response body contains the `taskId` for the task that updates the subscription. You can use `GET /v1/tasks/<taskId>` to track the task's status.

## Delete a subscription

Use `DELETE /v1/subscriptions/<subscriptionId>` to delete a subscription.

```sh
DELETE "https://[host]/v1/subscriptions/<subscriptionId>"
```
The response body contains the `taskId` for the task that deletes the subscription. You can use `GET /v1/tasks/<taskId>` to track the task's status.
