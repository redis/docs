---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Store and retrieve a conversation, then recall long-term memory with Python, HTTP, or the Iris CLI.
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

Build the memory for a travel assistant: save a conversation, retrieve it, and recall the user’s food preferences in a later conversation.

## Before you begin

To complete this quickstart, you need:

{{< embed-md "rc-agent-memory-quickstart-prerequisites.md" >}}

Follow one tab throughout the page. The Python SDK and command-line interface (CLI) require Python 3.11 or later. The cURL and CLI examples use Bash and jq. The CLI reads sessions and memories but does not write them, so the CLI tab starts at [Retrieve the conversation](#retrieve-the-conversation).

## Create a Redis Agent Memory service

{{< embed-md "rc-agent-memory-quickstart-create-service.md" >}}

## Connect to the service

1. For Python or CLI examples, install the unified package:

    ```bash
    python -m venv .venv
    source .venv/bin/activate
    python -m pip install 'redis-iris>=1.0.0'
    ```

1. Open the Redis Agent Memory service in the Redis Cloud console. On the **Configuration** tab, copy the **Store ID** and the URL from the **URL List**. Save them with your API key in `.env`. Use the endpoint's base address, including `https://`, without the `/iris/data/v1/agent-memory/...` path.

    ```dotenv
    IRIS_AGENT_MEMORY_URL='<data-plane-endpoint>'
    IRIS_AGENT_MEMORY_STORE_ID='<store-id>'
    IRIS_AGENT_MEMORY_API_KEY='<api-key>'
    ```

1. Load the file in the shell where you run the examples:

    ```bash
    set -a; source .env; set +a
    ```

1. Expand an example to copy the complete program. Save it as `quickstart.py`, `quickstart.cli.sh`, or `quickstart.sh` (cURL), then run `python quickstart.py`, `bash quickstart.cli.sh`, or `bash quickstart.sh`.

Keep `.env` out of source control and keys out of application logs and model prompts. Use [`iris.toml` profiles]({{< relref "/develop/ai/context-engine/sdk-and-cli" >}}) for several deployments.

For a self-managed service with ownership enforcement, use the authenticated client setup in [Delegate a user with an agent key]({{< relref "/operate/iris/agent-memory/self-managed/authentication#delegate-a-user-with-an-agent-key" >}}) and replace `quickstart-user` with the verified user ID.

<a id="check-the-service-health"></a>
<a id="save-the-connection-values"></a>

`Iris.from_env().agent_memory()` reads the connection values. Its `.client` property exposes every Agent Memory operation; the `conversation`, `recall`, `remember`, and `forget` methods cover the common agent tasks. Check that the overall status and each feature are `HEALTHY`.

{{< clients-example set="iris_agent_memory_quickstart" step="agent-memory-connect" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

<a id="1-build-conversation-context-with-session-memory"></a>

## Save a conversation

Session memory is the conversation transcript. Each message is an event, stored with the conversation's session ID and the sender's actor ID. Save a user's travel plans:

{{< clients-example set="iris_agent_memory_quickstart" step="agent-memory-quickstart-save" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Run the write once. Repeating it with a new idempotency key adds the same message again.

## Retrieve the conversation

Retrieve the session to check that the message was stored:

{{< clients-example set="iris_agent_memory_quickstart" step="agent-memory-quickstart-transcript" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

> [!NOTE]
> **What to expect:** One `USER` event from `quickstart-user` with the travel message. Redis Agent Memory adds an event ID and timestamps, so the application can recover the conversation later using only the session ID.

<a id="2-recall-automatically-extracted-information"></a>

## Recall an extracted preference

Redis Agent Memory processes session events in the background and creates long-term memories for information that may be useful in later conversations. You configured the extraction cadence to one minute when you created the service. The examples search every 10 seconds until a memory appears; the CLI runs one search, so rerun it if the result is empty.

{{< clients-example set="iris_agent_memory_quickstart" step="agent-memory-quickstart-recall" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

> [!NOTE]
> **What to expect:** Results similar to `User is vegetarian` and `User prefers spicy food`. Your application did not create these memories directly. Redis Agent Memory derived them from the session event. The exact text and memory types can vary.

The extracted memory remains searchable after the session expires, subject to the long-term memory time to live (TTL). You can change the extraction cadence and both TTLs in the [Redis Agent Memory service configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}).

## Clean up

Delete the quickstart session and every memory owned by `quickstart-user`. `forget` is the right-to-erasure operation and cannot be undone.

{{< clients-example set="iris_agent_memory_quickstart_delete" step="agent-memory-quickstart-delete" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

## Next steps

Generate a complete conversational agent with the [AI agent builder]({{< relref "/develop/ai/agent-builder" >}}). Select **Redis Iris Conversational Assistant**, then choose **Python** or **JavaScript**.

Follow the [developer guide]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide" >}}) to use memory in an agent’s request cycle. For specific features, see [Sessions]({{< relref "/develop/ai/context-engine/agent-memory/sessions" >}}), [Custom memory types]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#custom-memory-types" >}}), [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}), and [MCP]({{< relref "/develop/ai/context-engine/agent-memory/mcp" >}}).
