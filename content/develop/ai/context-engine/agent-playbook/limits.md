---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Find content and retrieval limits, proposal retention, error types, and retry guidance.
hideListLinks: true
linktitle: Limits and errors
title: Service limits and errors
weight: 90
---

Check these limits when preparing content or handling request failures. Confirm deployment overrides with your administrator.

The [API reference]({{< relref "/develop/ai/context-engine/agent-playbook/api-reference" >}}) defines field formats and operation-specific schemas.

## Content limits

These defaults can be lower in your deployment. Byte limits apply to decoded content, not base64 length. A kibibyte (KiB) is 1,024 bytes; a mebibyte (MiB) is 1,024 KiB.

| Content | Default ceiling |
|:--------|:----------------|
| Entries per playbook | 10,000 |
| Versions per entry | 100 |
| Retained content across an entry's versions | 256 MiB |
| Files per skill version, including `SKILL.md` | 64 |
| ZIP archive entries, including directories | 256 |
| Compressed skill archive | 5 MiB |
| Expanded skill archive | 20 MiB |
| Individual skill file | 5 MiB |
| Skill instructions file (`SKILL.md`) | 1 MiB |
| Version metadata | 64 KiB, nesting depth 16 |

Retained data includes version content and resources. Withdrawal does not free capacity; deletion removes the entry's history. You cannot delete an individual version.

These field and structure limits also apply:

| Field or structure | Limit |
|:-------------------|:------|
| FAQ question | 2,048 characters |
| FAQ answer | 32,768 characters |
| Intents | Five per entry version; 2,048 characters each |
| Attributes | 32 names; up to 20 scalar items in each list value |
| Entry key or skill name | 64 characters |
| Skill description | 1,024 characters |
| Skill compatibility text | 500 characters |

## Retrieval limits

| Request or setting | Limit or default |
|:-------------------|:-----------------|
| Search or discovery query | 1–4,096 characters |
| Type-specific search results | 1–50; omission uses the playbook's result default |
| Discovery results | 1–50, bounded by `discovery.maxResults`; default `10` |
| Similarity thresholds | `0`–`1`; default `0.7` for each entry type |
| Discovery preview ceiling | Disabled by default; minimum configured value `64` estimated tokens |
| Filter depth | Five |
| Equality predicates in a filter | 64 |
| Management list page | 1–200 results; default `50` |
| Entry lookup or bulk deletion | 1–100 entry references or identifiers |

Pins consume discovery slots and preview budget. The preview ceiling applies to discovery rather than type-specific search, loaded instructions, or fetched files. See [Retrieve knowledge]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval" >}}) for the behavior of each setting.

Follow a list response's next cursor until it is absent, even if a page is empty. Keep the collection, filters, and ordering consistent between pages. Lists reflect concurrent changes and do not represent a fixed snapshot.

Entry and proposal lists can include a separately measured first-page `total`. Absence means unknown, not zero. Cursored pages and version history omit totals. Use the cursor, not the count or page length, to decide when to stop. See [List entries and inspect history]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#list-entries-and-inspect-history" >}}) for examples.

## Proposal and evidence limits

| Limit or policy | Value |
|:----------------|:------|
| Open proposals per playbook | Default 5,000; configurable from 1 to 10,000 |
| Proposal review window | Default 30 days; configurable from 1 to 365 days |
| Evidence records per proposal | 100 |
| Total evidence payload per proposal | 256 KiB |
| Individual evidence payload | 12 KiB |
| Proposal search results | 1–50; default `10` |

The optional creation source is separate from attached evidence and does not increment `evidenceCount`. Unreviewed proposals leave the inbox at `inboxExpiresAt` and become unavailable after `purgeAt`. With the default policy, creation, new evidence, candidate replacement, and restoration set deadlines of 30 days for inbox review and 60 days for retention. Dismissing a proposal moves it to trash immediately and starts a 30-day retention window. An exact evidence retry does not refresh the deadlines.

Proposal retention does not affect an accepted FAQ's history. Store required review records outside the inbox.

## Handle request errors

HTTP errors include a status and machine-readable `type`. Use the type to choose a recovery action. For MCP, inspect `isError` before reading tool content. See [MCP troubleshooting]({{< relref "/develop/ai/context-engine/agent-playbook/mcp#troubleshoot-the-connection" >}}).

