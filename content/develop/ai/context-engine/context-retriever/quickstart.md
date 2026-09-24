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

Use this quickstart to model a Redis data source as a context surface, generate the retrieval tools Context Retriever exposes, and call one of those tools as an agent would. You will install the Python client, create an admin key, define entities in a model file, create a surface from that file, create an agent key scoped to it, then list and call the generated tools.

This quickstart uses Redis Cloud. If you're running Context Retriever self-managed, see [Install Context Retriever]({{< relref "/develop/ai/context-engine/context-retriever/install" >}}) instead; every step after sign-in and admin-key creation is the same either way.

## Before you begin

To complete this quickstart, you need:

* A Redis Cloud account.
* A Redis Cloud database that already contains some data, with a predictable key pattern (for example, `customer:1`, `customer:2`). If you don't have one, see [Create a database]({{< relref "/operate/rc/databases/create-database" >}}).
* Python 3.11 or later and `pip`.

## Install the Python client

The Python client includes the `ctxctl` CLI, which you use to model data, manage keys, and call the tools Context Retriever generates.

```bash
pip install redis-context-retriever
```

## Sign in and create an admin key

Start a session against your Redis Cloud account:

```bash
ctxctl auth login -u <your-redis-cloud-email>
```

Create an admin key. An admin key authorizes operations such as creating surfaces and agent keys.

```bash
ctxctl --output json admin create --name "quickstart-admin"
```

Save the returned key. Export it so later commands can use it:

```bash
export CTX_ADMIN_KEY='<the returned key, starts with cs_admin_>'
```

This quickstart uses a Redis Cloud account for sign-in and admin-key creation. If you're running Context Retriever self-managed instead, see [Install Context Retriever]({{< relref "/develop/ai/context-engine/context-retriever/install" >}}) to bootstrap your first admin key. Every other step in this quickstart applies to both.

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

## Create a surface

Create a context surface from your model file, pointing it at your Redis Cloud database:

```bash
ctxctl --output json surface create \
  --name "quickstart-surface" \
  --description "Quickstart context surface" \
  --models ./models.py \
  --redis-addr <your-database-host>:<port> \
  --redis-password '<your-database-password>' \
  --admin-key "$CTX_ADMIN_KEY"
```

Save the returned surface ID:

```bash
export CTX_SURFACE_ID='<the returned surface id>'
```

Confirm the surface was created:

```bash
ctxctl surface describe "$CTX_SURFACE_ID" --admin-key "$CTX_ADMIN_KEY"
```

## Create an agent key

An agent key authorizes an agent to call the tools generated for a surface. Create one scoped to the surface you just created:

```bash
ctxctl --output json agent create \
  --surface-id "$CTX_SURFACE_ID" \
  --name "quickstart-agent" \
  --admin-key "$CTX_ADMIN_KEY"
```

Save the returned key:

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
> **What to expect:** A JSON result containing any customers whose indexed text fields match `jane`, up to 5 results. The agent never sends a database query directly. It calls a tool that Context Retriever generated from your model.

## Clean up

Delete the surface you created, which also revokes its agent keys:

```bash
ctxctl surface delete "$CTX_SURFACE_ID" --admin-key "$CTX_ADMIN_KEY" --confirm
```

## Next steps

* Read [Context Retriever concepts]({{< relref "/develop/ai/context-engine/context-retriever/concepts" >}}) to understand tools, providers, and access tags.
* [Create a Context Retriever service in Redis Cloud]({{< relref "/operate/iris/context-retriever/create-service" >}}) using the console instead of the CLI.
* [Manage admin keys]({{< relref "/operate/iris/context-retriever/view-admin-keys" >}}).
