---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Discover playbook context before an agent turn, then load selected skills through MCP with OpenAI Agents SDK or LangGraph.
hideListLinks: true
linktitle: Agent integration
title: Integrate with an agent
weight: 65
---

Retrieve playbook context in your application before the first model call. Give the agent the task, returned FAQ answers, and skill previews. The agent then loads the instructions and files it needs through MCP.

Both framework examples use the same task:

> Draft a reply to a customer whose refund status shows Processing.

The request names no skill. The agent selects one from its name and description in the retrieved previews.

![An application discovers published playbook context for a task before the model turn. During the turn, the agent can load skill instructions and files through MCP, then return its response.](/images/ai/context-engine/agent-playbook-session.svg)
{width="700"}

Initial SDK discovery replaces routine MCP discovery at the start of the turn. MCP discovery remains available for follow-up questions and publication changes. Progressive disclosure concerns skill instructions and files; the available tool definitions remain the same.

## Before you begin

Follow the [quickstart setup]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart#before-you-begin" >}}) to install the Redis Agent Playbooks SDK. Export `PLAYBOOK_URL`, `PLAYBOOK_ID`, and `PLAYBOOK_API_KEY` using a key with `read` permission. Publish the sample [refund skill]({{< relref "/develop/ai/context-engine/agent-playbook/manage-skills" >}}) and keep it published while testing. Publish the [quickstart FAQ]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart" >}}) to test answer lookup too.

These programs connect to a playbook from your application runtime, which must reach the SDK and [MCP endpoints]({{< relref "/develop/ai/context-engine/agent-playbook/mcp#configure-the-connection" >}}). They use `gpt-5-mini` for model calls. Export a provider key separately:

```bash
export OPENAI_API_KEY='<your-openai-api-key>'
```

Use Python 3.11 or later and follow one framework. The dependency versions are pinned to the tested examples.

## Use OpenAI Agents SDK

The application calls asynchronous SDK discovery with the task and a result limit of three before `Runner.run`. It passes the response as clearly labeled context for that turn and attaches a Streamable HTTP MCP connection. The [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/mcp/) executes the model's tool calls from your runtime.

**Python**

```bash
python -m pip install openai-agents==0.23.1 mcp==2.3.0
```

Copy the program into `openai_agent.py`. Run `python openai_agent.py`.

{{< clients-example set="iris_playbook_openai_agent" step="playbook-openai-agent" description="" lang_filter="Python (Iris)" max_lines="160" footer="hide" />}}

## Use LangGraph

A discovery node retrieves context through the SDK. An agent node passes that context to LangChain's agent builder with the MCP tools. The builder owns the model and tool loop; the graph makes the application-controlled retrieval step explicit. See the [LangGraph graph API](https://docs.langchain.com/oss/python/langgraph/graph-api) for graph composition.

The [Python MCP adapter](https://docs.langchain.com/oss/python/langchain/mcp) is beta; its API can change.

**Python**

```bash
python -m pip install "langchain[mcp]==1.4.5" langchain-openai==1.7.2 langgraph==1.2.15 fastmcp==4.1.0 mcp==2.3.0
```

Copy the program into `langgraph_agent.py`. Run `python langgraph_agent.py`.

{{< clients-example set="iris_playbook_langgraph_agent" step="playbook-langgraph-agent" description="" lang_filter="Python (Iris)" max_lines="160" footer="hide" />}}

## Check the result

Expect a completed customer reply that preserves “Processing,” leaves no template placeholders, and promises no payment date. For example:

```text
Your order history shows "Processing". Support can help if you need more information about that stage.
```

Check that `load_skill` uses an identifier/version pair from discovery and `fetch_resource` uses the returned template URI. Exact wording and tool-call counts depend on the model.

The programs track failed tools and discard the model's draft while a failure remains unresolved. A later successful call to the failed tool clears that failure, allowing recovery after a publication change.

Set `AGENT_TASK` to try another task with the same program:

```bash
export AGENT_TASK='Where can I find my refund status?'
```

| Case | Expected behavior |
|:-----|:------------------|
| A question covered by a retrieved FAQ | Answer from its supplied content without loading a skill. |
| A refund reply with no reported stage | Ask for the missing stage rather than invent one. |
| No discovery matches | Report no matching knowledge; make no model call. |
| No previews fit the budget | Report the budget exclusion; make no model call. |
| SDK discovery fails | Report a retrieval failure; make no model call. |
| Publication changes before loading | Rediscover once through MCP, reassess the previews, and use the newly returned identifiers and URIs. |
| A tool still fails | Report unavailable guidance rather than inventing a reply. |

Reset `AGENT_TASK` with `unset AGENT_TASK` to return to the default refund task.

## Troubleshoot an agent run

Inspect initial discovery separately from the agent's tool results. Confirm that the first model input includes the returned context and preserves each identifier/version pair. Skill previews contain names, descriptions, and URIs; instructions and supporting files arrive through loading.

If the agent repeatedly discovers at the start or invents a URI, inspect its instructions and supplied context. The examples ask it to recover once after a publication change; enforce stricter retry or tool policies in your application when needed. See [MCP troubleshooting]({{< relref "/develop/ai/context-engine/agent-playbook/mcp#troubleshoot-the-connection" >}}) and [retrieval controls]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval" >}}).
