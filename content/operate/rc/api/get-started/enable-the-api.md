---
Title: Enable the API
alwaysopen: false
categories:
- docs
- operate
- rc
description: Use the Redis Cloud dashboard to enable the REST API.
weight: 10
---

If you have a Redis Cloud account, you can use a REST API to manage your subscriptions and databases programmatically.

For security reasons, the Redis Cloud API is inactive by default.

To enable the API:

1. Sign in to your [Redis Cloud account](https://cloud.redis.io) as an account owner.
1. From the menu, choose **Access Management**.
1. When the **Access Management** screen appears, select the **API Keys** tab.

    {{<image filename="images/rc/access-management-api-keys-tab.png" width="75%" alt="Use the **API Keys** tab of the **Access Management** screen to manage your REST API keys." >}}

1. If a **Copy** button appears to the right of the API account key, the API is enabled.  This button copies the account key to the Clipboard.

    {{<image filename="images/rc/button-copy.png" alt="Use the **Copy** button to copy the access key to the Clipboard." >}}

    If you see an **Enable API** button, select it to enable the API and generate your API account key.

    {{<image filename="images/rc/button-access-management-enable-api.png" alt="Use the **Enable API** button to enable the REST API for your account." >}}

To authenticate REST API calls, you need to use both the API account key and an [API user key]({{< relref "/operate/rc/api/get-started/manage-api-keys#api-user-keys" >}}) to make API calls.

Only account owners can see the access key in the account settings and give API access to other users.

{{< warning >}}
Make sure that you keep your access keys secret. Anyone who sends an API request with a valid access key can make changes to your account.
{{< /warning >}}

To manage your API keys or to limit IP addresses for user keys, see [Manage API keys]({{< relref "/operate/rc/api/get-started/manage-api-keys.md" >}}).
