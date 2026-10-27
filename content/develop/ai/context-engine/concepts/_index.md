---
alwaysopen: false
categories:
- docs
- develop
- ai
description: What happens when an agent asks Redis Iris for context, and why that's faster than assembling it yourself.
hideListLinks: true
linktitle: Concepts
title: How Redis Iris works
weight: 5
---

Redis Iris sits between your agent and your data. It's one system. Your agent asks for context. Iris returns it through the fastest path that answers the request: an answer your business already approved, a remembered fact, or a live lookup against your business data. That data can live in Redis or in another database you connect. You don't wire together separate lookups yourself.

Use Redis Iris when you want to route each message to the agent, tool, or workflow that handles it, answer recurring questions with approved answers instead of new model calls, recall what they've learned across turns and sessions, and act on live business data. Iris builds and maintains that infrastructure for you.

![An agent connects to Redis Iris, which stores memories, caches answers, and retrieves context, all backed by Redis or a connected database.](/images/ai/context-engine/iris-mental-model.svg)
{width="650"}

## The mental model

| Without a context layer | With Redis Iris |
|:---|:---|
| Ask a model which agent or tool should handle each message | Match the message to an intent you defined, and dispatch to its target |
| Replay the full conversation history every turn | Recall only what's relevant, summarized or extracted once |
| Have the model generate an answer your business already wrote | Return a published answer or procedure from a playbook |
| Give the agent a live database connection or let it generate its own queries | Give it a fixed set of governed tools that fetch exactly what's needed |
| Build separate integration code for every data source | Reach Redis or any connected database through the same interface |
| Guess why an agent gave a wrong answer | Trace each turn to see what context was fetched and what entered the prompt |
| Start a long agent response over when the client disconnects | Resume the response's event stream from the client's last cursor |

## What happens on a request

Iris does up to four things around your agent's model call, in whatever combination the request needs:

1. **Route.** Iris matches the message to an intent you defined and returns its target, such as the agent, tool, or workflow that handles it. No model call decides the route.
2. **Recall.** Iris checks your playbooks for an answer or procedure your business already published, and recalls relevant memory from earlier in the conversation or a past session. A published frequently asked question (FAQ) can answer the request without a model call.
3. **Retrieve.** If the request depends on current business data, Iris fetches exactly what's needed through a governed tool call, not a raw database query the agent constructs itself.
4. **Record.** After the model responds, your application records the turn in Agent Memory. Iris extracts what's worth remembering, so the next request, in this conversation or a future one, can recall it.

Not every request needs all four. A recurring question that a published FAQ answers skips straight to a response. A question about live inventory or account data goes straight to retrieval.

## Two phases: serving and recording

Most requests touch Redis Iris at two points:

1. **Before the model call**, route the message and check whether Iris already has what's needed: a published answer, relevant memory, or business data a tool can fetch.
2. **After the model responds**, record the turn so Iris can keep what's worth keeping. The next request doesn't start from nothing.

### 1. Serving the request (reading)

Iris draws on whichever of its capabilities the request needs, before the model call:

- **Intent routing.** Intent Router compares the message with your intents' example phrasings and returns the closest intents, each with a score and a target. Your application decides whether and how to dispatch to the target.
- **Playbook discovery.** [Agent Playbooks]({{< relref "/develop/ai/context-engine/agent-playbook" >}}) matches the agent's task against published entries by semantic similarity. A FAQ returns its full answer. A skill returns a preview, and the agent loads the full instructions only if it needs them.
- **Memory recall.** [Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}}) searches session and long-term memory for what's relevant to this conversation or user. You don't need to replay the full transcript to the model.
- **Governed retrieval.** [Context Gateway]({{< relref "/develop/ai/context-engine/context-gateway" >}}) calls a tool from a Model Context Protocol (MCP) server or from a Context Surface generated from your data model, instead of running a raw query. For tools you opt in, the Gateway's result cache returns the stored result of an identical call until its time to live (TTL) expires.

