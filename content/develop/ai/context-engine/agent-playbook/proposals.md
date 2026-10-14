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

{{< multitabs id="playbook-proposal-inbox" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
cursor = None
while True:
    page = playbook.list_proposals(view="inbox", sort_by="updatedAt", sort_order="desc", limit=50, cursor=cursor)
    if cursor is None:
        print("Total inbox proposals:", page.total if page.total is not None else "unknown")
    for item in page.proposals:
        print(item.proposal_id, item.status, item.evidence_count, item.action)
    cursor = page.next_cursor
    if cursor is None:
        break
```

-tab-sep-

```typescript
let inboxCursor: string | undefined;
while (true) {
  const page = await playbook.listProposals("inbox", "updatedAt", "desc", 50, inboxCursor);
  if (inboxCursor === undefined) console.log("Total inbox proposals:", page.total ?? "unknown");
  for (const item of page.proposals) console.log(item.proposalId, item.status, item.evidenceCount, item.action);
  inboxCursor = page.nextCursor;
  if (inboxCursor === undefined) break;
}
```

-tab-sep-

```bash
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode view=inbox --data-urlencode sortBy=updatedAt --data-urlencode sortOrder=desc --data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/proposals" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > inbox.json
  if [[ -z "$CURSOR" ]]; then jq '.total // "unknown"' inbox.json; fi
  jq '.proposals[] | {proposalId, status, evidenceCount, action}' inbox.json
  CURSOR=$(jq -r '.nextCursor // empty' inbox.json)
  [[ -n "$CURSOR" ]] || break
done
```

{{< /multitabs >}}

Search open proposals before submitting another candidate. Search excludes trash, promotion history, and published FAQs. Review similar questions to check whether they need the same answer.

{{< multitabs id="playbook-proposal-search" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
related = playbook.search_proposals(query="Contact support about a missing refund", minimum_score=0.7, limit=5)
for match in related.matches:
    print(match.proposal.proposal_id, match.score, match.proposal.action)
```

-tab-sep-

```typescript
const related = await playbook.searchProposals({
  query: "Contact support about a missing refund", minimumScore: 0.7, limit: 5,
});
for (const match of related.matches) console.log(match.proposal.proposalId, match.score, match.proposal.action);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/proposals/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Contact support about a missing refund","minimumScore":0.7,"limit":5}' \
  | jq '.matches[] | {proposalId: .proposal.proposalId, score, action: .proposal.action}'
```

{{< /multitabs >}}

## Create a proposal

Prepare a question and answer, with intents describing the task and attributes for audience filters. Submit them with `create_proposal` as an `add` action targeting `newEntry`. You can supply an entry key for the FAQ that acceptance will create.

The candidate enters the inbox without changing what agents retrieve.

Save the returned proposal identifier and `proposalRevision`. The revision identifies the candidate a reviewer edits or accepts.

{{< multitabs id="playbook-proposal-create" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
action = {"add": {
    "target": {"new_entry": {}},
    "candidate": {"content": {
        "intents": ["Contact support about a missing refund"],
        "attributes": {"locale": "en-US", "topic": "refund"},
        "payload": {"faq": {
            "question": "What should I send support about a missing refund?",
            "answer": "Send your order number and the date you requested the refund.",
        }},
    }},
}}
proposal = playbook.create_proposal(action=action)
proposal_id = proposal.proposal_id
print(proposal_id, proposal.proposal_revision)
```

-tab-sep-

```typescript
const action = { add: {
  target: { newEntry: {} },
  candidate: { content: {
    intents: ["Contact support about a missing refund"],
    attributes: { locale: "en-US", topic: "refund" },
    payload: { faq: {
      question: "What should I send support about a missing refund?",
      answer: "Send your order number and the date you requested the refund.",
    } },
  } },
} };
const proposal = await playbook.createProposal({ action });
const proposalId = proposal.proposalId;
console.log(proposalId, proposal.proposalRevision);
```

-tab-sep-

```bash
cat > proposal.json <<'JSON'
{"action":{"add":{
  "target":{"newEntry":{}},
  "candidate":{"content":{
    "intents":["Contact support about a missing refund"],
    "attributes":{"locale":"en-US","topic":"refund"},
    "payload":{"faq":{
      "question":"What should I send support about a missing refund?",
      "answer":"Send your order number and the date you requested the refund."
    }}
  }}
}}}
JSON
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/proposals" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @proposal.json > proposal-created.json
PROPOSAL_ID=$(jq -er '.proposalId' proposal-created.json)
jq '{proposalId, proposalRevision}' proposal-created.json
```

{{< /multitabs >}}

### Handle an existing candidate

Creation or candidate replacement can return `409` with type `/errors/proposal-already-exists`. Read the proposal identified by `existingProposalId` before submitting more content. In Python, catch `PlaybookConflictErrorResponseContent` and read `error.data.existing_proposal_id`; TypeScript exposes `error.existingProposalId` on the corresponding error class. HTTP callers read the field from the response body.

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

{{< multitabs id="playbook-proposal-evidence" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
from datetime import datetime, timezone
from uuid import uuid4

evidence_id = "evd_" + uuid4().hex
observed_at = datetime.now(timezone.utc)
evidence = playbook.submit_proposal_evidence(
    proposal_id=proposal_id,
    evidence_id=evidence_id,
    schema_version=1,
    observed_at=observed_at,
    producer={"name": "docs-example", "version": "1"},
    source={
        "type": "document",
        "reference": {"documentId": "sample-refund-policy"},
        "content": {"excerpt": "For refund inquiries, collect the order number and request date. Do not request full card details."},
    },
)
print(evidence.disposition)
```

-tab-sep-

```typescript
const { randomUUID } = await import("node:crypto");
const evidenceId = "evd_" + randomUUID().replaceAll("-", "");
const observedAt = new Date();
const evidence = await playbook.submitProposalEvidence(proposalId, evidenceId, {
  schemaVersion: 1,
  observedAt,
  producer: { name: "docs-example", version: "1" },
  source: {
    type: "document",
    reference: { documentId: "sample-refund-policy" },
    content: { excerpt: "For refund inquiries, collect the order number and request date. Do not request full card details." },
  },
});
console.log(evidence.disposition);
```

-tab-sep-

```bash
EVIDENCE_ID="evd_$(openssl rand -hex 16)"
jq -n --arg observedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '{
  schemaVersion: 1, observedAt: $observedAt,
  producer: {name: "docs-example", version: "1"},
  source: {
    type: "document",
    reference: {documentId: "sample-refund-policy"},
    content: {excerpt: "For refund inquiries, collect the order number and request date. Do not request full card details."}
  }
}' > evidence.json
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/proposals/$PROPOSAL_ID/evidence/$EVIDENCE_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @evidence.json | jq .disposition
```

{{< /multitabs >}}

## Review and edit a candidate

1. List the inbox or search proposals for the topic you want to review.
1. Retrieve the complete proposal, including its candidate and evidence.
1. Check that the sources support the answer, its conditions, and its intended audience.
1. Replace the candidate with `replace_proposal` if it needs changes, supplying `expectedProposalRevision` for the revision you read.
1. Review the returned candidate and record its new revision.

Editing replaces the complete proposed action and preserves existing evidence.

If another reviewer changes the candidate, the revision check fails. Read and review the current candidate before trying again. An evidence count can guide review priority, but it is not a correctness score.

{{< multitabs id="playbook-proposal-read" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
reviewed = playbook.get_proposal(proposal_id=proposal_id)
print(reviewed.model_dump_json(by_alias=True, indent=2))
```

-tab-sep-

```typescript
const reviewed = await playbook.getProposal(proposalId);
console.log(JSON.stringify(reviewed, null, 2));
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/proposals/$PROPOSAL_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" > reviewed.json
jq . reviewed.json
```

{{< /multitabs >}}

After checking the source excerpt, add its guidance about card details. Start from the action you just read, preserve its other fields, and supply that revision.

{{< multitabs id="playbook-proposal-replace" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
revised_action = reviewed.action.model_dump(exclude_unset=True)
revised_action["add"]["candidate"]["content"]["payload"]["faq"]["answer"] += " Do not send full card details."
revised = playbook.replace_proposal(
    proposal_id=proposal_id,
    action=revised_action,
    expected_proposal_revision=reviewed.proposal_revision,
)
print(revised.proposal_revision, revised.action)
```

-tab-sep-

```typescript
const reviewedContent = reviewed.action.add.candidate.content;
if (!("faq" in reviewedContent.payload)) throw new Error("Expected an FAQ proposal");
const revisedAction = { add: {
  target: reviewed.action.add.target,
  candidate: { content: {
    ...reviewedContent,
    payload: { faq: {
      ...reviewedContent.payload.faq,
      answer: reviewedContent.payload.faq.answer + " Do not send full card details.",
    } },
  } },
} };
const revised = await playbook.replaceProposal(proposalId, {
  action: revisedAction, expectedProposalRevision: reviewed.proposalRevision,
});
console.log(revised.proposalRevision, revised.action);
```

-tab-sep-

```bash
jq --argjson revision "$(jq -er '.proposalRevision' reviewed.json)" '
  {action} |
  .action.add.candidate.content.payload.faq.answer += " Do not send full card details." |
  .expectedProposalRevision = $revision
' reviewed.json > proposal-update.json
curl --fail-with-body --silent --show-error \
  -X PATCH "$PLAYBOOK_API/proposals/$PROPOSAL_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @proposal-update.json > revised.json
jq '{proposalRevision, action}' revised.json
```

{{< /multitabs >}}

## Dismiss, restore, or purge

Dismiss a candidate you do not want to accept. It moves to trash, where you can inspect or restore it before its retention deadline. Restore a trashed proposal before editing it, attaching evidence, or accepting it.

Open proposals also leave the inbox when their review window expires. Check `inboxExpiresAt` and `purgeAt` rather than treating the inbox as permanent storage. Candidate edits, new evidence, and restoration refresh the review deadlines.

Purge a trashed proposal when you want to remove it permanently. Save any review records your application needs before the proposal is purged.

Test dismissal and restoration before accepting the sample. Purging instead ends the walkthrough for that proposal.

{{< multitabs id="playbook-proposal-trash" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.dismiss_proposal(
    proposal_id=proposal_id, expected_proposal_revision=revised.proposal_revision,
)
playbook.restore_proposal(proposal_id=proposal_id)
# To purge a trashed proposal instead of restoring it:
# playbook.purge_proposal(proposal_id=proposal_id)
```

-tab-sep-

```typescript
await playbook.dismissProposal(proposalId, {
  expectedProposalRevision: revised.proposalRevision,
});
await playbook.restoreProposal(proposalId);
// To purge a trashed proposal instead of restoring it:
// await playbook.purgeProposal(proposalId);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/proposals/$PROPOSAL_ID/dismissal" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{expectedProposalRevision: .proposalRevision}' revised.json)" | jq .status
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_API/proposals/$PROPOSAL_ID/dismissal" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .status
# To purge instead of restoring, DELETE /proposals/$PROPOSAL_ID.
```

{{< /multitabs >}}

## Accept and publish

Use `accept_proposal` with the reviewed revision. It creates one unpublished FAQ and returns its entry and version.

The `promoting` and `promoted` states prevent further review changes. If acceptance is interrupted, retry it to resume or retrieve the recorded FAQ. Use that FAQ rather than creating a replacement.

Inspect the returned FAQ, then [publish its version]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#publish-a-version" >}}). Acceptance does not grant publication permission.

{{< multitabs id="playbook-proposal-final-review" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
final_review = playbook.get_proposal(proposal_id=proposal_id)
print(final_review.action, final_review.evidence)
```

-tab-sep-

```typescript
const finalReview = await playbook.getProposal(proposalId);
console.log(finalReview.action, finalReview.evidence);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/proposals/$PROPOSAL_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" > final-review.json
jq '{action, evidence, proposalRevision}' final-review.json
```

{{< /multitabs >}}

Accept the reviewed revision.

{{< multitabs id="playbook-proposal-accept" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
accepted = playbook.accept_proposal(
    proposal_id=proposal_id,
    expected_proposal_revision=final_review.proposal_revision,
)
print(accepted.entry.entry_id, accepted.version.version, accepted.version.content)
```

-tab-sep-

```typescript
const accepted = await playbook.acceptProposal(proposalId, {
  expectedProposalRevision: finalReview.proposalRevision,
});
console.log(accepted.entry.entryId, accepted.version.version, accepted.version.content);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/proposals/$PROPOSAL_ID/acceptance" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{expectedProposalRevision: .proposalRevision}' final-review.json)" > accepted.json
jq '{entryId: .entry.entryId, version: .version.version, content: .version.content}' accepted.json
```

{{< /multitabs >}}

Publish the returned FAQ version after review.

{{< multitabs id="playbook-proposal-publish" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.publish_faq(faq_id=accepted.entry.entry_id, version=accepted.version.version)
```

-tab-sep-

```typescript
await playbook.publishFaq(accepted.entry.entryId, { version: accepted.version.version });
```

-tab-sep-

```bash
ACCEPTED_FAQ_ID=$(jq -er '.entry.entryId' accepted.json)
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$ACCEPTED_FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{version: .version.version}' accepted.json)" | jq .publication
```

{{< /multitabs >}}

The accepted FAQ remains after this example. Delete it with the [FAQ cleanup procedure]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#withdraw-or-delete-an-faq" >}}) using the returned entry identifier when you finish.

## Inspect promotion history

The trash view includes dismissed or expired proposals and retained `promoted` history. A promoted proposal cannot be restored or edited. Read its detail with `get_proposal` while it is retained, or purge it when its review record is no longer needed. Purging the proposal does not delete the accepted FAQ. A `promoting` proposal remains in the inbox for acceptance recovery and cannot be purged.

{{< multitabs id="playbook-proposal-history" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
cursor = None
while True:
    page = playbook.list_proposals(view="trash", sort_by="updatedAt", sort_order="desc", limit=50, cursor=cursor)
    if cursor is None:
        print("Total trash proposals:", page.total if page.total is not None else "unknown")
    for item in page.proposals:
        print(item.proposal_id, item.status, item.evidence_count, item.action)
    cursor = page.next_cursor
    if cursor is None:
        break
```

-tab-sep-

```typescript
let trashCursor: string | undefined;
while (true) {
  const page = await playbook.listProposals("trash", "updatedAt", "desc", 50, trashCursor);
  if (trashCursor === undefined) console.log("Total trash proposals:", page.total ?? "unknown");
  for (const item of page.proposals) console.log(item.proposalId, item.status, item.evidenceCount, item.action);
  trashCursor = page.nextCursor;
  if (trashCursor === undefined) break;
}
```

-tab-sep-

```bash
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode view=trash --data-urlencode sortBy=updatedAt --data-urlencode sortOrder=desc --data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/proposals" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > trash.json
  if [[ -z "$CURSOR" ]]; then jq '.total // "unknown"' trash.json; fi
  jq '.proposals[] | {proposalId, status, evidenceCount, action}' trash.json
  CURSOR=$(jq -r '.nextCursor // empty' trash.json)
  [[ -n "$CURSOR" ]] || break
done
```

{{< /multitabs >}}

## Review background extraction results

With background extraction enabled, extraction agents read eligible conversations from a connected Redis Agent Memory store. They can create FAQ proposals or attach evidence to existing open proposals for review.

Extraction is opt-in. An administrator must configure the source connection and enable extraction on a deployment that supports it. Proposal permissions alone do not configure or start extraction.

<!-- TODO: Link to source connection and extraction setup when Agent Playbooks operator guidance exists. -->

Review extracted candidates in the same inbox. Check their sources, answers, and audiences before accepting and publishing. Extraction does not publish answers automatically or extract skills.
