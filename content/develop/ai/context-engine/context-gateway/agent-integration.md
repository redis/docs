---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Give an OpenAI Agents SDK or LangGraph agent a Gateway's tools over MCP, in full or search mode.
hideListLinks: true
linktitle: Agent integration
title: Integrate with an agent
weight: 65
---

Attach a Gateway to an agent as one Streamable HTTP MCP server. The agent lists the Gateway's tools and calls them from your application runtime.

![A task starts an agent turn. During the turn, the model calls tools through Context Gateway, which calls the MCP servers and Context Surfaces behind it and returns the results. The turn ends with a reply.](/images/ai/context-engine/context-gateway-session.svg)
{width="700"}

Both framework examples use the same task:

*Sample task, chosen with the sample Upstream.*

<!-- TODO: Choose a sample task that matches the sample Upstream in the operator API examples. -->

## Before you begin

Follow the [quickstart setup](/content/develop/ai/context-engine/context-gateway/quickstart.md#before-you-begin) and export `IRIS_CONTEXT_GATEWAY_URL` and `IRIS_CONTEXT_GATEWAY_API_KEY`. The Gateway must serve the sample Upstream.

These programs use an OpenAI model. Export a provider key separately:

```bash
export OPENAI_API_KEY='<your-openai-api-key>'
```

These programs use Python. Follow one framework. The dependency versions are pinned to the tested examples.

## Choose a tool exposure mode

| Gateway mode | What the agent does |
| --- | --- |
| `full` | Sees every tool definition at the start of the turn and calls tools by qualified name. |
| `search` | Calls `search_tools` for the task, then calls the chosen tool through `run_tool`. |

Search mode keeps tool definitions out of the context until the agent needs them. Tell the agent in its instructions to search before it calls a tool.

## Use OpenAI Agents SDK

The application attaches the Gateway as a Streamable HTTP MCP server with the agent key in a request header. The [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/mcp/) runs the model's tool calls.

*Install command, pinned to tested versions.*

*Example set `iris_gateway_openai_agent`, step `gateway-openai-agent`, in Python (Iris).*

## Use LangGraph

A LangGraph agent loads the Gateway's tools through the LangChain MCP adapter and runs the tool loop. See the [LangChain MCP documentation](https://docs.langchain.com/oss/python/langchain/mcp).

*Install command, pinned to tested versions.*

*Example set `iris_gateway_langgraph_agent`, step `gateway-langgraph-agent`, in Python (Iris).*

## Check the result

*Expected reply and the tool calls to check, once the sample task is chosen.*

| Case | Expected behavior |
| --- | --- |
| The task needs one tool | The agent calls it once and answers from its result. |
| Search mode | The agent calls `search_tools` before `run_tool` and copies the returned reference. |
| A tool returns an error | The agent reports the failure rather than inventing a result. |
| The result comes back as a handle | The agent reads only the pages it needs and releases the handle. |

## Troubleshoot an agent run

Inspect the tools the agent received before the first model call. If the agent invents a tool name or a `run_tool` reference, check its instructions and the Gateway's mode. See [MCP troubleshooting](/content/develop/ai/context-engine/context-gateway/connect-agents.md#troubleshoot-the-connection).
