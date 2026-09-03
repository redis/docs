---
Title: Self-managed API examples
alwaysopen: false
categories:
- docs
- operate
- iris
description: Use curl examples with the Redis Agent Memory self-managed Control Plane and Data Plane APIs.
linkTitle: Self-managed API examples
weight: 70
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/api-examples/
---

These examples show self-managed Control Plane and Data Plane requests.

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
| `builtInDetectors.detectors[].id` | Required. A detector ID from `/v1/detectors`. |
| `customDetectors.detectors[].name` | Required. 1-64 characters, starting with a letter, followed by letters, digits, underscores, or dashes. Unique within the store, and not a built-in detector ID. |
| `matcher.kind` | Required. Use `regex`. |
| `matcher.regex.pattern` | Required when `kind` is `regex`. 1-512 characters, evaluated by RE2, so lookaround is unavailable. Rejected if it does not compile, or if it can match without consuming text. |
| `action` | Optional on any detector. Use `redact` to replace the matched text or `drop` to discard the memory. Defaults to `redact`. |
| `semantic.prompt` | Required when `semantic.enabled` is `true`. Up to 2,000 characters. |

A store may define at most 32 custom detectors. Update an existing store's policy by sending `longTermMemoryExclusions` on a store update.

For what each mechanism does, how a match is handled, and which memory paths exclusions apply to, see [exclude sensitive data from automatic extraction]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#exclude-sensitive-data-from-automatic-extraction" >}}).

Mint an agent key:

```bash
curl -sS -X POST "$CP_URL/v1/api-keys" \
  -H "Authorization: Bearer $RAM_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent-key",
    "grants": [
      {
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
| `resourceType` | Use `mem-store`. |
| `resourceId` | Set to the store ID. |
| `actions` | Use `read`, `write`, or both. |
| Token | Returned only when you mint or rotate a key. Store it immediately. |

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

### Create long-term memories directly

```bash
curl -sS -X POST "$DP_URL/v1/stores/$STORE_ID/long-term-memory" \
  -H "Authorization: Bearer $RAM_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "memories": [
      {
        "id": "pref-email-updates",
        "text": "User prefers email updates.",
        "memoryType": "semantic",
        "ownerId": "user-001",
        "namespace": "preferences",
        "topics": ["communications"]
      }
    ]
  }'
```

### Search long-term memory

```bash
curl -sS -X POST "$DP_URL/v1/stores/$STORE_ID/long-term-memory/search" \
  -H "Authorization: Bearer $RAM_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "How should we contact this user?",
    "filter": {
      "ownerId": {
        "eq": "user-001"
      }
    },
    "limit": 5
  }'
```
