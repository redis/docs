---
LinkTitle: n8n Redis vector store
Title: n8n Redis vector store
categories:
- docs
- integrate
- oss
- rs
- rc
description: Learn how to use Redis as a vector store with n8n workflows
group: library
stack: true
summary: Use Redis as a vector store with n8n workflows
type: integration
weight: 2
---

[n8n](https://n8n.io/) is a platform that lets you automate data manipulation tasks.
You specify the tasks using a visual graph notation known as a *workflow*. Each node in the
graph represents a task, and the edges represent the data flow between tasks.

The
[Redis vector store](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreredis/)
node lets you access [vector search]({{< relref "/develop/ai/search-and-query/vectors" >}}) capabilities from
your n8n workflows. Some typical usage patterns include:

-   **Use as a regular node to insert and retrieve documents**: Use the Redis Vector Store as a
    regular node to insert or get documents in the regular connection flow without using an agent.
-   **Connect directly to an AI agent as a tool**: Connect the Redis Vector Store node directly to
    the tool connector of an AI agent to use a vector store as a resource when answering queries.
-   **Use a retriever to fetch documents**: Use the
    [Vector Store Retriever](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.retrievervectorstore/)
    node with the Redis Vector Store node to fetch documents that match the given chat input, often used with 
    the [Question and Answer Chain](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainretrievalqa/)
    node.
-   **Use the Vector Store Question Answer Tool to answer questions**: Use the Vector Store
    [ Question Answer Tool](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolvectorstore/)
    to summarize results and answer questions from the Redis Vector Store node, rather than connecting it 
    directly as a tool.


The sections below summarize how you can use the Redis vector store node in n8n,
but see the [Redis vector store node documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreredis/) (available from the n8n workflow editor)
for more information.

## Prerequisites

To use the Redis vector store node, you need a Redis server with Redis Query Engine enabled.
See the [Redis Cloud quickstart guide]({{< relref "/develop/ai/search-and-query/vectors/quickstart" >}})
or the [Redis Open Source installation guide]({{< relref "/operate/oss_and_stack/install/install-stack" >}})
to learn how to set up a suitable Redis server within minutes.

## Node parameters

The sections below summarize the parameters available for the Redis vector store node. See
the
[Redis vector store node documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreredis/#node-parameters)
for more information.

### Operation Mode

The Redis Vector Store node has four operation modes that determine what operations you can perform:

- **Get Many**: Retrieve multiple documents from your vector database by providing a prompt. The prompt is embedded and used for similarity search, returning the most similar documents with their similarity scores. Useful for retrieving a list of similar documents to pass to an agent as additional context.
- **Insert Documents**: Insert new documents into your vector database.
- **Retrieve Documents (as Vector Store for Chain/Tool)**: Use with a vector-store retriever to retrieve documents from a vector database and provide them to the retriever connected to a chain. You must connect the node to a retriever node or root node in this mode.
- **Retrieve Documents (as Tool for AI Agent)**: Use the vector store as a tool resource when answering queries. The agent uses the vector store when the vector store name and description match the question details.

### Rerank Results

Enable this to apply a reranking node to the results for queries. You can use this option with the Get Many, Retrieve Documents (as Vector Store for Chain/Tool), and Retrieve Documents (as Tool for AI Agent) modes.

### Get Many parameters

- **Redis Index**: Enter the name of the Redis vector search index to use. Optionally choose an existing one from the list.
- **Prompt**: Enter the search query.
- **Limit**: Enter how many results to retrieve from the vector store. For example, set this to 10 to get the ten best results.

This mode includes the [Metadata Filter](#metadata-filter) node option.

### Insert Documents parameters

- **Redis Index**: Enter the name of the Redis vector search index to use. Optionally choose an existing one from the list.

### Retrieve Documents (as Vector Store for Chain/Tool) parameters

- **Redis Index**: Enter the name of the Redis vector search index to use. Optionally choose an existing one from the list.

This mode includes the [Metadata Filter](#metadata-filter) node option.

### Retrieve Documents (as Tool for AI Agent) parameters

- **Name**: The name of the vector store.
- **Description**: Explain to the LLM what this tool does. A good, specific description allows LLMs to produce expected results more often.
- **Redis Index**: Enter the name of the Redis vector search index to use. Optionally choose an existing one from the list.
- **Limit**: Enter how many results to retrieve from the vector store. For example, set this to 10 to get the ten best results.

### Include Metadata

Whether to include document metadata. You can use this with the Get Many and Retrieve Documents (as Tool for AI Agent) modes.

## Node options

The sections below summarize the node options available for the Redis vector store node. See
the
[Redis vector store node documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreredis/#node-options)
for more information.

### Metadata Filter

Metadata filters are available for the Get Many, Retrieve Documents (as Vector Store for Chain/Tool), and Retrieve Documents (as Tool for AI Agent) operation modes.

This is an OR query. If you specify more than one metadata filter field, at least one of them must match.

When inserting data, the metadata is set using the document loader. Refer to the n8n documentation on [Default Data Loader](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.documentdefaultdataloader/) for more information on loading documents.

### Redis Configuration Options

Available for all operation modes:

- **Metadata Key**: Enter the key for the metadata field in the Redis hash (default: `metadata`).
- **Key Prefix**: Enter the key prefix for storing documents (default: `doc:`).
- **Content Key**: Enter the key for the content field in the Redis hash (default: `content`).
- **Embedding Key**: Enter the key for the embedding field in the Redis hash (default: `embedding`).

### Insert Options

Available for the Insert Documents operation mode:

- **Overwrite Documents**: Select whether to overwrite existing documents (turned on) or not (turned off). Also deletes the index.
- **Time-to-Live**: Enter the time-to-live for documents in seconds. Does not expire the index.

## Example workflows

Redis provides two example workflows to demonstrate how you can use the Redis vector store node in n8n.

-   [Chat with GitHub issues using OpenAI and Redis Vector Search](https://n8n.io/workflows/10837-chat-with-github-issues-using-openai-and-redis-vector-search/)
    This workflow uses the Redis vector store node implement a basic RAG pattern. The chat answers
    questions about GitHub issues from the list of issues in a repository.
-   [Semantic caching](https://n8n.io/workflows/10887-reduce-llm-costs-with-semantic-caching-using-redis-vector-store-and-huggingface/)
    This workflow implements a [semantic cache](https://redis.io/blog/what-is-semantic-caching/)
    that checks for previously answered questions before calling an LLM. This pattern can help
    reduce LLM costs by answering questions from cached results.

