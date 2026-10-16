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

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-inbox" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Search open proposals before submitting another candidate. Search excludes trash, promotion history, and published FAQs. Review similar questions to check whether they need the same answer.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-search" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Create a proposal

Prepare a question and answer, with intents describing the task and attributes for audience filters. Submit them with `create_proposal` as an `add` action targeting `newEntry`. You can supply an entry key for the FAQ that acceptance will create.

The candidate enters the inbox without changing what agents retrieve.

Save the returned proposal identifier and `proposalRevision`. The revision identifies the candidate a reviewer edits or accepts.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-create" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

### Handle an existing candidate

Creation or candidate replacement can return `409` with type `/errors/proposal-already-exists`. Read the existing proposal before submitting more content. Catch `PlaybookConflictErrorResponseContent` and read its identifier from `error.data.existing_proposal_id`.

If the existing open candidate addresses the same need, use its identifier to [attach evidence]({{< relref "/develop/ai/context-engine/agent-playbook/proposals#attach-evidence" >}}). Review its current revision before editing or accepting it. Restore a trashed candidate before adding evidence; promoted candidates remain locked against review changes. Duplicate detection is advisory, so concurrent submissions can still produce candidates that need consolidation during review.

## Attach evidence

Submit source context to the open proposal with `submit_proposal_evidence`. Each observation includes:

| Field | Purpose |
|:------|:--------|
| `evidenceId` | Identifier for this observation. Reuse it for an exact retry. |
| `schemaVersion` | Evidence format version; currently `1`. |
| `observedAt` | Time of the source observation. |
| `producer` | Name and version of the application or agent submitting it. |
| `source` | Source type, with optional reference and content objects. |

Attach a supporting passage and a reference the reviewer can check. The service does not independently verify caller-supplied attribution.

Evidence is immutable. Retrying the same identifier and payload returns `alreadyPresent`. Reusing that identifier for changed content returns a conflict. Use a new identifier for a new observation.

Evidence stays with the proposal. Acceptance does not copy it into the FAQ. See [evidence limits]({{< relref "/develop/ai/context-engine/agent-playbook/limits#proposal-and-evidence-limits" >}}) before attaching large source content.

This example attaches a policy excerpt. The HTTP example uses `openssl` to generate an identifier. Keep that identifier and payload for exact retries.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-evidence" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Review and edit a candidate

1. List the inbox or search proposals for the topic you want to review.
1. Retrieve the complete proposal, including its candidate and evidence.
1. Check that the sources support the answer, its conditions, and its intended audience.
1. Replace the candidate with `replace_proposal` if it needs changes, supplying `expectedProposalRevision` for the revision you read.
1. Review the returned candidate and record its new revision.

Editing replaces the complete proposed action and preserves existing evidence.

If another reviewer changes the candidate, the revision check fails. Read and review the current candidate before trying again. An evidence count can guide review priority, but it is not a correctness score.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-read" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

After checking the source excerpt, add its guidance about card details. Start from the action you just read, preserve its other fields, and supply that revision.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-replace" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Dismiss, restore, or purge

Dismiss a candidate you do not want to accept. It moves to trash, where you can inspect or restore it before its retention deadline. Restore a trashed proposal before editing it, attaching evidence, or accepting it.

Open proposals also leave the inbox when their review window expires. Check `inboxExpiresAt` and `purgeAt` rather than treating the inbox as permanent storage. Candidate edits, new evidence, and restoration refresh the review deadlines.

Purge a trashed proposal when you want to remove it permanently. Save any review records your application needs before the proposal is purged.

Test dismissal and restoration before accepting the sample. Purging instead ends the walkthrough for that proposal.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-trash" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Accept and publish

Use `accept_proposal` with the reviewed revision. It creates one unpublished FAQ and returns its entry and version.

The `promoting` and `promoted` states prevent further review changes. If acceptance is interrupted, retry it to resume or retrieve the recorded FAQ. Use that FAQ rather than creating a replacement.

Inspect the returned FAQ, then [publish its version]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#publish-a-version" >}}). Acceptance does not grant publication permission.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-final-review" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Accept the reviewed revision.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-accept" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Publish the returned FAQ version after review.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-publish" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

The accepted FAQ remains after this example. Delete it with the [FAQ cleanup procedure]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#withdraw-or-delete-an-faq" >}}) using the returned entry identifier when you finish.

## Inspect promotion history

The trash view includes dismissed or expired proposals and retained `promoted` history. A promoted proposal cannot be restored or edited. Read its detail with `get_proposal` while it is retained, or purge it when its review record is no longer needed. Purging the proposal does not delete the accepted FAQ. A `promoting` proposal remains in the inbox for acceptance recovery and cannot be purged.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-history" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Review background extraction results

With background extraction enabled, extraction agents read eligible conversations from a connected Redis Agent Memory store. They can create FAQ proposals or attach evidence to existing open proposals for review.

Extraction is opt-in. An administrator must configure the source connection and enable extraction on a deployment that supports it. Proposal permissions alone do not configure or start extraction.

<!-- TODO: Link to source connection and extraction setup when Agent Playbooks operator guidance exists. -->

Review extracted candidates in the same inbox. Check their sources, answers, and audiences before accepting and publishing. Extraction does not publish answers automatically or extract skills.
