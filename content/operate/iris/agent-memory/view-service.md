---
alwaysopen: false
categories:
- docs
- operate
- iris
description: View and manage your Agent Memory service in Redis Cloud.
hideListLinks: true
linktitle: View service
title: View and manage Agent Memory service
weight: 15
aliases:
- /operate/rc/context-engine/agent-memory/view-service/
- /operate/rc/agent-memory/view-service/
---

After you have [created your first Agent Memory service]({{< relref "/operate/iris/agent-memory/create-service" >}}), select **Agent Memory** under **Iris** in the Redis Cloud console menu to see the **Agent Memory** page.

This page lists all Agent Memory services associated with your account, with each service's status, name, store ID, related database, and created date.

Select your Agent Memory service from the list to view the service's details. The service's page has these tabs:

- [**Configuration**](#configuration-tab): view and edit the service's settings, connect an agent, and flush or delete the service.
- **MemoryETL**: extract long-term memories from documents you upload. This tab has a **Beta** badge.
- [**API explorer**](#api-explorer-tab): try Agent Memory API requests against the service.
- **Memory Inspector**: browse the service's sessions and search its long-term memories.
- [**Metrics**](#metrics-tab): view latency and token usage.

<!-- TODO: MemoryETL and Memory Inspector need their own coverage. -->

Which tabs, sections, and buttons you see depends on your permissions. For example, **Edit**, **Flush**, **Delete**, **Create API key**, **Metrics**, and **Memory Inspector** each need a specific permission.
<!-- TODO: document which Redis Cloud roles grant each Agent Memory permission. -->

## Configuration tab

The **Configuration** tab lets you view the details of your Agent Memory service.

It starts with a banner for connecting your agent:

- Select **Connect** to see the service's endpoint, its store ID, and **Quick connect** samples for each software development kit (SDK).
- Select **Create API key** to create a key with access to this service. The button appears only when the service has no active API key. See [Connect and create an API key](/content/operate/iris/agent-memory/create-service.md#connect-and-create-an-api-key).
- Select **API docs** to open the Agent Memory API documentation.

The banner is followed by these sections:

- The **General settings** section provides the connection details and general settings for your Agent Memory service.
- The **Memory configuration** section provides the service settings for your Redis Agent Memory service.
- The **AI model and credentials** section shows the model configuration for a service that uses a customer-managed provider key.
- The **Memory types & extraction** section shows any custom memory types defined for your service.
- The **Sensitive-data exclusions** section shows the sensitive-data exclusions configured for your service.
- The **Danger zone** section lets you flush or delete your Redis Agent Memory service.

Some of these settings can be changed after service creation. To do so, select **Edit** in the **General settings** section, make your changes, and select **Save**.

### General settings

The **General settings** section provides the connection details and general settings for your Agent Memory service.

| Setting name          |Description|
|:----------------------|:----------|
| **Service Name** | The name of your agent memory service. _(Editable)_ |
| **Database** | The name of the database your service uses. |
| **Store ID** | The unique ID of your Agent Memory store. |
| **URL List** | The base URL for Agent Memory requests. If the service is available in several regions, select **Show all regions** to see each region's URL. |

Select the copy button next to the **Store ID** or a URL to copy it to the clipboard.

Follow the [Redis Agent Memory quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}) to use the connection information and API key.

### Memory configuration

The **Memory configuration** section shows the time-to-live (TTL) for memory storage, the extraction cadence, and the automatic summarization settings for session memory.

![The Memory configuration section for the Agent Memory service.](/images/rc/agent-memory-view-memory-configuration.png)

| Setting name          |Description|
|:----------------------|:----------|
| **Short-term TTL** | The time-to-live (TTL) of your agent's **short-term memory** (also known as **session memory**). _(Editable)_ |
| **Long-term TTL** | The time-to-live (TTL) of your agent's **long-term memory**. _(Editable)_ |
| **Extraction cadence** | How often the extraction pipeline runs while a session is active. Defaults to 5 minutes; can be set to a value between 60 and 600 seconds. _(Editable)_ |
| **Automatic summarization** | Whether older messages in a session are automatically compressed into a summary to keep session memory concise during long conversations. _(Editable)_ |
| **Summarize after (messages)** | The number of messages a session can hold before older messages are summarized. Shown only when automatic summarization is enabled. _(Editable)_ |
| **Keep most recent (messages)** | The number of most recent messages that are always kept in full and never summarized. Shown only when automatic summarization is enabled. _(Editable)_ |

### AI model and credentials {#ai-model-and-credentials}

The **AI model and credentials** section appears when the service uses your model provider key.

Provider and model values shown in the screenshot are examples.

![The AI model and credentials section for an existing service. It shows the provider, embedding model, LLM model, and a User-managed API key status.](/images/rc/agent-memory-ai-model-details.png)

The provider and embedding model are read-only. You can change the LLM model or replace the provider key. For update steps, key rotation behavior, security, and troubleshooting guidance, see [Configure AI models for Agent Memory]({{< relref "/operate/iris/agent-memory/model-configuration" >}}).

### Memory types & extraction {#memory-types-and-extraction}

The **Memory types & extraction** section shows any [custom memory types]({{< relref "/operate/iris/agent-memory/create-service#custom-memory-types" >}}) defined for the service, each listed with its name, fields, and extraction strategy.

![The Memory types & extraction section for the Agent Memory service.](/images/rc/agent-memory-view-memory-types.png)

#### Custom memory types

Because a custom memory type's structure is fixed after creation, only some settings can be changed when you edit the service:

| Setting name          |Description|
|:----------------------|:----------|
| **Name** | The name of the custom memory type. _(Read-only)_ |
| **Fields** | The fields that make up the custom memory type, with their names, types, and descriptions. _(Read-only)_ |
| **Extraction prompt** | The extraction strategy prompt for the custom memory type. _(Editable)_ |
| **Enabled** | Whether the extraction strategy is active. _(Editable)_ |

To change a custom memory type's name or fields, you must create a new service. You can't delete a custom memory type, remove an existing type's extraction prompt, or add an extraction strategy to a type created without one. You can, however, add a new custom memory type when editing the service, up to the limit of 3 custom memory types.

### Sensitive-data exclusions {#sensitive-data-exclusions}

The **Sensitive-data exclusions** section shows the [sensitive-data exclusions]({{< relref "/operate/iris/agent-memory/create-service#sensitive-data-exclusions" >}}) configured for the service.

![The Sensitive-data exclusions section for the Agent Memory service.](/images/rc/agent-memory-view-sensitive-data-exclusions.png)

| Setting name          |Description|
|:----------------------|:----------|
| **Built-in detectors** | Whether built-in detectors are applied, with each selected detector and the action it takes on a match. Only selected detectors are listed. _(Editable)_ |
| **Custom detectors** | Whether custom detectors are applied, with each detector's name, pattern, action on a match, and status. _(Editable)_ |
| **Semantic exclusions** | Whether semantic exclusions are applied when memories are extracted. _(Editable)_ |
| **Exclusion prompt** | The plain-language description of what should never be kept in long-term memory. Required when semantic exclusions are enabled. _(Editable)_ |

Turning semantic exclusions off keeps the exclusion prompt you saved, so you can turn them back on later without retyping it.

Changing exclusions affects memories extracted after you save. Memories already in long-term memory are not re-evaluated, and there is no way to remove only the memories that match your exclusions. The only way to clear memories stored before you configured exclusions is to [flush the service](#flush-memory-entries), which permanently erases all of the service's stored memory data.

> [!WARNING]
> Semantic exclusions are **advisory**. They steer the extraction model, but they do not guarantee that sensitive content is excluded. Do not rely on semantic exclusions as your only control for regulated or highly sensitive data.

### Danger zone

The **Danger zone** section lets you flush or delete your Agent Memory service.

#### Flush memory entries

Flushing the service completely erases all stored memory data while preserving the service configuration and the search index used by the service.

To flush the service:

1. Select **Flush**. You can't flush the service while you're editing it, or while it's unavailable.

1. In the **Flush all entries** dialog, select **Yes, I want to flush all entries**.

1. Select **Flush** to confirm.

Flushing the service is permanent and cannot be undone, and will result in empty memory retrieval results until new memory is stored.

#### Delete service

Deleting your Agent Memory service permanently deletes the service configuration and its short-term sessions. Long-term memories stay in your database.
<!-- TODO: confirm what deleting a service removes. The console says long-term memories stay in your database. The previous docs said deletion removes all memory data, the search index, any stored model provider key, and access for the service's API keys. -->

To delete your Agent Memory service:

1. Select **Delete**. You can't delete the service while you're editing it.

1. In the **Delete service** dialog, select **Yes, I want to delete this resource**.

1. Select **Delete** again to confirm.

Deleting the Agent Memory service is permanent and cannot be undone.

## API explorer tab

The **API explorer** tab lets you try Agent Memory API requests against your service from the console.

## Metrics tab

The **Metrics** tab shows performance and usage data for your Agent Memory service. Choose a period of an hour, a day, a week, 30 days, or 90 days.

The **API & reliability** view shows the following:

| Metric | Description |
|--------|-------------|
| Short-term Memory Latency | The average time to process a Short-term memory (or Session memory) lookup request.  |
| Long-term Memory Latency | The average time to process a Long-term memory lookup request. |

The view also shows **Latency by phase**, with charts for **Retrieval latency**, **Embedding latency**, and **Generation latency**. Some services don't report phase latency.

The **Token consumption** view shows how many large language model (LLM) and embedding tokens the service used, with a breakdown by feature, such as extraction and session summaries. Select **Export** to download the data as a comma-separated values (CSV) file.

## Create an API key {#create-an-api-key}

Agents call the Agent Memory API with an API key that has access to the service. To create a key for one service, select **Create API key** or **Connect** in the service's [connect banner](#configuration-tab). To create a key that can reach several services, or to manage existing keys, use **Access & Identity**:

1. In the Redis Cloud console menu, select **Access & Identity** under **Iris**.
1. Select **New API key**.
1. Under **Access**, give the key access to your service's memory store under **Agent Memory**.
1. Select **Create key**.
1. Copy the key's token.

> [!WARNING]
> The console shows the key's token only once, when you create it. Save it to a secure location before you close the page. If you lose it, create a new key.

To remove an agent's access, delete its key in **Access & Identity**.
