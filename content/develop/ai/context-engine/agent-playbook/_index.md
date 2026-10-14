---
Title: Redis Agent Playbooks
alwaysopen: false
categories:
- docs
- develop
- ai
description: Publish reusable skills and answers that agents can discover and load for a task.
linkTitle: Agent Playbooks
hideListLinks: true
weight: 25
bannerText: Documentation review draft.
bannerChildren: true
---

Redis Agent Playbooks lets agents share curated answers and procedures without bundling them into each application. Publish a version, retrieve it for a task, and prepare revisions while agents use the current publication.

A FAQ gives an agent a validated answer, such as where a customer can find their refund status. A skill ([Agent Skill](https://agentskills.io/home)) guides the agent through drafting a reply from that status using a template.

## Choose what to publish

| Entry | Use it for                                                                         | What the agent receives                                              |
| ----- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Skill | Procedures for completing a task, with optional scripts, references, or templates. | A name and description first; full instructions and files on demand. |
| FAQ   | A validated answer to a recurring question.                                       | The question and answer in the retrieval result.                     |

A **playbook** is a registry of entries with its own access grants and retrieval settings. A publisher selects the version of each **entry** agents receive. Your application controls how retrieved content enters the model's context and which actions the agent can take.

See [Agent Playbooks concepts]({{< relref "/develop/ai/context-engine/agent-playbook/concepts" >}}) for versions, publication, and review.

## Get started

1. Set up a playbook instance. Operator guides are coming soon.
2. [Publish and retrieve your first FAQ]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart" >}}).

## Manage playbook entries

- [Manage FAQs]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs" >}}): write, publish, and update FAQs.
- [Manage skills]({{< relref "/develop/ai/context-engine/agent-playbook/skills" >}}): package Agent Skills and load their instructions and files on demand.
- [Review proposals]({{< relref "/develop/ai/context-engine/agent-playbook/proposals" >}}): check proposed entries and accumulated evidence before accepting them.

## Serve playbook entries at runtime

- [Retrieve relevant FAQs or Agent Skills]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval" >}}) on demand.
- [Integrate with an agent]({{< relref "/develop/ai/context-engine/agent-playbook/agent-integration" >}}) using OpenAI Agents SDK or LangGraph.
- [Connect with MCP]({{< relref "/develop/ai/context-engine/agent-playbook/mcp" >}}).

Use the [API reference]({{< relref "/develop/ai/context-engine/agent-playbook/api-reference" >}}) for operations and schemas, and [service limits and errors]({{< relref "/develop/ai/context-engine/agent-playbook/limits" >}}) for constraints and recovery guidance.
