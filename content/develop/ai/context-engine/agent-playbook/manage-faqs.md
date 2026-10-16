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

The sample FAQ explains where to find refund status. Use a [skill]({{< relref "/develop/ai/context-engine/agent-playbook/manage-skills" >}}) when the agent must interpret the customer's reported stage, choose a template, and draft a reply.

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

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-create" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Promote a reviewed proposal

If an answer comes from the proposal inbox, [review the candidate and its evidence]({{< relref "/develop/ai/context-engine/agent-playbook/proposals#review-and-edit-a-candidate" >}}) first. Accept the proposal with the revision you reviewed.

Acceptance returns an entry and version for one unpublished FAQ. Save those values and continue with publication. Promotion does not make the answer available to agents, and it does not update an existing FAQ.

## Publish a version

1. Retrieve the exact version you intend to publish.
2. Review its answer, intents, and audience attributes.
3. Publish that version with `publish_faq`.
4. Test retrieval with a reader key and a representative question.

Test a paraphrase such as “Where can I see my refund?” and a nearby question the answer does not cover, such as “How do I request a refund?” Check the returned entry and audience, then use the [retrieval guide]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval" >}}) to tune matching.

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-publish" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Publish the version you reviewed.

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-publication" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-search" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Update an answer

Append a complete replacement version to the same entry with `append_faq_version`. Include the intents, attributes, and metadata you want that version to contain.

Coordinate publishers for the same entry. Concurrent publication changes are last-write-wins. Publishing an already published version is a no-op.

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-update" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

The identifier stays the same, and search still serves the first publication. Review and publish the new version, then search again.

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-republish" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Republish the first version to roll back.

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-rollback" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## List entries and inspect history

Use `list_faqs` to list entries, including unpublished ones, and `get_faq` to read a summary. Both require `read`. Summaries show the latest version number and any publication, without draft content.

Follow the pagination cursor until it is absent, even after an empty page. Keep filters and sort settings unchanged. The optional first-page `total` is a separately measured count; absence means unknown, not zero. Lists can change while you page through them.

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-list" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

To select only published or unpublished entries, set `published` to `true` or `false`. Omit it to include both.

Listing full version history requires `write` or `publish`. Versions arrive newest first. This example uses the FAQ created in this guide:

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-history" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Look up entry state

Use `lookup_entries` with `write` or `publish` permission to inspect known FAQs or skills. Supply 1–100 references, each containing either an entry identifier or an entry key. Results preserve request order and report missing entries explicitly. The batch is not a fixed snapshot.

Each found entry includes `latest`, optional `publication`, and `versionCount`. The response also reports the playbook's `maxVersions` limit. The two version summaries include `contentDigest`: a server-generated hash of normalized authored content. Compare their digests to check whether the latest and published content match. It is not a hash of the uploaded ZIP or the raw request, and it is not an idempotency key.

{{< clients-example set="iris_playbook_faqs" step="playbook-faq-lookup" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

The example finds the same FAQ by identifier and by key. Either identifies the entry across versions, not a particular publication. Before retrying an uncertain write, inspect its state and relevant version. Appending identical content can still create another version.

## Withdraw or delete an FAQ

Use `withdraw_faq` to stop serving the answer while retaining the entry and its versions. Use `delete_faq` to remove the entry and its history permanently.

Set `PLAYBOOK_FAQ_ID` to the printed entry identifier before running a withdrawal or deletion example with the same connection values.

{{< clients-example set="iris_playbook_faqs_withdraw" step="playbook-faq-withdraw" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

When you no longer need the sample history, delete the entry.

{{< clients-example set="iris_playbook_faqs_delete" step="playbook-faq-delete" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}
