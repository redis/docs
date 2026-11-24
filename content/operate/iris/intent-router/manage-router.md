---
alwaysopen: false
categories:
- docs
- operate
- iris
description: View and manage an Intent Router and its intents in Redis Cloud.
hideListLinks: true
linktitle: Manage router
title: View and manage an Intent Router
weight: 15
---

After you [create an Intent Router](/content/operate/iris/intent-router/create-router.md), select **Intent Router** under **Iris** in the Redis Cloud console menu to see the list of your Routers.

The list shows each Router's **Status**, **Name**, **Router ID**, **Embedding model**, **Minimum score**, **Related Database**, and **Configuration updated date**. Select a Router to open it.

<!-- TODO: screenshot of the Intent Router list. -->

| Status | Meaning |
|:-------|:--------|
| **Provisioning** | Intent Router is building the Router's search index. The Router can't serve requests yet. |
| **Ready** | The Router serves requests. |
| **Suspended** | The Router keeps its intents but doesn't serve requests. |
| **Failed** | The Router couldn't be provisioned. Its **Configuration** tab shows why. |
| **Deleting** | Intent Router is removing the Router. |

A failed Router can't be resumed. Delete it and create it again after you fix the cause.

The Router's page has the **Configuration** and **Intents** tabs, and opens on the **Configuration** tab. Select **Connect** on the Router's page to [connect an application](/content/operate/iris/intent-router/create-router.md#connect-an-application).

## Configuration tab

The **General settings** section shows the Router's **Router ID**, its **Embedding model**, its **Redis Cloud database**, its **Status**, its **Template**, its **Created date**, and its **Configuration updated date**. To change a setting, select **Edit**, make your changes, and select **Save changes**.

| Setting | Description |
|:--------|:------------|
| **Router name** | The Router's name, up to 128 characters. |
| **Description** | An optional description. |
| **Minimum score** | How similar a request must be to an intent's examples to match, from 0.01 to 1. |

You can't change a Router's embedding model or database after you create it.

If someone else changed the Router while you were editing, the console asks you to reload it and apply your changes again.

### Suspend or resume a Router

Suspend a Router to stop it serving requests without deleting its intents. Requests to a suspended Router fail until you resume it.

1. On the Router's **Configuration** tab, find the **Availability** section.
1. Turn the switch off to suspend the Router, or on to resume it.

You can suspend or resume a Router only when it's **Ready** or **Suspended**.

### Delete a Router

Deleting a Router permanently removes it with its intents and examples, and applications that use it lose access right away.

1. On the Router's **Configuration** tab, select **Delete** in the **Danger zone** section.
1. Select the **Yes, I want to delete this resource** checkbox.
1. Select **Delete**.

This action can't be undone.

<!-- TODO: confirm whether deleting a Router in Redis Cloud revokes its agent keys. In self-managed deployments it doesn't. -->

## Intents tab

The **Intents** tab lists the Router's intents, with each one's name, **When it should win** description, **Target**, and number of **Examples**. You can view intents only while the Router is **Ready**.

From this tab, you can:

- [Add an intent](/content/operate/iris/intent-router/create-router.md#add-intents) with **New intent**.
- Expand an intent to see its example commands, add examples, or remove them.
- Use an intent's actions menu to edit or delete it.
- Test how the Router classifies a request under **Try a query**.

The console doesn't set an intent's target or its own minimum score. To set them, use the [data-plane API or a client](/content/develop/ai/context-engine/intent-router/manage-intents.md).

### Manage examples

Expand an intent to see its **Example commands**.

- To add an example, enter it under **New example command** and press Enter. To add several at once, paste one per line.
- To remove an example, select **Remove**. The console removes it right away, without asking you to confirm.

An intent holds up to 256 examples, each up to 2,048 characters. You can't edit an example. Remove it and add the new wording instead.

### Edit an intent

1. Select **Edit** in the intent's actions menu.
1. Change **When it should win**.
1. Select **Save changes**.

You can't rename an intent. To use a new name, create an intent with that name and delete the old one.

### Delete an intent

Deleting an intent removes it with its examples.

1. Select **Delete** in the intent's actions menu.
1. Select the **Yes, I want to delete this resource** checkbox.
1. Select **Delete**.

This action can't be undone.

### Try a query

Under **Try a query**, enter a request such as `Where is my order?` and select **Match**. The console lists the intents that match, best first, with each one's score. If no intent scores at least the Router's minimum score, the console shows **No intent matched**.
