---
Title: Create and manage subscriptions
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes how to create and manage a subscription using the Redis Cloud API.
weight: 10
---

The Redis Cloud REST API lets you create and manage all kinds of subscriptions. 

## Redis Cloud Essentials

### Create an Essentials subscription

Use [`POST /v1/fixed/subscriptions`]({{< relref "/operate/rc/api/api-reference#tag/Subscriptions-Essentials/operation/createSubscription_1" >}}) to create an Essentials subscription.

```sh
POST "https://[host]/v1/fixed/subscriptions"
{
    "name": "My new subscription",
    "planId": <plan_id>,
    "paymentMethodId": <payment_id>
}
```

Modify the following parameters in the sample JSON document to create a subscription on your own account:

- **`paymentMethodId`** - Specify a payment method connected to your account.

    Use [`GET /v1/payment-methods`]({{< relref "/operate/rc/api/api-reference#tag/Account/operation/getAccountPaymentMethods" >}}) to find a payment method ID.

    You don't need to pass this field in your API request if you subscribed to Redis Cloud through a marketplace integration.

- **`planId`** - Specify an essentials plan to create.

    Use [`GET /v1/fixed/plans`]({{< relref "/operate/rc/api/api-reference#tag/Subscriptions-Essentials/operation/getAllFixedSubscriptionsPlans" >}}) to get a list of plan IDs.

After you create an Essentials subscription, you must use the [`POST /v1/fixed/subscriptions/{subscriptionId}/databases`]({{< relref "/operate/rc/api/api-reference#tag/Databases-Essentials/operation/createFixedDatabase" >}}) endpoint to create the database.

You can include the contents of the JSON document in the `POST /v1/fixed/subscriptions` operation in the [Swagger UI](https://api.redislabs.com/v1/swagger-ui.html). See [Swagger user interface]({{< relref "/operate/rc/api/get-started/use-rest-api#swagger-user-interface" >}}) for more details.

{{< note >}}
The Swagger UI generates default JSON examples for `POST` and `PUT` operations. You can reference these examples and modify them to fit your specific needs and account settings. The examples will fail if used as-is.
{{< /note >}}

The response body contains the `taskId` for the task that creates the subscription. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.

### Update an Essentials subscription

Use [`PUT /v1/fixed/subscriptions/{subscriptionId}`]({{< relref "/operate/rc/api/api-reference#ADD-TAG" >}}) to update an Essentials subscription.

```sh
PUT "https://[host]/v1/fixed/subscriptions/{subscriptionId}"
{
    "name": "new-subscription-name",
    "planId": <plan_id>,
    "paymentMethodId": <payment_id>
}
```

You can only change the following settings with this endpoint:
- **`name`** - Specify a new name for your subscription.

- **`planId`** - Specify a new Essentials plan to change to.

    Use [`GET /v1/fixed/plans`]({{< relref "/operate/rc/api/api-reference#tag/Subscriptions-Essentials/operation/getAllFixedSubscriptionsPlans" >}}) to get a list of plan IDs.

    You can only change to a plan that:
      - Is in the same cloud provider and region of your current plan.
      - Has a compatible [High-availability option]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) to your current plan. For example, if your current plan has single-zone replication, you cannot switch to a plan with multi-zone replication, but you can switch to a plan with no replication. If your current plan has multi-zone replication, you must switch to a plan with multi-zone replication.

- **`paymentMethodId`** - Specify a different payment method connected to your account.

    Use [`GET /v1/payment-methods`]({{< relref "/operate/rc/api/api-reference#tag/Account/operation/getAccountPaymentMethods" >}}) to find a payment method ID.

The response body contains the `taskId` for the task that updates the subscription. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.

### Delete an Essentials subscription

Use [`DELETE /v1/fixed/subscriptions/{subscriptionId}`]({{< relref "/operate/rc/api/api-reference#ADD-TAG" >}}) to delete a subscription.

```sh
DELETE "https://[host]/v1/fixed/subscriptions/{subscriptionId}"
```
The response body contains the `taskId` for the task that deletes the subscription. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.

## Redis Cloud Pro

### Create a Pro subscription

Use [`POST /v1/subscriptions`]({{< relref "/operate/rc/api/api-reference#ADD-TAG" >}}) to create a Pro subscription.

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

    Use [`GET /v1/payment-methods`]({{< relref "/operate/rc/api/api-reference#tag/Account/operation/getAccountPaymentMethods" >}}) to find a payment method ID.

    You don't need to pass this field in your API request if you subscribed to Redis Cloud through a marketplace integration.

- **`cloudAccountId`** - Set a cloud account ID connected to your account.

    To list cloud account IDs, use [`GET /v1/cloud-accounts`]({{< relref "/operate/rc/api/api-reference#ADD-TAG" >}}). 
    
    You don't need to pass this field in your API request if you want to use internal resources.

The request JSON body contains two primary segments: subscription specification and databases specification. When you create a subscription, you must specify one or more databases in the "`databases`" array.

You can include the contents of the JSON document in the `POST /subscriptions` operation in the [Swagger UI](https://api.redislabs.com/v1/swagger-ui.html). See [Swagger user interface]({{< relref "/operate/rc/api/get-started/use-rest-api#swagger-user-interface" >}}) for more details.

{{< note >}}
The Swagger UI generates default JSON examples for `POST` and `PUT` operations. You can reference these examples and modify them to fit your specific needs and account settings. The examples will fail if used as-is.
{{< /note >}}

The response body contains the `taskId` for the task that creates the subscription. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.

### Update a Pro subscription

Use [`PUT /v1/subscriptions/{subscriptionId}`]({{< relref "/operate/rc/api/api-reference#ADD-TAG" >}}) to update a Pro subscription.

```sh
PUT "https://[host]/v1/subscriptions/{subscriptionId}"
{
    "name": "new-subscription-name",
    "paymentMethodId": <payment_id>
}
```

You can only change the following settings with this endpoint:
- **`name`** - Specify a new name for your subscription.

- **`paymentMethodId`** - Specify a different payment method connected to your account.

    Use [`GET /v1/payment-methods`]({{< relref "/operate/rc/api/api-reference#tag/Account/operation/getAccountPaymentMethods" >}}) to find a payment method ID.

The response body contains the `taskId` for the task that updates the subscription. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.

### Delete a Pro subscription

Use [`DELETE /v1/subscriptions/{subscriptionId}`]({{< relref "/operate/rc/api/api-reference#ADD-TAG" >}}) to delete a subscription.

```sh
DELETE "https://[host]/v1/subscriptions/{subscriptionId}"
```
The response body contains the `taskId` for the task that deletes the subscription. You can use [`GET /v1/tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to track the task's status.
