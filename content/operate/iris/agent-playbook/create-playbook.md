---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create an Agent Playbooks playbook in Redis Cloud and give your agents access to it.
hideListLinks: true
linktitle: Create playbook
title: Create a playbook
weight: 5
---

A playbook is a registry of the frequently asked questions (FAQs) and skills your agents can use, with its own access grants and retrieval settings. Agents receive only the versions you publish. This guide walks you through creating a playbook in the Redis Cloud console and giving an agent access to it.

## Before you begin

The playbook stores its data in a Redis Cloud database. Use one of your databases, or let the console create a free database when you create the playbook. To create one yourself, see [Create a database](/content/operate/rc/databases/create-database/_index.md).

If the database has a Classless Inter-Domain Routing (CIDR) allow list that blocks Agent Playbooks, you can't create the playbook with it. The console lists the Internet Protocol (IP) addresses to add. Add them under **Security** in the database's settings.

## Create a playbook

1. From the [Redis Cloud console](https://cloud.redis.io/), select **Agent Playbooks** under **Iris** in the menu.

    If you don't have a playbook yet, you see an introduction to Agent Playbooks. Otherwise, you see the list of your playbooks.

    <!-- TODO: screenshot of the Agent Playbooks introduction page. -->

1. Select **New playbook**.

1. In the **New playbook** dialog, enter the following:

    | Setting | Description |
    |:--------|:------------|
    | **Name** | A name for the playbook, up to 128 characters. |
    | **Database** | The Redis Cloud database that stores the playbook's data. The list shows the databases you can use. If you don't have a free database, select **Free Redis database** to create one with the playbook. An existing free database appears first, with a **Free** badge. |
    | **Embedding model** | The model that creates embeddings for semantic matching. Each option shows its provider and number of dimensions. Models listed as **Redis** use Redis-managed credentials. Models listed as **Bring Your Own** use your provider's application programming interface (API) key. |

    You can't change the database or the embedding model after you create the playbook.

    <!-- TODO: screenshot of the New playbook dialog. -->

1. Select **Create playbook**. Creation can take up to two minutes.

1. In the **Connect to Playbook** step, [create an API key for your agent](#give-an-agent-access), or select **Skip for now**.

The console opens the playbook's **Configuration** tab. The playbook's status shows **Provisioning** until it's **Ready**. A playbook can also show **Failed**, **Suspended**, **Deleting**, or **Unavailable**.

## Add your provider API key

If you chose a **Bring Your Own** embedding model, the playbook needs your provider API key before it can process content. Until you add it, the **Registry** tab asks you to add it in **Configuration**.

1. On the playbook's **Configuration** tab, find the **Embedding provider credential** section.
1. Enter your **Provider API key**.
1. Select **Save provider credential**.

This key is separate from the API key your agents use to read the playbook. You can replace it later from the same section.

## Give an agent access

Agents read a playbook at its endpoint, with an API key that has access to it.

1. On the playbook's page, select **Connect**. The **Connect to Playbook** dialog shows the playbook's **Endpoint** and **Playbook ID**. Copy them for your agent.

    This dialog also opens as the second step when you create a playbook.

    <!-- TODO: confirm the Connect dialog code samples ship by GA -->

1. Select **Create an API key**.

1. Enter a **Key name**, or keep the default.

1. Under **What can this key do?**, select `read` to retrieve published content. Also select `propose` if your agent submits proposals.

    <!-- TODO: confirm which actions beyond read and propose the console lists for a playbook, and whether to document them. -->

1. Choose an **Expiration**. The default is 90 days.

1. Select **Create API key**.

1. Copy the key, and then select **Done**.

    > [!WARNING]
    > The console shows the key only once, when you create it. Save it to a secure location before you select **Done**.

To set more options, select **Customize in the full page** in the **Create API key** step. The console opens **Access & Identity** with this playbook selected.

For what each action allows, see [Playbooks](/content/develop/ai/context-engine/agent-playbooks/concepts.md#playbooks).

## Next steps

- [Publish and retrieve your first FAQ](/content/develop/ai/context-engine/agent-playbooks/quickstart.md).
- [View and manage the playbook](/content/operate/iris/agent-playbook/manage-playbook.md): add FAQs and skills, publish versions, test retrieval, and review proposals.
