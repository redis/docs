---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Search published knowledge, discover skills and answers together, and control relevance and result size.
hideListLinks: true
linktitle: Retrieval
title: Retrieve knowledge
weight: 50
---

Retrieve published knowledge for the user's task. Choose a retrieval method:

- [**Discovery**]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#discovery" >}}) combines FAQ answers and skill previews so the agent can choose what to use.
- [**Search**]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#search" >}}) returns one entry type when your application needs answers or skill previews, with a relevance threshold and result count for each request.

Both methods serve current publications. They exclude drafts, historical versions, and proposals.

## Before you begin

Use a data-plane endpoint, playbook identifier, and API key with `read` permission. Publish the entries you want to retrieve before testing them.

Start with the quickstart's [client setup]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart#connect-to-the-playbook" >}}) with a reader key, then append this page's snippets in order. The examples use the published FAQ and skill from the task guides; keep them published until testing is complete.

## Discovery

Discovery returns answers and skill previews within a shared result limit. Pins include required entries; a preview budget limits returned content.

Call `discover_entries` with a Python or TypeScript SDK, over HTTP, or through [MCP]({{< relref "/develop/ai/context-engine/agent-playbook/mcp" >}}). Load selected skill instructions and files with [progressive disclosure]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#load-skills-with-progressive-disclosure" >}}).

Request up to five entries for the agent's task:

