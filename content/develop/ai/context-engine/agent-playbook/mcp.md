---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect Agent Playbooks to an agent through MCP and let the agent retrieve published knowledge as needed.
hideListLinks: true
linktitle: MCP
title: Connect with MCP
weight: 60
---

Use MCP to let an agent discover knowledge, load a skill, and fetch its resources. This example produces a customer reply from a reported refund stage using a published skill and template.

## Before you begin

Get the data-plane endpoint, playbook identifier, and an API key with `read` permission. Export `PLAYBOOK_URL`, `PLAYBOOK_ID`, and `PLAYBOOK_API_KEY` as shown in [Save connection values]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart#save-connection-values" >}}).

Publish `refund-support-reply` with [Manage skills]({{< relref "/develop/ai/context-engine/agent-playbook/skills" >}}) and keep it published while testing. The [quickstart FAQ]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart" >}}) is optional; this task uses the skill to draft a reply.

The Python and TypeScript examples use the [OpenAI Agents SDK](https://developers.openai.com/api/docs/guides/agents/integrations-observability). The HTTP example uses the [OpenAI Responses API with remote MCP](https://developers.openai.com/api/docs/guides/tools-connectors-mcp). Set an OpenAI key for model calls:

```bash
export OPENAI_API_KEY='<your-openai-api-key>'
```

Install the dependencies for your chosen tab:

**Python**

```bash
python -m pip install openai-agents==0.23.1 mcp==1.30.0
```

**TypeScript**

```bash
npm install @openai/agents@0.19.0
npm install --save-dev tsx typescript @types/node
```

**HTTP**

```bash
curl --version
jq --version
```

## Configure the connection

Use these settings with an agent framework that supports Streamable HTTP and custom request headers:

| Setting        | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Transport      | Streamable HTTP                                        |
| Endpoint       | `<data-plane-base-url>/v1/playbooks/<playbook-id>/mcp` |
| Request header | `Authorization: Bearer <reader-api-key>`               |

Python and TypeScript connect from your application; the endpoint must be reachable there. The HTTP example connects from OpenAI and needs an `https://` endpoint reachable from OpenAI. A local address works only for an MCP client on the same host.

Keep the playbook key in connection settings and `OPENAI_API_KEY` in the environment. They authenticate knowledge access and model requests, respectively. Keep both out of agent instructions.

## Connect an agent

Attach the MCP connection to your agent. The SDK or Responses API executes the model's tool calls. Agent Playbooks supplies the skill; the model drafts the reply.

Save the Python example as `mcp_example.py` or the TypeScript example as `mcp-example.mts`. Run `python mcp_example.py` or `npx tsx mcp-example.mts`. Run the HTTP example in Bash.

{{< clients-example set="iris_playbook_mcp" step="playbook-mcp-example" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Check the printed calls for `discover_entries`, `load_skill`, and `fetch_resource`: they select the skill, load its instructions, and read the template. The model chooses the calls, so order and count can vary. The HTTP example allows them without per-call approval.

With the sample template, a completed reply is:

```text
Your order history shows "Processing". Support can help if you need more information about that stage.
```

Check that the reply preserves “Processing,” contains no placeholders, and promises no payment date. Also try these tasks:

| Task                                                         | Check                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| “Draft a reply for a customer who says no refund is listed.” | Uses the missing refund template and asks the customer to contact support with their order number. |
| “Draft a refund reply.”                                      | Asks what order history shows instead of inventing a stage.                                        |
| “How do I request a new refund?”                             | Avoids using the status-reply skill for a different procedure.                                     |

For an answer lookup, ask “Where can I find refund status?” with the sample FAQ published. Its answer can be used directly without loading a skill. If retrieval returns no relevant knowledge or a tool fails, the agent should report that rather than invent guidance.

For selection controls, see [Discovery]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#discovery" >}}). For skill loading behavior, see [Load skills with progressive disclosure]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#load-skills-with-progressive-disclosure" >}}).

## Read skill files as MCP resources

If your client supports standard MCP resources, it can read the same published skill files without calling `fetch_resource`. Use the URI returned by discovery or `load_skill`.

| Method                     | Request                                                | Result                                                                      |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `resources/templates/list` | List resource templates on the initialized connection. | The template for published skill files. This is not an inventory of skills. |
| `resources/read`           | Set `uri` to a returned skill file URI.                | A `contents` array with the URI, media type, and file content.              |

Read `text` when present. Otherwise, base64-decode `blob` to get the file bytes. An empty file can use an empty blob, so check which field is present rather than whether its value is nonempty. The `fetch_resource` tool uses the same text/blob distinction and also returns a file digest. Standard resource results do not include that digest field.

Both methods use the same connection and reader key as the tools. File reads enforce the current publication even with a management key. If the publication changes between discovery and reading, rediscover and reassess the selected skill. Standard resource methods are client operations; an agent framework that exposes only tools can continue to use `fetch_resource`.

## Troubleshoot the connection

- If the connection fails, check the full MCP endpoint, network reachability, and reader key. A hosted client cannot reach your application's local address.
- If the agent has no playbook tools, check that the MCP connection is attached to the agent or model request.
- If retrieval fails or returns no matches, inspect the agent run's tool results. Follow the Retrieval guide's guidance on [pins]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#pin-required-knowledge" >}}), [preview limits]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#limit-discovery-previews" >}}), and [publication changes]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#load-skills-with-progressive-disclosure" >}}).

Preserve error details for diagnosis without logging keys or private content. See [service limits and errors]({{< relref "/develop/ai/context-engine/agent-playbook/limits" >}}) for request constraints and recovery.
