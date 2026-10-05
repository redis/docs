---
alwaysopen: false
categories:
- docs
- operate
- iris
description: View and manage Context Retriever admin keys in Redis Cloud.
hideListLinks: true
linktitle: View admin keys
title: View and manage Context Retriever admin keys
weight: 25
aliases:
- /operate/rc/context-engine/context-retriever/view-admin-keys/
---

After you have [created your first Context Retriever service]({{< relref "/operate/iris/context-retriever/create-service" >}}), you can view and manage your admin keys from the **Admin keys** tab in the **Context Retriever** section of the Redis Cloud console.

A Context Retriever **admin key** authorizes administrative operations against Context Retriever in your Redis Cloud account, such as creating, updating, or deleting services and their entity models. You can use it with the [Context Surfaces Python Client](https://pypi.org/project/redis-context-retriever/) and `cxtctl` CLI to create an Agent key and call your tools.

## Admin keys tab

From the [Redis Cloud console](https://cloud.redis.io/), select **Context Retriever** from the left-hand menu, then select the **Admin keys** tab.

![The Admin keys tab showing the list of admin keys.](/images/rc/context-retriever-admin-keys-list.png)

This tab shows a list of all admin keys associated with Context Retriever in your account. Here, you can generate a new admin key or remove any keys that are no longer in use. You can generate or remove admin keys at any time.

| Column | Description |
|:-------|:------------|
| **Name** | The name you assigned to the admin key when you created it. |
| **Value** | An abbreviated value of the admin key. |
| **Created** | The date and time the admin key was generated. |

## Generate a new admin key

To generate a new admin key:

1. Select **New admin key**.

    ![The New admin key button.](/images/rc/context-retriever-new-admin-key.png)
    {width="150px"}

1. Enter a name for your admin key.

    ![The Add admin key window.](/images/rc/context-retriever-add-admin-key.png)
    {width="37.5%"}

1. Select **Generate key** to generate your new admin key.

1. The new key will appear in a dialog box. Select **Copy** to copy the key to the clipboard.

    ![The Context Retriever admin key window. Use the Copy button to save the admin key to the clipboard.](/images/rc/context-retriever-admin-key.png)
    {width="40%"}

    > [!WARNING]
    > This is the only time the value of the admin key is available. Save it to a secure location before closing the dialog box.<br/><br/>
    >
    > If you lose the admin key value, you will need to generate a new admin key.

## Delete an admin key

To delete an admin key, select the **Delete admin key** button next to the key you want to remove.

![Delete button.](/images/rc/icon-delete-lb.png)
{width="36px"}

Deleting an admin key immediately revokes any administrative operations that rely on it. This action cannot be undone.
