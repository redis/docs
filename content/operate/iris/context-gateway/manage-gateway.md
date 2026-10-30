---
alwaysopen: false
categories:
- docs
- operate
- iris
description: View and manage a Context Gateway and its Upstreams in Redis Cloud.
hideListLinks: true
linktitle: Manage gateway
title: View and manage a Context Gateway
weight: 15
aliases:
- /operate/iris/context-retriever/view-service/
- /operate/iris/context-retriever/view-admin-keys/
---

After you [create a Context Gateway](/content/operate/iris/context-gateway/create-gateway.md), select **Context Gateways** under **Iris** in the Redis Cloud console menu to see the list of your Gateways.

The list shows each Gateway's **Name**, its **Tool exposure** mode, and its **Created date**. Select a Gateway to open it.

<!-- TODO: screenshot of the Context Gateways list. -->

The Gateway's page has the **Configuration** and **Upstreams** tabs, and opens on the **Configuration** tab.
<!-- TODO: add the Playground tab if it's on at GA -->

## Configuration tab

The **Configuration** tab starts with a banner for connecting agents. Select **Connect** or **Create API key** there to [connect an agent](/content/operate/iris/context-gateway/create-gateway.md#connect-an-agent).

The **General settings** section shows the Gateway's **Gateway ID**, its Model Context Protocol (MCP) endpoint (**MCP endpoint**), its **Created date**, and its **Configuration updated date**. To change a setting, select **Edit**, make your changes, and select **Save changes**.

| Setting | Description |
|:--------|:------------|
| **Name** | The Gateway's name, up to 128 characters. |
| **Description** | An optional description. |
| **Tool exposure** | **Search** or **Full**. Agents get the new mode on their next request. With many tools, full mode fills more of their context. |

If someone else changed the Gateway while you were editing, the console asks you to reload it and apply your changes again. If the Gateway is in search mode and serves only a few tools, the tab suggests full mode.

### Delete a Gateway

Deleting a Gateway removes its MCP endpoint, and agents that use it lose access right away. You can't delete a Gateway that has Upstreams, because deleting a Gateway never deletes its Upstreams for you. [Delete its Upstreams](#delete-an-upstream) first. Until you do, the **Danger zone** section lists them.

1. On the Gateway's **Configuration** tab, select **Delete gateway** in the **Danger zone** section.
1. Select the **Yes, I want to delete this resource** checkbox.
1. Select **Delete gateway**.

This action can't be undone.

## Upstreams tab

The **Upstreams** tab lists the Gateway's Upstreams, with each one's **Name**, **Namespace**, **Type** (**MCP server** or **Context Surface**), number of **Tools**, whether it's **Enabled**, and its **Created date**.

From this tab, you can:

- [Add an MCP server](/content/operate/iris/context-gateway/create-gateway.md#add-an-mcp-server) or [create a Context Surface](/content/operate/iris/context-gateway/create-gateway.md#create-a-context-surface).
- Turn an Upstream on or off with its **Enabled** switch. A disabled Upstream keeps its configuration and tools, but agents see none of its tools.
- Use an Upstream's actions menu to open, refresh, enable or disable, or delete it.

Select an Upstream to open its page, which has the **Configuration** and **Tools** tabs and opens on the **Configuration** tab.

### Refresh an Upstream

Select **Refresh** on an Upstream to discover an MCP server's tools again, or to regenerate a Context Surface's tools. Refresh after the server's tools change, or after you fix a problem that stopped discovery. If the refresh fails, the console shows the error and how to fix it.

### Tools tab

The **Tools** tab lists the Upstream's tools by their `namespace.tool` names, with each tool's description and annotations, such as **Read-only** or **Destructive**.

The tab also shows each tool's **Cache** and **Compression** policy. You can't change these policies in the console.
<!-- TODO: confirm whether the Redis Cloud docs should mention caching and compression at all for Nov 4. Redis Cloud doesn't serve them yet, but the Tools tab still shows both columns. -->

For a Context Surface, the **Entities** section shows its data model. Select **Edit data model** to change it. Saving regenerates the Surface's tools and removes the policies of any tools the new model drops.

### Configuration tab

The **Configuration** tab shows the Upstream's settings and its **Upstream ID**. In the **General** section, select **Edit name** to rename the Upstream, or use the **Status** switch to turn it on or off.

- For an MCP server, select **Edit MCP server** to change the **Endpoint URL** and the authentication. When you change the endpoint, enter every secret again, so the Gateway never sends credentials to a host you didn't intend. Saving discovers the server's tools again.
- For a Context Surface, you can replace the data model from a JavaScript Object Notation (JSON) file with **Replace from JSON**. Replacing the data model regenerates the Surface's tools.

You can't change an Upstream's namespace, or a Context Surface's **Surface database ID**, after you create it.

### Delete an Upstream

Deleting an Upstream removes its tools from the Gateway right away, along with their tool policies.

1. On the Upstream's **Configuration** tab, select **Delete Upstream** in the **Danger zone** section. **Delete** in the Upstream's actions menu on the **Upstreams** tab opens the same step.
1. Select the **Yes, I want to delete this resource** checkbox.
1. Select **Delete Upstream**.

When you delete a Context Surface, the Gateway also drops the search indexes it built on the Surface database. Your records stay. If the Gateway can't drop the indexes, you can retry once the database is fixed, or select **Delete anyway**. Then indexes named `idx:<upstream-id>:*` stay on the database until someone drops them.
