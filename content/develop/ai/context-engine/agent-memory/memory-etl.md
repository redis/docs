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

MemoryETL uses extract, transform, load (ETL) processing to turn text or Markdown documents into long-term memories. For example, a travel assistant can learn facts from a destination guide before a user starts a conversation.

An **extractor** tells MemoryETL what to extract: a custom memory type and instructions for the model. Creating an extractor is an administrative task. Applications can then submit documents to it.

Use [session extraction](/content/develop/ai/context-engine/agent-memory/sessions/_index.md) for conversation events. Use [direct memory creation](/content/develop/ai/context-engine/agent-memory/long-term-memory.md#create-a-custom-memory-directly) when your application already has the records it wants to save.

## Prepare the service

MemoryETL is available in Redis Cloud and enabled in self-managed deployments. These examples use a self-managed service. For its model, processing limits, and worker settings, see [Configure document ingestion](/content/operate/iris/agent-memory/self-managed/configuration.md#enable-document-ingestion).

Install the SDK using the [quickstart](/content/develop/ai/context-engine/agent-memory/quickstart.md#install-the-sdk). Set:

| Variable | Value |
|:---------|:------|
| `AGENT_MEMORY_URL`, `STORE_ID`, `API_KEY` | The Data Plane endpoint, store, and application credential. |
| `OWNER_ID` | Your application's authenticated user ID for this document. |
| `USER_TOKEN` | The user's token when self-managed ownership enforcement is enabled. See [delegation](/content/operate/iris/agent-memory/self-managed/authentication.md#delegate-a-user-with-an-agent-key). |

## Create an extractor

Ask your operator to [register a memory type and create a document extractor](/content/operate/iris/agent-memory/self-managed/api-examples.md#create-an-extractor). Set `EXTRACTOR_ID` to the returned extractor ID. Applications use their Data Plane credential to submit documents.

## Submit and track a document

Create `travel-guide.md` containing:

```text
Kyoto has vegetarian restaurants near its central railway station.
```

Only `text/plain` and `text/markdown` are accepted. Encode the UTF-8 bytes as base64 **once** before passing `content` to REST or an SDK. The SDK expects the encoded string, not a file object or raw text.

Each submission requires these fields:

| Field | Purpose | Example |
|:------|:--------|:--------|
| `documentId` | Your ID for the logical document. | `travel-guide` |
| `revision` | An immutable, case-sensitive version. Use a new value when the content changes. | `1` |
| `content` | The file's UTF-8 bytes, base64-encoded once. | The examples encode `travel-guide.md`. |
| `mediaType` | The document's content type. | `text/plain` or `text/markdown` |
| `ownerId` | The authenticated user the memories belong to. | Your verified `OWNER_ID`. |
| `extractorId` | The extractor's returned `id`. | `$EXTRACTOR_ID` |
| `idempotencyKey` | A key to reuse when retrying the same submission. | `travel-guide-revision-1` |

The server returns a separate ingestion ID to track the run.

The examples submit the file, poll for a terminal processing state, and list output memory IDs. Save the ingestion ID even if polling times out:

{{< multitabs id="document-ingestion" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
import asyncio
import base64
import os
from pathlib import Path

from redis_agent_memory import AgentMemory


async def main():
    headers = {"X-Iris-User-Token": os.environ["USER_TOKEN"]} if os.environ.get("USER_TOKEN") else {}
    async with AgentMemory(
        os.environ["AGENT_MEMORY_URL"], store_id=os.environ["STORE_ID"],
        api_key=os.environ["API_KEY"],
    ) as memory:
        accepted = await memory.create_document_ingestion_async(
            document_id="travel-guide", revision="1",
            content=base64.b64encode(Path("travel-guide.md").read_bytes()).decode("ascii"),
            media_type="text/markdown", owner_id=os.environ["OWNER_ID"],
            extractor_id=os.environ["EXTRACTOR_ID"],
            idempotency_key="travel-guide-revision-1", http_headers=headers,
        )
        ingestion_id = accepted.result.ingestion_id
        print("Ingestion ID:", ingestion_id)
        for _ in range(60):
            record = await memory.get_document_ingestion_async(
                ingestion_id=ingestion_id, http_headers=headers,
            )
            status = record.ingestion.status
            if status.processing in {"SUCCEEDED", "PARTIAL", "FAILED"}:
                print(status.model_dump_json(by_alias=True))
                break
            await asyncio.sleep(2)
        else:
            raise TimeoutError(f"Continue polling ingestion {ingestion_id}")

        cursor = None
        while True:
            page = await memory.list_document_ingestion_outputs_async(
                ingestion_id=ingestion_id, limit=100, cursor=cursor, http_headers=headers,
            )
            print(page.items)
            cursor = page.next_cursor
            if not cursor:
                break
        if status.processing != "SUCCEEDED":
            raise RuntimeError(f"Inspect ingestion {ingestion_id}: {status.processing}")


asyncio.run(main())
```

-tab-sep-

```typescript
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { AgentMemory } from "@redis-iris/agent-memory";

async function main() {
  const { AGENT_MEMORY_URL, STORE_ID, API_KEY, OWNER_ID, EXTRACTOR_ID, USER_TOKEN } = process.env;
  if (!AGENT_MEMORY_URL || !STORE_ID || !API_KEY || !OWNER_ID || !EXTRACTOR_ID) {
    throw new Error("Set the Data Plane values, OWNER_ID, and EXTRACTOR_ID.");
  }
  const memory = new AgentMemory({ serverURL: AGENT_MEMORY_URL, storeId: STORE_ID, apiKey: API_KEY });
  const headers: Record<string, string> = USER_TOKEN ? { "X-Iris-User-Token": USER_TOKEN } : {};
  const options = { headers };
  const accepted = await memory.createDocumentIngestion({
    documentId: "travel-guide", revision: "1",
    content: (await readFile("travel-guide.md")).toString("base64"),
    mediaType: "text/markdown", ownerId: OWNER_ID, extractorId: EXTRACTOR_ID,
    idempotencyKey: "travel-guide-revision-1",
  }, options);
  const ingestionId = accepted.result.ingestionId;
  console.log("Ingestion ID:", ingestionId);
  let finished = false;
  let processing: string | undefined;
  for (let attempt = 0; attempt < 60; attempt++) {
    const { ingestion } = await memory.getDocumentIngestion(ingestionId, options);
    if (["SUCCEEDED", "PARTIAL", "FAILED"].includes(ingestion.status.processing)) {
      processing = ingestion.status.processing;
      console.dir(ingestion.status, { depth: null });
      finished = true;
      break;
    }
    await delay(2000);
  }
  if (!finished) throw new Error(`Continue polling ingestion ${ingestionId}`);
  let cursor: string | undefined;
  do {
    const page = await memory.listDocumentIngestionOutputs(ingestionId, 100, cursor, options);
    console.log(page.items);
    cursor = page.nextCursor;
  } while (cursor);
  if (processing !== "SUCCEEDED") throw new Error(`Inspect ingestion ${ingestionId}: ${processing}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Request failed"); process.exitCode = 1; });
```

-tab-sep-

```sh
jq -n --rawfile text travel-guide.md \
  --arg owner "$OWNER_ID" --arg extractor "$EXTRACTOR_ID" \
  '{documentId:"travel-guide",revision:"1",content:($text|@base64),mediaType:"text/markdown",ownerId:$owner,extractorId:$extractor,idempotencyKey:"travel-guide-revision-1"}' > ingestion.json

response=$(curl --fail-with-body --silent --show-error --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header "X-Iris-User-Token: ${USER_TOKEN:-}" \
  --header 'Content-Type: application/json' --data @ingestion.json \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/document-ingestions") || exit 1
INGESTION_ID=$(printf '%s' "$response" | jq -er .ingestionId) || exit 1
printf 'Ingestion ID: %s\n' "$INGESTION_ID"

finished=false
for attempt in $(seq 1 60); do
  status=$(curl --fail-with-body --silent --show-error \
    --header "Authorization: Bearer $API_KEY" \
    --header "X-Iris-User-Token: ${USER_TOKEN:-}" \
    "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/document-ingestions/$INGESTION_ID") || exit 1
  state=$(printf '%s' "$status" | jq -r .ingestion.status.processing)
  case "$state" in
    SUCCEEDED|PARTIAL|FAILED) printf '%s\n' "$status" | jq; finished=true; break ;;
  esac
  sleep 2
done
[ "$finished" = true ] || { printf 'Continue polling %s\n' "$INGESTION_ID"; exit 1; }

cursor=''
while :; do
  page=$(curl --fail-with-body --silent --show-error --get \
    --header "Authorization: Bearer $API_KEY" \
    --header "X-Iris-User-Token: ${USER_TOKEN:-}" \
    --data-urlencode 'limit=100' --data-urlencode "cursor=$cursor" \
    "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/document-ingestions/$INGESTION_ID/outputs") || exit 1
  printf '%s\n' "$page" | jq .items
  cursor=$(printf '%s' "$page" | jq -r '.nextCursor // empty')
  [ -n "$cursor" ] || break
done
[ "$state" = SUCCEEDED ] || { printf 'Inspect ingestion %s: %s\n' "$INGESTION_ID" "$state"; exit 1; }
```

{{< /multitabs >}}

REST returns `202 Accepted`; this confirms submission, not successful extraction. In the SDKs, the submission content is under `accepted.result`, while the status read returns `ingestion.status`. Output listing returns memory IDs in `items`; pass `nextCursor` as `cursor` for the next page.

## Interpret results and recover

| Processing state | Meaning and action |
|:-----------------|:-------------------|
| `QUEUED` or `RUNNING` | Keep polling the saved ingestion ID. Do not create another submission to check progress. |
| `SUCCEEDED` | Processing finished. Inspect `createdCount` and `filteredCount`; success can produce no memories. |
| `PARTIAL` | Some chunks completed before a failure. Inspect `error`, counts, and available output IDs. Earlier writes remain. |
| `FAILED` | Inspect `error` and available outputs. Do not assume that every prior write was rolled back. |

`completedChunks`, `totalChunks`, `extractorId`, and `extractorRevision` help identify what ran. `cleanup` is independent: `PENDING`, `DELETED`, or `FAILED` describes temporary source cleanup. A successful extraction with failed cleanup needs operator attention; it is not a reason to submit the document again. Extracted memories and provenance can remain after source bytes are deleted.

Reuse the same idempotency key and original request after a timeout or lost submission response. Changing the input under the same key conflicts. Reusing an immutable document revision with different content also conflicts. Use a new revision for changed content; do not change the bytes merely to force a retry of an existing run.

The service bounds decoded bytes, estimated input tokens, chunks, output records, queued bytes, retries, execution time, and source/checkpoint retention. Inspect the deployment settings and `retentionDeadline`. Idempotency and status retention are bounded; retain your logical document IDs, revisions, ingestion IDs, and recovery decisions in your application. A new revision does not promise automatic removal of every memory from an older revision.

Extracted records return `documentManaged: true`. They appear in ordinary long-term-memory searches unless you set `excludeDocumentManaged: true`. Their text and attributes are managed by document ingestion: generic overwrite and PATCH requests cannot replace them. Document chunk spans use UTF-8 byte offsets; do not apply those offsets to a character-indexed string.

With [ingestion webhooks](/content/develop/ai/context-engine/agent-memory/ingestion-webhooks.md), submission and generated chunks can also be reviewed before they change data. Check hook decisions separately from ingestion processing. Receiver failure and explicit filtering have different outcomes.

## Trace memories to their sources

Provenance connects a memory to document or session inputs used during extraction. A `sourceId` identifies one revisioned origin in the store; an `ingestionId` identifies a particular document run. Session evidence lists input event IDs. Document evidence identifies ingestions, chunks, and optional source spans. These describe the input supplied to extraction, not a guarantee that each sentence in the resulting memory is a quoted fact.

| Request | Python method | TypeScript method |
|:--------|:--------------|:------------------|
| Memory → sources | `list_memory_source_links_async` | `listMemorySourceLinks` |
| Memory/source → more evidence | `list_memory_source_evidence_async` | `listMemorySourceEvidence` |
| Source → memories for an owner | `list_source_memories_async` | `listSourceMemories` |

Set `MEMORY_ID` to one returned output ID. These examples follow both source pages and each source's independent evidence pages, then list memories associated with that source for `OWNER_ID`. Add the Python snippet inside the ingestion example's `async with` block, or the TypeScript snippet inside `main`, after output listing. They reuse the same client and request headers.

{{< multitabs id="document-provenance" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        source_cursor = None
        while True:
            links = await memory.list_memory_source_links_async(
                memory_id=os.environ["MEMORY_ID"], limit=100,
                cursor=source_cursor, http_headers=headers,
            )
            for source in links.items:
                print(source.model_dump_json(by_alias=True))
                evidence_cursor = source.evidence_next_cursor
                while evidence_cursor:
                    evidence = await memory.list_memory_source_evidence_async(
                        memory_id=os.environ["MEMORY_ID"], source_id=source.source_id,
                        limit=100, cursor=evidence_cursor, http_headers=headers,
                    )
                    print(evidence.source.model_dump_json(by_alias=True))
                    evidence_cursor = evidence.source.evidence_next_cursor
                reverse_cursor = None
                while True:
                    related = await memory.list_source_memories_async(
                        source_id=source.source_id, owner_id=os.environ["OWNER_ID"],
                        limit=100, cursor=reverse_cursor, http_headers=headers,
                    )
                    print(related.model_dump_json(by_alias=True))
                    reverse_cursor = related.next_cursor
                    if not reverse_cursor:
                        break
            source_cursor = links.next_cursor
            if not source_cursor:
                break
```

-tab-sep-

```typescript
  const memoryId = process.env.MEMORY_ID;
  if (!memoryId) throw new Error("Set MEMORY_ID to an output memory ID.");
  let sourceCursor: string | undefined;
  do {
    const links = await memory.listMemorySourceLinks(memoryId, 100, sourceCursor, options);
    for (const source of links.items) {
      console.dir(source, { depth: null });
      let evidenceCursor = source.evidenceNextCursor;
      while (evidenceCursor) {
        const evidence = await memory.listMemorySourceEvidence(
          memoryId, source.sourceId, 100, evidenceCursor, options,
        );
        console.dir(evidence.source, { depth: null });
        evidenceCursor = evidence.source.evidenceNextCursor;
      }
      let reverseCursor: string | undefined;
      do {
        const related = await memory.listSourceMemories(
          source.sourceId, OWNER_ID, 100, reverseCursor, options,
        );
        console.dir(related.items, { depth: null });
        reverseCursor = related.nextCursor;
      } while (reverseCursor);
    }
    sourceCursor = links.nextCursor;
  } while (sourceCursor);
```

-tab-sep-

```sh
source_token=''
while :; do
  links=$(curl --fail-with-body --silent --show-error --get \
    --header "Authorization: Bearer $API_KEY" \
    --header "X-Iris-User-Token: ${USER_TOKEN:-}" \
    --data-urlencode 'limit=100' --data-urlencode "cursor=$source_token" \
    "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/memories/$MEMORY_ID/sources") || exit 1
  printf '%s\n' "$links" | jq .items
  printf '%s' "$links" | jq -c '.items[]' | while IFS= read -r source; do
    source_id=$(printf '%s' "$source" | jq -r .sourceId)
    evidence_token=$(printf '%s' "$source" | jq -r '.evidenceNextCursor // empty')
    while [ -n "$evidence_token" ]; do
      evidence=$(curl --fail-with-body --silent --show-error --get \
        --header "Authorization: Bearer $API_KEY" \
        --header "X-Iris-User-Token: ${USER_TOKEN:-}" \
        --data-urlencode 'limit=100' --data-urlencode "cursor=$evidence_token" \
        "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/memories/$MEMORY_ID/sources/$source_id/evidence") || exit 1
      printf '%s\n' "$evidence" | jq .source
      evidence_token=$(printf '%s' "$evidence" | jq -r '.source.evidenceNextCursor // empty')
    done
    reverse_token=''
    while :; do
      related=$(curl --fail-with-body --silent --show-error --get \
        --header "Authorization: Bearer $API_KEY" \
        --header "X-Iris-User-Token: ${USER_TOKEN:-}" \
        --data-urlencode "ownerId=$OWNER_ID" --data-urlencode 'limit=100' \
        --data-urlencode "cursor=$reverse_token" \
        "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/sources/$source_id/memories") || exit 1
      printf '%s\n' "$related" | jq .items
      reverse_token=$(printf '%s' "$related" | jq -r '.nextCursor // empty')
      [ -n "$reverse_token" ] || break
    done
  done || exit 1
  source_token=$(printf '%s' "$links" | jq -r '.nextCursor // empty')
  [ -n "$source_token" ] || break
done
```

{{< /multitabs >}}

The evidence response wraps `source`; it does not return a top-level `items` list. The source object contains `evidence` for documents or `sessionEvidence` for sessions. Newer evidence can also include `evidenceId`, `schemaVersion`, `capturedAt`, and `producer`. Handle their absence on legacy data. `capturedAt` is when extraction input was prepared, not when the original event occurred. A retried delivery retains its evidence identity.

For reverse lookup, use `GET /iris/data/v1/agent-memory/stores/{storeId}/sources/{sourceId}/memories` with `ownerId`, or the corresponding SDK method. Follow its `nextCursor` independently. Keep every token with the exact query and endpoint that issued it. Tokens expire; restart a query when one is invalid, and URL-encode tokens in REST calls.

A source link does not grant access to the original document, session, or another owner's memories. The service checks source and record access separately; sharing an extracted memory does not share the private document it came from.