<!-- TODO: link Intent Router to /develop/ai/context-engine/intent-router when intent-router-docs-align merges into iris-ga-docs. -->

### 2. Recording the interaction (writing)

After the model responds, your application writes the turn to Agent Memory. Iris handles the rest:

- **Session write.** Your application stores the conversation's events as they happen. The next turn has recent history available.
- **Background extraction.** Iris pulls durable facts and preferences out of the conversation and stores them separately, with embeddings for later semantic search.
- **Playbook proposals.** If you connect a memory store to a playbook, Iris suggests new FAQs from resolved conversations. A reviewer accepts and publishes each one before agents can retrieve it.

Extraction and proposals run in the background. They don't slow down the response your application is waiting for.

## Alongside the request

Two Iris services work alongside the request rather than supplying its context:

- **[Lens]({{< relref "/develop/ai/context-engine/lens" >}})** traces each turn. It records what each source returned, what entered the prompt, and how long each step took. Agent Memory, Agent Playbooks, and Context Gateway calls appear in the trace with no extra code.
- **Agent Mesh** keeps a long agent response deliverable when the client disconnects. It retains the response's events in Redis, so the client reconnects with its last cursor and receives the updates it missed.
<!-- TODO: link Agent Mesh to /develop/ai/context-engine/agent-mesh when codex/agent-mesh-preview-docs merges into iris-ga-docs. -->

## Where context lives

Redis Iris splits that context across stores, each built for a different lookup pattern:

| Store | Holds | Purpose |
|:---|:---|:---|
| Routers | Intents, their example phrasings with embeddings, and their targets | Routing each message to the agent, tool, or workflow that handles it |
| Playbooks | Published FAQs and skills, with embeddings | Semantic discovery of answers and procedures your business approved |
| Memory store | Session events and extracted long-term facts, with embeddings | Recall across turns and sessions |
| Gateway database | Cached tool results and result handles | Reuse of identical tool calls, and large results the agent reads in parts |
| Your business data | Whatever you already store in Redis or a connected database | Queried through governed tools, not a raw connection |

Your data stays in your Redis databases. Each Iris service stores its data in Redis databases you own. On Redis Cloud, that's a database in your account. Self-managed, it's your own Redis deployment. Session events, extracted memories, playbook entries, cached tool results, and the embeddings Iris creates for search all use the database's memory like any other data, so you size and pay for that database as usual.

Start small and stay in control of growth. On Redis Cloud, Agent Memory's Quick create uses your free 30 MB database, which is enough to try the quickstarts. As you grow, you configure what to keep and for how long, not how the underlying store works.

## Build against this flow

- Route with intents you define, not a model call that picks the next agent or tool. Use Intent Router to decide where a message goes, and Agent Playbooks to supply what the answer says.
- Publish answers your business has approved as playbook FAQs, and repeatable procedures as skills. Don't build a separate caching layer on top of the model call.
- Cache tool results sparingly. Opt in only the tools whose results stay valid for the TTL you set.
- Write session events as they happen. Let background extraction decide what's durable, rather than deciding yourself on every turn.
- Model your business data as entities and relationships once. Let a Context Gateway Context Surface generate the tools your agent calls, instead of writing a tool per query.
- Scope every write and lookup by user, session, or namespace. This keeps agents and users from colliding.
- Trace turns with Lens while you build, so you can see which context reached the prompt.

## Next steps

- [How a request flows through Redis Iris]({{< relref "/develop/ai/context-engine/concepts/request-flow" >}})
- [Agent Playbooks concepts]({{< relref "/develop/ai/context-engine/agent-playbook/concepts" >}})
- [Agent Memory overview]({{< relref "/develop/ai/context-engine/agent-memory/overview" >}})
- [Context Gateway concepts]({{< relref "/develop/ai/context-engine/context-gateway/concepts" >}})
- [Lens concepts]({{< relref "/develop/ai/context-engine/lens/concepts" >}})
- An [interactive demo]({{< relref "/develop/ai/context-engine/agent-memory/interactive-demo" >}}) of Agent Memory that runs in your browser
