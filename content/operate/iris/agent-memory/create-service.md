---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create an Agent Memory service in Redis Cloud to store working and long-term memory for AI agents.
hideListLinks: true
linktitle: Create service
title: Create an Agent Memory service
weight: 5
bannerText: Redis Agent Memory on Redis Cloud is currently available as a public preview. Features and behavior are subject to change.
aliases:
- /operate/rc/context-engine/agent-memory/create-service/
- /operate/rc/agent-memory/create-service/
---

Redis Agent Memory provides a persistent, structured memory layer that AI agents can use to store, retrieve, and manage contextual data across interactions. This guide walks you through creating and configuring an Agent Memory service in Redis Cloud.

## Prerequisites and limitations

To create a Redis Agent Memory service, you will need a Redis Cloud database. If you don't have one, see [Create a database]({{< relref "/operate/rc/databases/create-database" >}}).

{{< note >}}
Redis Agent Memory does not support the following databases during public preview:
- [Redis Flex]({{< relref "operate/rc/databases/create-database/create-flex-database">}}) databases
- Databases using [AWS PrivateLink]({{< relref "operate/rc/security/aws-privatelink">}}) connectivity
- [Active-Active]({{< relref "/operate/rc/databases/active-active" >}}) databases
- Databases with the [default user]({{< relref "/operate/rc/security/access-control/data-access-control/default-user" >}}) turned off
{{< /note >}}

## Create an Agent Memory service

