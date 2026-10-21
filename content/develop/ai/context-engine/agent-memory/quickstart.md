---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Store and retrieve a conversation, then recall long-term memory with Python, TypeScript, or curl.
hideListLinks: true
linktitle: Quickstart
title: Redis Agent Memory quickstart
weight: 5
aliases:
- /develop/ai/context-engine/agent-memory/sdk-quickstart/
- /develop/ai/context-engine/agent-memory/python-sdk-quickstart/
- /develop/ai/context-engine/agent-memory/typescript-sdk-quickstart/
- /develop/ai/context-engine/agent-memory/rest-api-quickstart/
- /develop/ai/context-engine/agent-memory/api-examples/
- /operate/rc/context-engine/agent-memory/use-agent-memory/
---

Store a travel-planning message, retrieve the conversation, and recall a preference extracted into long-term memory. Choose Python, TypeScript, or curl for each example.

## Before you begin

To complete this quickstart, you need:

{{< embed-md "rc-agent-memory-quickstart-prerequisites.md" >}}

Choose Python, TypeScript, or curl for the examples and use it throughout this page.

{{< multitabs id="prerequisites" tab1="Python" tab2="TypeScript" tab3="curl" >}}

You also need Python 3.10 or later.

-tab-sep-

You also need Node.js and npm.

-tab-sep-

You also need a shell with `curl` and `jq` installed.

{{< /multitabs >}}

## Create a Redis Agent Memory service

{{< embed-md "rc-agent-memory-quickstart-create-service.md" >}}

## Save the connection values

1. Open the Redis Agent Memory service in the Redis Cloud console.
1. On the **Configuration** tab, copy the **Endpoint** and **Store ID**.
1. Export the values for your chosen client in your shell:

{{< multitabs id="connection-values" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```sh
export API_KEY='<API_KEY>'
```

-tab-sep-

```sh
export API_KEY='<API_KEY>'
```

-tab-sep-

```sh
export AGENT_MEMORY_URL='<ENDPOINT>'
export STORE_ID='<STORE_ID>'
export API_KEY='<API_KEY>'
export SESSION_ID='travel-planning-session'
export OWNER_ID='quickstart-user'
```

{{< /multitabs >}}

The endpoint must include `https://`. Keep the API key out of source control, application logs, and other unsecured locations.

## Install the SDK

{{< multitabs id="installation" tab1="Python" tab2="TypeScript" tab3="curl" >}}

Create and activate a virtual environment with [uv](https://docs.astral.sh/uv/):

```sh
uv venv
source .venv/bin/activate
uv pip install redis-agent-memory
```

-tab-sep-

```sh
mkdir agent-memory-quickstart
cd agent-memory-quickstart
npm init -y
npm install @redis-iris/agent-memory
npm install --save-dev tsx
```

-tab-sep-

Use `curl` and `jq` directly. No SDK installation is required.

{{< /multitabs >}}

<a id="check-the-service-health"></a>

## Create the client and check the service health

Create `quickstart.py` or `quickstart.ts` with the complete example for your language. Replace `<ENDPOINT>` and `<STORE_ID>` with your service values. The endpoint must include `https://`.

{{< clients-example set="agent_memory_sdk" step="connect_health_check" footer="hide" dft_tab_name="curl" runnable="false" try_it="false" >}}
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/health" | jq
{{< /clients-example >}}

The store health response checks the configured Store ID and reports the status of its memory features. Inspect the overall `status` and individual `features` before continuing.

Run Python examples with `python quickstart.py` or TypeScript examples with `npx tsx quickstart.ts`. Each SDK example includes its client setup. Replace the file with the complete example for the next step, and use the same connection values and identifiers. Run curl commands in the shell where you exported the connection values.

## 1. Build conversation context with session memory

Session memory is the conversation transcript. Each message is an event, stored with the conversation's session ID and the sender's actor ID. The first request saves a user's travel plans. The second retrieves the conversation so you can check that the message was stored.

1. Replace your SDK quickstart file with the complete example for your language. For curl, run the commands in order.

{{< clients-example set="agent_memory_sdk" step="add_session_event" footer="hide" dft_tab_name="curl" runnable="false" try_it="false" >}}
export EVENT_CREATED_AT="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory/events" <<JSON | jq
{
  "sessionId": "$SESSION_ID",
  "actorId": "$OWNER_ID",
  "role": "USER",
  "content": [
    {
      "text": "I am visiting Tokyo and Kyoto next month. I am vegetarian and prefer spicy food."
    }
  ],
  "createdAt": "$EVENT_CREATED_AT"
}
JSON


curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory/$SESSION_ID" | jq
{{< /clients-example >}}

2. For Python, save the file and run `python quickstart.py`. For TypeScript, save the file and run `npx tsx quickstart.ts`.
3. Find the `events` array in the session response. Check that it contains the travel message, the `USER` role, and the `quickstart-user` actor ID.

> [!NOTE]
> **What to expect:** The `events` array contains the travel message. Redis Agent Memory adds an `eventId` and `systemTimestamp`, showing that the application can recover the complete event later using only the session ID.

Run the event write once. Repeating it adds the same message again. The next example searches without repeating the write.

## 2. Recall automatically extracted information

Redis Agent Memory processes session events in the background and creates long-term memories for information that may be useful in later conversations. You configured the extraction cadence to one minute when you created the service.

Wait at least one minute. Replace your SDK file with the complete search example, or run the curl command:

{{< clients-example set="agent_memory_sdk" step="search_long_term_memory_basic" footer="hide" dft_tab_name="curl" runnable="false" try_it="false" >}}
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/search" <<JSON | jq
{
  "text": "What dietary requirements and food preferences does the user have?",
  "filter": {
    "ownerId": {
      "eq": "$OWNER_ID"
    }
  },
  "limit": 5
}
JSON
{{< /clients-example >}}

Run the search. The `items` array should contain memories derived from the conversation, such as the vegetarian requirement or preference for spicy food. Extraction is asynchronous, so run the search again if the array is empty.

> [!NOTE]
> **What to expect:** Results similar to `User is a vegetarian` and `User prefers spicy food`. Your application did not create these memories directly. Redis Agent Memory derived them from the session event. The exact text and memory types can vary.

The extracted memory remains searchable after the session expires, subject to the long-term memory time to live (TTL). You can change the extraction cadence and both TTLs in the [Redis Agent Memory service configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}).

## Next steps

Generate a complete conversational agent with the [AI agent builder]({{< relref "/develop/ai/agent-builder" >}}). Select **Redis Iris Conversational Assistant**, then choose **Python** or **JavaScript**.

Follow the [developer guide]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide" >}}) to use memory in an agent’s request cycle. For specific features, see [Sessions]({{< relref "/develop/ai/context-engine/agent-memory/sessions" >}}), [Custom memory types]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#custom-memory-types" >}}), and [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}).
