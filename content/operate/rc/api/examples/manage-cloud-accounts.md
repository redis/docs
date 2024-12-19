---
Title: Create and manage cloud accounts
alwaysopen: false
categories:
- docs
- operate
- rc
description: Cloud accounts specify which account to use when creating and modifying
  infrastructure resources.
linkTitle: Manage cloud accounts
weight: 80
draft: true
---
<!-- This article is removed since it was duplicated with the REST API reference. I decided to keep it as a draft just in case. -->

You can use the Redis Cloud REST API to create and manage cloud accounts.

These examples use the [`cURL` utility]({{< relref "/operate/rc/api/get-started/use-rest-api#use-the-curl-http-client" >}}); you can use any REST client to work with the Redis Cloud REST API.

## Create a cloud account

To create a cloud account, use the `POST /v1/cloud-accounts` endpoint.

The created cloud account is defined by a JSON document that is sent as the body of the request.

```sh
POST https://[host]/v1/cloud-accounts
{
  "accessKeyId": "$ACCESS_KEY_ID",
  "accessSecretKey": "$ACCESS_SECRET_KEY",
  "consolePassword": "$CONSOLE_PASSWORD",
  "consoleUsername": "$CONSOLE_USERNAME",
  "name": "My new Cloud Account",
  "provider": "AWS",
  "signInLoginUrl": "https://$AWS_ACCOUNT_IDENTIFIER.signin.aws.amazon.com/console"
}
```

The POST response is a JSON document that contains the `taskId`. You can use `GET /v1/tasks/<taskId>` to track the status of the cloud account creation.
