---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Understand session memory, long-term memory, and namespaces in Redis Agent Memory.
hideListLinks: true
linktitle: Concepts
title: Concepts
weight: 4
---

Redis Agent Memory keeps conversation context in session memory and information for future conversations in long-term memory. Optional namespaces organize both.

## Session memory

Session memory is the ordered history of a conversation. It includes messages and their roles, timestamps, and metadata. Use it to give an agent the context it needs to continue an interaction, such as the cities a user has discussed with a travel agent.

Sessions have configurable retention. Automatic summarization condenses older messages while keeping recent messages in full, so a long conversation takes less space in the model's context window.

For event fields, retrieval, retention, and summarization settings, see [Sessions]({{< relref "/develop/ai/context-engine/agent-memory/sessions" >}}).

## Long-term memory

Long-term memory holds information that remains useful across conversations, such as a user's dietary requirements. It lets an agent recall relevant information in a later session, including after the original session expires. Long-term memory has its own retention settings.

Redis Agent Memory can extract memories from session events in the background. Applications can also create memories directly. Custom memory types add structured fields for information specific to your application.

For creation and retrieval details, see [Long-term memory]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory" >}}). For schemas and extraction instructions, see [Custom memory types]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#custom-memory-types" >}}).

## Namespaces

Namespaces are optional groups for session memory and long-term memory. Use them to organize information by user, project, or team. A travel application could group a user's conversations and extracted memories in a personal travel namespace.

Namespaces can form a hierarchy, with personal or shared scope. Each namespace has a stable ID, so applications can keep referring to it when its name or path changes.

For creation, memory placement, search, and management, see [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}).
