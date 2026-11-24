---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect an MCP client to a Redis Agent Memory store to search, curate, and ingest long-term memories.
hideListLinks: true
linktitle: MCP
title: Connect with MCP
weight: 16
---

Every Redis Agent Memory store serves a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) endpoint. Connect an MCP client to let an agent search and curate long-term memories and submit documents for extraction without writing API calls.

The MCP tools cover long-term memory and document ingestion. Session memory is not exposed, because the application that owns the conversation writes its events. Use the [SDK or REST API]({{< relref "/develop/ai/context-engine/agent-memory/sessions" >}}) for sessions.

## Before you begin

Get the data-plane endpoint, store ID, and an API key with write access to the store. The MCP endpoint requires write access for every tool, including search. Save and load the `IRIS_AGENT_MEMORY_*` variables as shown in [Save the connection values]({{< relref "/develop/ai/context-engine/agent-memory/quickstart#connect-to-the-service" >}}).

For the Python client, use Python 3.10 or later and install these dependencies:

**Python**

```bash
python -m pip install mcp==2.3.0 httpx2==2.13.1
```

**HTTP**

```bash
curl --version
jq --version
```

## Configure the connection

Use a client that supports Streamable HTTP and custom request headers:

| Setting | Value |
|:--------|:------|
| Transport | Streamable HTTP |
| Endpoint | `<data-plane-base-url>/iris/data/v1/agent-memory/stores/<store-id>/mcp` |
| Request header | `Authorization: Bearer <api-key>` |

The server is stateless and returns JSON responses, so clients do not need to keep an MCP session open between calls. The endpoint must be reachable from the client runtime. A hosted client needs an HTTPS endpoint reachable from its provider. Keep the API key in connection settings and out of agent instructions.

On a self-managed deployment with ownership enforcement, use a delegated or user-bound token as described in [Authentication]({{< relref "/operate/iris/agent-memory/self-managed/authentication" >}}). The tools enforce the same ownership rules as the REST API.

## Use the tools

Call `tools/list` on an initialized connection to get the input schemas. Tool arguments use `snake_case` names, such as `owner_id` and `namespace_id`, rather than the REST API's `camelCase` fields.

| Tool | Use it to |
|:-----|:----------|
| `search_long_term_memory` | Search by `text`, or filter by `owner_id`, `namespace_id`, `session_id`, `memory_type`, and `topics`. Text results rank by similarity; filter-only results can sort by `createdAt` or `updatedAt`. |
| `create_long_term_memories` | Store 1–100 new memories, each with a client-supplied `id` and required `owner_id`. An existing ID is reported in `errors` and left unchanged. |
| `edit_long_term_memory` | Change only the provided fields of one memory. Changing `text` re-embeds the memory. |
| `upsert_long_term_memory` | Create or fully replace one memory, including custom `attributes`. Omitted optional fields reset to their defaults. |
| `delete_long_term_memories` | Delete 1–100 memories by ID. |
| `create_document_ingestion` | Submit one base64-encoded `text/plain` or `text/markdown` document for [MemoryETL]({{< relref "/develop/ai/context-engine/agent-memory/memory-etl" >}}) extraction with an enabled extractor. |
| `get_document_ingestion` | Check processing progress and source cleanup for an ingestion. |
| `list_document_ingestion_outputs` | Page through the memory IDs an ingestion produced. |
| `list_memory_sources`, `list_memory_source_evidence`, `list_source_memories` | Trace a memory to its sources and evidence, or list the memories linked to a source. |

`edit_long_term_memory` and `upsert_long_term_memory` accept `expected_revision` to apply a change only when the memory's `revision` is current. The write tools accept `idempotency_key` so a retry replays the original result instead of writing twice.

## Connect a client

This client connects, lists the tools, creates a memory, searches for it, and then deletes it.

Copy the complete program and save it as `mcp_client.py` or `mcp_client.sh`. Run `python mcp_client.py` or `bash mcp_client.sh` with the connection values you exported.

{{< clients-example set="iris_agent_memory_mcp_client" step="agent-memory-mcp-client" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Expect the tool names, followed by the created memory ID, a search result that contains the memory, and the deleted memory ID. A request or tool error stops the program with an error.

## Troubleshoot the connection

- If the connection fails, check the full endpoint, network reachability, and API key. A `403` means the key lacks write access to the store.
- If a tool result has `isError` set, read its content before using the result. Connection and transport failures raise separately.
- If a search returns nothing for a new memory, check `owner_id` and other filters. Memories created by extraction appear only after background processing.

Keep diagnostic details without logging keys or private content.
