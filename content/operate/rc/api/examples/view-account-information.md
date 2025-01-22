---
Title: View account information
alwaysopen: false
categories:
- docs
- operate
- rc
description: Get initial information on account parameters
weight: 70
draft: true
---
<!-- This article is removed since it was duplicated with the REST API reference. I decided to keep it as a draft just in case. -->

The root API operation returns information about the current account, user, and API Key (as identified by the set of API Keys provided in the API request).

```shell
GET "https://[host]/v1/subscriptions/<subscription_id>/databases/<database_id>/metrics?metricSpan=1hour"
```

Here is an example of the API operation response:

```json
{
  "account": {
    "id": 654321,
    "name": "Redis",
    "createdTimestamp": "2018-12-23T15:15:31Z",
    "updatedTimestamp": "2019-07-04T12:22:04Z",
    "key": {
      "name": "jay-doe-api-key-6",
      "accountId": 654321,
      "accountName": "Redis account for Jay Doe",
      "allowedSourceIps": [
        "192.0.2.0/24"
      ],
      "createdTimestamp": "2019-06-06T07:41:14Z",
      "owner": {
        "name": "Jay Doe",
        "email": "jay.doe@redislabs.com"
      },
      "httpSourceIp": "192.0.2.0"
    }
  }
}
```

The above example contains:

- **httpSourceIp**: The public source IP of the current user
- **allowedSourceIps**: Restricts the current API Key access to requests originating from IP addresses that reside within the specified IP range
