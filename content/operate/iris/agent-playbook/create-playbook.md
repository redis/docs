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

You need a Redis Cloud database for the playbook's data. If you don't have one, see [Create a database](/content/operate/rc/databases/create-database/_index.md).

If the database has a Classless Inter-Domain Routing (CIDR) allow list, the console lists the Internet Protocol (IP) addresses to add to it so Agent Playbooks can reach the database. Add them under **Security** in the database's settings.

## Create a playbook

1. From the [Redis Cloud console](https://cloud.redis.io/), select **Agent Playbooks** under **Iris** in the menu.

    If you don't have a playbook yet, you see an introduction to Agent Playbooks. Otherwise, you see the list of your playbooks.

    <!-- TODO: screenshot of the Agent Playbooks introduction page. -->

1. Select **New playbook**.

1. In the **New playbook** dialog, enter the following:

    | Setting | Description |
    |:--------|:------------|
    | **Name** | A name for the playbook, up to 128 characters. |
    | **Database** | The Redis Cloud database that stores the playbook's data. The list shows the databases you can use. |
    | **Embedding model** | The model that creates embeddings for semantic matching. Each option shows its provider and number of dimensions. Models listed as **Redis** use Redis-managed credentials. Models listed as **Bring Your Own** use your provider's application programming interface (API) key. |

    You can't change the database or the embedding model after you create the playbook.

    <!-- TODO: screenshot of the New playbook dialog. -->

1. Select **Create Playbook**.

The console creates the playbook and opens its **Registry** tab. The playbook's status shows **Provisioning** until it's **Ready**.

## Add your provider API key

If you chose a **Bring Your Own** embedding model, the playbook needs your provider API key before it can process content. Until you add it, the **Registry** tab asks you to add it in **Settings**.

1. On the playbook's **Settings** tab, find the **Embedding provider credential** section.
1. Enter your **Provider API key**.
1. Select **Save provider credential**.

This key is separate from the API key your agents use to read the playbook. You can replace it later from the same section.

## Give an agent access

Agents read a playbook with an API key that has access to it, at the playbook's agent endpoint.

1. On the playbook's **Settings** tab, find the **Agent endpoint** in the **General settings** section. Copy the URL for your region.

1. In the **Manage API keys** section, select **Manage API keys**. The console opens **Access & Identity**.

1. Create an API key with access to this playbook. Grant `read` to retrieve published content. Also grant `propose` if your agent submits proposals.

    > [!WARNING]
    > The console shows the key's token only once, when you create it. Save it to a secure location before you close the page.

For what each action allows, see [Playbooks](/content/develop/ai/context-engine/agent-playbook/concepts.md#playbooks).

## Next steps

- [Publish and retrieve your first FAQ](/content/develop/ai/context-engine/agent-playbook/quickstart.md).
- [View and manage the playbook](/content/operate/iris/agent-playbook/manage-playbook.md): add FAQs and skills, publish versions, test retrieval, and review proposals.
