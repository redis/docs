---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Write answers, promote reviewed proposals, and publish FAQ versions for retrieval.
hideListLinks: true
linktitle: Manage FAQs
title: Manage FAQs
weight: 20
---

Publish a FAQ to give agents an approved answer to a recurring question. Write it directly or promote a reviewed proposal.

## Before you begin

Use an existing playbook and an API key with `write` permission to create and maintain entries. Publishing and withdrawing require `publish`. See [access permissions]({{< relref "/develop/ai/context-engine/agent-playbook/concepts#playbooks" >}}).

Start with the quickstart's [client setup]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart#connect-to-the-playbook" >}}), then append this page's snippets in order. Run each write once.

## Write an answer

Write a question in the language a user would use. Include conditions that distinguish it from similar questions, such as the product or region. Make the answer self-contained: the agent receives it without the source conversation or document.

The sample FAQ explains where to find refund status. Use a [skill]({{< relref "/develop/ai/context-engine/agent-playbook/skills" >}}) when the agent must interpret the customer's reported stage, choose a template, and draft a reply.

Use these fields to describe the answer and its audience:

| Field                          | Use it for                                                 |
| ------------------------------ | ---------------------------------------------------------- |
| `content.payload.faq.question` | The recurring question.                                    |
| `content.payload.faq.answer`   | The approved answer.                                       |
| `content.intents`              | Optional task phrases returned with discovery previews.    |
| `content.attributes`           | Exact-match filters, such as audience, locale, or product. |
| `content.metadata`             | Application context, such as a source-document reference.  |

Semantic matching uses the question, not the answer or intents. Use attributes to filter the audience. Metadata does not control publication.

For example, prefer “How do I check the status of an existing refund?” to “Refund help.” Keep “How do I request a refund?” separate: it needs a different answer.

## Create a draft FAQ

Submit the complete content with `create_faq`. The sample assigns `refund-status` as its entry key. Keys are immutable and unique within a playbook; choose another key if that one is already in use. Save the returned entry identifier and version number.

The new FAQ is unpublished. Review it before publishing; search and discovery do not return it yet.

