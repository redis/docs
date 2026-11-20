---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Review and publish proposals to add or update FAQs and skills in a playbook.
hideListLinks: true
linktitle: Proposals
title: Proposals
weight: 40
exampleClientOrder:
- Python (Iris)
- TypeScript (Iris)
- CLI (Iris)
- cURL (Iris)
aliases:
- /develop/ai/context-engine/agent-playbook/proposals/
---

Use proposals to review suggested frequently asked questions (FAQs) and skills before publishing them. An `ADD` proposal creates an entry. An [UPDATE proposal](#update-an-existing-entry) appends a version to an existing entry. Both produce an unpublished version on acceptance.

Start with the FAQ walkthrough or [review a skill proposal](#review-skill-proposals). [Automatic extraction](#automate-proposal-generation) from Redis Agent Memory creates FAQ ADD proposals.

![In this ADD example, a proposal enters the inbox with candidate content and evidence. Acceptance creates an unpublished FAQ. Publication makes it available to agents. Dismissal or inbox expiration moves the proposal to trash, where it can be restored before its retention deadline.](/images/ai/context-engine/agent-playbook-proposals.svg)
{width="700"}

## Before you begin

Use an existing playbook and application programming interface (API) keys with these permissions:

- `read` to inspect review material.
- `propose` to create candidates and attach evidence.
- `write` to edit, accept, dismiss, restore, or purge proposals.
- `publish` to publish the entry returned by acceptance.

For this walkthrough, give `IRIS_AGENT_PLAYBOOKS_API_KEY` these permissions and follow the quickstart's [client setup]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart#connect-to-the-playbook" >}}). Append the snippets in order and run each write once. In your application, you can separate suggestion, review, and publication across keys.

For the skill examples, first [prepare the sample skill package](/content/develop/ai/context-engine/agent-playbooks/manage-skills.md#prepare-a-skill-package). The CLI takes the complete skill directory with `proposals create --entry-type skill`.

## Find proposals to review

A key with `read` permission can list, search, and inspect proposals. The inbox contains candidates awaiting review and any acceptance still in progress. Only open candidates can be edited.

For software development kit (SDK) and cURL lists, follow the cursor until it is absent, even after an empty page. Keep the view and sort settings unchanged. Responses return `items` and `nextCursor` and don't include a total count. The command-line interface (CLI) follows cursors automatically. Use `--page` for one page with `items` and `nextCursor`, then `--cursor` to continue.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-inbox" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

Search before submitting another candidate. Compare similar questions to decide whether they need the same answer. Proposal search covers open candidates, not trash, accepted proposals, or [published FAQs](/content/develop/ai/context-engine/agent-playbooks/retrieval.md#search).

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-search" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

To find corrections with an UPDATE-capable client, set `actionType` to `UPDATE` on list or search. The CLI uses `--action-type update`.

## Create a proposal

Write a self-contained question and answer. Add intents for the task and attributes for its audience, then call `create_proposal` with an `add` action targeting `newEntry`. You can supply an entry key for the resulting FAQ and immutable source context that a reviewer can check.

Save the proposal identifier and `revision`. Use the revision to identify the candidate you edit or accept.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-create" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

The CLI defaults to ADD. Pass a flat FAQ candidate file in JavaScript Object Notation (JSON) or a skill directory with `--entry-type skill`. Use `--source` to attach a separate source file.

### Handle an existing candidate

If creation or replacement returns `409` with type `/errors/proposal-already-exists`, read the existing proposal. The error body names it in `existingId`; Python exposes it as `error.data.existing_id` on `ConflictErrorResponseContent`.

If the open candidate addresses the same need, [attach evidence]({{< relref "/develop/ai/context-engine/agent-playbooks/proposals#attach-evidence" >}}) to it rather than creating another suggestion. Review its current revision before editing or accepting it.

## Attach evidence

Use `submit_proposal_evidence` to add another observation to an open proposal. For example, attach a policy excerpt that supports the answer or a conversation that reveals a missing condition.

| HTTP/CLI field | Python argument or dictionary field | Purpose |
|:---------------|:------------------------------------|:--------|
| `evidenceId` | `evidence_id` | Required observation identifier: `evd_` followed by 32 lowercase hexadecimal characters. Reuse it for an exact retry. |
| `observedAt` | `observed_at` | Required time of the source observation. |
| `producer.name` | `producer["name"]` | Required application or agent name. |
| `producer.promptVersion` | `producer["prompt_version"]` | Optional prompt version. |
| `producer.commitSHA` | `producer["commit_sha"]` | Optional commit hash: 40 or 64 lowercase hexadecimal characters. |
| `source.kind` | `source["kind"]` | Required source label. |
| `source.reference` | `source["reference"]` | Optional JSON object locating the source. |
| `source.content` | `source["content"]` | Optional JSON object containing the observation or excerpt. |

Include a supporting passage and a reference the reviewer can check. Redis Agent Playbooks do not independently verify caller-supplied attribution. An evidence count measures observations, not correctness or independent users.

Evidence is immutable. Retrying the same identifier and payload returns the disposition `ALREADY_PRESENT`; new evidence returns `ADDED`. Reusing that identifier for changed content returns a conflict. Use a new identifier for a new observation.

The creation source explains the first suggestion and does not increase `evidenceCount`. Attached evidence stays with the proposal; acceptance does not copy it into the FAQ. Check [evidence limits]({{< relref "/develop/ai/context-engine/agent-playbooks/limits#proposal-and-evidence-limits" >}}) before attaching large passages.

This example attaches a policy excerpt. The cURL and CLI tabs use `openssl` to generate an identifier.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-evidence" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

## Review and edit a candidate

1. Retrieve the complete proposal and its evidence with `get_proposal`.
1. Check that the sources support the answer, its conditions, and its intended audience.
1. Check for sensitive or conversation-specific details that should not become reusable guidance.
1. Replace the candidate with `replace_proposal` if it needs changes. Supply the complete action and `expected_revision` for the revision you read (`expectedRevision` in HTTP).
1. Review the returned candidate and record its new revision.

Editing preserves evidence. If another reviewer changes the candidate, the revision check fails; review the current answer before trying again.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-read" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

Add the excerpt's guidance about card details. Preserve the other fields from the proposal you just read.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-replace" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

## Dismiss, restore, or purge

Dismiss a candidate you do not want to accept. You can inspect or restore it from trash before its retention deadline. Restore it before editing, attaching evidence, or accepting it.

Open proposals also expire. Check `inboxExpiresAt` and `purgeAt`, and see [review and retention limits](/content/develop/ai/context-engine/agent-playbooks/limits.md#proposal-and-evidence-limits) for how activity changes those deadlines.

Purge a trashed proposal to remove it permanently. Save any review records your application needs first.

Test dismissal and restoration before accepting the sample. Purging instead ends the walkthrough for that proposal.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-trash" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

## Accept and publish

Call `accept_proposal` with the revision you reviewed. Acceptance creates one unpublished FAQ. Use the entry identifier and version in `result.versionCreated` to read that FAQ, then [publish the reviewed version]({{< relref "/develop/ai/context-engine/agent-playbooks/manage-faqs#publish-a-version" >}}) with a key that has `publish` permission.

A proposal being accepted (state `PROMOTING`) or already accepted (`PROMOTED`) cannot be edited. If acceptance is interrupted, retry it rather than creating another FAQ. The returned receipt is historical: it does not contain the answer or confirm that the FAQ still exists. Inspect the FAQ before acting on a retried result.

If your client cannot recognize the result type, inspect the result or upgrade the client before publishing.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-final-review" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

Accept the reviewed revision.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-accept" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

Publish the returned FAQ version after review.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-publish" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

The accepted FAQ remains after this example. Delete it with the [FAQ cleanup procedure]({{< relref "/develop/ai/context-engine/agent-playbooks/manage-faqs#withdraw-or-delete-an-faq" >}}) using the returned entry identifier when you finish.

## Inspect promotion history

Use the trash view to inspect dismissed, expired, and accepted proposals while they are retained. Accepted proposals cannot be restored or edited. Purging their review record does not delete the FAQ. An acceptance still in progress remains in the inbox and cannot be purged.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-history" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

## Review skill proposals

Submit the complete skill ZIP in `skillPackage.packageBase64` under `content.payload`. The service validates the archive and returns normalized instructions and resource descriptors. A proposal resource has no published skill URI; read it through the proposal resource operation with the revision you reviewed.

If creation rejects `skillPackage` with `/errors/unknown-request-member`, ask your administrator to check that the service supports your SDK's API contract.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-skill-create" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Read the candidate, inspect its instructions, and read the supporting files. This example verifies the reply template's SHA-256 digest before displaying its text. Do not run scripts merely because archive validation succeeded.

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-skill-review" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Resource reads require `expectedRevision` (`expected_revision` in Python). If another reviewer replaces the candidate, a stale resource read or acceptance returns `412` with type `/errors/revision-conflict`. Read and review the new candidate and its files before retrying. To replace a skill candidate, submit a complete ZIP with the retained intents, attributes, and metadata; the normalized response payload is not an upload request.

Accept the reviewed revision and check the receipt's `entryKind` before selecting a publication operation. A skill receipt identifies an unpublished skill version:

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-skill-accept" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Publish the reviewed skill version with `publish_skill`:

{{< clients-example set="iris_playbook_proposals" step="playbook-proposal-skill-publish" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

The accepted skill remains published. Use its returned entry identifier with the [skill cleanup procedure](/content/develop/ai/context-engine/agent-playbooks/manage-skills.md#withdraw-or-delete-a-skill) when you finish. Purging a proposal's review record does not delete its accepted entry.


## Update an existing entry

Use a Playbooks deployment that supports existing-entry proposals. For the SDK tabs, install `redis-agent-playbook==1.3.0` for Python or `@redis-iris/agent-playbook@1.3.0` for TypeScript in a separate environment. The CLI and unified Python examples require a `redis-iris` release that lists `--update` in `iris agent-playbooks proposals create --help`. Use the connection variables from [client setup](/content/develop/ai/context-engine/agent-playbooks/quickstart.md#connect-to-the-playbook).

### Submit a complete candidate

For this walkthrough, choose a sample FAQ or skill in a test playbook. Set its identifier and the positive version number you edited:

```bash
export PLAYBOOK_ENTRY_ID='<entry-id>'
export PLAYBOOK_BASED_ON_VERSION=1
```

The basis records the entry version you edited. Acceptance can append a new version even when the entry has a newer draft. Compare the candidate with both versions before acceptance. The entry keeps its identifier, key, and history.

Save the full authored content as `proposal-content.json`. For an FAQ, include the question, answer, and any intents, attributes, and metadata you want to retain. For example:

```json
{
  "intents": ["Check when to contact support about a refund"],
  "attributes": {"topic": "refund"},
  "payload": {
    "faq": {
      "question": "What should I send support about a missing refund?",
      "answer": "Send your order number and the date you requested the refund."
    }
  }
}
```

For a skill, package the complete directory using [the skill packaging steps](/content/develop/ai/context-engine/agent-playbooks/manage-skills.md#prepare-a-skill-package). Put the archive in `payload.skillPackage.packageBase64` and put authored settings beside `payload`. For example:

```bash
jq -n --rawfile package <(base64 < refund-support-reply.zip | tr -d '\n') '{
  attributes: {topic: "refund"},
  payload: {skillPackage: {packageBase64: $package}}
}' > proposal-content.json
```

The candidate is a full replacement. Omitted intents, attributes, metadata, and skill files are removed from the new version.

For the CLI tab, use a FAQ JSON file from `iris agent-playbooks faqs export` or a complete [skill directory](/content/develop/ai/context-engine/agent-playbooks/manage-skills.md#prepare-a-skill-package). Set `PLAYBOOK_ENTRY_TYPE` to `faq` or `skill` and `PLAYBOOK_UPDATE_CANDIDATE` to the file or directory. `--update ENTRY` accepts a key or ID. The CLI reads the entry's latest version when you omit `--based-on`. Supply the ID and `--based-on` to submit with a key that has only `propose` permission.

{{< clients-example set="iris_playbook_proposals_update" step="playbook-update-submit" description="" lang_filter="Python (Iris),TypeScript (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

### Submit from the unified Python SDK

Use this example to submit one proposal from Python. Set `PLAYBOOK_ENTRY_TYPE` to `faq` or `skill` and supply the complete content you intend to keep. For a skill, prepare `refund-support-reply.zip` before running the example. Use the returned proposal ID to inspect the candidate in the CLI or an SDK.

{{< clients-example set="iris_playbook_proposals_update_unified" step="playbook-update-unified-submit" description="" lang_filter="Python (Iris)" footer="hide" />}}

### Review and replace the candidate

Inspect the proposal and compare it with the basis version. Check the current draft and publication for changes made since that version. `expectedRevision` guards the proposal revision during replacement and acceptance.

For this walkthrough, edit the candidate and save the complete corrected content as `proposal-content-reviewed.json`. For the CLI tab, point `PLAYBOOK_UPDATE_REVISED` to the revised file or directory. The API requires `write` to replace the candidate. The CLI also needs `read` to fetch the stored target. Keep the action, entry, basis and kind, and send the `expectedRevision` you reviewed. If the service returns `412`, read and review the current revision before replacing it. Review the returned candidate after replacing it. For skills, use an SDK or the cURL tab to read the candidate files for that revision before accepting. The example checks the reply template against its digest.

{{< clients-example set="iris_playbook_proposals_update" step="playbook-update-review" description="" lang_filter="Python (Iris),TypeScript (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

### Accept and publish the new version

Accept the reviewed revision. Acceptance appends an unpublished version. If the response is uncertain, repeat acceptance for the same proposal and revision to recover the recorded receipt. If the target was deleted before acceptance could write, acceptance fails. A receipt from an earlier completed acceptance is historical, so read the exact version before publishing it.

{{< clients-example set="iris_playbook_proposals_update" step="playbook-update-accept" description="" lang_filter="Python (Iris),TypeScript (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

Use the entry identifier and version from `result.versionCreated` to publish with a key that has `publish` permission. Acceptance leaves the current publication in place.

{{< clients-example set="iris_playbook_proposals_update" step="playbook-update-publish" description="" lang_filter="Python (Iris),TypeScript (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

## Automate proposal generation

Choose how your application contributes suggestions:

- **Redis Agent Memory:** Derive reusable answers from recorded agent conversations through background extraction.
- **Proposal and evidence APIs:** Generate suggestions from your own sources and triggers, such as resolved support cases or evaluation findings.

Both paths feed the same review inbox. Background extraction generates FAQs; your application can submit FAQ or skill proposals. Automatic skill extraction is not supported.

### Extract FAQs from agent usage in Redis Agent Memory

1. [Record session events in Redis Agent Memory](/content/develop/ai/context-engine/agent-memory/developer-guide.md#build-context-for-each-agent-turn), including user questions and agent responses under the correct conversation identity. Retrieving playbook knowledge alone does not record an interaction.
1. Ask your administrator to [configure and enable extraction](/content/operate/iris/agent-playbook/manage-playbook.md#automatic-faq-extraction) for the source store and destination playbook. Proposal permissions alone do not enable it.
1. Let a representative conversation become idle, then [inspect the inbox](/content/develop/ai/context-engine/agent-playbooks/proposals.md#find-proposals-to-review) for suggestions and new evidence.

Each playbook can extract from one whole Redis Agent Memory store in the same tenant; selecting individual namespaces is not supported. Keep source conversations available for extraction and review. Later events in a completed conversation do not automatically trigger another extraction.

Not every conversation produces a proposal. It might still be active, contain no reusable answer, or support an existing FAQ or open candidate. Extraction can add evidence to an open proposal without replacing its answer. It never updates a published FAQ. See [extraction setup](/content/operate/iris/agent-playbook/manage-playbook.md#automatic-faq-extraction) and [operator troubleshooting](/content/operate/iris/agent-playbook/manage-playbook.md#troubleshoot-a-playbook) for timing and diagnosis.

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
