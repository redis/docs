---
alwaysopen: false
categories:
- docs
- operate
- iris
description: View and manage your Redis Agent Memory service in Redis Cloud.
hideListLinks: true
linktitle: View service
title: View and manage Redis Agent Memory service
weight: 15
bannerText: Redis Agent Memory on Redis Cloud is currently available as a public preview. Features and behavior are subject to change.
aliases:
- /operate/rc/context-engine/agent-memory/view-service/
---

After you have [created your first Redis Agent Memory service]({{< relref "/operate/iris/agent-memory/create-service" >}}), selecting **Agent Memory** from the Redis Cloud Console menu will take you to the **Agent Memory Services** page.

This page displays a list of all Redis Agent Memory services associated with your account.

{{<image filename="images/rc/agent-memory-service-list.png" alt="The Redis Agent Memory service in the Redis Agent Memory service list." >}}

Select your Redis Agent Memory service from the list to view the service's details.

## Configuration tab

The **Configuration** tab lets you view the details of your Redis Agent Memory service. It contains the following sections:

- The **General settings** section provides the connection details and general settings for your Redis Agent Memory service.
- The **Memory configuration** section provides the service settings for your Redis Agent Memory service.
- The **Memory types & extraction** section shows any custom memory types defined for your service.
- The **Actions** section lets you flush or delete your Redis Agent Memory service.

Some of these settings can be changed after service creation. To do so, select the **Edit** button.

### General settings

The **General settings** section provides the connection details and general settings for your Redis Agent Memory service.

{{<image filename="images/rc/agent-memory-view-general.png" alt="The General settings for the Redis Agent Memory service." >}}

| Setting name          |Description|
|:----------------------|:----------|
| **Service name** | The name of your agent memory service. _(Editable)_ |
| **Database** | The name of the database your service uses. |
| **Store ID** | The unique ID of your Redis Agent Memory store. |
| **Endpoint** | The base URL for any Redis Agent Memory requests. |

Select the **Copy** button next to the Store ID and API Base URL to copy them to the clipboard.

Follow the [Redis Agent Memory REST API quickstart]({{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart" >}}) to use the connection information and API key.

### Memory configuration

The **Memory configuration** section shows the time-to-live (TTL) for memory storage, the extraction cadence, and the automatic summarization settings for session memory.

{{<image filename="images/rc/agent-memory-view-memory-configuration.png" alt="The Memory configuration section for the Redis Agent Memory service." >}}

| Setting name          |Description|
|:----------------------|:----------|
| **Short-term TTL** | The time-to-live (TTL) of your agent's **short-term memory** (also known as **session memory**). _(Editable)_ |
| **Long-term TTL** | The time-to-live (TTL) of your agent's **long-term memory**. _(Editable)_ |
| **Extraction cadence** | How often the extraction pipeline runs while a session is active. Defaults to 5 minutes; can be set to a value between 60 and 600 seconds. _(Editable)_ |
| **Automatic summarization** | Whether older messages in a session are automatically compressed into a summary to keep session memory concise during long conversations. _(Editable)_ |
| **Summarize after (messages)** | The number of messages a session can hold before older messages are summarized. Shown only when automatic summarization is enabled. _(Editable)_ |
| **Keep most recent (messages)** | The number of most recent messages that are always kept in full and never summarized. Shown only when automatic summarization is enabled. _(Editable)_ |

### Memory types & extraction {#memory-types-and-extraction}

The **Memory types & extraction** section shows any [custom memory types]({{< relref "/operate/iris/agent-memory/create-service#custom-memory-types" >}}) defined for the service, each listed with its name, fields, and extraction strategy.

{{<image filename="images/rc/agent-memory-view-memory-types.png" alt="The Memory types & extraction section for the Redis Agent Memory service." >}}

#### Custom memory types

Because a custom memory type's structure is fixed after creation, only some settings can be changed when you edit the service:

| Setting name          |Description|
|:----------------------|:----------|
| **Name** | The name of the custom memory type. _(Read-only)_ |
| **Fields** | The fields that make up the custom memory type, with their names, types, and descriptions. _(Read-only)_ |
| **Extraction prompt** | The extraction strategy prompt for the custom memory type. _(Editable)_ |
| **Enabled** | Whether the extraction strategy is active. _(Editable)_ |

To change a custom memory type's name or fields, you must create a new service. You can, however, add a new custom memory type when editing the service, up to the limit of 3 custom memory types.

### Actions

The **Actions** section lets you flush or delete your Redis Agent Memory service.

{{<image filename="images/rc/agent-memory-view-actions.png" alt="The actions for the Redis Agent Memory service." >}}

#### Flush memory entries

Flushing the service completely erases all stored memory data while preserving the service configuration and the search index used by the service.

To flush the service:

1. Select **Flush**.

1. A confirmation dialog will appear. Select **Flush** again to confirm.

Flushing the service is permanent and cannot be undone, and will result in empty memory retrieval results until new memory is stored.

#### Delete service

Deleting your Redis Agent Memory service permanently deletes all associated memory data, the service configuration, and the Redis Agent Memory search index. It also immediately terminates all API keys associated with the service. Data stored in other indexes within the same database will remain unaffected.

To delete your Redis Agent Memory service:

1. Select **Delete**.

1. A confirmation dialog will appear. Select the checkbox to confirm that you want to delete the service.

1. Select **Delete** again to confirm.

Deleting the Redis Agent Memory service is permanent and cannot be undone.

## Metrics tab

The **Metrics** tab provides a series of graphs showing performance data for your Redis Agent Memory service.

| Metric | Description |
|--------|-------------|
| Short-term Memory Latency | The average time to process a Short-term memory (or Session memory) lookup request.  |
| Long-term Memory Latency | The average time to process a Long-term memory lookup request. |

## API keys tab

The **API keys** tab shows a list of all API keys for your service.

{{<image filename="images/rc/agent-memory-view-api-keys.png" alt="The actions for the Redis Agent Memory service." >}}

Here, you can generate a new API key or remove any keys that are no longer in use. You can generate or remove service API keys at any time.

### Generate a new service API key {#replace-service-api-key}

To generate a new service key:

1. Select **New API key**.

    {{<image filename="images/rc/agent-memory-new-api-key.png" alt="The New API key button." width=150px >}}

1. Enter a new name for your API key.

    {{<image filename="images/rc/agent-memory-add-api-key.png" alt="The Add API key window." >}}

1. Select **Generate key** to generate your new API key.

1. The new key will appear in a dialog box. Select **Copy** to copy the key to the clipboard.

    {{<image filename="images/rc/agent-memory-service-key.png" alt="The Redis Agent Memory service key window. Use the Copy button to save the service key to the clipboard." width=80% >}}

    {{<warning>}}
This is the only time the value of the user key is available. Save it to a secure location before closing the dialog box. <br/><br/>

If you lose the service key value, you will need to generate a new key again.
    {{</warning>}}

### Delete API key

To delete an API key, select the **Delete API key** button next to the old key.

{{<image filename="images/rc/icon-delete-lb.png" width="36px" alt="Delete button." >}}
