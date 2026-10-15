---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect an MCP client, discover published knowledge, and load skill instructions and files.
hideListLinks: true
linktitle: MCP
title: Connect with MCP
weight: 60
---

Connect a Streamable HTTP MCP client to retrieve published FAQs and skill content. Redis Agent Playbooks exposes three tools and standard skill resources. For framework examples that retrieve context before a model turn, see [Integrate with an agent]({{< relref "/develop/ai/context-engine/agent-playbook/agent-integration" >}}).

## Before you begin

Get the data-plane endpoint, playbook identifier, and an API key with `read` permission. Export `PLAYBOOK_URL`, `PLAYBOOK_ID`, and `PLAYBOOK_API_KEY` as shown in [Save connection values]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart#save-connection-values" >}}).

Publish the sample [FAQ]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart" >}}) or [skill]({{< relref "/develop/ai/context-engine/agent-playbook/manage-skills" >}}) to test discovery. The basic clients use no model-provider key.

Install the dependencies for your chosen language. Python requires Python 3.10 or later; TypeScript requires Node.js 22 or later.

**Python**

```bash
python -m pip install mcp==2.3.0 httpx2==2.13.1
```

**TypeScript**

```bash
npm install @modelcontextprotocol/sdk@1.32.1
npm install --save-dev tsx typescript @types/node
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
| Endpoint | `<data-plane-base-url>/v1/playbooks/<playbook-id>/mcp` |
| Request header | `Authorization: Bearer <reader-api-key>` |

The endpoint must be reachable from the client runtime. A hosted client needs an HTTPS endpoint reachable from its provider; a local address works for clients on the same host. Keep the playbook key in connection settings and out of agent instructions.

## Use the tools

List the tools on an initialized connection to get their input schemas.

| Tool | Input | Result |
|:-----|:------|:-------|
| `discover_entries` | A task query, with optional filters, pins, and result limit. | Published FAQ answers and skill previews, including identifiers and versions. |
| `load_skill` | The selected skill's `entry_id` and `version`. | Full instructions and resource descriptors. |
| `fetch_resource` | A returned resource `uri`. | File content, media type, and digest. |

![Discovery returns FAQ answers and skill previews. Loading a selected skill adds its instructions to the context. Fetching a resource adds only the file needed for the task.](/images/ai/context-engine/agent-playbook-disclosure.svg)
{width="700"}

Use the tools in this order:

1. Discover knowledge for the task. Use an applicable FAQ answer directly.
2. Select a skill preview, then load its instructions with the returned identifier and version together.
3. Fetch supporting files when the instructions or task require them, using their returned URIs.

See [Discovery]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#discovery" >}}) for selection controls. Progressive disclosure loads **skill content** on demand; these three tool definitions remain available on the connection.

## Connect a client

This client connects, lists tools, and prints discovery results for a refund task. For an agent that selects a skill and loads its instructions and files, see [the framework examples]({{< relref "/develop/ai/context-engine/agent-playbook/agent-integration" >}}).

Copy the complete program and save it as `mcp_client.py`, `mcp_client.mts`, or `mcp_client.sh`. Run `python mcp_client.py`, `npx tsx mcp_client.mts`, or `bash mcp_client.sh` with the connection values you exported.

{{< clients-example set="iris_playbook_mcp_client" step="playbook-mcp-client" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Expect the three tool names followed by the discovery response as JSON. It includes matching FAQ answers and skill previews. Empty `pinnedEntries` and `discoveredEntries` arrays can reflect the query, publication, filters, or [preview budget]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#limit-discovery-previews" >}}). A request or tool error stops the program with an error.

## Read skill files as MCP resources

Clients can also read published skill files through standard MCP resources. Use the URI returned by discovery or `load_skill`.

| Method | Request | Result |
|:-------|:--------|:-------|
| `resources/templates/list` | List resource templates on the initialized connection. | The template for published skill files, rather than an inventory of skills. |
| `resources/read` | Set `uri` to a returned skill file URI. | A `contents` array with the URI, media type, and file content. |

Read `text` when present. Otherwise, base64-decode `blob` to get the file bytes. An empty file can use an empty blob, so check field presence. The `fetch_resource` tool uses the same distinction and also returns a file digest; standard resource results omit that digest.

File reads enforce the current publication even with a management key. If publication changes between discovery and reading, rediscover and reassess the selected skill. Agent frameworks that expose tools can use `fetch_resource`.

## Troubleshoot the connection

- If connection fails, check the full endpoint, network reachability, and reader key.
- If a tool reports `isError`, inspect its error before using the content. Connection and transport failures can raise separately.
- If loading fails after a publication change, rediscover once and reassess the returned previews. Preserve returned identifiers and URIs; do not construct replacements.

Keep diagnostic details without logging keys or private content. See [service limits and errors]({{< relref "/develop/ai/context-engine/agent-playbook/limits" >}}) for recovery guidance.
