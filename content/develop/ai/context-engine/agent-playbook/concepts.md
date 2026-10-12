---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Understand playbooks, entries, versions, publication, discovery, proposals, and evidence.
hideListLinks: true
linktitle: Concepts
title: Agent Playbooks concepts
weight: 5
---

## Playbooks

Agent Playbooks stores reusable answers and procedures as **entries**. Publish a **version** for retrieval, then revise new content while agents use that publication.

Embeddings and semantic search match agent tasks with relevant entries. Discovery settings control similarity thresholds and result limits. Your application supplies the task text and retrieval options.

A **proposal** inbox holds suggested answers and evidence from agent interactions for review.

Access **grants** apply across a playbook. For example, you can give a support agent **read** access to a support playbook and give a content reviewer permission to **write** or **publish**. Use separate playbooks when workloads must not share visibility. Attribute filters help select content within a playbook, but do not replace access grants.

Playbook API keys can grant these actions:

| Action    | What it allows                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `read`    | Retrieve published knowledge, list and inspect entry summaries, and read proposals.                     |
| `write`   | Create entries, append versions, inspect drafts, delete entries, and review proposals. Includes `read`. |
| `publish` | Publish or withdraw entries and inspect versions. Includes `read`.                                      |
| `propose` | Create proposals and attach evidence. Includes `read`.                                                  |

`write` does not include `publish` or `propose`. You can assign authoring and publication to different people or applications.

## Entries

An entry is a reusable answer or procedure. Agent Playbooks supports two types:

- A **FAQ** pairs a question with an answer. Retrieval returns the full answer directly.
- A **skill (Agent Skill)** packages instructions and optional supporting files for a procedure. Retrieval returns a preview so an agent can decide whether to load the instructions and resources.

An entry keeps the same identifier across versions. You can also assign an immutable, human-readable entry key when you create it. Use the entry identifier to maintain existing content; creating another entry produces a separate history.

Both types can include optional intents, attributes, and metadata:

- **Intents** are optional task paraphrases returned on discovery to help an agent or application interpret the entry.
- **Attributes** support exact-match retrieval filters, such as locale or audience.
- **Metadata** holds additional agent or application context; retrieval filters do not search it.

For fields and types, see the [entry model]({{< relref "/develop/ai/context-engine/agent-playbook/api-reference#schema/StableEntry" >}}).

### Versions

A version is a complete, immutable snapshot of an entry's authored content. Updating an entry appends a new version rather than editing the existing snapshot.

The latest version and the published version can differ. Version 2 of a refund procedure can remain under review while agents retrieve version 1. Publishing version 2 switches retrieval to the update and retains version 1 for rollback.

<Diagram WIP>

Management operations let you inspect drafts and historical versions with the required permissions. See the [version model]({{< relref "/develop/ai/context-engine/agent-playbook/api-reference#schema/Version" >}}) for fields and types.

### Publication

Publication selects the version of an entry that search and discovery can return.

Publish a reviewed version to make it available to agents. Publish an earlier version to roll back. Withdraw the publication to stop serving the entry while retaining its history. Delete the entry to remove it and its versions permanently.

## Discovery

Discovery returns relevant, published FAQ answers and skill previews for an agent task.

Similarity scores help rank relevant content. Filter attributes narrow the audience or topic. Pins let an application select known published skills or FAQs regardless of similarity.

For skills, the agent selects a preview, loads its instructions, and fetches supporting files as needed. Your application controls how it uses that content.

## Proposals

A proposal is a suggested playbook entry awaiting expert review. See the [proposal model]({{< relref "/develop/ai/context-engine/agent-playbook/api-reference#schema/GetProposalResponseContent" >}}) for fields and types.

A human or agent can suggest a question and answer, edit the candidate, or attach evidence.

Accepting a reviewed proposal *promotes* its candidate into an *unpublished* entry. Proposal workflows currently support FAQs; skills are planned for a future release.

### Evidence

Evidence gives reviewers source context for a proposal. It can come from background extraction or an authorized client acting for a human or agent. See the [evidence model]({{< relref "/develop/ai/context-engine/agent-playbook/api-reference#schema/ProposalEvidence" >}}) for fields and types.

More evidence means more submitted observations, not greater factual accuracy. Check the candidate against its sources before accepting and publishing it.

See [Review proposals]({{< relref "/develop/ai/context-engine/agent-playbook/proposals" >}}) for the procedure.
