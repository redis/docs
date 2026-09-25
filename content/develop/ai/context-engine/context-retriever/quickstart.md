---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Model a data source, generate MCP tools, and call them from an agent using the ctxctl CLI.
hideListLinks: true
linktitle: Quickstart
title: Redis Context Retriever quickstart
weight: 10
bannerText: Redis Context Retriever is currently available in preview. Features and behavior are subject to change.
---

Use this quickstart to model a Redis data source as a context surface, generate the retrieval tools that Context Retriever exposes, and call one of those tools as an agent would.

This quickstart walks you through:

1. [Install the Python client](#install-the-python-client)
1. [Sign in and create an admin key](#sign-in-and-create-an-admin-key)
1. [Define your data model](#define-your-data-model)
1. [Load sample data](#load-sample-data)
1. [Create a surface](#create-a-surface)
1. [Create an agent key](#create-an-agent-key)
1. [List the generated tools](#list-the-generated-tools)
1. [Call a tool](#call-a-tool)
1. [Clean up](#clean-up)

This quickstart uses Redis Cloud. If you're running Context Retriever self-managed, see [Install Context Retriever]({{< relref "/operate/iris/context-retriever/self-managed" >}}) instead; every step after sign-in and admin-key creation is the same either way.

## Before you begin

To complete this quickstart, you need:

* A Redis Cloud account.
* A Redis Cloud database. If you don't have one, see [Create a database]({{< relref "/operate/rc/databases/create-database" >}}).
* Python 3.11 or later and `pip`.
* `redis-cli`, to load sample data. See [Install redis-cli]({{< relref "/operate/oss_and_stack/install/install-stack/install-redis-cli" >}}).

## Install the Python client

The Python client includes the `ctxctl` CLI, which you use to model data, manage keys, and call the tools Context Retriever generates.

```bash
pip install redis-context-retriever
```

## Sign in and create an admin key

1. Start a session against your Redis Cloud account:

   ```bash
   ctxctl auth login -u <your-redis-cloud-email>
   ```

1. Create an admin key. An admin key authorizes operations such as creating surfaces and agent keys.

   ```bash
   ctxctl --output json admin create --name "quickstart-admin"
   ```

1. Save the returned key. Export it so later commands can use it:

   ```bash
   export CTX_ADMIN_KEY='<the returned key, starts with cs_admin_>'
   ```

This quickstart uses a Redis Cloud account for sign-in and admin-key creation. If you're running Context Retriever self-managed instead, see [Install Context Retriever]({{< relref "/operate/iris/context-retriever/self-managed" >}}) to bootstrap your first admin key. Every other step in this quickstart applies to both.

## Define your data model

Context Retriever generates tools from a data model, not from CLI flags entered one field at a time. Define your entities in a Python file.

Create `models.py`:

```python
from context_surfaces.context_model import ContextField, ContextModel

class Customer(ContextModel):
    __redis_key_template__ = "customer:{id}"

    id: str = ContextField(description="Unique customer ID", is_key_component=True)
    name: str = ContextField(description="Customer name", index="text")
    email: str = ContextField(description="Customer email address", index="tag")
```

## Load sample data

Load a few customer hashes that match the model, so the tool call later in this quickstart returns predictable results:

```bash
redis-cli -h <your-database-host> -p <port> -a '<your-database-password>' HSET customer:1 id 1 name "Jane Doe" email "jane.doe@example.com"
redis-cli -h <your-database-host> -p <port> -a '<your-database-password>' HSET customer:2 id 2 name "John Smith" email "john.smith@example.com"
redis-cli -h <your-database-host> -p <port> -a '<your-database-password>' HSET customer:3 id 3 name "Jane Roberts" email "jane.roberts@example.com"
```

If you already have data that matches this shape, you can skip this step and use your own keys instead.

## Create a surface

1. Create a context surface from your model file, pointing it at your Redis Cloud database:

   ```bash
   ctxctl --output json surface create \
     --name "quickstart-surface" \
     --description "Quickstart context surface" \
     --models ./models.py \
     --redis-addr <your-database-host>:<port> \
     --redis-password '<your-database-password>' \
     --admin-key "$CTX_ADMIN_KEY"
   ```

1. Save the returned surface ID:

   ```bash
   export CTX_SURFACE_ID='<the returned surface id>'
   ```

1. Confirm the surface was created:

   ```bash
   ctxctl surface describe "$CTX_SURFACE_ID" --admin-key "$CTX_ADMIN_KEY"
   ```

## Create an agent key

An agent key authorizes an agent to call the tools generated for a surface.

1. Create one scoped to the surface you just created:

   ```bash
   ctxctl --output json agent create \
     --surface-id "$CTX_SURFACE_ID" \
     --name "quickstart-agent" \
     --admin-key "$CTX_ADMIN_KEY"
   ```

1. Save the returned key:

   ```bash
   export CTX_AGENT_KEY='<the returned key, starts with cs_agent_>'
   ```

## List the generated tools

As the admin, confirm which tools Context Retriever generated from your model:

```bash
ctxctl tools list --agent-key "$CTX_AGENT_KEY"
```

The list includes tools such as a search tool and a get-by-ID tool for each entity you defined.

## Call a tool

Call a generated tool directly, using the agent key instead of the admin key:

```bash
ctxctl tools call search_customer_by_text --agent-key "$CTX_AGENT_KEY" --args '{"query": "jane", "limit": 5}'
```

> [!NOTE]
> **What to expect:** A JSON result containing `Jane Doe` and `Jane Roberts`, the two sample customers whose `name` field matches `jane`. The agent never sends a database query directly. It calls a tool that Context Retriever generated from your model.

## Clean up

Delete the surface you created, which also revokes its agent keys:

```bash
ctxctl surface delete "$CTX_SURFACE_ID" --admin-key "$CTX_ADMIN_KEY" --confirm
```

## Next steps

* Read [Context Retriever concepts]({{< relref "/develop/ai/context-engine/context-retriever/concepts" >}}) to understand tools, providers, and access tags.
* [Create a Context Retriever service in Redis Cloud]({{< relref "/operate/iris/context-retriever/create-service" >}}) using the console instead of the CLI.
* [Manage admin keys]({{< relref "/operate/iris/context-retriever/view-admin-keys" >}}).
