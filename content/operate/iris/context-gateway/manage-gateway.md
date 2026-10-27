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

The list shows each Gateway's **Name**, its **Tool exposure** mode, and its **Created date**. Select a Gateway to open it. To go straight to a Gateway's settings or delete it, use the row's actions menu.

<!-- TODO: screenshot of the Context Gateways list. -->

The Gateway's page has the **Overview**, **Upstreams**, and **Settings** tabs. From any tab, select **Create agent key** or **Connect** to [connect an agent](/content/operate/iris/context-gateway/create-gateway.md#connect-an-agent). The **Set up this Gateway** checklist tracks the steps to add an Upstream, create an agent key, and connect an agent.

## Overview tab

The **Overview** tab shows the following:

- **Endpoint**: the Model Context Protocol (MCP) endpoint agents connect to with an agent key. Select the copy button to copy it.
- **Details**: the Gateway's tool exposure mode, its created date, and when its configuration was last updated.
- **Upstreams**: how many Upstreams the Gateway has, how many are enabled, and how many tools they serve, with the newest ones listed. Select **View all** to open the **Upstreams** tab.

If the Gateway is in search mode and serves only a few tools, the tab suggests full mode, so agents can see every tool directly.

## Upstreams tab

The **Upstreams** tab lists the Gateway's Upstreams, with each one's **Name**, **Namespace**, **Kind** (**MCP server** or **Context Surface**), number of **Tools**, whether it's **Enabled**, and its **Created date**.

From this tab, you can:

- [Add an MCP server](/content/operate/iris/context-gateway/create-gateway.md#add-an-mcp-server) or [create a Context Surface](/content/operate/iris/context-gateway/create-gateway.md#create-a-context-surface).
- Turn an Upstream on or off with its **Enabled** switch. A disabled Upstream keeps its configuration and tools, but agents see none of its tools.
- Use an Upstream's actions menu to open, refresh, enable or disable, or delete it.

Select an Upstream to open its page, which has the **Tools** and **Configuration** tabs.

### Refresh an Upstream

Select **Refresh** on an Upstream to discover an MCP server's tools again, or to regenerate a Context Surface's tools. Refresh after the server's tools change, or after you fix a problem that stopped discovery. If the refresh fails, the console shows the error and how to fix it.

### Tools tab

The **Tools** tab lists the Upstream's tools by their `namespace.tool` names, with each tool's description and annotations, such as **Read-only** or **Destructive**. Use **Filter by name** to find a tool.

The tab also shows each tool's **Result cache** and **Result handle** policy. You can't change these policies in the console.
<!-- TODO: confirm how to describe tool policies on Redis Cloud. The console's own code says Redis Cloud doesn't serve result caching or result handles yet, but the Tools tab still shows both columns. -->

For a Context Surface, the **Entities** section shows its data model. Select **Edit data model** to change it. Saving regenerates the Surface's tools and removes the policies of any tools the new model drops.

### Configuration tab

The **Configuration** tab shows the Upstream's settings and its **Upstream ID**.

- For an MCP server, you can change the **Display name**, the **Endpoint URL**, and the authentication. When you change the endpoint, enter every secret again, so the Gateway never sends credentials to a host you didn't intend. Saving discovers the server's tools again.
- For a Context Surface, you can change the **Display name**, and replace the data model from a JavaScript Object Notation (JSON) file with **Replace from JSON**. Replacing the data model regenerates the Surface's tools.

You can't change an Upstream's namespace, or a Context Surface's **Surface database ID**, after you create it.

### Delete an Upstream

Deleting an Upstream removes its tools from the Gateway right away, along with their tool policies.

1. On the Upstream's page, select **Delete**.
1. Type the Upstream's name to confirm.
1. Select **Delete Upstream**.

When you delete a Context Surface, the Gateway also drops the search indexes it built on the Surface database. Your records stay. If the Gateway can't drop the indexes, you can retry once the database is fixed, or select **Delete anyway**. Then indexes named `idx:<upstream-id>:*` stay on the database until someone drops them.

## Settings tab

The **Settings** tab shows the Gateway's settings, with its **Gateway ID**, **MCP endpoint**, created date, and when its configuration was last updated. To change a setting, select **Edit**, make your changes, and select **Save changes**.

| Setting | Description |
|:--------|:------------|
| **Name** | The Gateway's name, up to 200 characters. |
| **Description** | An optional description. |
| **Tool exposure** | **Search** or **Full**. Agents get the new mode on their next request. With many tools, full mode fills more of their context. |

If someone else changed the Gateway while you were editing, the console asks you to reload it and apply your changes again.

### Delete a Gateway

Deleting a Gateway removes its MCP endpoint, and agents that use it lose access right away. You can't delete a Gateway that has Upstreams, because deleting a Gateway never deletes its Upstreams for you. [Delete its Upstreams](#delete-an-upstream) first.

1. On the **Settings** tab, select **Delete gateway** in the **Danger zone** section.
1. Type the Gateway's name to confirm.
1. Select **Delete gateway**.

This action can't be undone.
