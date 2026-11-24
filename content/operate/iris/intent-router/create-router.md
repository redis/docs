---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create an Intent Router in Redis Cloud, add its first intents, and connect an application.
hideListLinks: true
linktitle: Create router
title: Create an Intent Router
weight: 5
---

An Intent Router classifies each incoming request by intent, so your application can send it to the right tool, model, agent, or guardrail. You define intents with example phrases, and your application sends each request to the Router to find the closest match. This guide walks you through creating a Router in the Redis Cloud console, adding its first intents, and connecting an application.

## Before you begin

You need an active Redis Cloud database that Intent Router can use to store the Router's intents, examples, and search index. If your account has no eligible database, the console disables **New Intent Router** and asks you to create one that meets the prerequisites.

<!-- TODO: confirm which databases are eligible (plan, Redis version, Search and Query). The console gets eligibility from the backend and doesn't list the criteria. -->

If the database has a CIDR allow list, it must allow Intent Router to reach it. See [Create an Intent Router](#create-an-intent-router).

If you don't have permission to make a change, the console hides or disables the control for it. Ask your account administrator for access.

## Create an Intent Router

1. From the [Redis Cloud console](https://cloud.redis.io/), select **Intent Router** under **Iris** in the menu.

    If you don't have a Router yet, you see an introduction to Intent Router. Otherwise, you see the list of your Routers.

    <!-- TODO: screenshot of the Intent Router introduction page. -->

1. Select **New Intent Router**.

1. In the **New Intent Router** dialog, enter the following:

    | Setting | Description |
    |:--------|:------------|
    | **Name** | A name for the Router, up to 128 characters. Required. |
    | **Database** | The database that holds the Router's intents, examples, and search index. You can't change it after you create the Router. Required. |
    | **Template** | **Custom** (the default), **Model selection**, **Guardrails**, or **Agent routing**. Every template except **Custom** adds starter intents when the Router is ready. See [Starter intents](#starter-intents). |
    | **Embedding model** | The model that embeds your examples and each request. It decides how well matching understands wording. The console selects the first model in the list. You can't change it after you create the Router. Required. |
    | **Description** | What the Router is for, up to 1,024 characters. Optional. |

    If the database you choose has a CIDR allow list that blocks Intent Router, the console shows the IP addresses to add. Add each one to the database's CIDR allow list, under **Security** in the database's settings, then select the database again.

    <!-- TODO: screenshot of the New Intent Router dialog. -->

1. Select **Create Intent Router**.

The console creates the Router and opens the [**Connect to Intent Router**](#connect-an-application) step. The new Router starts in the **Provisioning** state while Intent Router builds its search index. It's ready to serve requests when its state is **Ready**.

If the console can't tell whether the Router was created, for example after a timeout, it asks you to check your Intent Routers before you try again. Select **Check Intent Routers** rather than creating the Router again.

### Starter intents

A template other than **Custom** adds starter intents the first time you open the Router's **Intents** tab after the Router is ready. You can edit or delete them like any other intent.

| Template | Starter intents |
|:---------|:----------------|
| **Model selection** | `small_model`, `frontier_model`, `code_model` |
| **Guardrails** | `prompt_injection`, `off_topic` |
| **Agent routing** | `orders_agent`, `billing_agent` |

If the starter intents aren't added, for example because you reloaded the page before the Router was ready, select **Add the *N* starter intents** on the empty **Intents** tab.

The template is otherwise a label: every Router matches the same way.

## Connect an application

Applications send requests to the Router's match endpoint with an agent key that has a grant on the Router.

1. Open the **Connect to Intent Router** step. It opens after you create a Router, or you can select **Connect** on the Router's page.

1. Under **Connection details**, copy the **Endpoint** and the **Router ID**.

1. Select **Create an API key**.

1. In the **Create API key** step, enter the following, then select **Create API key**:

    | Setting | Description |
    |:--------|:------------|
    | **Key name** | A name for the key, up to 64 characters of letters, numbers, periods, underscores, and hyphens. The console suggests the Router's name followed by `-key`. |
    | **What can this key do?** | The key's grant on this Router: `read`, `write`, or `full`. Give an application that only matches requests a `read` key. Give a tool that authors intents a `write` key. See [Issue agent keys](/content/develop/ai/context-engine/intent-router/manage-routers.md#issue-agent-keys). |
    | **Expiration** | **Never**, **30 days**, **90 days** (the default), **365 days**, or **Custom date**. |

    To set more options, select **Customize in the full page**, which opens **Access & Identity**.

    > [!WARNING]
    > The console shows the key only once, when you create it. Copy it and save it to a secure location before you select **Done**. If you lose the key, rotate it to get a new one.

1. Under **Try it**, copy the cURL request to send your first match request, then select **Done**.

    After you create a Router, **Done** opens the Router's **Intents** tab.

To connect from code, select **Connect** on the Router's page. Under **Quick connect**, select **TypeScript** or **cURL**, and copy its sample. Replace `<api-key>` with your agent key.

<!-- TODO: screenshot of the Connect to Intent Router step. -->

## Add intents

Each intent is a name and the example phrases that should match it. The Router matches a request to the intent whose examples are closest in meaning.

1. On the Router's **Intents** tab, select **New intent**.

1. In the **New intent** dialog, enter the following:

    | Setting | Description |
    |:--------|:------------|
    | **Intent name** | A name such as `track_order`, up to 128 characters. It starts with a letter or digit and uses letters, digits, `.`, `_`, and `-`. Required. |
    | **When it should win** | A description of the requests this intent is for, up to 1,024 characters. Optional. |
    | **Example commands, one per line** | The phrases that should match this intent, such as `where is my order`. Up to 256 examples, each up to 2,048 characters. The console drops blank and duplicate lines. |

    More examples make matching more accurate. An intent with no examples never matches.

1. Select **Create intent**.

To check how the Router classifies a request, enter it under **Try a query** on the **Intents** tab and select **Match**. The console lists the matching intents with their scores, best first.

## Next steps

- [View and manage an Intent Router](/content/operate/iris/intent-router/manage-router.md).
- Follow the [Intent Router quickstart](/content/develop/ai/context-engine/intent-router/quickstart.md) to define intents and match requests from code.
- [Match queries](/content/develop/ai/context-engine/intent-router/match.md) to tune thresholds and result limits.
