---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Configure blocking ingestion webhooks, verify signed callbacks, and recover from failures.
hideListLinks: true
linktitle: Ingestion webhooks
title: Review content with ingestion webhooks
weight: 15
---

Ingestion webhooks let your application accept, reject, or transform content before Redis Agent Memory saves it. A callback returns a decision; successful HTTP delivery alone does not approve a write.

Ingestion webhooks require a self-managed deployment with the Redis background-job backend. Hooks are off by default.

## Choose what to review

Select each path your policy needs. Selecting creation does not also select updates or deletion.

### Before input is saved (`before_input`)

| Path | What triggers it | Decisions |
|:-----|:-----------------|:----------|
| `session.append` | An application adds a session event. | Accept, reject, or transform. |
| `memory.create` | An application creates a memory batch. | Accept, reject, transform, or review each operation. |
| `document.submit` | An application submits a document for extraction. | Accept, reject, or transform. |
| `memory.update`, `memory.delete`, `memory.move` | An authorized caller changes, deletes, or moves a memory. | Accept or reject. |
| `session.summary`, `session.property` | An application or worker writes a session summary or property. | Accept or reject. |
| `session.delete`, `session.events.delete` | An application explicitly deletes a session or event. | Accept or reject. |

### Before generated changes are applied (`before_apply`)

| Path | What triggers it | Decisions |
|:-----|:-----------------|:----------|
| `session.builtin` | Built-in session extraction produces memory changes. | Whole-batch or per-operation decisions. |
| `session.custom` | Custom session extraction produces memory changes. | Whole-batch or per-operation decisions. |
| `document.chunk` | Document extraction produces memory changes from a chunk. | Whole-batch or per-operation decisions. |
| `summary_view.refresh` | A Summary View generates a value for publication. | Accept or reject. |

Configuration, reads, searches, automatic expiration, and store teardown are outside content hooks. Empty extraction batches and empty Summary View results have no generated content to review. Authorization runs before content is sent to a receiver; an acceptance cannot grant access or bypass validation.

## Prepare the deployment

