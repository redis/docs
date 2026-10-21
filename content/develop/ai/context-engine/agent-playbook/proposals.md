---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Create proposals, attach evidence, review candidates, and promote approved answers into unpublished FAQs.
hideListLinks: true
linktitle: Review proposals
title: Review proposals
weight: 40
---

Review suggested answers as proposals. Check each candidate against its evidence, accept it into an unpublished FAQ, and publish the reviewed version.

The current proposal workflow adds new FAQs. It does not create skills or revise existing entries.

To fill the inbox from agent usage, see [Automate proposal generation](/content/develop/ai/context-engine/agent-playbook/proposals.md#automate-proposal-generation). You can use background extraction from Redis Agent Memory or build a producer with the proposal and evidence APIs.

![A proposal enters the inbox with candidate content and evidence. Acceptance creates an unpublished FAQ, which publication serves to agents. Dismissal or inbox expiration moves the proposal to trash, where it can be restored before its retention deadline.](/images/ai/context-engine/agent-playbook-proposals.svg)
{width="700"}

## Before you begin

Use an existing playbook and API keys with these permissions:

- `propose` to create candidates and attach evidence.
- `write` to edit, accept, dismiss, restore, or purge proposals.
- `publish` to publish the FAQ returned by acceptance.

Start with the quickstart's [client setup]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart#connect-to-the-playbook" >}}), then append this page's snippets in order. Run each write once.

This walkthrough needs all three permissions on `PLAYBOOK_API_KEY`. Applications can use separate keys for suggestion, review, and publication.

## Find proposals to review

A key with `read` permission can list, search, and inspect proposals. The inbox contains open candidates and acceptances in `promoting` state. Only open candidates can be edited. Read the complete proposal and its evidence before deciding what to accept.

Follow the cursor until it is absent, even after an empty page. Keep the view and sort settings unchanged. An absent first-page `total` means unknown.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-inbox" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Search open proposals before submitting another candidate. Search excludes trash, promotion history, and published FAQs. Review similar questions to check whether they need the same answer.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-search" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Create a proposal

Prepare a question and answer, with intents describing the task and attributes for audience filters. Submit them with `create_proposal` as an `add` action targeting `newEntry`. You can supply an entry key for the FAQ that acceptance will create and immutable source context that explains where the proposal originated.

The candidate enters the inbox without changing what agents retrieve.

Save the returned proposal identifier and `proposalRevision`. The revision identifies the candidate a reviewer edits or accepts. A creation source does not count as attached evidence.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-create" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The CLI reads a flat FAQ candidate file and a separate creation-source JSON file. It constructs the proposal action for you. Proposal and evidence JSON use the API field names; neither operation publishes content.

### Handle an existing candidate

Creation or candidate replacement can return `409` with type `/errors/proposal-already-exists`. Read the existing proposal before submitting more content. Catch `PlaybookConflictErrorResponseContent` and read its identifier from `error.data.existing_proposal_id`.

If the existing open candidate addresses the same need, use its identifier to [attach evidence]({{< relref "/develop/ai/context-engine/agent-playbook/proposals#attach-evidence" >}}). Review its current revision before editing or accepting it. Restore a trashed candidate before adding evidence; promoted candidates remain locked against review changes. Duplicate detection is advisory, so concurrent submissions can still produce candidates that need consolidation during review.

## Attach evidence

Submit source context to the open proposal with `submit_proposal_evidence`. Each observation includes:

| Field | Purpose |
|:------|:--------|
| `evidenceId` | Identifier for this observation. Reuse it for an exact retry. |
| `observedAt` | Time of the source observation. |
| `producer` | Application or agent name, with optional prompt version and commit hash. |
| `source` | Source type, with optional reference and content objects. |

Attach a supporting passage and a reference the reviewer can check. The service does not independently verify caller-supplied attribution.

Evidence is immutable. Retrying the same identifier and payload returns `alreadyPresent`. Reusing that identifier for changed content returns a conflict. Use a new identifier for a new observation.

Evidence stays with the proposal. Acceptance does not copy it into the FAQ. See [evidence limits]({{< relref "/develop/ai/context-engine/agent-playbook/limits#proposal-and-evidence-limits" >}}) before attaching large source content.

This example attaches a policy excerpt. The HTTP example uses `openssl` to generate an identifier. Keep that identifier and payload for exact retries.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-evidence" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Review and edit a candidate

1. List the inbox or search proposals for the topic you want to review. Filter by action or entry type when the inbox contains multiple proposal kinds.
1. Retrieve the complete proposal, including its candidate and evidence.
1. Check that the sources support the answer, its conditions, and its intended audience.
1. Replace the candidate with `replace_proposal` if it needs changes, supplying `expectedProposalRevision` for the revision you read.
1. Review the returned candidate and record its new revision.

Editing replaces the complete proposed action and preserves existing evidence.

If another reviewer changes the candidate, the revision check fails. Read and review the current candidate before trying again. An evidence count can guide review priority, but it is not a correctness score.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-read" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

After checking the source excerpt, add its guidance about card details. Start from the action you just read, preserve its other fields, and supply that revision.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-replace" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Dismiss, restore, or purge

Dismiss a candidate you do not want to accept. It moves to trash, where you can inspect or restore it before its retention deadline. Restore a trashed proposal before editing it, attaching evidence, or accepting it.

Open proposals also leave the inbox when their review window expires. Check `inboxExpiresAt` and `purgeAt` rather than treating the inbox as permanent storage. Candidate edits, new evidence, and restoration refresh the review deadlines.

Purge a trashed proposal when you want to remove it permanently. Save any review records your application needs before the proposal is purged.

Test dismissal and restoration before accepting the sample. Purging instead ends the walkthrough for that proposal.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-trash" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Accept and publish

Use `accept_proposal` with the reviewed revision. It creates one unpublished FAQ and returns a historical `result.versionCreated` receipt. The receipt identifies the new entry and version, but it does not contain the authored content or confirm that the target still exists.

The `promoting` and `promoted` states prevent further review changes. If acceptance is interrupted, retry it to resume or retrieve the recorded FAQ. Use that FAQ rather than creating a replacement.

Read the accepted FAQ version with the receipt, then [publish that version]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#publish-a-version" >}}). Acceptance does not grant publication permission. If the client returns an unrecognized result type, inspect or upgrade the client before acting on it.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-final-review" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Accept the reviewed revision.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-accept" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Publish the returned FAQ version after review.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-publish" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The accepted FAQ remains after this example. Delete it with the [FAQ cleanup procedure]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#withdraw-or-delete-an-faq" >}}) using the returned entry identifier when you finish.

## Inspect promotion history

The trash view includes dismissed or expired proposals and retained `promoted` history. A promoted proposal cannot be restored or edited. Read its detail with `get_proposal` while it is retained, or purge it when its review record is no longer needed. Purging the proposal does not delete the accepted FAQ. A `promoting` proposal remains in the inbox for acceptance recovery and cannot be purged.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-history" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

CLI proposal lists follow every cursor automatically. Use `--page` for a response with `items`, `nextCursor`, and optional `total`, then `--cursor` to continue. Candidate replacement and acceptance examples pass the revision from the saved review rather than selecting the current revision automatically.

## Automate proposal generation

Use automation to turn agent usage into candidates for the review inbox. Both approaches currently propose new FAQs. Skill extraction and skill proposals are planned for a future release; updating a published FAQ still uses the [FAQ versioning workflow](/content/develop/ai/context-engine/agent-playbook/manage-faqs.md#update-an-answer).

| Approach | Source and responsibilities | Use it when |
| --- | --- | --- |
| Background extraction from Redis Agent Memory | Your agent records session events. A configured worker extracts candidates, compares existing knowledge, and submits proposals or evidence. | You want to derive reusable answers from conversations stored in Redis Agent Memory. |
| Direct proposal and evidence API calls | Your application selects observations, generates candidates, compares existing knowledge, and submits proposals or evidence. | You need custom triggers, source systems, or candidate-generation rules. |

Give a custom producer `propose` permission, which includes `read`. Keep review and publication with callers that have the corresponding permissions. Creating proposals or attaching evidence does not change what agents retrieve.

### Extract FAQs from agent usage in Redis Agent Memory

1. [Record session events in Redis Agent Memory](/content/develop/ai/context-engine/agent-memory/developer-guide.md#work-with-session-memory). Include the user's questions and the agent's responses under the correct user and conversation identities. Retrieving playbook knowledge alone does not record the interaction in Redis Agent Memory.
1. Ask your administrator to configure the source connection and extraction worker. This includes a generation model, worker access to both products, and an extraction binding between the source store and destination playbook. Proposal permissions alone do not enable extraction.
1. Have the administrator enable the binding after it becomes ready and the worker is healthy. A binding selects a whole store in the same tenant as the playbook. There is currently one binding per playbook, with no per-binding namespace selection.
1. Let a representative conversation become idle. The binding's default idle window is 30 minutes, and its scan cadence is five minutes. These intervals determine eligibility; they are not a completion-time guarantee.
1. [Inspect the proposal inbox](/content/develop/ai/context-engine/agent-playbook/proposals.md#find-proposals-to-review) and read the candidate's creation source and attached evidence.

The worker derives reusable questions and answers from retained events or a session summary. It compares each observation with published FAQs and open proposals:

| Comparison result | Effect |
| --- | --- |
| A published FAQ already covers the observation | The worker leaves the published entry unchanged; no proposal may be needed. |
| An open proposal addresses the same need | The worker attaches evidence without replacing the candidate. The observation can include a differing answer for review. |
| The observation represents a new need, or the match is uncertain | The worker creates a new FAQ proposal with its original source context. |

An empty inbox does not necessarily indicate a failure. A session might still be active, contain no reusable answer, or support existing published knowledge. Model input limits can also restrict how much of a session is examined. Completed sessions are not automatically reprocessed when later events arrive. Keep source sessions available long enough for extraction and review, and ask the operator to inspect worker health and processing outcomes when expected results are missing.

### Review background extraction results

Extracted proposals use the same review, acceptance, and publication steps as manually submitted proposals. Read the full proposal with `get_proposal`; its creation source and evidence provide context that compact inbox results omit.

For Redis Agent Memory sources, check the store, owner, session, and cited event identifiers. Summary-derived observations include a summary reference and supporting quotes. Extracted question and answer text is model-derived and can differ from the source wording. The optional model assessment `conflict: true` flags a differing answer; `false` reports no detected conflict. An absent assessment does not mean the answers agree.

Check factual support, audience, and sensitive or conversation-specific details before accepting a candidate. An evidence count measures observations, not correctness or the number of independent users. Acceptance retains the review record with the proposal and creates an unpublished FAQ. [Publish the reviewed version](/content/develop/ai/context-engine/agent-playbook/proposals.md#accept-and-publish) separately.

### Generate proposals with the proposal and evidence APIs

Use a custom producer for events such as a resolved support conversation, an agent evaluation, or a reviewed document update. Redis Agent Memory is optional for this path. The API stores the candidate and observations you submit; your producer performs extraction and decides how observations relate to existing knowledge.

Use this page's Python, TypeScript, cURL, or CLI examples as the submission steps in your producer:

1. Select an observation and generate a reusable question and answer. Preserve a source reference that reviewers can inspect, and remove details that apply only to one conversation.
1. Search both [published FAQs](/content/develop/ai/context-engine/agent-playbook/retrieval.md#search) and [open proposals](/content/develop/ai/context-engine/agent-playbook/proposals.md#find-proposals-to-review). Proposal search does not include published FAQs. Compare the question, conditions, and audience as well as the similarity score.
1. If an open proposal addresses the same need, [attach evidence](/content/develop/ai/context-engine/agent-playbook/proposals.md#attach-evidence) with `submit_proposal_evidence`. Include the observation's time, producer, and source. A differing answer can be useful evidence for a reviewer; attaching it does not edit the candidate.
1. If no suitable candidate exists, [create a proposal](/content/develop/ai/context-engine/agent-playbook/proposals.md#create-a-proposal) with `create_proposal`, an `add` action, a `newEntry` target, and a FAQ payload. Include immutable creation source context and retain the returned proposal identifier and revision.
1. Route the proposal to a reviewer. If published knowledge needs correction, use the separate FAQ revision process; the current proposal API cannot propose an update to that entry.

The creation `source` explains the first observation and does not increase `evidenceCount`. Attach evidence for additional observations. Your source's `reference` and `content` are source-specific JSON objects; custom producers do not need to imitate the Redis Agent Memory extraction schema. Identify generated answers and retain the supporting material a reviewer needs to evaluate them.

#### Handle retries and concurrent observations

Persist each evidence identifier and its original payload before sending it. Retry an uncertain evidence submission with the same identifier, timestamp, producer, and source. An exact retry returns `alreadyPresent`; changed content under the same identifier conflicts. Generate a new identifier for a new observation. The walkthrough generates a random identifier once; a background job must retain it across retries instead of generating another on each attempt.

Proposal creation is not idempotent. After a timeout or ambiguous response, inspect the inbox before creating again. Handle `/errors/proposal-already-exists` by reading the returned existing proposal and deciding whether the observation belongs there. Search and duplicate detection do not guarantee uniqueness under concurrent submissions, so allow reviewers to consolidate equivalent candidates.

Recheck a proposal if an evidence target has been dismissed, promoted, or purged. Leave restoration and candidate edits to an authorized reviewer. Respect [proposal and evidence limits](/content/develop/ai/context-engine/agent-playbook/limits.md#proposal-and-evidence-limits), and retain failed observations for investigation rather than retrying a permanent validation error indefinitely.