From the [Redis Cloud console](https://cloud.redis.io/), select **Agent Memory** from the left-hand menu. 

If you have not already created an Agent Memory service, you'll see a page with an introduction to Agent Memory. Otherwise, select **New service** to go to the Agent Memory introduction page.

{{<image filename="images/rc/langcache-new-service.png" alt="The New service button." width="150px" >}}

From here: 

- Select **Quick create** to create a Redis Agent Memory service with default settings using your Free 30MB database. If you haven't created a Free database yet, Redis Cloud will create one and set up the Redis Agent Memory service for you.

    {{<image filename="images/rc/langcache-quick-create.png" alt="The Quick create button." width="150px" >}}

    After Redis Cloud creates your Agent Memory service, a window containing your Agent Memory service key will appear. Select **Copy** to copy the key to your clipboard.

    {{<image filename="images/rc/agent-memory-service-key.png" alt="The Agent Memory service key window. Use the Copy button to save the service key to the clipboard." width=80% >}}

    {{<warning>}}
This is the only time the value of the user key is available. Save it to a secure location before closing the dialog box.<br/><br/>

If you lose the service key value, you will need to [generate a new service key]({{< relref "/operate/iris/agent-memory/view-service#replace-service-api-key" >}}) to be able to use the Agent Memory API.
    {{</warning>}}

    After Redis Cloud creates your service, [continue with the REST API quickstart]({{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart" >}}).

- If you want to customize your Redis Agent Memory service, select **Create custom**.

    {{<image filename="images/rc/agent-memory-custom-service.png" alt="The Create custom button to create an Agent Memory service." width="150px" >}}

    This takes you to the **Create Agent Memory Service** page. This page is divided into the following sections:

    1. The [General settings](#general-settings) section defines basic properties of your service.
    1. The [Memory configuration](#memory-configuration) section allows you to define the time-to-live (TTL) of your agent's memories, set how often memories are extracted, and control automatic summarization of session memory.
    1. The [Memory types & extraction](#memory-types-and-extraction) section allows you to define custom memory types with their own extraction strategies.

### General settings

The **General settings** section defines basic properties of your service.

{{<image filename="images/rc/agent-memory-general-settings.png" alt="The General settings section." >}}

| Setting name          |Description|
|:----------------------|:----------|
| **Service name** | Enter a name for your Agent Memory service. We recommend you use a name that describes your service's purpose. |
| **Select database** | Select the Redis Cloud database to use for this service from the list. |
| **User for this service** | The [database access user]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control" >}}) to use for this service. Agent Memory only supports the [`default` user]({{< relref "/operate/rc/security/access-control/data-access-control/default-user" >}}) during public preview. |

### Memory configuration

The **Memory configuration** section allows you to define the time-to-live (TTL) of your agent's memories, set how often memories are extracted, and control automatic summarization of session memory.

{{<image filename="images/rc/agent-memory-memory-configuration.png" alt="The Memory configuration section." >}}

| Setting name          |Description|
|:----------------------|:----------|
| **Short-term TTL** | Defines the time-to-live (TTL) of your agent's **short-term memory** (also known as **session memory**). You can define this TTL in seconds, minutes, hours, or days. Default: 1 hour |
| **Long-term TTL** | Defines the time-to-live (TTL) of your agent's **long-term memory**. You can define this TTL in seconds, minutes, hours, or days. Default: 365 days |
| **Extraction cadence** | How often the extraction pipeline runs while a session is active. Leave this blank to use the default of 5 minutes, or set a value between 60 and 600 seconds to override it. |

#### Automatic summarization

Automatic summarization keeps your agent sharp during long conversations by compressing older messages in a session into a summary, while keeping the most recent messages in full. This helps control the size of session memory without losing important context.

Use the **Automatic summarization** toggle to enable or disable this behavior. When it is enabled, you can configure the following settings:

| Setting name          |Description|
|:----------------------|:----------|
| **Summarize after (messages)** | The number of messages a session can hold before older messages are summarized. When a session exceeds this threshold, the oldest messages beyond the **Keep most recent** count are compressed into a summary. |
| **Keep most recent (messages)** | The number of most recent messages that are always kept in full and never summarized. |

For example, with **Summarize after** set to 20 and **Keep most recent** set to 10, once a session reaches 20 messages, the oldest 10 messages are summarized automatically and the 10 most recent are kept in full.

### Memory types & extraction {#memory-types-and-extraction}

The **Memory types & extraction** section allows you to define custom long-term memory types with structured fields and an optional extraction strategy. Each enabled type runs independently.

{{<image filename="images/rc/agent-memory-memory-types.png" alt="The Memory types & extraction section." >}}

#### Custom memory types

In addition to the built-in memory types, you can define **custom memory types** to capture structured, domain-specific information from your agent's conversations. Each custom type describes a category of information you want to extract, the fields that make up that information, and an optional extraction strategy that tells the extraction pipeline how to populate it.

You can define up to **3 custom memory types**. Once you reach this limit, the **Add type** button is disabled.

To add a custom memory type, select **Add type** and configure the following settings:

| Setting name          |Description|
|:----------------------|:----------|
| **Name** | A unique name for the custom memory type. Must start with a letter and contain only letters, numbers, hyphens, or underscores (1–64 characters). The name must be unique within the service and cannot match a built-in memory type (`semantic`, `episodic`, `message`, or `session_summary_view`). |
| **Description** | A short description of what the memory type represents (1–200 characters). |
| **Fields** | The structured fields that make up the memory type. See [Fields](#fields) below. |

##### Fields

Each custom memory type can have one or more fields that define its structured attributes. For each field, configure the following:

| Setting name          |Description|
|:----------------------|:----------|
| **Name** | The field name. Follows the same rules as the memory type name: must start with a letter and contain only letters, numbers, hyphens, or underscores. |
| **Type** | The field's data type. Choose from `str`, `int`, `float`, `bool`, `list[str]`, `list[float]`, or `object`. |
| **Description** | A description of the field (1–200 characters). This description is used to guide extraction, so make it clear and specific. |

##### Extraction strategy

Each custom memory type can have an **extraction strategy** that controls how the extraction pipeline populates it from session messages.

| Setting name          |Description|
|:----------------------|:----------|
| **Extraction prompt** | A natural-language prompt (up to 10,000 characters) that instructs the extraction pipeline how to identify and extract this memory type from a conversation. |
| **Enabled** | Whether the extraction strategy is active. Enabled by default. Disable it to keep the type defined without extracting new memories for it. |

### Sensitive-data exclusions {#sensitive-data-exclusions}

The **Sensitive-data exclusions** section lets you guide automatic extraction away from information that should not be stored in long-term memory. Semantic exclusions can match concepts that a literal pattern might not cover, such as secrets, recovery codes, and similar information.

| Setting name | Description |
|:-------------|:------------|
| **Semantic exclusions** | Whether the extraction model applies the exclusion prompt when creating long-term memories from session events. |
| **Exclusion prompt** | Plain-language instructions describing information that should not be kept in long-term memory. Maximum length: 2,000 characters. |

For example:

```text
Do not keep passwords, access tokens, recovery codes, payment card information, or booking confirmation codes in long-term memory.
```

{{< warning >}}
Sensitive-data exclusions are advisory and do not guarantee that information is excluded. Sensitive session content still reaches the extraction model provider. Exclusions do not apply to long-term memories created directly through the API or an SDK.
{{< /warning >}}

### Create service

When you are done setting the details of your Agent Memory service, select **Create** to create it.

{{<image filename="images/rc/button-access-management-user-key-create.png" alt="Use the Create button to create an Agent Memory service." >}}

A window containing your Agent Memory service key will appear. Select **Copy** to copy the key to your clipboard.

{{<image filename="images/rc/agent-memory-service-key.png" alt="The Agent Memory service key window. Use the Copy button to save the service key to the clipboard." width=80% >}}

{{<warning>}}
This is the only time the value of the user key is available. Save it to a secure location before closing the dialog box.<br/><br/>

If you lose the service key value, you will need to [generate a new service key]({{< relref "/operate/iris/agent-memory/view-service#replace-service-api-key" >}}) to be able to use the Redis Agent Memory API.
{{</warning>}}

If an error occurs, verify that your database is active. For help, [contact support](https://redis.io/support/).

## Next steps

After Redis Cloud creates your service, [continue with the REST API quickstart]({{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart" >}}).

You can also [view and edit the service]({{< relref "/operate/iris/agent-memory/view-service" >}}).