| Status | Meaning | Action |
|:-------|:--------|:-------|
| `400` | Invalid input, cursor, or unsupported request member. | Correct fields or restore the cursor's original request parameters. |
| `401` | Authentication failed. | Check the endpoint and key, including expiry or revocation. |
| `403` | The caller lacks access. | Check tenant, playbook, and action grants. `write` does not include `publish`. |
| `404` | The requested resource is unavailable. | Check identifiers and retention. Rediscover a previously selected skill once. |
| `409` | Content or review state conflicts with the request. | Inspect the error type and current state before changing the request. |
| `413` | Content exceeds a payload limit. | Reduce the package, metadata, answer, or evidence payload. |
| `423` | The playbook is suspended. | Ask the administrator to inspect its state. |
| `424` | A required dependency failed. | Check playbook health and ask the administrator to inspect the dependency. |
| `429` | Requests are throttled. | Use bounded backoff and honor `Retry-After` when supplied. |
| `500` | An internal or content-integrity failure occurred. | Preserve safe diagnostic details and report persistent failures. Stored integrity failures require administrator investigation. |
| `503` | The service or playbook is unavailable. | Check readiness and use bounded retries for safe operations. |

For example, inspect a failed entry read without retrying it automatically. Use the [client setup]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart#connect-to-the-playbook" >}}) and export the FAQ identifier you want to inspect:

```bash
export PLAYBOOK_FAQ_ID='<faq-entry-id>'
```

{{< clients-example set="iris_playbook_limits" step="playbook-error-type" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Resolve conflicts

The `409` error type identifies the recovery step:

| Error type | Action |
|:-----------|:-------|
| `/errors/entry-not-published` | Refresh retrieval or publish the intended version. |
| `/errors/entry-key-conflict` | Use the existing entry or choose another key. |
| `/errors/content-limit-exceeded` | Free retained capacity or confirm a higher supported deployment limit. |
| `/errors/pinned-entry-unavailable` | Correct or remove the pin. |
| `/errors/proposal-already-exists` | Inspect `existingProposalId` or attach evidence to that proposal. |
| `/errors/proposal-evidence-conflict` | Retry the original evidence payload or use a new evidence identifier for a new observation. |
| `/errors/proposal-evidence-capacity` | Review the proposal with its retained evidence; additional evidence does not fit. |
| `/errors/proposal-revision-conflict` | Read and review the current candidate before resubmitting. |
| `/errors/proposal-trashed` | Restore the proposal before modifying or accepting it. |
| `/errors/proposal-open` | Dismiss the proposal before purging it. |
| `/errors/proposal-promotion-locked` | Resume acceptance or use its recorded FAQ. Candidate edits and evidence changes are locked. |

## Retry uncertain operations

Use bounded retries for reads and transient failures. Proposal acceptance can resume its recorded target. For an exact evidence retry, keep the same identifier and payload.

A timeout, including `408`, does not prove a create or append failed. Read state before retrying to avoid another entry or version. Check the Python SDK retry configuration when controlling write retries.

Bulk deletion is not atomic across the batch. Earlier deletions can remain applied after a later failure. Retrying the same batch is safe because absent entries are ignored.

## Remove content in bulk

Use a key with `write` permission for bulk deletion. Choose the entry type before sending a request:

| Task | Python method | TypeScript method | HTTP request |
|:-----|:--------------|:------------------|:-------------|
| Delete selected FAQ entries and all their versions | `delete_faqs(entry_ids=...)` | `deleteFaqs({ entryIds: ... })` | `DELETE /v1/playbooks/{playbookId}/faqs` with an `entryIds` array |
| Delete selected skills, versions, and files | `delete_skills(entry_ids=...)` | `deleteSkills({ entryIds: ... })` | `DELETE /v1/playbooks/{playbookId}/skills` with an `entryIds` array |

Bulk deletion accepts 1–100 entry identifiers of the selected type. The data plane does not provide an operation to clear an entire playbook. An administrator can [clear entries, proposals, or both through the control plane]({{< relref "/operate/iris/agent-playbook/self-managed/operations#clear-playbook-content" >}}).

For ordinary sample cleanup, use the single-entry deletion steps in [Manage FAQs]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#withdraw-or-delete-an-faq" >}}) or [Manage skills]({{< relref "/develop/ai/context-engine/agent-playbook/manage-skills#withdraw-or-delete-a-skill" >}}).