{{< multitabs id="playbook-faq-create" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
faq_content = {
    "intents": ["Check a refund", "Find an existing refund"],
    "attributes": {"locale": "en-US", "topic": "refund"},
    "payload": {
        "faq": {
            "question": "How do I check the status of a refund?",
            "answer": "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number.",
        }
    },
}

draft = playbook.create_faq(content=faq_content, entry_key="refund-status")
faq_id = draft.entry.entry_id
version = draft.version.version
print(faq_id, version, draft.entry.publication)
```

-tab-sep-

```typescript
const faqContent = {
  intents: ["Check a refund", "Find an existing refund"],
  attributes: { locale: "en-US", topic: "refund" },
  payload: { faq: {
    question: "How do I check the status of a refund?",
    answer: "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number.",
  } },
};
const draft = await playbook.createFaq({ content: faqContent, entryKey: "refund-status" });
const faqId = draft.entry.entryId;
const version = draft.version.version;
console.log(faqId, version, draft.entry.publication);
```

-tab-sep-

```bash
cat > faq.json <<'JSON'
{
  "entryKey": "refund-status",
  "content": {
    "intents": ["Check a refund", "Find an existing refund"],
    "attributes": {"locale": "en-US", "topic": "refund"},
    "payload": {"faq": {
      "question": "How do I check the status of a refund?",
      "answer": "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number."
    }}
  }
}
JSON
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @faq.json > draft.json
FAQ_ID=$(jq -er '.entry.entryId' draft.json)
VERSION=$(jq -er '.version.version' draft.json)
jq '{entryId: .entry.entryId, version: .version.version, publication: .entry.publication}' draft.json
```

{{< /multitabs >}}

## Promote a reviewed proposal

If an answer comes from the proposal inbox, [review the candidate and its evidence]({{< relref "/develop/ai/context-engine/agent-playbook/proposals#review-and-edit-a-candidate" >}}) first. Accept the proposal with the revision you reviewed.

Acceptance returns an entry and version for one unpublished FAQ. Save those values and continue with publication. Promotion does not make the answer available to agents, and it does not update an existing FAQ.

## Publish a version

1. Retrieve the exact version you intend to publish.
2. Review its answer, intents, and audience attributes.
3. Publish that version with `publish_faq`.
4. Test retrieval with a reader key and a representative question.

Test a paraphrase such as “Where can I see my refund?” and a nearby question the answer does not cover, such as “How do I request a refund?” Check the returned entry and audience, then use the [retrieval guide]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval" >}}) to tune matching.

{{< multitabs id="playbook-faq-publish" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
stored = playbook.get_faq_version(faq_id=faq_id, version=version)
print(stored.content)
```

-tab-sep-

```typescript
const stored = await playbook.getFaqVersion(faqId, version);
console.log(stored.content);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/faqs/$FAQ_ID/versions/$VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .content
```

{{< /multitabs >}}

Publish the version you reviewed.

{{< multitabs id="playbook-faq-publication" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.publish_faq(faq_id=faq_id, version=version)
```

-tab-sep-

```typescript
await playbook.publishFaq(faqId, { version });
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --argjson version "$VERSION" '{version: $version}')" | jq .publication
```

{{< /multitabs >}}

{{< multitabs id="playbook-faq-search" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
results = playbook.search_faqs(
    query="Where can I see how my refund is progressing?",
    filter_={"eq": {"name": "locale", "value": "en-US"}},
    limit=5,
)
for match in results.matches:
    if match.faq is not None:
        print(match.entry_id, match.version, match.score, match.faq.answer)
```

-tab-sep-

```typescript
const results = await playbook.searchFaqs({
  query: "Where can I see how my refund is progressing?",
  filter: { eq: { name: "locale", value: "en-US" } },
  limit: 5,
});
for (const match of results.matches) {
  if (match.faq) {
    console.log(match.entryId, match.version, match.score, match.faq.answer);
  }
}
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Where can I see how my refund is progressing?","filter":{"eq":{"name":"locale","value":"en-US"}},"limit":5}' \
  | jq '.matches[] | {entryId, version, score, answer: .faq.answer}'
```

{{< /multitabs >}}

## Update an answer

Append a complete replacement version to the same entry with `append_faq_version`. Include the intents, attributes, and metadata you want that version to contain.

Coordinate publishers for the same entry. Concurrent publication changes are last-write-wins. Publishing an already published version is a no-op.

{{< multitabs id="playbook-faq-update" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
from copy import deepcopy

updated_content = deepcopy(faq_content)
updated_content["payload"]["faq"]["answer"] += " Support can check the current stage but cannot guarantee a bank posting date."
updated = playbook.append_faq_version(faq_id=faq_id, content=updated_content)
print("Review this version:", updated.version.version, updated.version.content)
```

-tab-sep-

```typescript
const updatedContent = structuredClone(faqContent);
updatedContent.payload.faq.answer += " Support can check the current stage but cannot guarantee a bank posting date.";
const updated = await playbook.appendFaqVersion(faqId, { content: updatedContent });
console.log("Review this version:", updated.version.version, updated.version.content);
```

-tab-sep-

```bash
jq 'del(.entryKey) | .content.payload.faq.answer += " Support can check the current stage but cannot guarantee a bank posting date."' \
  faq.json > faq-update.json
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/$FAQ_ID/versions" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @faq-update.json > updated.json
jq .version updated.json
```

{{< /multitabs >}}

The identifier stays the same, and search still serves the first publication. Review and publish the new version, then search again.

{{< multitabs id="playbook-faq-republish" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.publish_faq(faq_id=faq_id, version=updated.version.version)
```

-tab-sep-

```typescript
await playbook.publishFaq(faqId, { version: updated.version.version });
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{version: .version.version}' updated.json)" | jq .publication
```

{{< /multitabs >}}

Republish the first version to roll back.

{{< multitabs id="playbook-faq-rollback" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.publish_faq(faq_id=faq_id, version=version)
```

-tab-sep-

```typescript
await playbook.publishFaq(faqId, { version });
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --argjson version "$VERSION" '{version: $version}')" | jq .publication
```

{{< /multitabs >}}

## List entries and inspect history

Use `list_faqs` to list entries, including unpublished ones, and `get_faq` to read a summary. Both require `read`. Summaries show the latest version number and any publication, without draft content.

Follow the pagination cursor until it is absent, even after an empty page. Keep filters and sort settings unchanged. The optional first-page `total` is a separately measured count; absence means unknown, not zero. Lists can change while you page through them.

{{< multitabs id="playbook-faq-list" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
cursor = None
while True:
    page = playbook.list_faqs(sort_by="updatedAt", sort_order="desc", limit=50, cursor=cursor)
    if cursor is None:
        print("Total FAQs:", page.total if page.total is not None else "unknown")
    for entry in page.faqs:
        print(entry.entry_id, entry.latest_version, entry.publication)
    cursor = page.next_cursor
    if cursor is None:
        break
```

-tab-sep-

```typescript
let faqCursor: string | undefined;
while (true) {
  const page = await playbook.listFaqs(
    "updatedAt", "desc", undefined, undefined, undefined, 50, faqCursor,
  );
  if (faqCursor === undefined) console.log("Total FAQs:", page.total ?? "unknown");
  for (const entry of page.faqs) console.log(entry.entryId, entry.latestVersion, entry.publication);
  faqCursor = page.nextCursor;
  if (faqCursor === undefined) break;
}
```

-tab-sep-

```bash
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode sortBy=updatedAt --data-urlencode sortOrder=desc --data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/faqs" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > faq-page.json
  if [[ -z "$CURSOR" ]]; then jq '.total // "unknown"' faq-page.json; fi
  jq '.faqs[] | {entryId, latestVersion, publication}' faq-page.json
  CURSOR=$(jq -r '.nextCursor // empty' faq-page.json)
  [[ -n "$CURSOR" ]] || break
done
```

{{< /multitabs >}}

To select only published or unpublished entries, set `published` to `true` or `false`. Omit it to include both.

Listing full version history requires `write` or `publish`. Versions arrive newest first. This example uses the FAQ created in this guide:

{{< multitabs id="playbook-faq-history" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
cursor = None
while True:
    page = playbook.list_faq_versions(faq_id=faq_id, limit=50, cursor=cursor)
    for item in page.versions:
        print(item.version, item.content_digest, item.content)
    cursor = page.next_cursor
    if cursor is None:
        break
```

-tab-sep-

```typescript
let faqVersionCursor: string | undefined;
while (true) {
  const page = await playbook.listFaqVersions(faqId, undefined, undefined, 50, faqVersionCursor);
  for (const item of page.versions) console.log(item.version, item.contentDigest, item.content);
  faqVersionCursor = page.nextCursor;
  if (faqVersionCursor === undefined) break;
}
```

-tab-sep-

```bash
CURSOR=''
while true; do
  PAGE_ARGS=(--data-urlencode limit=50)
  if [[ -n "$CURSOR" ]]; then PAGE_ARGS+=(--data-urlencode "cursor=$CURSOR"); fi
  curl --fail-with-body --silent --show-error --get "$PLAYBOOK_API/faqs/$FAQ_ID/versions" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" "${PAGE_ARGS[@]}" > faq-versions.json
  jq '.versions[] | {version, contentDigest, content}' faq-versions.json
  CURSOR=$(jq -r '.nextCursor // empty' faq-versions.json)
  [[ -n "$CURSOR" ]] || break
done
```

{{< /multitabs >}}

## Look up entry state

Use `lookup_entries` with `write` or `publish` permission to inspect known FAQs or skills. Supply 1–100 references, each containing either an entry identifier or an entry key. Results preserve request order and report missing entries explicitly. The batch is not a fixed snapshot.

Each found entry includes `latest`, optional `publication`, and `versionCount`. The response also reports the playbook's `maxVersions` limit. The two version summaries include `contentDigest`: a server-generated hash of normalized authored content. Compare their digests to check whether the latest and published content match. It is not a hash of the uploaded ZIP or the raw request, and it is not an idempotency key.

{{< multitabs id="playbook-faq-lookup" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
from redis_agent_playbook.models import Found

lookup = playbook.lookup_entries(references=[
    {"entry_id": faq_id}, {"entry_key": "refund-status"},
])
print("Version limit:", lookup.max_versions)
for result in lookup.results:
    if isinstance(result, Found):
        state = result.found.entry
        print(state.entry_id, state.version_count, state.latest, state.publication)
    else:
        print("Missing:", result.missing.reference)
```

-tab-sep-

```typescript
const lookup = await playbook.lookupEntries({
  references: [{ entryId: faqId }, { entryKey: "refund-status" }],
});
console.log("Version limit:", lookup.maxVersions);
for (const result of lookup.results) {
  if ("found" in result) {
    const state = result.found.entry;
    console.log(state.entryId, state.versionCount, state.latest, state.publication);
  } else {
    console.log("Missing:", result.missing.reference);
  }
}
```

-tab-sep-

```bash
jq -n --arg id "$FAQ_ID" '{references: [{entryId: $id}, {entryKey: "refund-status"}]}' \
  | curl --fail-with-body --silent --show-error \
    -X POST "$PLAYBOOK_API/entries/lookup" \
    -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
    -H 'Content-Type: application/json' --data-binary @- \
  | jq '{maxVersions, results}'
```

{{< /multitabs >}}

The example finds the same FAQ by identifier and by key. Either identifies the entry across versions, not a particular publication. Before retrying an uncertain write, inspect its state and relevant version. Appending identical content can still create another version.

## Withdraw or delete an FAQ

Use `withdraw_faq` to stop serving the answer while retaining the entry and its versions. Use `delete_faq` to remove the entry and its history permanently.

{{< multitabs id="playbook-faq-withdraw" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.withdraw_faq(faq_id=faq_id)
```

-tab-sep-

```typescript
await playbook.withdrawFaq(faqId);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
```

{{< /multitabs >}}

When you no longer need the sample history, delete the entry.

{{< multitabs id="playbook-faq-delete" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.delete_faq(faq_id=faq_id)
```

-tab-sep-

```typescript
await playbook.deleteFaq(faqId);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_API/faqs/$FAQ_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY"
```

{{< /multitabs >}}
