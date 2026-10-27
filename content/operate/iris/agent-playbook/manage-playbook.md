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

The list shows each playbook's **Status**, **Name**, **Playbook ID**, when its configuration was last updated, and its database. Select a playbook to open it.

<!-- TODO: screenshot of the Agent Playbooks list. -->

A playbook's page has the following tabs:

- [**Registry**](#registry-tab): the playbook's frequently asked questions (FAQs) and skills, and their versions.
- [**Proposals**](#proposals-tab): suggested FAQs waiting for review.
- [**Playground**](#playground-tab): a test of what an agent retrieves for a query.
- [**Settings**](#settings-tab): the playbook's settings, credentials, extraction, and retrieval policy.

If your role can't read the playbook's content, you see only the **Settings** tab.

## Registry tab

The **Registry** tab lists the playbook's entries, with **FAQs** and **Skills** on separate tabs. For each entry, it shows the question or skill name, which version is published, the latest version, and when it was updated. Filter the list by **Publication** to find entries that are published, not published, or have a newer version waiting.

### Add a FAQ

1. On the **FAQs** tab, select **New FAQ**.
1. Enter the **Question** and the **Answer** your agents should give.
1. Optionally, open **Optional settings** and set the following:

    | Setting | Description |
    |:--------|:------------|
    | **Alias** | A stable, human-readable identifier for the entry, using lowercase letters, numbers, and single hyphens. You can't change it after you create the entry. |
    | **Retrieval intents** | Up to five task paraphrases, one per line, returned with the entry to help an agent interpret it. |
    | **Filter attributes** | A JavaScript Object Notation (JSON) object of up to 32 attributes, such as locale or audience, that retrieval filters can match. |
    | **Metadata** | JSON for any other context your agent or application needs. Retrieval filters don't search it. |

1. Select **Save as draft**.

The console saves the FAQ as an unpublished version 1. Agents don't receive it until you [publish it](#publish-a-version).

### Upload a skill

A skill packages instructions and supporting files for a procedure, in the [Agent Skills](https://agentskills.io/home) format.

1. On the **Skills** tab, select **Upload Skill**.
1. Drop or browse to an **Agent Skills ZIP** file, up to 5 MiB. The ZIP must contain one folder, named after the skill, with a `SKILL.md` file that begins with YAML `name` and `description` fields, plus any resources.
1. Optionally, set the entry's **Optional settings**, as for a FAQ.
1. Select **Save as draft**.

See [Manage skills](/content/develop/ai/context-engine/agent-playbook/manage-skills.md) for how to package a skill.

### Publish a version

Every change to an entry creates a new version. Agents receive only the version you publish, so you can prepare and review a new version while agents keep using the current one.

Select an entry to open its page. The published version card shows which version agents receive, and whether a newer version isn't published yet. The **Versions** table lists every version and its state.

- To publish a version, select it and select **Publish version**, or select **Publish** in the **Versions** table.
- To roll back, publish an earlier version.
- To stop serving the entry, select **Withdraw version**. Its versions stay available, and you can publish one again later.
- To edit the entry, select **New version**. Saving creates an unpublished version.
- To see what changed between two versions, select **Compare versions**.

You can also publish an entry's newest version from the **Registry** list: select **Publish latest** from the entry's actions menu.

### Delete an entry

Deleting an entry permanently removes all its versions and resources.

1. In the **Registry** list, select **Delete entry** from the entry's actions menu. To delete several entries, select them and select **Delete selected**.
1. Confirm the deletion.

## Proposals tab

The **Proposals** tab holds suggested FAQs for review. Proposals can come from agents with `propose` access, or from [automatic FAQ extraction](#automatic-faq-extraction).

The **Inbox** lists open proposals, with how much evidence supports each one and when to review it by. Select a proposal to review its candidate question and answer, and its **Supporting evidence**. Then:

- Select **Accept as draft FAQ** to create an unpublished FAQ version from the candidate. Review it, then [publish it](#publish-a-version) when it's ready.
- Select **Edit candidate** to change the question, answer, alias, intents, or attributes before you accept it.
- Select **Move to trash** to dismiss it.

More evidence means more observations, not greater accuracy. Check the candidate against its sources before you accept and publish it. See [Review proposals](/content/develop/ai/context-engine/agent-playbook/proposals.md) for more.

The **Trash** lists dismissed proposals until they're purged. Select **Restore to inbox** to review one again, or **Purge proposal** to delete it permanently.

## Playground tab

The **Playground** tab shows what an agent would retrieve for a query, using only published versions.

1. Enter a **Query**, such as a question your agent needs to answer.
1. Optionally, open **Options** to choose a **Search mode** (combined discovery, FAQ search, or skill search), a **Result limit**, pinned entries, or an **Attribute filter**. These options apply only to this test. They don't change the playbook's policy.
1. Select **Run search**.

**What your agent sees** lists the matching FAQs and skill previews, with each one's version and similarity score, and the full response as JSON. To change how discovery selects entries for every request, edit the [discovery policy](#discovery-policy).

## Settings tab

The **Settings** tab has the following sections. To change a section, select its **Edit** button, make your changes, and select **Save changes**.

### General settings

Shows the **Playbook name**, which you can change, and the **Playbook ID**, **Embedding model**, and **Redis Cloud database**, which you can't. It also lists the playbook's **Agent endpoint** for each region.

### Manage API keys

Select **Manage API keys** to create or change API keys in **Access & Identity**. An agent needs `read` access to retrieve published content, and `propose` access to submit proposals.

### Embedding provider credential

Appears only for a playbook that uses a **Bring Your Own** embedding model. It shows whether a provider API key is configured, and lets you replace it.

### Automatic FAQ extraction

Extraction turns your agents' conversations in Agent Memory into FAQ proposals for review. The playbook must be **Ready** to create or turn on extraction.

1. Enter the **Source RAM store ID**, the ID of the Agent Memory service whose conversations to read, or choose one from your account. You can't change it after you create the extraction job.
    <!-- TODO: confirm the UI term. The console calls the Agent Memory service a "RAM store" here, but the Agent Memory screens and docs don't use that term. -->
1. Set the **Session inactivity window**, how long after a session's last event it becomes eligible for extraction, from 1 to 1440 minutes. The default is 30 minutes.
1. Select **Create extraction job**.
1. Turn extraction on when you're ready.

Extraction suggests FAQs only. It never publishes them: accepted proposals become unpublished FAQs that you review and publish. To stop extraction and remove its settings, select **Remove extraction job**. Your Agent Memory service, FAQs, and proposals stay.

### Discovery policy

Controls how discovery selects entries for every request.

| Setting | Description |
|:--------|:------------|
| **FAQ minimum score** | The minimum similarity, from 0 to 1, for a FAQ to match. |
| **Skill minimum score** | The minimum similarity, from 0 to 1, for a skill to match. |
| **Maximum results** | The most entries discovery returns, from 1 to 50. |
| **Preview token budget** | An estimated token ceiling for one discovery response. Leave it empty to disable it. |

See [Configure discovery](/content/develop/ai/context-engine/agent-playbook/retrieval.md#configure-discovery) for how these settings work together.

### Proposal review policy

Set the **Review window**, how long proposals stay available for review, from 1 to 365 days. **Maximum open proposals** shows the inbox's capacity, which you can't change in the console.

### Danger zone

| Action | What it does |
|:-------|:-------------|
| **Clear entries** | Permanently removes all FAQs, skills, versions, and resources, including published content. Proposals and settings stay. |
| **Clear proposals** | Permanently removes all proposals from the inbox and trash. Entries and their versions stay. |
| **Delete** | Permanently deletes the playbook, with its entries, versions, resources, and proposals. |

You can clear entries or proposals only while the playbook is **Ready**. Each action asks you to confirm, and none can be undone. If a clear fails partway, check the playbook's current state before you retry.
