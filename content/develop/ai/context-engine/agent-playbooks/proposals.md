---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Turn suggested answers from agents and applications into reviewed FAQs for your playbook.
hideListLinks: true
linktitle: Proposals
title: Proposals
weight: 40
---

Use proposals to turn answers from agent conversations, documents, or application events into knowledge other agents can reuse. An agent or application suggests an answer; a reviewer checks its evidence before accepting and publishing it as a frequently asked question (FAQ).

Proposals currently add new FAQs. They do not create skills or revise existing entries. To correct an existing answer, use [FAQ versioning](/content/develop/ai/context-engine/agent-playbooks/manage-faqs.md#update-an-answer).

Start with the walkthrough, or [automate suggestions](/content/develop/ai/context-engine/agent-playbooks/proposals.md#automate-proposal-generation) from Redis Agent Memory or your own application. Suggestions do not affect agent responses until you publish the accepted FAQ.

![A proposal enters the inbox with candidate content and evidence. Acceptance creates an unpublished FAQ, which publication serves to agents. Dismissal or inbox expiration moves the proposal to trash, where it can be restored before its retention deadline.](/images/ai/context-engine/agent-playbook-proposals.svg)
{width="700"}

## Before you begin

Use an existing playbook and application programming interface (API) keys with these permissions:

- `propose` to create candidates and attach evidence.
- `write` to edit, accept, dismiss, restore, or purge proposals.
- `publish` to publish the FAQ returned by acceptance.

For this walkthrough, give `PLAYBOOK_API_KEY` all three permissions and follow the quickstart's [client setup]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart#connect-to-the-playbook" >}}). Append the snippets in order and run each write once. In your application, you can separate suggestion, review, and publication across keys.

## Find proposals to review

A key with `read` permission can list, search, and inspect proposals. The inbox contains candidates awaiting review and any acceptance still in progress. Only open candidates can be edited.

For software development kit (SDK) and cURL lists, follow the cursor until it is absent, even after an empty page. Keep the view and sort settings unchanged. Responses return `items` and `nextCursor` and don't include a total count. The command-line interface (CLI) follows cursors automatically. Use `--page` for one page with `items` and `nextCursor`, then `--cursor` to continue.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-inbox" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Search before submitting another candidate. Compare similar questions to decide whether they need the same answer. Proposal search covers open candidates, not trash, accepted proposals, or [published FAQs](/content/develop/ai/context-engine/agent-playbooks/retrieval.md#search).

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-search" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Create a proposal

Write a self-contained question and answer. Add intents for the task and attributes for its audience, then call `create_proposal` with an `add` action targeting `newEntry`. You can supply an entry key for the resulting FAQ and immutable source context that a reviewer can check.

Save the proposal identifier and `revision`. Use the revision to identify the candidate you edit or accept.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-create" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The CLI takes a flat FAQ candidate file and a separate source file in JavaScript Object Notation (JSON), and constructs the proposal action for you.

### Handle an existing candidate

If creation or replacement returns `409` with type `/errors/proposal-already-exists`, read the existing proposal. The error body names it in `existingId`; Python exposes it as `error.data.existing_id` on `ConflictErrorResponseContent`.

If the open candidate addresses the same need, [attach evidence]({{< relref "/develop/ai/context-engine/agent-playbooks/proposals#attach-evidence" >}}) to it rather than creating another suggestion. Review its current revision before editing or accepting it.

## Attach evidence

Use `submit_proposal_evidence` to add another observation to an open proposal. For example, attach a policy excerpt that supports the answer or a conversation that reveals a missing condition.

| Field | Purpose |
|:------|:--------|
| `evidenceId` | Identifier for this observation. Reuse it for an exact retry. |
| `observedAt` | Time of the source observation. |
| `producer` | Application or agent name, with optional prompt version and commit hash. |
| `source` | Source type, with optional reference and content objects. |

Include a supporting passage and a reference the reviewer can check. Redis Agent Playbooks does not independently verify caller-supplied attribution. An evidence count measures observations, not correctness or independent users.

Evidence is immutable. Retrying the same identifier and payload returns the disposition `ALREADY_PRESENT`; new evidence returns `ADDED`. Reusing that identifier for changed content returns a conflict. Use a new identifier for a new observation.

The creation source explains the first suggestion and does not increase `evidenceCount`. Attached evidence stays with the proposal; acceptance does not copy it into the FAQ. Check [evidence limits]({{< relref "/develop/ai/context-engine/agent-playbooks/limits#proposal-and-evidence-limits" >}}) before attaching large passages.

This example attaches a policy excerpt. The cURL and CLI tabs use `openssl` to generate an identifier.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-evidence" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Review and edit a candidate

1. Retrieve the complete proposal and its evidence with `get_proposal`.
1. Check that the sources support the answer, its conditions, and its intended audience.
1. Check for sensitive or conversation-specific details that should not become reusable guidance.
1. Replace the candidate with `replace_proposal` if it needs changes. Supply the complete action and `expectedRevision` for the revision you read.
1. Review the returned candidate and record its new revision.

Editing preserves evidence. If another reviewer changes the candidate, the revision check fails; review the current answer before trying again.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-read" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Add the excerpt's guidance about card details. Preserve the other fields from the proposal you just read.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-replace" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Dismiss, restore, or purge

Dismiss a candidate you do not want to accept. You can inspect or restore it from trash before its retention deadline. Restore it before editing, attaching evidence, or accepting it.

Open proposals also expire. Check `inboxExpiresAt` and `purgeAt`, and see [review and retention limits](/content/develop/ai/context-engine/agent-playbooks/limits.md#proposal-and-evidence-limits) for how activity changes those deadlines.

Purge a trashed proposal to remove it permanently. Save any review records your application needs first.

Test dismissal and restoration before accepting the sample. Purging instead ends the walkthrough for that proposal.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-trash" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Accept and publish

Call `accept_proposal` with the revision you reviewed. Acceptance creates one unpublished FAQ. Use the entry identifier and version in `result.versionCreated` to read that FAQ, then [publish the reviewed version]({{< relref "/develop/ai/context-engine/agent-playbooks/manage-faqs#publish-a-version" >}}) with a key that has `publish` permission.

A proposal being accepted (state `PROMOTING`) or already accepted (`PROMOTED`) cannot be edited. If acceptance is interrupted, retry it rather than creating another FAQ. The returned receipt is historical: it does not contain the answer or confirm that the FAQ still exists. Inspect the FAQ before acting on a retried result.

If your client cannot recognize the result type, inspect the result or upgrade the client before publishing.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-final-review" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Accept the reviewed revision.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-accept" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

Publish the returned FAQ version after review.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-publish" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

The accepted FAQ remains after this example. Delete it with the [FAQ cleanup procedure]({{< relref "/develop/ai/context-engine/agent-playbooks/manage-faqs#withdraw-or-delete-an-faq" >}}) using the returned entry identifier when you finish.

## Inspect promotion history

Use the trash view to inspect dismissed, expired, and accepted proposals while they are retained. Accepted proposals cannot be restored or edited. Purging their review record does not delete the FAQ. An acceptance still in progress remains in the inbox and cannot be purged.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-history" description="" lang_filter="Python (Iris),cURL (Iris),CLI (Iris)" footer="hide" />}}

## Automate proposal generation

Choose how your application contributes suggestions:

- **Redis Agent Memory:** Derive reusable answers from recorded agent conversations through background extraction.
- **Proposal and evidence APIs:** Generate suggestions from your own sources and triggers, such as resolved support cases or evaluation findings.

Both paths feed the same review inbox. They currently support new FAQs; skill extraction and skill proposals are planned for a future release.

### Extract FAQs from agent usage in Redis Agent Memory

1. [Record session events in Redis Agent Memory](/content/develop/ai/context-engine/agent-memory/developer-guide.md#work-with-session-memory), including user questions and agent responses under the correct conversation identity. Retrieving playbook knowledge alone does not record an interaction.
1. Ask your administrator to configure and enable extraction for the source store and destination playbook. Proposal permissions alone do not enable it.
1. Let a representative conversation become idle, then [inspect the inbox](/content/develop/ai/context-engine/agent-playbooks/proposals.md#find-proposals-to-review) for suggestions and new evidence.

Each playbook can extract from one whole Redis Agent Memory store in the same tenant; selecting individual namespaces is not supported. Keep source conversations available for extraction and review. Later events in a completed conversation do not automatically trigger another extraction.

Not every conversation produces a proposal. It might still be active, contain no reusable answer, or support an existing FAQ or open candidate. Extraction can add evidence to an open proposal without replacing its answer. It never updates a published FAQ. For timing, eligibility, and troubleshooting, use the operator's extraction guide.

### Review background extraction results

Open the proposal's source conversation or supporting quotes and check the generated answer against them. Extraction suggests reusable wording, which can differ from the conversation or reflect conflicting observations. Resolve those differences and remove conversation-specific details before following the [review and publication steps](/content/develop/ai/context-engine/agent-playbooks/proposals.md#review-and-edit-a-candidate).

### Generate proposals with the proposal and evidence APIs

Use the Python, cURL, or CLI examples in your application when you need custom sources or generation rules. Redis Agent Memory is optional for this path. Your application selects the source material and generates the suggested answer.

1. Extract a reusable question and answer from the source material, keeping a reference the reviewer can inspect.
1. Compare it with [published FAQs](/content/develop/ai/context-engine/agent-playbooks/retrieval.md#search) and [open proposals](/content/develop/ai/context-engine/agent-playbooks/proposals.md#find-proposals-to-review). Check the question, conditions, and audience, rather than relying on similarity scores alone.
1. [Attach evidence](/content/develop/ai/context-engine/agent-playbooks/proposals.md#attach-evidence) if an open candidate addresses the same need. A differing answer can help the reviewer; evidence does not edit the candidate.
1. [Create a proposal](/content/develop/ai/context-engine/agent-playbooks/proposals.md#create-a-proposal) if the answer covers a new need. Save its identifier and revision.
1. Route the candidate to a reviewer before accepting and publishing it.

Use a key with `propose` permission, which includes `read`. Keep review and publication permissions separate. Put source identifiers in `source.reference` and supporting material in `source.content`, using JSON objects appropriate to your source.

#### Handle retries and concurrent observations

Persist evidence identifiers and their original payloads before submission so a background job can follow the [exact-retry rules](/content/develop/ai/context-engine/agent-playbooks/proposals.md#attach-evidence). Do not generate another identifier on each retry.

Proposal creation is not idempotent: after an uncertain response, inspect the inbox before creating again. Follow [existing-candidate handling](/content/develop/ai/context-engine/agent-playbooks/proposals.md#handle-an-existing-candidate) for duplicate errors. Concurrent submissions can still produce equivalent candidates that need review.

Recheck the proposal if its state changes, and leave restoration or edits to an authorized reviewer. Check [proposal and evidence limits](/content/develop/ai/context-engine/agent-playbooks/limits.md#proposal-and-evidence-limits) and retain failed observations for investigation instead of retrying permanent validation errors.
