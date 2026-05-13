---
alwaysopen: false
categories:
- docs
- operate
- rc
description: Use the Agent Memory API to store and retrieve working and long-term memory for AI agents.
hideListLinks: true
linktitle: Use Agent Memory
title: Use the Agent Memory API on Redis Cloud
weight: 10
---

You can use the [Agent Memory API and SDK]({{< relref "/develop/ai/context-engine/agent-memory/api-examples" >}}) from your client app to store and retrieve working and long-term memory for AI agents.

To access the Agent Memory API, you need:

- Agent Memory API endpoint
- Agent Memory service API key
- Store ID

For Agent Memory on Redis Cloud, the endpoint and Store ID are available in the Agent Memory service's **Configuration** page in the [**General settings** section]({{< relref "/operate/rc/context-engine/agent-memory/view-service#general-settings" >}}).

The Agent Memory API key is only available immediately after you create the service API key. If you lost this value, you will need to [generate a new service API key]({{< relref "/operate/rc/context-engine/agent-memory/view-service#replace-service-api-key" >}}) to be able to use the Agent Memory API.

When you call the API, you need to pass the Agent Memory API key in the `Authorization` header as a Bearer token and the Store ID as the `storeId` path parameter.

See the [Agent Memory API and SDK examples]({{< relref "/develop/ai/context-engine/agent-memory/api-examples" >}}) for more information on how to use the Agent Memory API.
