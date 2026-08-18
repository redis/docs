---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure the AI models and provider API key used by an Agent Memory service on Redis Cloud.
hideListLinks: true
linktitle: Configure AI models
title: Configure AI models for Agent Memory
weight: 10
bannerText: Redis Agent Memory on Redis Cloud is currently available as a public preview. Features and behavior are subject to change.
---

You can use Redis-managed credentials for the AI models used by an Agent Memory service, or supply your own model provider API key. Supplying your own key is also known as bring your own key (BYOK).

## Choose who supplies the model credentials

Agent Memory uses two AI models:

| Model | Purpose |
| --- | --- |
| Large language model (LLM) | Extracts long-term memories from sessions and summarizes session messages. |
| Embedding model | Creates vector embeddings used to find relevant long-term memories. |

When you create a service, choose one of these credential sources:

| Credential source | Behavior |
| --- | --- |
| **Use Redis in-built keys** | Redis manages the model credentials. You do not select models or provide a model provider API key. |
| **Bring my own key** | You select the provider and models. Agent Memory uses your provider API key and provider account for both LLM and embedding calls. |

Available LLM model choices can change. Use the Redis Cloud console to see the current choices. Provider and model values shown in this guide's screenshots are examples.

## Prepare your provider account

Before you use your own key, make sure:

- The provider API key is active.
- The provider account has enough quota for LLM and embedding calls.
- The provider account can use the models that you select.
- You understand the provider's billing, service terms, and data-handling policies. The selected LLM processes session content used for extraction and summarization. The embedding model processes the text needed to create embeddings for long-term-memory storage and search.

The model provider API key is different from an Agent Memory service API key. Applications use a service API key to call the Agent Memory API. Agent Memory uses the model provider API key to call the selected AI models.

## Use your own key when you create a service

To configure your own model provider key:

1. Start the [custom service creation flow]({{< relref "/operate/iris/agent-memory/create-service" >}}).

1. In **AI model and credentials (optional)**, select **Bring my own key**.

1. Select a **Provider**.

1. Enter the provider **API key**.

1. Select an **LLM model**.

1. Select an **Embedding model**.

1. Complete the other service settings, then select **Create**.

{{<image filename="images/rc/agent-memory-ai-model-create.png" alt="The AI model and credentials section with Bring my own key selected. The section contains the provider, API key, LLM model, and embedding model settings." >}}

The key is used for both the LLM and embedding calls. Redis stores the key securely and does not show it again after you create the service.

{{<warning>}}
The credential source, provider, and embedding model are fixed after you create the service. A service created with Redis-managed credentials cannot later use your provider key. A service created with your key cannot switch to Redis-managed credentials.
{{</warning>}}

## View the current model configuration

To view the configuration:

1. In the Redis Cloud console, select **Agent Memory**.

1. Select the service.

1. On the **Configuration** tab, find **AI model and credentials**.

{{<image filename="images/rc/agent-memory-ai-model-details.png" alt="The AI model and credentials section for an existing service. It shows the provider, embedding model, LLM model, and a User-managed API key status." >}}

The **User-managed** status confirms that the service uses your provider key. Redis does not display or return the saved value.

## Change the LLM model or rotate the key

You can change the LLM model and replace the provider API key. You cannot change the provider or embedding model.

To update the service:

1. On the service **Configuration** tab, select **Edit**.

1. To change the LLM model, select another **LLM model**.

1. To rotate the provider key, enter a new value in **Replace API key**. Leave this field empty to keep the current key.

1. Select **Save**.

{{<image filename="images/rc/agent-memory-ai-model-edit.png" alt="The AI model and credentials section in edit mode. The provider and embedding model are read-only. The LLM model and Replace API key settings are editable." >}}

After the update completes, new operations use the replacement key. Operations that were already in progress can continue to use the previous key. The replacement applies to both LLM and embedding calls.

## Redis protects the provider key

- Redis stores the provider key securely.
- The key is write-only. Redis does not display or return it after saving.
- The key does not appear in the service's model configuration.
- Deleting the Agent Memory service also deletes the stored provider key.
- A service created with a provider key does not fall back to Redis-managed credentials.

## Resolve provider key and quota errors

Model-backed operations can fail when the provider rejects the key or reports that the model quota was exceeded.

For synchronous API operations, Agent Memory returns these conditions as `424 Failed Dependency` responses:

| Error | Meaning | What to do |
| --- | --- | --- |
| **Invalid Model Credentials** | The selected model credentials are missing or invalid. | Confirm that the provider key is active. If necessary, [replace the key](#change-the-llm-model-or-rotate-the-key), then retry the operation. |
| **Model Quota Exceeded** | The provider reported that the selected model account exceeded its model quota. | Check the provider account's quota and billing status. Resolve any problem, then retry the operation. |

Failures in asynchronous extraction or summarization might not appear in the API call that added the session messages. If expected memories or summaries do not appear:

1. Confirm that the provider key is still active.

1. Confirm that the provider does not report that the model quota was exceeded.

1. If the key is valid and quota is available, [contact support](https://redis.io/support/).
