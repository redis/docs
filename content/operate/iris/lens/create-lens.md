---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create Lens in Redis Cloud, create the keys your agents and readers use, open Lens in the console, and delete it.
hideListLinks: true
linktitle: Create Lens
title: Create Lens
weight: 5
---

Lens records each turn your agent handles, so you can open it later and see what the agent recalled, what it sent to the model, and what came back. This guide walks you through creating Lens in the Redis Cloud console, connecting an agent, and opening its sessions.

## Before you begin

Each Redis Cloud account has one Lens instance, which stores its data in two databases you choose:

| Database | Holds | Requirements |
|:---------|:------|:-------------|
| **Records database** | Turns, sessions, and their search indexes. | A Redis Cloud Essentials or Pro database. |
| **Content database** | Captured prompts, responses, and tool payloads. | Any Redis Cloud database, including Redis Flex. |

If you don't have a database, see [Create a database](/content/operate/rc/databases/create-database/_index.md).

If a database's Classless Inter-Domain Routing (CIDR) allow list blocks Lens, the **Create Lens** dialog lists the Internet Protocol (IP) addresses to add, and you can't create Lens until you add them. Add them under **Security** in the database's settings.

## Create Lens

1. From the [Redis Cloud console](https://cloud.redis.io/), select **Lens** under **Iris** in the menu.

    If you haven't created Lens yet, you see an introduction to Lens.

    <!-- TODO: screenshot of the Lens introduction page. -->

1. Select **New lens**.

    **New lens** is unavailable until your account has a database for each role in [Before you begin](/content/operate/iris/lens/create-lens.md#before-you-begin). If you don't see it, you don't have permission to create Lens.

1. In the **Create Lens** dialog, choose a **Records database** and a **Content database**. You can't change them after you create Lens.

1. Select **Create**.

When Lens is ready, the **Lens is ready** dialog shows the **Instance ID** and the **Endpoint**, with the steps to connect your agent:

1. Install the Redis Iris software development kit (SDK).
1. Set `IRIS_LENS_ENDPOINT` to the endpoint, and `IRIS_LENS_API_KEY` to an agent's API key.
1. Add Lens to your agent: call `lens.init` once, and wrap each turn in `lens.turn`.

Copy each step's code with **Copy code**. See [Instrument an agent](/content/develop/ai/context-engine/lens/instrument.md) for what to record in a turn.

If one of the databases is unavailable, the dialog shows a warning in place of the endpoint and the connection steps.

Select **Open Lens** to go to Lens, or **I'll do this later** to close the dialog.

<!-- TODO: screenshot of the Lens is ready dialog. -->

## Create API keys

Agents send turns to Lens with an API key that has the `ingest` scope. Readers, such as the [read application programming interface (API)](/content/develop/ai/context-engine/lens/read-api.md) client, need a key with the `read` scope. Give each agent its own ingest key, so an agent's key can't read other agents' turns.

To create an agent's key:

1. In the **Lens is ready** dialog, select **Create API key**. The console opens **Create API key** with **ingest** already selected for your Lens instance.
1. Enter a **Key name**. Use letters, numbers, periods, underscores, or hyphens.
1. Choose an **Expiration**. The default is 90 days.
1. Select **Create key**.
1. Copy the key from the **API Key Generated** dialog, and then select **Close**.

To create a read key:

1. Select **Access & Identity** under **Iris** in the console menu.
1. Select **New API key**.
1. Enter a **Key name** and choose an **Expiration**.
1. Under **Access**, expand **Lens** and select **Lens instance**. **ingest** is selected by default.
1. Select **read**, and then clear **ingest**.
1. Select **Create key**, and copy the key from the **API Key Generated** dialog.

> [!WARNING]
> The console shows a key only once, in the **API Key Generated** dialog. Save it to a secure location before you select **Close**.

See [Configure Lens](/content/develop/ai/context-engine/lens/configure.md) for the environment variables each key goes in.

## Open Lens

Select **Lens** under **Iris** in the Redis Cloud console menu. Then select an agent to see its sessions. Sessions appear as soon as the agent handles a turn.

See [Inspect sessions](/content/develop/ai/context-engine/lens/inspect-sessions.md) to find a session and read each turn's steps.

## Delete Lens

Deleting Lens removes the Lens instance and its Lens data from both databases. You can't undo it. Because you can't change the databases of an existing Lens, delete Lens and create it again to use different databases.

1. In Lens, select ![Lens actions](/images/rc/tags-icon-more-actions.png#no-click), and then select **Delete lens instance**.
1. Select **Yes, I want to delete this resource**.
1. Select **Delete lens instance**.

The console returns to the Lens introduction.

## Next steps

- [Trace your first turn](/content/develop/ai/context-engine/lens/quickstart.md).
- [Integrate with an agent framework](/content/develop/ai/context-engine/lens/agent-integration.md), such as LangGraph or the OpenAI Agents SDK.
