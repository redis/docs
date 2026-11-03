---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Manage a playbook's FAQs, skills, versions, proposals, and settings in Redis Cloud, and test what agents retrieve.
hideListLinks: true
linktitle: Manage playbook
title: View and manage a playbook
weight: 15
---

After you [create a playbook](/content/operate/iris/agent-playbook/create-playbook.md), select **Agent Playbooks** under **Iris** in the Redis Cloud console menu to see the list of your playbooks.

The list shows each playbook's **Status**, **Name**, **Playbook ID**, when its configuration was last updated, and its database. Select a playbook to open its **Configuration** tab.

<!-- TODO: screenshot of the Agent Playbooks list. -->

A playbook's page has the following tabs:

- [**Configuration**](#configuration-tab): the playbook's settings, credentials, extraction, and retrieval policy.
- [**Registry**](#registry-tab): the playbook's frequently asked questions (FAQs) and skills, and their versions.
- [**Proposals**](#proposals-tab): suggested FAQs and skills waiting for review.
- [**Playground**](#playground-tab): a test of what an agent retrieves for a query.

If your role can't read the playbook's content, you see only the **Configuration** tab.

To connect an agent, select **Connect** on the playbook's page. See [Give an agent access](/content/operate/iris/agent-playbook/create-playbook.md#give-an-agent-access).

## Registry tab

The **Registry** tab lists the playbook's entries, with **FAQs** and **Skills** on separate tabs. For each entry, it shows the question or skill name, which version is published, the latest version, and when it was updated. Filter the list by **Publication** to find entries that are published, not published, or have a newer version waiting.

### Add a FAQ

1. On the **FAQs** tab, select **New FAQ**.
1. In the **New FAQ** dialog, enter the **Question** and the **Answer** your agents should give.
1. Optionally, open **Optional settings** and set the following:

    | Setting | Description |
    |:--------|:------------|
    | **Alias (optional, immutable)** | A stable, human-readable identifier for the entry, using lowercase letters, numbers, and single hyphens, up to 64 characters. You can't change it after you create the entry. |
    | **Retrieval intents** | Up to five task paraphrases, one per line, returned with the entry to help an agent interpret it. |
    | **Filter attributes** | A JavaScript Object Notation (JSON) object of up to 32 attributes, such as locale or audience, that retrieval filters can match. |
    | **Metadata** | JSON for any other context your agent or application needs. Retrieval filters don't search it. |

1. Select **Create FAQ**.

The console saves the FAQ as an unpublished version 1. Agents don't receive it until you [publish it](#publish-a-version).

### Upload a skill

A skill packages instructions and supporting files for a procedure, in the [Agent Skills](https://agentskills.io/home) format.

1. On the **Skills** tab, select **Upload Skill**.
1. In the **Upload Skill** dialog, drop or browse to an **Agent Skills ZIP** file, up to 5 MiB. The ZIP must contain one folder, named after the skill, with a `SKILL.md` file that begins with YAML `name` and `description` fields, plus any resources. Exclude `__MACOSX` files.
1. Optionally, set the entry's **Optional settings**, as for a FAQ.
1. Select **Upload Skill**.

See [Manage skills](/content/develop/ai/context-engine/agent-playbooks/manage-skills.md) for how to package a skill.

### Publish a version

Every change to an entry creates a new version. Agents receive only the version you publish, so you can prepare and review a new version while agents keep using the current one.

Select an entry to open its page. The published version card shows which version agents receive, and whether a newer version isn't published yet. The **Versions** table lists every version and its state.

- To publish a version, select it and select **Publish version**, or select **Publish** in the **Versions** table. The **Versions** table also has a **Withdraw** button for the published version.
- To roll back, publish an earlier version.
- To stop serving the entry, select **Withdraw version**. Its versions stay available, and you can publish one again later.
- To edit the entry, select **New version**. Saving creates an unpublished version.
- To see what changed between two versions, select **Compare versions**.

You can also publish an entry's newest version from the **Registry** list: select **Publish latest** from the entry's actions menu. The option shows the newest version number, such as **Publish latest v3**.

### Delete an entry

Deleting an entry permanently removes all its versions and resources.

1. In the **Registry** list, select **Delete entry** from the entry's actions menu. To delete several entries, select them and select **Delete selected**.
1. Select the confirmation checkbox, and then select **Delete**.

You can also delete an entry from its page, in the **Danger zone**.

## Proposals tab

The **Proposals** tab lists FAQ and skill proposals from agents with `propose` access. [Automatic FAQ extraction](#automatic-faq-extraction) adds FAQ proposals only.

The **Inbox** lists open proposals, with how much evidence supports each one and when to review it by. Select a proposal to review its candidate and **Supporting evidence**.

For a FAQ, review the question and answer. For a skill, review its name, description, and **Instructions**. Use **Download** under **Resources** to inspect its supporting files. The console verifies that downloaded files match the reviewed proposal.

After review:

- Select **Accept as draft FAQ** or **Accept as draft Skill** to create an unpublished version from the candidate. Review it, then [publish it](#publish-a-version) when it's ready.
- For a FAQ, select **Edit candidate** to change the question, answer, alias, intents, or attributes before you accept it.
- Select **Move to trash** to dismiss it.

If the proposal changes during review, select **Reload proposal** and review the updated candidate and files before accepting it.

More evidence means more observations, not greater accuracy. Check the candidate against its sources before you accept and publish it. For review through the API, see [Review proposals](/content/develop/ai/context-engine/agent-playbooks/proposals.md).

The **Trash** lists dismissed proposals until they're purged. Select **Restore to inbox** to review one again, or **Purge proposal** to delete it permanently.

## Playground tab

The **Playground** tab shows what an agent would retrieve for a query, using only published versions.

1. Enter a **Query**, such as a question your agent needs to answer.
1. Optionally, open **Options** to choose a **Search mode** (combined discovery, FAQ search, or skill search), a **Result limit**, pinned entries, or an **Attribute filter**. These options apply only to this test. They don't change the playbook's policy.
1. Select **Run search**.

**What your agent sees** lists the matching FAQs and skill previews, with each one's version and similarity score, and the full response as JSON. To change how discovery selects entries for every request, edit the [discovery policy](#discovery-policy).

## Configuration tab

The **Configuration** tab has the following sections. To change a section, select its **Edit** button, make your changes, and select **Save changes**.

### General settings

Shows the **Playbook name**, which you can change, and the **Playbook ID**, **Embedding model**, and **Redis Cloud database**, which you can't. It also lists the playbook's **Agent endpoint** for each region.

### Embedding provider credential

Appears only for a playbook that uses a **Bring Your Own** embedding model. It shows whether a provider API key is configured, and lets you replace it.

### Automatic FAQ extraction

Extraction turns conversations in Agent Memory into FAQ proposals for review. The playbook must be **Ready**, and you need access to manage the source service. Each playbook reads one whole Agent Memory service in the same account; you can't select individual namespaces.

1. Enter the **Source RAM store ID**, the ID of the Agent Memory service whose conversations to read, or choose one from your account. You can't change it after you create the extraction job.
1. Set the **Session inactivity window**, how long after a session's last event it becomes eligible for extraction, from 1 to 1440 minutes. The default is 30 minutes.
1. Select **Create extraction job**.
1. Turn extraction on when you're ready.

Extraction suggests FAQs only. It never publishes them: accepted proposals become unpublished FAQs that you review and publish. To stop extraction and remove its settings, use **Remove extraction job** in the [Danger zone](#danger-zone).

Turning extraction off pauses new work and keeps the source connection and settings. Work already in progress can finish. A **Ready** extraction configuration does not confirm that a worker has processed a conversation.

Keep source conversations available until extraction and review finish. A conversation becomes eligible after the inactivity window; that window is not a completion deadline. Active conversations, conversations without reusable answers, and answers already covered by published FAQs might produce no proposal. Extraction can also add evidence to an existing open proposal. Later events in a completed conversation do not automatically trigger extraction again.

### Discovery policy

Controls how discovery selects entries for every request.

| Setting | Description |
|:--------|:------------|
| **FAQ minimum score** | The minimum similarity, from 0 to 1, for a FAQ to match. |
| **Skill minimum score** | The minimum similarity, from 0 to 1, for a skill to match. |
| **Maximum results** | The most entries discovery returns, from 1 to 50. |
| **Preview token budget** | An estimated token ceiling for one discovery response, from 64 tokens. Turn the switch off to disable it. The console keeps the saved number. |

See [Configure discovery](/content/develop/ai/context-engine/agent-playbooks/retrieval.md#configure-discovery) for how these settings work together.

### Proposal review policy

Set the **Review window**, how long proposals stay available for review, from 1 to 365 days. **Maximum open proposals** shows the inbox's capacity, which you can't change in the console.

### Danger zone

| Action | What it does |
|:-------|:-------------|
| **Clear entries** | Permanently removes all FAQs, skills, versions, and resources, including published content. Proposals and settings stay. |
| **Clear proposals** | Permanently removes all proposals from the inbox and trash. Entries and their versions stay. |
| **Remove extraction job** | Stops automatic FAQ extraction and removes its source connection and settings. Your Agent Memory service, FAQs, and proposals stay. Appears only when an extraction job exists. |
| **Delete** | Permanently deletes the playbook, with its entries, versions, resources, and proposals. |

You can clear entries or proposals only while the playbook is **Ready**. To confirm clearing or deleting, select the confirmation checkbox in the dialog. None of these actions can be undone. If a clear fails partway, check the playbook's current state before you retry.

## Troubleshoot a playbook

Check the playbook's state in **Configuration** before retrying a failed operation. Keep its identifier and safe error details for support; do not include API keys or conversation content.

| Symptom | Next action |
|:--------|:------------|
| Provisioning fails or does not complete | Check the selected database's availability, capacity, and network allow list. Resolve the reported problem before retrying. If the playbook remains failed, contact support with its identifier. |
| **Suspended** or **Unavailable** | Check the database and any console explanation. Contact your account administrator or support if you can't restore access. Repeated authoring requests do not repair the service. |
| A **Bring Your Own** model cannot process content | Check or replace the provider key in **Embedding provider credential**, and check provider access to the selected model. The provider key is separate from the agent key. |
| Requests return `401` or `403` | Verify the endpoint, playbook identifier, key expiry, and action grants. Create a replacement key if the old one expired or was deleted. See [Give an agent access](/content/operate/iris/agent-playbook/create-playbook.md#give-an-agent-access). |
| Extraction reports a missing or inaccessible source | Restore the Agent Memory service or your permission to manage it, then turn extraction on to check the connection again. To use a different source, remove the existing extraction job and create another. |
| Extraction is enabled but no proposal appears | Confirm that events were recorded in the selected Agent Memory service, the conversation is idle, and the source is still available. Check the inbox for additional evidence on existing proposals. If the issue persists, contact support with the source and playbook identifiers and observation time. The console's configuration status is not a per-session processing history. |
| Playground returns no matches | Confirm that the intended versions are published. Check the query, filters, similarity thresholds, and preview budget. See [Retrieve knowledge](/content/develop/ai/context-engine/agent-playbooks/retrieval.md). |
