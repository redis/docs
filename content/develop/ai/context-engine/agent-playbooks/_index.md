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
bannerText: Documentation review draft. Helm chart publication and service compatibility must be confirmed before release.
bannerChildren: true
---

Redis Agent Playbooks stores your team's procedures and answers for agents to use. Publish knowledge once, then let applications retrieve the relevant content for each task.

For example, a support agent can find a refund-handling skill, load its instructions, and read a reply template. You control which version is published. The application controls when to retrieve it and how to act on it.

## Choose what to publish

| Entry | Use it for | What the agent receives |
|:------|:-----------|:------------------------|
| Skill | A procedure with instructions and supporting files. | A name and description first, then instructions and files when requested. |
| Frequently asked question (FAQ) | A question with an approved answer. | The question and answer in the retrieval result. |

A **playbook** is a collection with its own access grants and retrieval settings. Each **entry** has a stable ID and immutable **versions**. Creating or updating an entry does not publish the new version. Only the current publication is served by search and agent tools.

## Get started

If your team already runs the service, get the endpoint, playbook ID, and author and reader keys from its administrator. Start at step 2.

1. [Deploy with Helm]({{< relref "/operate/iris/agent-playbooks" >}}) and [create a playbook and keys]({{< relref "/operate/iris/agent-playbooks/authentication" >}}).
1. [Publish your first skill]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart" >}}) with the Python software development kit (SDK).
1. [Connect an agent]({{< relref "/develop/ai/context-engine/agent-playbooks/connect-agent" >}}) using Model Context Protocol (MCP).

## Maintain an integration

- [Manage published knowledge]({{< relref "/develop/ai/context-engine/agent-playbooks/publish-knowledge" >}}): add answers, update skills, publish, and withdraw.
- [Control discovery]({{< relref "/develop/ai/context-engine/agent-playbooks/discovery" >}}): filter by attributes and choose retrieval limits.
- [API and client reference]({{< relref "/develop/ai/context-engine/agent-playbooks/reference" >}}): client conventions, tool contracts, and error handling.
- [Download examples]({{< relref "/develop/ai/context-engine/agent-playbooks/examples" >}}): complete scripts and pinned dependencies.

For a coding agent, provide this page, the relevant example, and the API reference. Keep credentials in the application's environment.