{{< clients-example set="iris_playbook_retrieval" step="playbook-retrieval-discover" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Python's unified SDK exposes matches as `discovery.discovered` and pins as `discovery.pinned`. `as_prompt()` renders their context for an agent. The CLI accepts the same JSON discovery request as cURL through `--input FILE` and returns the API response with `--json`.

### How discovery selects entries

Discovery applies these steps:

1. Resolve each pin to its current published version, preserving request order.
1. Reserve result slots and preview budget for the pins.
1. Rank matching FAQs and skills together using the query, attribute filter, and each type's similarity threshold. Exclude pinned entries from these matches.
1. Fill the remaining slots in rank order. When a preview does not fit the remaining token budget, skip it and consider later candidates that may fit.
1. Return pins in `pinnedEntries` and ranked matches in `discoveredEntries`, with count and budget truncation signals.

If pins fill every result slot, discovery returns only the pins. An FAQ preview includes its question and answer. A skill preview includes its name, description, entry identifier, version, and file address.

### Configure discovery

The request controls are:

| Control | Use it to |
|:--------|:----------|
| `query` | Describe the agent's task. Required even when supplying pins. |
| `filter` | Restrict semantic matches by attributes. Uses the same [filter expressions as search]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#select-an-audience-with-filters" >}}); pins bypass it. |
| `limit` | Reduce the combined result count. Omission uses `discovery.maxResults`, which also caps an explicit limit. |
| `pinnedEntries` | Require known published entries, in the order supplied. |

Your administrator [configures the playbook controls]({{< relref "/operate/iris/agent-playbook/self-managed/configuration#playbook-settings" >}}):

| Setting | Default | Effect |
|:--------|:--------|:-------|
| `discovery.faqMinimumScore` | `0.7` | Minimum similarity for discovered FAQ matches. |
| `discovery.skillMinimumScore` | `0.7` | Minimum similarity for discovered skill matches. |
| `discovery.maxResults` | `10` | Combined result ceiling for pins and discovered matches. |
| `discovery.maxPreviewTokens` | Disabled | Estimated token ceiling for the discovery response. |

Discovery has no per-request similarity override. An administrator can adjust the playbook thresholds.

### Pin required knowledge

Use discovery pins when a task must include a known published entry. Supply exactly one entry identifier or entry key for each pin. Discovery returns pins in request order, separately from semantic matches.

Pins bypass similarity thresholds and the request filter. Choose pins for the intended audience yourself. They still consume result slots and preview budget.

A missing, unpublished, duplicate, or oversized pin fails the request. Use pins to test connectivity or include required content; evaluate semantic relevance without them.

Export the identifier of a published skill, such as the sample in [Manage skills]({{< relref "/develop/ai/context-engine/agent-playbook/manage-skills" >}}), before cleanup:

```bash
export PLAYBOOK_SKILL_ID='<published-skill-entry-id>'
```

{{< clients-example set="iris_playbook_retrieval" step="playbook-retrieval-pin" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

### Limit discovery previews

Use the preview budget to limit the knowledge returned in one discovery response. It excludes model framing, conversation history, loaded instructions, and fetched files. Your application still controls the model's total context.

| Signal | Meaning |
|:-------|:--------|
| `truncated: true` | Eligible fetched candidates exceed the slots left after pins. This does not count every match in the playbook. |
| `budgetTruncated: true` | Matching previews were skipped to fit the token ceiling. |

Empty results with `budgetTruncated: true` can mean matches did not fit. Shorten FAQ answers or skill descriptions, or raise the ceiling through your administrator. Increasing the result count does not increase the token budget. Type-specific search does not use this budget.

{{< clients-example set="iris_playbook_retrieval" step="playbook-retrieval-budget" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

### Load skills with progressive disclosure

Progressive disclosure lets an agent select a skill from its description before loading instructions and files. Discovery and skill search support the same loading steps.

1. **Discover previews.** Retrieve names and descriptions so the agent can assess which skills match the task. FAQ answers are already included in the result.
1. **Select a skill.** Keep the entry identifier and version from the same preview together.
1. **Load instructions.** Retrieve that version's instructions and resource descriptors. With MCP, call `load_skill` using the selected `entry_id` and `version`.
1. **Fetch files as needed.** Retrieve only supporting files needed for the task. Use returned resource identifiers or URIs. With MCP, pass the returned `uri` to `fetch_resource`.
1. **Add content to context.** Your application chooses the instructions and files to give the model and controls any actions it takes.

The preview budget applies only to the first step, not loaded instructions, files, or total model context.

Reader keys can load only the current publication. MCP tools apply this restriction even to management keys. For example, discovery can return version `1`, then loading fails because version `2` was published in the meantime. Rediscover once, select again, and load instructions and files from the newly returned version. Keeping an identifier/version pair does not reserve access to an older publication.

The example loads the skill selected in [Pin required knowledge]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#pin-required-knowledge" >}}), then fetches its reply template. For a complete MCP client example, see [Connect a client]({{< relref "/develop/ai/context-engine/agent-playbook/mcp#connect-a-client" >}}).

{{< clients-example set="iris_playbook_retrieval" step="playbook-retrieval-load" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Use an SDK or cURL for this reader-only operation. The published CLI's skill-loading commands perform management lookup, which requires `write` or `publish`. Discovery and search CLI examples work with the reader key.

## Search

Search returns ranked `matches` of one entry type. Use it to find an answer, select a skill, or tune retrieval per request.

| Operation | Use it when | Result |
|:----------|:------------|:-------|
| `search_faqs` | Your application needs an answer. | Ranked FAQ matches with questions and answers. |
| `search_skills` | Your application needs a procedure. | Ranked skill previews with names, descriptions, and file addresses. |

Send a query that describes the task and relevant conditions. A support question such as “How can I check an existing refund?” is more useful than a query containing only “refund.”

Semantic matching compares your query with the FAQ question or the skill's name and description. Include the task and distinguishing conditions in those fields. FAQ answers, intents, metadata, skill instructions, and supporting files do not contribute to similarity scores. Attributes narrow the eligible matches through filters. These rules apply to both search and discovery.

Retain returned entry identifiers and versions with the content you select.

{{< clients-example set="iris_playbook_retrieval" step="playbook-retrieval-search" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

### Control relevance and result count

Search accepts these request controls. The table uses HTTP field names.

| Control | Default | Use it to |
|:--------|:--------|:----------|
| `query` | Required | Describe the task to match semantically. |
| `filter` | None | Restrict matches by entry attributes, such as locale or topic. |
| `minimumScore` | The playbook's threshold for that entry type; initially `0.7` | Set a similarity floor from `0` to `1` for this request. |
| `limit` | `discovery.maxResults`; initially `10` | Request 1–50 results. An explicit search limit is not capped by the playbook's discovery limit. |

The threshold defaults come from `discovery.faqMinimumScore` and `discovery.skillMinimumScore`. Your administrator can change them. Search does not use discovery pins or the discovery preview budget.

Similarity ranks matches; it does not measure answer correctness. Test “Where is my refund?” against “How do I request a refund?” The first needs the sample status answer; the second needs different guidance. Compare results across paraphrases before choosing a threshold. Higher thresholds can remove useful matches too. If no relevant match remains, ask for clarification or route to support.

For example, override the FAQ search threshold and result count for one request:

{{< clients-example set="iris_playbook_retrieval" step="playbook-retrieval-threshold" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

### Select an audience with filters

Set attributes when [authoring FAQs]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs" >}}) or [uploading skills]({{< relref "/develop/ai/context-engine/agent-playbook/manage-skills" >}}). Filter retrieval by those attributes to select a locale, product, or audience.

Filters use exact, typed comparisons. Each filter node has one operator: `eq`, `and`, or `or`.

An equality filter matches a scalar attribute or a member of a list-valued attribute. Boolean `true`, integer `1`, and string `"true"` are different values. Filters do not search metadata and do not replace playbook access grants.

{{< clients-example set="iris_playbook_retrieval" step="playbook-retrieval-filter" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Use entry lookup or list operations for management state. Lists use pagination cursors; search and discovery use result limits. See [service limits and errors]({{< relref "/develop/ai/context-engine/agent-playbook/limits" >}}) for request constraints and recovery.
