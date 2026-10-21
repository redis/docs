---
Title: Redis Agent Playbooks
alwaysopen: false
categories:
- docs
- develop
- ai
description: Create playbooks of reusable skills and answers that agents can discover and load for a task.
linkTitle: Agent Playbooks
hideListLinks: true
weight: 25
bannerText: Documentation review draft.
bannerChildren: true
---

## What is Redis Agent Playbooks?

Redis Agent Playbooks lets you create and manage playbooks of curated answers and procedures for AI agents. Each playbook is a registry of entries with its own access grants and retrieval settings.

Publish an entry version, retrieve it for a task, and prepare revisions while agents use the current publication.

A FAQ gives an agent a validated answer, such as where a customer can find their refund status. A skill ([Agent Skill](https://agentskills.io/home)) guides the agent through drafting a reply from that status using a template.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card icon="images/icon_logo/icon-data-structures-64-midnight.png" title="Concepts" description="Learn how playbooks, entries, versions, publication, and proposals work" url="/develop/ai/context-engine/agent-playbook/concepts" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Quickstart" description="Publish and retrieve your first FAQ" url="/develop/ai/context-engine/agent-playbook/quickstart" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Agent integration" description="Connect Redis Agent Playbooks to OpenAI Agents SDK or LangGraph" url="/develop/ai/context-engine/agent-playbook/agent-integration" >}}
</div>

## Why use Redis Agent Playbooks?

- **Reusable agent knowledge:** Manage approved FAQs and skills once, then use them across agents and applications.
- **Controlled updates:** Publish a specific entry version while authors prepare and review the next revision.
- **Relevant retrieval:** Match an agent's task with FAQ answers and skill previews using semantic discovery.
- **Progressive skill loading:** Let agents inspect skill previews before loading full instructions and supporting files.
- **Governed collaboration:** Separate reading, writing, publishing, and proposing with playbook access grants.
- **Flexible integration:** Retrieve entries through Python, TypeScript, HTTP, or Model Context Protocol (MCP).

## Choose what to publish

| Entry | Use it for                                                                         | What the agent receives                                              |
| ----- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Skill | Procedures for completing a task, with optional scripts, references, or templates. | A name and description first; full instructions and files on demand. |
| FAQ   | A validated answer to a recurring question.                                       | The question and answer in the retrieval result.                     |

A publisher selects the version of each **entry** agents receive. Your application controls how retrieved content enters the model's context and which actions the agent can take.

See [Redis Agent Playbooks concepts]({{< relref "/develop/ai/context-engine/agent-playbook/concepts" >}}) for versions, publication, and review.

## Get started

1. [Deploy a self-managed instance]({{< relref "/operate/iris/agent-playbook/self-managed" >}}) and [create a playbook and keys]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples" >}}).
2. [Publish and retrieve your first FAQ]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart" >}}).

## Manage playbook entries

- [Manage FAQs]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs" >}}): write, publish, and update FAQs.
- [Manage skills]({{< relref "/develop/ai/context-engine/agent-playbook/manage-skills" >}}): package Agent Skills and load their instructions and files on demand.
- [Review proposals]({{< relref "/develop/ai/context-engine/agent-playbook/proposals" >}}): check proposed entries and accumulated evidence before accepting them.

## Serve playbook entries at runtime

- [Retrieve relevant FAQs or Agent Skills]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval" >}}) on demand.
- [Integrate with an agent]({{< relref "/develop/ai/context-engine/agent-playbook/agent-integration" >}}) using OpenAI Agents SDK or LangGraph.
- [Connect with MCP]({{< relref "/develop/ai/context-engine/agent-playbook/mcp" >}}).

Use the [API reference]({{< relref "/develop/ai/context-engine/agent-playbook/api-reference" >}}) for operations and schemas, and [service limits and errors]({{< relref "/develop/ai/context-engine/agent-playbook/limits" >}}) for constraints and recovery guidance.
