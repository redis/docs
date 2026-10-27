---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create a Context Gateway in Redis Cloud, add its first MCP server or Context Surface, and connect an agent.
hideListLinks: true
linktitle: Create gateway
title: Create a Context Gateway
weight: 5
aliases:
- /operate/iris/context-retriever/create-service/
---

A Context Gateway gives your agents one Model Context Protocol (MCP) endpoint for the tools of the systems behind it. Each of those systems is an *Upstream*: an MCP server you run or use, or a Context Surface that generates search tools from a data model over your Redis data. This guide walks you through creating a Gateway in the Redis Cloud console, adding its first Upstream, and connecting an agent.

## Before you begin

- To add an MCP server, you need its endpoint URL, and its credentials if it requires them. The server must use the Streamable HTTP transport and be reachable from Redis Cloud.
- To create a Context Surface, you need the ID of the Redis database that holds your records.
  <!-- TODO: confirm what the Surface database ID is on Redis Cloud. The console tells users to get it from their "deployment admin", who adds databases to "the registry", which reads as self-managed wording. -->

If your role doesn't allow a change, the console says so and names the role it needs.
<!-- TODO: confirm the Redis Cloud roles for Context Gateway. The console's refusal text names operator, product_admin, and viewer roles, which aren't standard Redis Cloud roles. -->

## Create a Gateway

