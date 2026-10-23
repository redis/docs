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

Ingestion webhooks let your application accept, reject, or transform content before Agent Memory saves it. A callback returns a decision; successful HTTP delivery alone does not approve a write.

The supported setup uses a self-managed deployment with the Redis background-job backend. Hooks are off by default. This guide does not assume Cloud account controls or a Cloud webhook rollout.

## Choose what to review

Select each path your policy needs. Selecting creation does not also select updates or deletion.

| Phase | Paths | Review |
|:------|:------|:-------|
| `before_input` | `session.append`, `memory.create`, `document.submit` | Session input, a manual memory batch, or a document before persistence and extraction dispatch. Accept, reject, or transform. |
| `before_apply` | `session.builtin`, `session.custom`, `document.chunk` | Generated creates, updates, and deletes before the current batch is applied. Whole-batch or per-operation decisions. |
| `before_input` | `memory.update`, `memory.delete`, `memory.move` | An authorized memory mutation. Accept or reject only. |
| `before_input` | `session.summary`, `session.property`, `session.delete`, `session.events.delete` | Session content changes and explicit deletion, including applicable worker writes. Accept or reject only. |
| `before_apply` | `summary_view.refresh` | A generated Summary View value before publication. Accept or reject only. |

Configuration, reads, searches, automatic expiration, and store teardown are outside content hooks. Empty extraction batches and empty Summary View results have no generated content to review. Authorization runs before content is sent to a receiver; an acceptance cannot grant access or bypass validation.

## Prepare the deployment

Start with the [self-managed deployment](/content/operate/iris/agent-memory/self-managed/deploy.md). These are process settings; a client cannot enable them through a request header.

An operator must configure both Data Plane servers and workers:

