---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Extract long-term memories from documents, track processing, and inspect source evidence.
hideListLinks: true
linktitle: MemoryETL
title: Extract memories from documents with MemoryETL
weight: 13
---

MemoryETL uses extract, transform, load (ETL) processing to turn text or Markdown documents into long-term memories. For example, a travel assistant can learn a user's plans from trip notes they upload before the conversation starts.

An **extractor** tells MemoryETL what to extract: a custom memory type and instructions for the model. Creating an extractor is an administrative task. Applications can then submit documents to it.

Use [session extraction](/content/develop/ai/context-engine/agent-memory/sessions/_index.md) for conversation events. Use [direct memory creation](/content/develop/ai/context-engine/agent-memory/long-term-memory.md#create-a-custom-memory-directly) when your application already has the records it wants to save.

## Prepare the service

MemoryETL is available in Redis Cloud and enabled in self-managed deployments. For a self-managed service's model, processing limits, and worker settings, see [Configure document ingestion](/content/operate/iris/agent-memory/self-managed/configuration.md#enable-document-ingestion).

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

The examples save memories for `quickstart-user`. In your application, use the authenticated user ID that owns the document. For a self-managed service with ownership enforcement, use the authenticated client setup in [delegation](/content/operate/iris/agent-memory/self-managed/authentication.md#delegate-a-user-with-an-agent-key).

## Create an extractor

Ask your operator to [register a memory type and create a document extractor](/content/operate/iris/agent-memory/self-managed/api-examples.md#create-an-extractor). Add the returned extractor ID to `.env` as `EXTRACTOR_ID`. Applications use their Data Plane credential to submit documents.

```dotenv
EXTRACTOR_ID='<extractor-id>'
```

## Submit and track a document

Create `trip-notes.md` containing the following line. The examples create it if it's missing. The extractor publishes only information that its memory type captures, so use a document that matches your extractor.

```text
Trip to Kyoto, April 3 to April 10. I am vegetarian and want to try local tofu dishes.
```

Only `text/plain` and `text/markdown` are accepted. Encode the UTF-8 bytes as base64 **once** before passing `content` to REST or an SDK. The SDK expects the encoded string, not a file object or raw text.

Each submission requires these fields:

| Field | Purpose | Example |
|:------|:--------|:--------|
| `documentId` | Your ID for the logical document. | `example-trip-notes` |
| `revision` | An immutable, case-sensitive version. Use a new value when the content changes. | `1` |
| `content` | The file's UTF-8 bytes, base64-encoded once. | The examples encode `trip-notes.md`. |
| `mediaType` | The document's content type. | `text/plain` or `text/markdown` |
| `ownerId` | The authenticated user the memories belong to. | `quickstart-user` |
| `extractorId` | The extractor's returned `id`. | `$EXTRACTOR_ID` |
| `idempotencyKey` | A key to reuse when retrying the same submission. | `example-trip-notes-revision-1` |

Submit the file. The server returns a separate ingestion ID to track the run. Save it; you need it even if polling times out.

{{< clients-example set="iris_agent_memory_memory_etl" step="memory-etl-submit" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

REST returns `202 Accepted`; this confirms submission, not successful extraction. In Python, the submission content is under `accepted.result`.

Poll the ingestion until it reaches a terminal processing state. The examples check every 10 seconds for up to 15 minutes:

{{< clients-example set="iris_agent_memory_memory_etl" step="memory-etl-status" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

List the IDs of the memories the run published. Pass `nextCursor` as `cursor` to read the next page:

{{< clients-example set="iris_agent_memory_memory_etl" step="memory-etl-outputs" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

## Interpret results and recover

MemoryETL processes a document in two stages. First, each chunk is extracted into candidate memories. These candidates are staged, not published. Then a final reconciliation step merges duplicates and continued observations across chunks and publishes the result. No memories are searchable until reconciliation finishes. Publication is incremental, so a run that stops during publication can leave some memories.

| Processing state | Meaning and action |
|:-----------------|:-------------------|
| `QUEUED` or `RUNNING` | Keep polling the saved ingestion ID. Do not create another submission to check progress. `completedChunks` can equal `totalChunks` while reconciliation is still running. |
| `SUCCEEDED` | Processing finished. Inspect `createdCount` and `filteredCount`; success can produce no memories. |
| `PARTIAL` | Processing stopped after some memories were published. Inspect `error`, counts, and available output IDs. Published memories remain. |
| `FAILED` | Inspect `error` and available outputs. Do not assume that every prior write was rolled back. |

`completedChunks`, `totalChunks`, `extractorId`, and `extractorRevision` help identify what ran. The chunk counts cover source chunks only; reconciliation isn't counted. `cleanup` is independent: `PENDING`, `DELETED`, or `FAILED` describes temporary source cleanup. A successful extraction with failed cleanup needs operator attention; it is not a reason to submit the document again. Extracted memories and provenance can remain after source bytes are deleted.

Reuse the same idempotency key and original request after a timeout or lost submission response. Changing the input under the same key conflicts. Reusing an immutable document revision with different content also conflicts. Use a new revision for changed content; do not change the bytes merely to force a retry of an existing run.

The service bounds decoded bytes, estimated input tokens, chunks, output records, queued bytes, retries, execution time, and source/checkpoint retention. The reference self-managed configuration allows 8,000 input tokens per extraction request; reconciliation has a separate budget that defaults to 32,000 tokens per request. Inspect the deployment settings and `retentionDeadline`. Idempotency and status retention are bounded; retain your logical document IDs, revisions, ingestion IDs, and recovery decisions in your application. A new revision does not promise automatic removal of every memory from an older revision.

Extracted records return `documentManaged: true`. They appear in ordinary long-term-memory searches unless you set `excludeDocumentManaged: true`. Their text and attributes are managed by document ingestion: generic overwrite and PATCH requests cannot replace them. The exception is a PATCH that changes only the namespace: it moves the memory, keeps its content, and keeps its current expiration. Document chunk spans use UTF-8 byte offsets; do not apply those offsets to a character-indexed string.

With [ingestion webhooks](/content/develop/ai/context-engine/agent-memory/ingestion-webhooks.md), the submission and the reconciled candidates can also be reviewed before they change data. Check hook decisions separately from ingestion processing. Receiver failure and explicit filtering have different outcomes.

## Trace memories to their sources

Provenance connects a memory to document or session inputs used during extraction. A `sourceId` identifies one revisioned origin in the store; an `ingestionId` identifies a particular document run. Session evidence lists input event IDs. Document evidence identifies ingestions, chunks, and optional source spans. These describe the input supplied to extraction, not a guarantee that each sentence in the resulting memory is a quoted fact.

| Request | Python method | REST endpoint |
|:--------|:--------------|:--------------|
| Memory → sources | `list_memory_source_links` | `GET .../memories/{memoryId}/sources` |
| Memory/source → more evidence | `list_memory_source_evidence` | `GET .../memories/{memoryId}/sources/{sourceId}/evidence` |
| Source → memories for an owner | `list_source_memories` | `GET .../sources/{sourceId}/memories` |

The examples take the first output memory ID. They follow its source pages and each source's independent evidence pages, then list memories that the same document source produced for `quickstart-user`:

{{< clients-example set="iris_agent_memory_memory_etl" step="memory-etl-provenance" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

The evidence response wraps `source`; it does not return a top-level `items` list. The source object contains `evidence` for documents or `sessionEvidence` for sessions. Newer evidence can also include `evidenceId`, `schemaVersion`, `capturedAt`, and `producer`. Handle their absence on legacy data. `capturedAt` is when extraction input was prepared, not when the original event occurred. A retried delivery retains its evidence identity.

For reverse lookup, use `GET /iris/data/v1/agent-memory/stores/{storeId}/sources/{sourceId}/memories` with `ownerId`, or `list_source_memories`. Reverse lookup covers document sources; a session source returns `404`. Follow its `nextCursor` independently. Keep every token with the exact query and endpoint that issued it. Tokens expire; restart a query when one is invalid, and URL-encode tokens in REST calls.

A source link does not grant access to the original document, session, or another owner's memories. The service checks source and record access separately; sharing an extracted memory does not share the private document it came from.