Ask your operator to [enable ingestion webhooks](/content/operate/iris/agent-memory/self-managed/configuration.md#enable-ingestion-webhooks) and configure the signing-secret backend.

## Configure a store policy

Your operator must [configure a store policy](/content/operate/iris/agent-memory/self-managed/api-examples.md#configure-a-webhook-policy), then provide the receiver with its signing keys and key IDs through a secret store. The receiver example reads them from `HOOK_KEYS_JSON`. Enable delivery after the receiver is ready.

## Verify callbacks and return decisions

The payload identifies `version`, `eventId`, `ingestionOperationId`, `phase`, `path`, store/owner context, configuration revision, correlation ID, and timestamp. Input appears under `input`; generated candidates appear under `operations`. A candidate's `operationId` identifies the proposed operation, separately from its target memory ID.

Verify the exact raw request bytes before interpreting the JSON. The signature is:

```text
v1=<hex HMAC-SHA256(decodedKey, timestamp + "." + eventId + "." + rawBody)>
```

Read the timestamp, event ID, key ID, and signature from `X-Redis-Webhook-Timestamp`, `X-Redis-Webhook-Event-Id`, `X-Redis-Webhook-Key-Id`, and `X-Redis-Webhook-Signature`. Check freshness and use a constant-time signature comparison. Retries keep the event ID and raw body but receive a fresh signed timestamp.

This runnable receiver uses FastAPI and the Python standard library. It:

1. Checks the four signature headers and the timestamp.
1. Verifies the hash-based message authentication code (HMAC) over the raw body.
1. Returns the saved decision if the event and body match a previous request.
1. Rejects content containing `[reject]` and accepts other signed content.

Replace the demonstration marker policy with your application's policy. Save as `receiver.py`:

```python
import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import FastAPI, HTTPException, Request

app = FastAPI()
keys = {}
for key_id, encoded in json.loads(os.environ["HOOK_KEYS_JSON"]).items():
    key = base64.b64decode(encoded, validate=True)
    if not key_id or len(key) != 32 or base64.b64encode(key).decode("ascii") != encoded:
        raise ValueError("Keys must be canonical base64 encodings of 32 bytes")
    keys[key_id] = key
if not keys:
    raise ValueError("Configure at least one signing key")
decisions = {}


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


@app.post("/hook")
async def hook(request: Request):
    names = ["X-Redis-Webhook-Key-Id", "X-Redis-Webhook-Event-Id",
             "X-Redis-Webhook-Timestamp", "X-Redis-Webhook-Signature"]
    if any(len(request.headers.getlist(name)) != 1 for name in names):
        raise HTTPException(401, "Invalid signature headers")
    key_id, event_id, stamp, signature = [request.headers[name] for name in names]
    key = keys.get(key_id)
    try:
        fresh = abs(time.time() - int(stamp)) <= 300
    except ValueError:
        fresh = False
    if not key or not event_id or not fresh:
        raise HTTPException(401, "Invalid signing identity or timestamp")
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 8 * 1024 * 1024:
            raise HTTPException(413, "Body too large")
    expected = "v1=" + hmac.new(
        key, f"{stamp}.{event_id}.".encode() + body, hashlib.sha256,
    ).hexdigest()
    if not signature.isascii() or not hmac.compare_digest(signature, expected):
        raise HTTPException(401, "Invalid signature")
    try:
        payload = json.loads(body, object_pairs_hook=unique_object)
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(400, "Invalid JSON")
    if not isinstance(payload, dict) or payload.get("version") != "1" or payload.get("eventId") != event_id:
        raise HTTPException(400, "Invalid envelope")
    if payload.get("phase") not in {"before_input", "before_apply"}:
        raise HTTPException(400, "Invalid phase")

    # Demo only: one process and at most 1,000 saved decisions.
    # Use a durable shared store before adding replicas or external effects.
    now = time.time()
    for identity, saved in list(decisions.items()):
        if saved[2] <= now:
            del decisions[identity]
    identity = (key_id, event_id)
    digest = hashlib.sha256(body).digest()
    if identity in decisions:
        saved_digest, decision, _ = decisions[identity]
        if saved_digest != digest:
            raise HTTPException(409, "Event content changed")
        return decision
    if len(decisions) >= 1000:
        raise HTTPException(503, "Decision capacity reached")
    decision = {"version": "1", "decision": "accept"}
    if "[reject]" in json.dumps(payload, ensure_ascii=False):
        decision.update(decision="reject", reasonCode="policy_denied")
    decisions[identity] = (digest, decision, now + 7 * 24 * 60 * 60)
    return decision
```

Install and run it with a certificate for the configured receiver hostname:

```sh
uv venv
source .venv/bin/activate
uv pip install fastapi uvicorn
uvicorn receiver:app --host 0.0.0.0 --port 8443 \
  --ssl-certfile <certificate-file> --ssl-keyfile <private-key-file>
```

The example retains up to 1,000 decisions in one process for seven days. Restarting loses that cache. Use a durable shared store for production decisions and store the body fingerprint with each decision. Do not perform external side effects before saving an idempotent decision.

Return HTTP `200` and `Content-Type: application/json` with a versioned decision. An empty body, bare success status, unknown fields, duplicate keys, or an invalid decision fails closed. Whole-request decisions are:

```json
{"version":"1","decision":"accept"}
```

```json
{"version":"1","decision":"reject","reasonCode":"policy_denied"}
```

A document-input transform replaces its decoded text:

```json
{"version":"1","decision":"transform","replacement":{"content":"Approved document text."}}
```

| Path | What a transform can change |
|:-----|:----------------------------|
| `document.submit` | The decoded document text in `replacement.content`. |
| `session.append` | `actorId`, `role`, `content`, `createdAt`, and `metadata`. Session identity, owner, and placement stay fixed. |
| `memory.create` | Editable text, type, session, owner, namespace placement, topics, and attributes. Record count, order, and IDs stay fixed. |

Do not supply both `namespace` and `namespaceRef`. Transformed records must still pass authorization and validation.

For `memory.create`, `session.builtin`, `session.custom`, and `document.chunk`, `decision: review` can decide each operation separately:

```json
{
  "version":"1",
  "decision":"review",
  "operations":[
    {"operationId":"<candidate-1>","decision":"accept"},
    {"operationId":"<candidate-2>","decision":"transform","replacement":{"text":"Approved fact."}},
    {"operationId":"<candidate-3>","decision":"reject","reasonCode":"policy_denied"}
  ]
}
```

Return exactly one decision for every proposed operation; missing, duplicate, or unknown IDs invalidate the batch. Manual-create operation IDs are the supplied memory IDs. Generated candidates have separate operation IDs. Generated updates can transform editable fields; deletion can only be accepted or rejected. A receiver cannot add operations, change targets or kinds, or rewrite provenance. Native authorization, exclusions, namespace admission, and concurrency checks still apply.

## Make input retries idempotent

When selected, session append and manual memory creation require `idempotencyKey` containing 1–128 printable ASCII characters. In Python this is `idempotency_key`; TypeScript and REST use `idempotencyKey`. Document ingestion already requires this field.

Save the complete original request, including timestamps, before sending it. After a lost response, reuse that request and key. Changing content under the same key conflicts. Saved acceptance and write receipts let a retry resume without repeating confirmed writes. A manual batch can still have per-record errors.

To try the receiver's rejection marker, use a new memory ID and key with your authenticated owner. Save this synthetic request and repeat only the curl call to test an identical retry:

```sh
export HOOK_TEST_MEMORY_ID="hook-test-$(openssl rand -hex 12)"
export HOOK_TEST_REQUEST_ID="hook-request-$(openssl rand -hex 12)"
jq -n --arg id "$HOOK_TEST_MEMORY_ID" --arg owner "$OWNER_ID" \
  --arg key "$HOOK_TEST_REQUEST_ID" \
  '{idempotencyKey:$key,memories:[{id:$id,ownerId:$owner,text:"[reject] synthetic webhook test"}]}' > hook-test.json
curl --fail-with-body --silent --show-error --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header "X-Iris-User-Token: ${USER_TOKEN:-}" \
  --header 'Content-Type: application/json' --data @hook-test.json \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory" | jq
```

With `memory.create` selected, inspect the per-record result and verify that the rejected record was not created. Use a new key for changed input; editing `hook-test.json` under the same key conflicts.

The additional mutation paths and Summary View publication use fresh events rather than this input-replay contract. Retrying them reviews current state again; a lost response after a successful mutation can lead to another review. A callback's acceptance does not promise that its target will remain unchanged until persistence.

## Handle failures and inspect status

Callbacks have a five-second limit. Input callbacks have no automatic receiver retry. Interrupted undecided input can be resumed with the same original request and key; receiver failures remain terminal. Abandoned undecided input is cancelled after 60 seconds without a live lease.

Session and document extraction output have at most three total callback attempts, with delays of 30 and 120 seconds within the job deadline. Saved candidates are resumed rather than regenerated. Explicit rejection filters candidates and permits progress; invalid responses or transport failures stop the current batch. Earlier batches may already be saved.

For `summary_view.refresh`, a recorded rejection, invalid decision, or receiver failure stops that refresh's normal retries. Request a new refresh to generate a new proposal. Interrupted attempts can still be delivered again. Native generation or signing-key lookup failures have their own retry policy.

Session summary and property hooks also apply to worker writes. A rejected summary is not saved and does not advance the worker's summary boundary; property hooks can also stop bookmark writes.

| Response | Action |
|:---------|:-------|
| `503` with `/errors/ingestion-hook-retry` | Inspect `retryAt` and resume the same operation after that time. |
| `422` with `/errors/ingestion-hook-stopped` | Inspect the terminal state. Repeating the same stopped operation is not recovery. |
| `429` | Hook capacity is exhausted. Apply backoff and inspect pending work. |
| Bulk success with item errors | Check every record's result; HTTP success does not mean all records were applied. |

Decision `state` and `applyState` are separate. Inspect `applied`, `filtered`, `conflicts`, attempts, safe errors, and retry times. A later failure or an incomplete completion record does not prove earlier writes were rolled back. You cannot manually retry a stopped operation through a retry endpoint.

Use the Data Plane connection values from the [quickstart](/content/develop/ai/context-engine/agent-memory/quickstart.md). Set `HOOK_EVENT_ID` to inspect one known event, or omit it to list events. Add `USER_TOKEN` for delegated access:

{{< multitabs id="hook-status" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
import asyncio
import os

from redis_agent_memory import AgentMemory


async def main():
    headers = {"X-Iris-User-Token": os.environ["USER_TOKEN"]} if os.environ.get("USER_TOKEN") else {}
    async with AgentMemory(
        os.environ["AGENT_MEMORY_URL"], store_id=os.environ["STORE_ID"],
        api_key=os.environ["API_KEY"],
    ) as memory:
        if os.environ.get("HOOK_EVENT_ID"):
            event = await memory.get_ingestion_hook_status_async(
                event_id=os.environ["HOOK_EVENT_ID"], http_headers=headers,
            )
            print(event.model_dump_json(by_alias=True))
            return
        cursor = None
        while True:
            page = await memory.list_ingestion_hook_statuses_async(
                limit=20, cursor=cursor, http_headers=headers,
            )
            for status in page.statuses:
                print(status.model_dump_json(by_alias=True))
            cursor = page.next_cursor
            if not cursor:
                break


asyncio.run(main())
```

-tab-sep-

```typescript
import { AgentMemory } from "@redis-iris/agent-memory";

async function main() {
  const { AGENT_MEMORY_URL, STORE_ID, API_KEY, USER_TOKEN, HOOK_EVENT_ID } = process.env;
  if (!AGENT_MEMORY_URL || !STORE_ID || !API_KEY) {
    throw new Error("Set AGENT_MEMORY_URL, STORE_ID, and API_KEY.");
  }
  const memory = new AgentMemory({ serverURL: AGENT_MEMORY_URL, storeId: STORE_ID, apiKey: API_KEY });
  const headers: Record<string, string> = USER_TOKEN ? { "X-Iris-User-Token": USER_TOKEN } : {};
  const options = { headers };
  if (HOOK_EVENT_ID) {
    console.dir(await memory.getIngestionHookStatus(HOOK_EVENT_ID, options), { depth: null });
    return;
  }
  let cursor: string | undefined;
  do {
    const page = await memory.listIngestionHookStatuses(20, cursor, options);
    console.dir(page.statuses, { depth: null });
    cursor = page.nextCursor;
  } while (cursor);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Request failed"); process.exitCode = 1; });
```

-tab-sep-

```sh
if [ -n "${HOOK_EVENT_ID:-}" ]; then
  curl --fail-with-body --silent --show-error \
    --header "Authorization: Bearer $API_KEY" \
    --header "X-Iris-User-Token: ${USER_TOKEN:-}" \
    "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/ingestion-hooks/events/$HOOK_EVENT_ID" | jq
else
  cursor=''
  while :; do
    page=$(curl --fail-with-body --silent --show-error --get \
      --header "Authorization: Bearer $API_KEY" \
      --header "X-Iris-User-Token: ${USER_TOKEN:-}" \
      --data-urlencode 'limit=20' --data-urlencode "cursor=$cursor" \
      "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/ingestion-hooks/events") || exit 1
    printf '%s\n' "$page" | jq .statuses
    cursor=$(printf '%s' "$page" | jq -r '.nextCursor // empty')
    [ -n "$cursor" ] || break
  done
fi
```

{{< /multitabs >}}

Lists return `statuses` and `nextCursor`. Pass `nextCursor` as `cursor`, even when the page is empty; ownership filtering can produce that result. Keep the same store, credential, and list parameters. The maximum page size is 100.

Private pending content expires within 24 hours or the earlier operation deadline. Compact status and write receipts remain for seven days after completion or expiry. Status omits private input, generated content, prompts, endpoint configuration, and keys.

Each store permits 10,000 hook records and 64 MiB of reserved pending content. Encoded callback requests and responses are limited to 8 MiB; decoded reviewed content is limited to 1 MiB. Hooks on bulk deletion or moves reduce the request limit to four memory IDs when that mutation path is selected; otherwise the native limit is 100. Split larger selected mutations into smaller requests and inspect every result.