1. Enable `memory.webhooks.enabled` in chart-rendered configuration, or `webhooks.enabled` at the root of a bring-your-own file.
1. Enable the Redis job backend and [authenticated worker callbacks](/content/operate/iris/agent-memory/self-managed/authentication.md#worker-callbacks).
1. Configure the same signing-secret backend and prefix in the Control Plane, Data Plane, and worker. Supported backends are Vault and AWS Secrets Manager. The Control Plane writes keys; Data Plane processes read them.
1. Serve the receiver over HTTPS with a certificate trusted by the Data Plane.
1. For a private receiver address, allow its range in `memory.webhooks.private_cidrs` on both servers and workers.

For example, allow one private receiver address in Helm values:

```yaml
memory:
  webhooks:
    enabled: true
    private_cidrs:
      - <receiver-private-ip>/32
```

Delivery checks all resolved addresses at connection time. Redirects and environment HTTP proxies are not used. An allowlist cannot permit loopback, link-local, metadata-service, multicast, or other protected addresses. A localhost URL is not a production callback endpoint.

For Vault, use matching application configuration in the Data Plane and Control Plane:

```yaml
secrets:
  provider: vault
vault:
  address: https://<vault-host>:8200
  mount: secret
  base_path: agent-memory
```

In chart-rendered values, put this under `memory` and `controlplane.configData`, respectively. Supply `vault.token` through a mounted configuration Secret. The Control Plane needs permission to write and delete signing-key versions; servers and workers need read permission. Keep real Vault tokens and callback keys out of source control.

Before enabling output hooks on an existing deployment, upgrade workers first, then servers, and drain jobs queued by the older release. Keep hooks disabled until both sides support them. Setting the deployment flag to false stops delivery and fails selected work closed; it does not approve pending operations.

For Active-Active backing databases, route every server and worker for a store through the same authoritative writer connection. Do not mix member addresses or use region-dependent aliases for that connection. Before changing writers, drain old writers, wait for replication, and restart the processes to clear old connections. A store with hook history fails closed if its persisted writer connection is missing or invalid; regional queue ownership does not make independent writers safe.

## Configure a store policy

Use the self-managed Control Plane REST API and an operator credential. The Data Plane SDKs expose status reads; `AgentMemoryService` does not currently expose hook-policy management. Set `AGENT_MEMORY_CONTROL_PLANE_URL`, `AGENT_MEMORY_SERVICE_TOKEN`, `STORE_ID`, and `HOOK_URL`. For the receiver example, use `https://<receiver-host>:8443/hook`, or the HTTPS ingress URL that forwards to it.

A policy PUT replaces the whole policy. Include every phase you want to retain; omitting a phase removes it. Read the current revision before writing:

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $AGENT_MEMORY_SERVICE_TOKEN" \
  "$AGENT_MEMORY_CONTROL_PLANE_URL/v1/stores/$STORE_ID/ingestion-hooks" > hook-config.json
```

A new store starts at revision 0. Generate separate 32-byte signing keys for the two phases, then configure them with delivery still disabled:

```sh
export HOOK_INPUT_KEY="$(openssl rand -base64 32)"
export HOOK_OUTPUT_KEY="$(openssl rand -base64 32)"

jq --arg url "$HOOK_URL" \
  '{expectedRevision:.revision,enabled:false,beforeInput:{url:$url,paths:["session.append","memory.create","document.submit"],signingKey:env.HOOK_INPUT_KEY},beforeApply:{url:$url,paths:["session.builtin","session.custom","document.chunk"],signingKey:env.HOOK_OUTPUT_KEY}}' \
  hook-config.json | curl --fail-with-body --silent --show-error --request PUT \
    --header "Authorization: Bearer $AGENT_MEMORY_SERVICE_TOKEN" \
    --header 'Content-Type: application/json' --data @- \
    "$AGENT_MEMORY_CONTROL_PLANE_URL/v1/stores/$STORE_ID/ingestion-hooks" > hook-config-new.json
```

The response returns each phase's `keyId` and `signingKeyConfigured`, never its key. Load those IDs and original keys into the receiver. A receiver that accepts the JSON map used in the next section can get it from:

```sh
export HOOK_KEYS_JSON="$(jq -c '{(.beforeInput.keyId):env.HOOK_INPUT_KEY,(.beforeApply.keyId):env.HOOK_OUTPUT_KEY}' hook-config-new.json)"
```

After the receiver is ready, enable the same policy using the returned revision and omitting signing keys to retain them:

```sh
jq '{expectedRevision:.revision,enabled:true,beforeInput:{url:.beforeInput.url,paths:.beforeInput.paths},beforeApply:{url:.beforeApply.url,paths:.beforeApply.paths}}' \
  hook-config-new.json | curl --fail-with-body --silent --show-error --request PUT \
    --header "Authorization: Bearer $AGENT_MEMORY_SERVICE_TOKEN" \
    --header 'Content-Type: application/json' --data @- \
    "$AGENT_MEMORY_CONTROL_PLANE_URL/v1/stores/$STORE_ID/ingestion-hooks" | jq
```

A stale `expectedRevision` returns `409`. To rotate a key, supply a new `signingKey` and load its returned ID into the receiver. Retain the previous receiver key for 24 hours: pending work keeps its original endpoint and key version. Policy changes affect new work; they do not rewrite saved decisions or a pending run's policy.

Keep the previous endpoint reachable while its pending work completes; delivery does not follow a redirect to the replacement URL.

## Verify callbacks and return decisions

The payload identifies `version`, `eventId`, `ingestionOperationId`, `phase`, `path`, store/owner context, configuration revision, correlation ID, and timestamp. Input appears under `input`; generated candidates appear under `operations`. A candidate's `operationId` identifies the proposed operation, separately from its target memory ID.

Verify the exact raw request bytes before interpreting the JSON. The signature is:

```text
v1=<hex HMAC-SHA256(decodedKey, timestamp + "." + eventId + "." + rawBody)>
```

Read the timestamp, event ID, key ID, and signature from `X-Redis-Webhook-Timestamp`, `X-Redis-Webhook-Event-Id`, `X-Redis-Webhook-Key-Id`, and `X-Redis-Webhook-Signature`. Check freshness and use a constant-time signature comparison. Retries keep the event ID and raw body but receive a fresh signed timestamp.

This runnable receiver uses FastAPI and the Python standard library. It rejects the demonstration marker `[reject]` and accepts other signed content. Replace that marker policy with your application's policy. Save as `receiver.py`:

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

    # ponytail: one process and at most 1000 decisions; use a durable shared
    # decision store before adding replicas or policies with external effects.
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

Session-input transforms can change `actorId`, `role`, `content`, `createdAt`, and `metadata`, while preserving session identity, owner, and placement. Manual-create transforms preserve record count, order, and IDs. They can change editable text, type, session, owner, namespace placement, topics, and attributes. Do not supply both `namespace` and `namespaceRef`.

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

Decision `state` and `applyState` are separate. Inspect `applied`, `filtered`, `conflicts`, attempts, safe errors, and retry times. A later failure or an incomplete completion record does not prove earlier writes were rolled back. There is no manual redrive endpoint.

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
  if (HOOK_EVENT_ID) console.dir(await memory.getIngestionHookStatus(HOOK_EVENT_ID, options), { depth: null });
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
fi
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
```

{{< /multitabs >}}

Lists return `statuses` and `nextCursor`, not `items` and `nextPageToken`. Continue when a page is empty but has a cursor; ownership filtering can produce that result. Keep the same store, credential, and list parameters when following a cursor. The maximum page size is 100.

Private pending content expires within 24 hours or the earlier operation deadline. Compact status and write receipts remain for seven days after completion or expiry. Status omits private input, generated content, prompts, endpoint configuration, and keys.

Each store permits 10,000 hook records and 64 MiB of reserved pending content. Encoded callback requests and responses are limited to 8 MiB; decoded reviewed content is limited to 1 MiB. Hooks on bulk deletion or moves reduce the request limit to four memory IDs when that mutation path is selected; otherwise the native limit is 100. Split larger selected mutations into smaller requests and inspect every result.
