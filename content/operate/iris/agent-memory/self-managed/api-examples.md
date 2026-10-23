---
Title: Self-managed API examples
alwaysopen: false
categories:
- docs
- operate
- iris
description: Manage a self-managed Redis Agent Memory service and make application requests with SDKs or curl.
linkTitle: Self-managed API examples
weight: 70
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/api-examples/
---

These examples show self-managed Control Plane, Identity Service, and Data Plane requests.

They assume either an auth-disabled private Data Plane or agent-key auth
configured as described in [Authentication and authorization]({{< relref "/operate/iris/agent-memory/self-managed/authentication" >}}).

For the complete shared Data Plane schema, see the
[Redis Agent Memory API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}).
For the self-managed admin schema, see the
[Control Plane API reference]({{< relref "/operate/iris/agent-memory/self-managed/control-plane-api-reference" >}}).

## Control Plane API examples

Set variables:

```bash
CP_URL="http://localhost:9100"
RAM_ADMIN_TOKEN="<admin-token>"
```

List stores:

```bash
curl -sS "$CP_URL/v1/stores" \
  -H "Authorization: Bearer $RAM_ADMIN_TOKEN"
```

Create a store:

```bash
curl -sS -X POST "$CP_URL/v1/stores" \
  -H "Authorization: Bearer $RAM_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-store"
  }'
```

Response:

```json
{
  "storeId": "<store-id>"
}
```

List the built-in sensitive-data detectors a store may select:

```bash
curl -sS "$CP_URL/v1/detectors" \
  -H "Authorization: Bearer $RAM_ADMIN_TOKEN"
```

Response:

```json
{
  "catalogVersion": "1.0.0",
  "detectors": [
    {
      "id": "credit-card",
      "name": "Credit card number",
      "description": "Payment card numbers, covering Visa, Mastercard, American Express, Discover, JCB, Diners Club and UnionPay. Maestro is not covered. Digits may be separated by spaces or hyphens."
    }
  ]
}
```

Read detector IDs from this endpoint rather than copying them from documentation. The catalog is compiled into the server, so it is never empty, and `catalogVersion` identifies the generation a result came from.

Create a store with sensitive-data exclusions:

```bash
curl -sS -X POST "$CP_URL/v1/stores" \
  -H "Authorization: Bearer $RAM_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-store",
    "longTermMemoryExclusions": {
      "enabled": true,
      "builtInDetectors": {
        "enabled": true,
        "detectors": [
          { "id": "credit-card", "enabled": true, "action": "drop" },
          { "id": "ip-address", "enabled": true, "action": "redact" }
        ]
      },
      "customDetectors": {
        "enabled": true,
        "detectors": [
          {
            "name": "internal-case-reference",
            "enabled": true,
            "action": "redact",
            "matcher": {
              "kind": "regex",
              "regex": { "pattern": "CASE-REF-[0-9]{6}" }
            }
          }
        ]
      },
      "semantic": {
        "enabled": true,
        "prompt": "Never keep a customer's payment card number in long-term memory."
      }
    }
  }'
```

Exclusions fields:

| Field | Notes |
| ----- | ----- |
| `enabled` | Required. Gates all three mechanisms. Turning it off stops enforcement without discarding what you configured. |
| `builtInDetectors.enabled` | Required. |
| `builtInDetectors.detectors[].id` | Required. A detector ID from `/v1/detectors`. |
| `customDetectors.enabled` | Required. |
| `customDetectors.detectors[].name` | Required. 1-64 characters, starting with a letter, followed by letters, digits, underscores, or dashes. Unique within the store, and not a built-in detector ID. |
| `detectors[].enabled` | Required on every built-in and custom detector. |
| `matcher.kind` | Required. Use `regex`. |
| `matcher.regex.pattern` | Required when `kind` is `regex`. 1-512 characters, using [RE2 syntax](https://github.com/google/re2/wiki/Syntax), so lookaround is unavailable. Rejected if it does not compile, or if it can match without consuming text. |
| `action` | Optional on any detector. Use `redact` to replace the matched text or `drop` to discard the memory. Defaults to `redact`. |
| `semantic.enabled` | Required. |
| `semantic.prompt` | Required when `semantic.enabled` is `true`. Up to 2,000 characters. |

A store may define at most 32 custom detectors. Update an existing store's policy by sending `longTermMemoryExclusions` on a store update.

For what each mechanism does, how a match is handled, and which memory paths exclusions apply to, see [exclude sensitive data from automatic extraction]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#exclude-sensitive-data-from-automatic-extraction" >}}).

## Manage a service with the Control Plane SDK

The same package supplies two independently configured clients:

| Client | Purpose | Connection and credential |
|:-------|:--------|:--------------------------|
| `AgentMemoryService` | Manage stores and extractors. Supply the store ID on each call. | Control Plane URL and operator `token`. |
| `AgentMemory` | Read and write memory within the store selected by the constructor. | Data Plane URL, Store ID, and application credential. |

Use the self-managed Control Plane admin token or supported operator token with `AgentMemoryService`. Its SDK uses `/v2/memory` routes; the self-managed `/v1` admin API remains available. The SDK does not derive a Data Plane URL or credential from a Control Plane response.

Set `AGENT_MEMORY_CONTROL_PLANE_URL` and `AGENT_MEMORY_SERVICE_TOKEN` separately from `AGENT_MEMORY_URL`, `STORE_ID`, and `API_KEY`. These examples read the store and check Data Plane health:

{{< multitabs id="memory-service-sdk" tab1="Python" tab2="TypeScript" >}}

```python
import asyncio
import os

from redis_agent_memory import AgentMemory, AgentMemoryService


async def main():
    async with AgentMemoryService(
        server_url=os.environ["AGENT_MEMORY_CONTROL_PLANE_URL"],
        token=os.environ["AGENT_MEMORY_SERVICE_TOKEN"],
    ) as service:
        store = await service.get_store_async(store_id=os.environ["STORE_ID"])
        print("Store:", store.name)
    async with AgentMemory(
        os.environ["AGENT_MEMORY_URL"], store_id=os.environ["STORE_ID"],
        api_key=os.environ["API_KEY"],
    ) as memory:
        print((await memory.store_health_async()).status)


asyncio.run(main())
```

-tab-sep-

```typescript
import { AgentMemory, AgentMemoryService } from "@redis-iris/agent-memory";

async function main() {
  const { AGENT_MEMORY_CONTROL_PLANE_URL, AGENT_MEMORY_SERVICE_TOKEN,
    AGENT_MEMORY_URL, STORE_ID, API_KEY } = process.env;
  if (!AGENT_MEMORY_CONTROL_PLANE_URL || !AGENT_MEMORY_SERVICE_TOKEN ||
      !AGENT_MEMORY_URL || !STORE_ID || !API_KEY) {
    throw new Error("Set both planes' connection values.");
  }
  const service = new AgentMemoryService({
    serverURL: AGENT_MEMORY_CONTROL_PLANE_URL, token: AGENT_MEMORY_SERVICE_TOKEN,
  });
  console.log("Store:", (await service.getStore(STORE_ID)).name);
  const memory = new AgentMemory({ serverURL: AGENT_MEMORY_URL, storeId: STORE_ID, apiKey: API_KEY });
  console.log((await memory.storeHealth()).status);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Request failed");
  process.exitCode = 1;
});
```

{{< /multitabs >}}

If omitted, the Control Plane token is read from `AGENT_MEMORY_SERVICE_TOKEN`; it does not fall back to the Data Plane key. Python service models, errors, and retry helpers use `redis_agent_memory.controlplane`; Data Plane imports remain separate. Use each client's corresponding error classes.

Store and extractor management, detectors, and memory-type reference data have Cloud and self-managed API implementations. The generated client also includes Cloud-only account database, end user license agreement (EULA), network, store-model, metrics, flush, and empty-store operations; those return `404` on-prem. The current Cloud Control Plane does not accept a programmatic credential for this SDK. Use the Cloud console for Cloud service setup rather than sending a Data Plane key or assuming a console session is a service token.

See [Create an extractor](#create-an-extractor) for extractor administration and the [self-managed Control Plane reference](/content/operate/iris/agent-memory/self-managed/control-plane-api-reference.md) for the admin REST API. Webhook-policy configuration uses the admin REST API; it is not a method on the current service SDK.

## Create an extractor

Enable [document ingestion](/content/operate/iris/agent-memory/self-managed/configuration.md#enable-document-ingestion). Set `AGENT_MEMORY_CONTROL_PLANE_URL`, `AGENT_MEMORY_SERVICE_TOKEN`, and `STORE_ID` as described in [Manage a service with the Control Plane SDK](#manage-a-service-with-the-control-plane-sdk).

First register a custom memory type on the store. For a new `document_fact` type, run this once:

```sh
curl --fail-with-body --silent --show-error --request PATCH \
  --header "Authorization: Bearer $AGENT_MEMORY_SERVICE_TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"addCustomMemoryTypes":[{"name":"document_fact","description":"Useful facts extracted from documents"}]}' \
  "$AGENT_MEMORY_CONTROL_PLANE_URL/v2/memory/stores/$STORE_ID" | jq
```

Use an existing registered type instead if it already has the fields you need. Existing types cannot be redefined by adding them again.

Create an extractor with `source: documents` and `strategy: custom`. Save its returned `id` as `EXTRACTOR_ID`:

{{< multitabs id="document-extractor" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
import asyncio
import os

from redis_agent_memory import AgentMemoryService


async def main():
    async with AgentMemoryService(
        server_url=os.environ["AGENT_MEMORY_CONTROL_PLANE_URL"],
        token=os.environ["AGENT_MEMORY_SERVICE_TOKEN"],
    ) as service:
        extractor = await service.create_extractor_async(
            store_id=os.environ["STORE_ID"],
            name="Travel guide facts", memory_type="document_fact",
            source="documents", strategy="custom",
            prompt="Extract useful travel facts. Keep each fact in one memory.",
        )
        print(extractor.model_dump_json(by_alias=True))


asyncio.run(main())
```

-tab-sep-

```typescript
import { AgentMemoryService } from "@redis-iris/agent-memory";

async function main() {
  const { AGENT_MEMORY_CONTROL_PLANE_URL, AGENT_MEMORY_SERVICE_TOKEN, STORE_ID } = process.env;
  if (!AGENT_MEMORY_CONTROL_PLANE_URL || !AGENT_MEMORY_SERVICE_TOKEN || !STORE_ID) {
    throw new Error("Set the Control Plane connection values and STORE_ID.");
  }
  const service = new AgentMemoryService({
    serverURL: AGENT_MEMORY_CONTROL_PLANE_URL, token: AGENT_MEMORY_SERVICE_TOKEN,
  });
  console.dir(await service.createExtractor(STORE_ID, {
    name: "Travel guide facts", memoryType: "document_fact",
    source: "documents", strategy: "custom",
    prompt: "Extract useful travel facts. Keep each fact in one memory.",
  }), { depth: null });
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Request failed"); process.exitCode = 1; });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error --request POST \
  --header "Authorization: Bearer $AGENT_MEMORY_SERVICE_TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"name":"Travel guide facts","memoryType":"document_fact","source":"documents","strategy":"custom","prompt":"Extract useful travel facts. Keep each fact in one memory."}' \
  "$AGENT_MEMORY_CONTROL_PLANE_URL/v2/memory/stores/$STORE_ID/extractors" | jq
```

{{< /multitabs >}}

Set `destinationNamespaceId` when creating an extractor to place its output in one namespace in the same store. Use a stable namespace ID, not a display name. Personal destinations must be compatible with the document owner; shared placement does not make the original document accessible to every reader of the extracted memories.

List or read extractors before editing them. Updates and removal require the current `expectedRevision`; a stale revision returns `409`. An update can change the name, prompt, enabled flag, or destination. An empty destination clears it; omission keeps it. Accepted ingestions retain their extractor snapshot, so a later edit does not change an existing run.

After setup, applications can [submit and track documents](/content/develop/ai/context-engine/agent-memory/memory-etl.md#submit-and-track-a-document) with their Data Plane credentials.

## Configure a webhook policy

First [enable ingestion webhooks](/content/operate/iris/agent-memory/self-managed/configuration.md#enable-ingestion-webhooks). Use the self-managed Control Plane REST API and an operator credential. The Data Plane SDKs expose status reads; `AgentMemoryService` does not currently expose hook-policy management. Set `AGENT_MEMORY_CONTROL_PLANE_URL`, `AGENT_MEMORY_SERVICE_TOKEN`, `STORE_ID`, and `HOOK_URL`. For the receiver example, use `https://<receiver-host>:8443/hook`, or the HTTPS ingress URL that forwards to it.

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

The response returns each phase's `keyId` and `signingKeyConfigured`, never its key. Load those IDs and original keys into the receiver. The [receiver example](/content/develop/ai/context-engine/agent-memory/ingestion-webhooks.md#verify-callbacks-and-return-decisions) can get it from:

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

A stale `expectedRevision` returns `409`. To rotate a key, supply a new `signingKey` and load its returned ID into the receiver. Retain the previous receiver key for 24 hours: pending work keeps its original endpoint and key version. Keep the previous endpoint reachable while that work completes; delivery does not follow redirects. Policy changes affect new work; they do not rewrite saved decisions or a pending run's policy.

## Identity Service API examples

Manage agent keys with the Identity Service, using the Identity Service control token.

Set variables:

```bash
IDS_URL="http://localhost:9200"
IDS_CONTROL_TOKEN="<identity-service-control-token>"
```

Mint an agent key:

```bash
curl -sS -X POST "$IDS_URL/v1/api-keys" \
  -H "Authorization: Bearer $IDS_CONTROL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent-key",
    "grants": [
      {
        "tenant": "<your-tenant-id>",
        "product": "memory",
        "resourceType": "mem-store",
        "resourceId": "<store-id>",
        "actions": ["read", "write"]
      }
    ]
  }'
```

Response:

```json
{
  "keyId": "0123456789abcdef0123456789abcdef",
  "token": "<agent-key>",
  "createdAt": 1780000000
}
```

Agent-key fields:

| Field | Notes |
| ----- | ----- |
| Endpoint | Use `/v1/api-keys`. |
| `name` | Required. |
| `grants` | Required. |
| `tenant` | Your tenant ID. Use the same tenant on every grant of a key. Any string is accepted. Use `1` if you manage stores with the Control Plane admin token. |
| `product` | Use `memory`. |
| `resourceType` | Use `mem-store`. |
| `resourceId` | Set to the store ID. |
| `actions` | Use `read`, `write`, or both. |
| `expiresAt` | Optional. Unix seconds after which the key stops authenticating. `0` or omitted means never. |
| Token | Returned only when you mint or rotate a key. Store it immediately. |

List agent keys:

```bash
curl -sS "$IDS_URL/v1/api-keys" \
  -H "Authorization: Bearer $IDS_CONTROL_TOKEN"
```

Get one agent key:

```bash
curl -sS "$IDS_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IDS_CONTROL_TOKEN"
```

Update an agent key's grants:

```bash
curl -sS -X PATCH "$IDS_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IDS_CONTROL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grants": [
      {
        "tenant": "<your-tenant-id>",
        "product": "memory",
        "resourceType": "mem-store",
        "resourceId": "<store-id>",
        "actions": ["read", "write"]
      }
    ]
  }'
```

Rotate an agent key:

```bash
curl -sS -X POST "$IDS_URL/v1/api-keys/<key-id>/rotate?graceSeconds=3600" \
  -H "Authorization: Bearer $IDS_CONTROL_TOKEN"
```

Response:

```json
{
  "createdAt": 1780000000,
  "keyId": "fedcba9876543210fedcba9876543210",
  "oldExpiresAt": 1780003600,
  "token": "<new-agent-key>"
}
```

Rotation returns a new `keyId` with the new token. Use the new `keyId` for later updates,
rotations, and revocations. The old key stays valid for `graceSeconds`, which defaults to 3600 and
has a chart maximum of 604800 (`identityService.apiKeys.maxRotateGraceSeconds`). `oldExpiresAt` is
when the old key stops working. Revoking the old `keyId` ends its grace period early.

Revoke an agent key:

```bash
curl -sS -X DELETE "$IDS_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IDS_CONTROL_TOKEN"
```

A revoked key stops working within up to 5 minutes.

## Data Plane API examples

Set variables:

```bash
DP_URL="http://localhost:9000"
STORE_ID="<store-id>"
RAM_AGENT_KEY="<agent-key>"
```

For auth-disabled deployments, omit the `Authorization` header and rely on the
deployment's hosting controls.

### Write a session event

```bash
curl -sS -X POST "$DP_URL/v1/stores/$STORE_ID/session-memory/events" \
  -H "Authorization: Bearer $RAM_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-001",
    "actorId": "user-001",
    "role": "USER",
    "content": [
      {
        "text": "What is the capital of France?"
      }
    ],
    "createdAt": "2026-06-25T18:00:00Z"
  }'
```

Request body fields:

| Field | Notes |
| ----- | ----- |
| `actorId` | Required. |
| `role` | Required. Use `USER`, `ASSISTANT`, or `SYSTEM`. |
| `content` | Required. For text, use a content object such as `{"text": "..."}`. |
| `createdAt` | Required. Use an RFC 3339 timestamp, for example `2026-06-25T18:00:00Z`. |
| `sessionId` | Optional. If omitted, Redis Agent Memory generates one. |

### Read session memory

```bash
curl -sS "$DP_URL/v1/stores/$STORE_ID/session-memory/session-001" \
  -H "Authorization: Bearer $RAM_AGENT_KEY"
```

### List sessions

List sessions for a specific owner:

```bash
curl -sS "$DP_URL/v1/stores/$STORE_ID/session-memory?filterOwnerId=user-001" \
  -H "Authorization: Bearer $RAM_AGENT_KEY"
```

List all sessions:

```bash
curl -sS "$DP_URL/v1/stores/$STORE_ID/session-memory?includeAll=true" \
  -H "Authorization: Bearer $RAM_AGENT_KEY"
```

`filterOwnerId` and `includeAll` are mutually exclusive.

The `/session-memory` list returns session IDs. To get session rows ordered by
recent activity, use `/sessions`:

```bash
curl -sS "$DP_URL/v1/stores/$STORE_ID/sessions?filterOwnerId=user-001&sortBy=updatedAt&sortOrder=desc&limit=20" \
  -H "Authorization: Bearer $RAM_AGENT_KEY"
```

Each row includes `sessionId` and, when known, `ownerId`, `createdAt`,
`updatedAt`, and `namespaceRef`. Older sessions can have no owner or timestamps.
The default order is `updatedAt` descending. You can also sort by `sessionId`
or `createdAt`, each in ascending or descending order. Send `nextPageToken` as
`pageToken` with the same filters and sort options to fetch the next page.
The new route uses the same filter and authorization rules as `/session-memory`.

### Create long-term memories directly

Create a personal namespace for the user's preferences and save its ID. Run this once, then reuse the ID for later writes:

```bash
NAMESPACE_ID=$(curl --fail-with-body -sS -X POST "$DP_URL/v1/stores/$STORE_ID/namespaces" \
  -H "Authorization: Bearer $RAM_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"preferences","scope":"PERSONAL","ownerId":"user-001"}' \
  | jq -er '.namespace.namespaceId')
export NAMESPACE_ID
```

After the request succeeds, place the memory in that namespace:

```bash
curl -sS -X POST "$DP_URL/v1/stores/$STORE_ID/long-term-memory" \
  -H "Authorization: Bearer $RAM_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg ns "$NAMESPACE_ID" '{
    "memories": [
      {
        "id": "pref-email-updates",
        "text": "User prefers email updates.",
        "memoryType": "semantic",
        "ownerId": "user-001",
        "namespaceRef": {"namespaceId": $ns},
        "topics": ["communications"]
      }
    ]
  }')"
```

See [organize memories with namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}) for hierarchy, search, and management guidance.

### Search long-term memory

Filter by the namespace ID to recall preferences from that namespace:

```bash
curl -sS -X POST "$DP_URL/v1/stores/$STORE_ID/long-term-memory/search" \
  -H "Authorization: Bearer $RAM_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg ns "$NAMESPACE_ID" '{
    "text": "How should we contact this user?",
    "filter": {
      "namespaceRef": {"eq": $ns},
      "ownerId": {
        "eq": "user-001"
      }
    },
    "limit": 5
  }')"
```
