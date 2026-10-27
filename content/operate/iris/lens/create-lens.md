---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create Lens in Redis Cloud, create the keys your agents and readers use, and open Lens in the console.
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

If a database has a Classless Inter-Domain Routing (CIDR) allow list, the console lists the Internet Protocol (IP) addresses to add to it so Lens can reach the database. Add them under **Security** in the database's settings.

## Create Lens

1. From the [Redis Cloud console](https://cloud.redis.io/), select **Lens** under **Iris** in the menu.

    If you haven't created Lens yet, you see an introduction to Lens.

    <!-- TODO: screenshot of the Lens introduction page. -->

1. Select **New lens**.

1. In the **Create Lens** dialog, choose a **Records database** and a **Content database**. You can't change them after you create Lens.

1. Select **Create**.

When Lens is ready, the dialog shows the **Instance ID** and the **Endpoint**, with the steps to connect your agent:

1. Install the Redis Iris software development kit (SDK).
1. Set `IRIS_LENS_ENDPOINT` to the endpoint, and `IRIS_LENS_API_KEY` to an agent's API key.
1. Add Lens to your agent: call `lens.init` once, and wrap each turn in `lens.turn`.

Copy each step's code with **Copy code**. See [Instrument an agent](/content/develop/ai/context-engine/lens/instrument.md) for what to record in a turn.

<!-- TODO: screenshot of the Lens is ready dialog. -->

## Create API keys

Agents send turns to Lens with an API key that has the `ingest` scope. Readers, such as the [read application programming interface (API)](/content/develop/ai/context-engine/lens/read-api.md) client, need a key with the `read` scope. Give each agent its own ingest key, so an agent's key can't read other agents' turns.

To create an agent's key, select **Create API key** in the **Lens is ready** dialog. The console opens **Access & Identity** with the `ingest` scope on your Lens instance already selected. Create the key.

To create a read key, create an API key in **Access & Identity** with the `read` scope on your Lens instance.

> [!WARNING]
> The console shows a key's token only once, when you create it. Save it to a secure location before you close the page.

See [Configure Lens](/content/develop/ai/context-engine/lens/configure.md) for the environment variables each key goes in.

## Open Lens

Select **Lens** under **Iris** in the Redis Cloud console menu. Then select an agent to see its sessions. Sessions appear as soon as the agent handles a turn.

See [Inspect sessions](/content/develop/ai/context-engine/lens/inspect-sessions.md) to find a session and read each turn's steps.

## Next steps

- [Trace your first turn](/content/develop/ai/context-engine/lens/quickstart.md).
- [Integrate with an agent framework](/content/develop/ai/context-engine/lens/agent-integration.md), such as LangGraph or the OpenAI Agents SDK.