1. From the [Redis Cloud console](https://cloud.redis.io/), select **Context Gateways** under **Iris** in the menu.

    If you don't have a Gateway yet, you see an introduction to Context Gateway. Otherwise, you see the list of your Gateways.

    <!-- TODO: screenshot of the Context Gateway introduction page. -->

1. Select **New gateway**.

1. In the **Create gateway** dialog, enter a **Name** for the Gateway, up to 200 characters. Add a **Description** if you want one.

1. Choose a **Tool exposure** mode:

    | Mode | What agents see | Use it when |
    |:-----|:----------------|:------------|
    | **Search** | Two tools, `search_tools` and `run_tool`. Agents find a tool with `search_tools`, then run it with `run_tool`. This is the default. | The Gateway serves many tools. Agents load two tools instead of all of them. |
    | **Full** | Every tool, named `namespace.tool`. | The Gateway serves only a few tools. |

    You can change the mode later in the Gateway's [settings](/content/operate/iris/context-gateway/manage-gateway.md#settings-tab).

    <!-- TODO: screenshot of the Create gateway dialog. -->

1. Select **Create gateway**.

When the Gateway is ready, the dialog offers to add its first Upstream. Select [**Add MCP server**](#add-an-mcp-server) or [**Create Context Surface**](#create-a-context-surface). To add one later, select **Skip for now**, which opens the Gateway's **Overview** tab.

## Add an MCP server

Add an MCP server to serve its tools through the Gateway. The Gateway connects to the server, discovers its tools, and serves them under the Upstream's namespace.

1. Select **Add MCP server**, either after you create the Gateway or from the Gateway's **Upstreams** tab.

1. In the **Server** section, enter the following:

    | Setting | Description |
    |:--------|:------------|
    | **Display name** | A name for the Upstream, up to 200 characters. Required. |
    | **Namespace** | The prefix for this Upstream's tool names. Agents see its tools as `namespace.tool_name`. Use up to 63 lowercase letters and digits, joined by single hyphens. Leave it empty to make one from the display name. You can't change it after you add the Upstream. |
    | **Endpoint URL** | The absolute HTTP or HTTPS URL of the MCP server, such as `https://mcp.example.com/mcp`. The URL can't contain a user name or password. Required. |

    The **Transport** is always **Streamable HTTP**.

1. In the **Authentication** section, choose how the Gateway authenticates to the server:

    | Method | What the Gateway sends |
    |:-------|:-----------------------|
    | **None** | No credentials. This is the default. |
    | **Bearer token** | The **Token** you enter, in the `Authorization` header. You can also add headers, such as a tenant ID. |
    | **Headers** | One or more headers you name, such as `X-Api-Key`, with their values. |

    The console stores secrets encrypted and never shows them again. You can't add a header the Gateway sets itself, such as `Host` or `Content-Type`, or an `Authorization` header alongside a bearer token.

1. Under **Availability**, leave the Upstream enabled so agents see its tools as soon as discovery finishes. Turn it off to add the Upstream without serving its tools yet.

1. Select **Add MCP server**.

The Gateway connects to the server and discovers its tools, which can take a few seconds. The Upstream's page then shows how many tools it found.

<!-- TODO: screenshot of the Add MCP server page. -->

### If discovery fails

If the Gateway can't discover the server's tools, it still adds the Upstream, without tools. The Upstream's page shows the error and how to fix it. Fix the problem, then select **Refresh**. Don't add the server again, because the Upstream already exists.

| Status | Fix |
|:-------|:----|
| 422 | Check the credentials in the Upstream's configuration, then refresh. |
| 424 | Check that the endpoint URL is right and that the server speaks MCP, then refresh. |
| 408 | The server was slow to list its tools. Refresh to try again. |

## Create a Context Surface

A Context Surface generates search tools from a data model over the records in a Redis database. You describe your records as entities with fields, and the Gateway generates the tools agents use to find and read them. See [Write a data model](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md#write-a-data-model) for how the data model shapes the tools.

1. Select **Create Context Surface**, either after you create the Gateway or from the Gateway's **Upstreams** tab.

1. On the **Settings** step, enter the following, then select **Entities**:

    | Setting | Description |
    |:--------|:------------|
    | **Display name** | A name for the Upstream, up to 200 characters. Required. |
    | **Namespace** | The prefix for this Upstream's tool names, with the same rules as for an MCP server. Optional. |
    | **Surface database ID** | The ID of the database that holds your records, using 1 to 32 letters, digits, or hyphens. You can't change it after you create the Surface. Required. |
    | **Description** | What the data holds. Agents read it with the tools. Optional. |

1. On the **Entities** step, add each kind of record in your data model. Select **Add entity**, then enter its settings:

    | Setting | Description |
    |:--------|:------------|
    | **Entity name** | The name of the entity, such as `Customer`. Required. |
    | **Key template** | The Redis key pattern for the entity's records, such as `customer:{id}`. Leave it empty to use `{name}:{id}`. |
    | **Description** | What the entity represents. Optional. |
    | **Storage** | How the records are stored: **JSON** (the default) or **Hash**. |

    To start from a data model you already have, select **Import JSON**, then upload or paste a JavaScript Object Notation (JSON) object of up to 1 MiB, in the format the Iris command-line interface (CLI) writes. Importing replaces the entities and fields on the page.

    If a key template has no placeholder such as `{id}`, every record of that entity maps to the same key, and the console asks you to confirm.

1. Select **Fields**. For each entity, select **Add field**, then enter its settings:

    | Setting | Description |
    |:--------|:------------|
    | **Field** | The field name, such as `customer_id`. Required. |
    | **PK** | Whether the field is the entity's primary key (PK). A PK field can't have indexes. |
    | **Related entity** | Another entity this field points to, which creates a relationship. Optional. |
    | **Type** | One of `str`, `int`, `float`, `bool`, `list[str]`, `list[float]`, `object`, `geo`, or `timestamp`. |
    | **Indexes** | The indexes that let agents search or filter on the field. The choices depend on the type, and `geo` and `timestamp` fields always have one. |

    To adjust an index, open its **Index settings**:

    | Index | Settings |
    |:------|:---------|
    | Text | **Weight**, how much a match in this field counts (1 by default), and **No stemming**. |
    | Numeric | **Sortable**, which lets list tools sort by the field. On by default. |
    | Tag | **Allowed values**, one per line. The filter tool offers only these. Leave it empty to allow any value. |
    | Vector | **Vector size** (1536 by default), **Distance metric** (cosine, euclidean, or dot_product), **Embeds the text of** a `str` field or none, and the **Embedding model**. |

    Under **Relationships**, you can also add a relationship directly, with its name, target entity, and source field.

1. Select **Create Context Surface**.

The Gateway generates the tools from your data model, which can take a few seconds. The Upstream's page then shows how many tools it generated. If the console finds problems in the data model, it marks the entities that need a fix and lists the errors.

To create the Surface first and add its data model later, select **Create without a data model** on the **Entities** step. A Surface without a data model has no tools until you add one.

<!-- TODO: screenshots of the Entities and Fields steps. -->

## Connect an agent

Agents connect to the Gateway's MCP endpoint with an agent key that has a `use` grant on the Gateway.

1. On the Gateway's page, select **Create agent key**.

    The console opens **Access & Identity** with a `use` grant on this Gateway already selected. Create the key.

    > [!WARNING]
    > The console shows the key's token only once, when you create it. Save it to a secure location before you close the page.

1. Back on the Gateway's page, select **Connect**.

1. In the **Connect an agent** dialog, copy the **MCP endpoint**. Under **Client setup**, select your client, **Claude Code**, **Cursor**, or **ADK**, and copy its setup. Replace `<AGENT_KEY>` with your agent key's token.

The dialog's **What the agent sees** section describes the tools agents get in the Gateway's tool exposure mode.

<!-- TODO: screenshot of the Connect an agent dialog. -->

## Next steps

- [View and manage a Context Gateway](/content/operate/iris/context-gateway/manage-gateway.md).
- [Connect with MCP](/content/develop/ai/context-engine/context-gateway/mcp.md) from other clients, and use the Gateway's tools.
- Follow the [Context Gateway quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md) to list and call your first tools.
