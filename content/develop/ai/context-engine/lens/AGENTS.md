# Lens docs — conventions for AI-assisted editing

These pages document **Lens**, the Redis Iris observability tool for AI agents. Read the
repository-root `AGENTS.md` first for style and site mechanics. This file adds terminology,
disclosure, and framing rules for this directory, and wins where the two conflict.

## Product names

| Use | Not | Note |
| --- | --- | --- |
| Lens | Iris Lens, Redis Lens, Agent Lens | Every mention, including titles. |
| Context Gateway | Context Retriever | In prose. API literals such as `GetContextRetrieverResult` stay as they are. |
| Agent Memory, Agent Playbooks | RAM, Playbook service | The Iris services Lens traces. |
| Iris services | Iris products | Agent Memory, Agent Playbooks, and Context Gateway as a group, matching the other Iris pages. |
| beta | preview | Lens availability. Only Lens and agent_mesh carry a status label; the other Iris services have none. |

`redis-iris` (`redis_iris.lens`) is the instrumentation package. `redis-agent-lens`
(`redis_agent_lens`) is the read client. They read different key variables:
`IRIS_LENS_API_KEY` for export, `LENS_API_KEY` for reads. Never swap them.

## The source is private

Lens source is private, so a file path, repository URL, or "see the implementation"
pointer is a dead end for readers. Do not link to source code.

Leave out implementation internals: storage design, internal service names, internal span
and attribute names (`iris.lens.*`, `iris.component.*`), cursor encoding, and design
history. Document the public SDK calls, settings, and API fields.

## Present what Lens does

Say where a capability is present, not where it's missing. Write "Agent Playbooks discovery
results include their similarity score", not "Agent Memory recalls have no score". Name
the cases that have a capability, so readers don't assume it applies everywhere.

Leave unshipped and deferred features out entirely. The availability banner is the only
beta notice; don't add lists of gaps or "coming soon" notes.

## Deployments

Lens runs on Redis Cloud and self-managed. Pages are deployment-neutral: the same steps
work on both. Name a deployment only where behavior differs.

Readers get endpoints and keys from their administrator. Until the operator pages exist,
say so without linking to them, and mark each handoff with a TODO comment.

## Terms

- A **turn** is one agent exchange and one trace. Its trace ID is the turn ID.
- A **session** groups turns, and a **thread** is a conversation within a session. Readers
  choose session and thread IDs.
- A **step** is one recorded operation in a turn, such as a memory recall or a model call.
  Use "step" in prose; "span" only where the reader works with OpenTelemetry directly.
- **Fetched** is what a source returned. **Used** is what entered the prompt.
