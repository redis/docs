---
Title: Redis Agent Memory — Complete Developer Guide
alwaysopen: false
categories:
- docs
- develop
- ai
description: Complete developer guide for Redis Agent Memory (RAM) covering architecture, quick starts for Redis Cloud and on-premises, memory concepts, lifecycle, store management, authentication, configuration, and agent code examples.
linkTitle: Developer guide
weight: 5
bannerText: Redis Agent Memory is currently available in preview. Features and behavior are subject to change.
bannerChildren: true
---

**Covers:** Redis Cloud (public preview) and On-Premises (public preview) deployments  
**Audience:** Developers building AI agents, platform teams deploying RAM, solution architects

## Table of contents

- [Overview and architecture](#overview-and-architecture)
- [Quick start — Redis Cloud](#quick-start--redis-cloud)
- [Quick start — On-Premises](#quick-start--on-premises)
- [Memory concepts](#memory-concepts)
- [Memory lifecycle](#memory-lifecycle)
- [Store management](#store-management)
- [Authentication and authorization](#authentication-and-authorization)
- [Configuration reference](#configuration-reference)
- [Agent examples](#agent-examples)

---

## Overview and architecture

### What is Redis Agent Memory?

Redis Agent Memory (RAM) is an AI agent memory infrastructure service. It gives AI agents persistent memory across conversations, sessions, and long-term interactions — without the application having to manage storage, extraction, deduplication, or retrieval.

RAM is designed for production use. It handles the full memory pipeline:

- **Receive** — accepts conversation messages from your agent or application
- **Extract** — identifies what is worth remembering (facts, preferences, summaries)
- **Store** — persists extracted memories with semantic embeddings
- **Retrieve** — returns relevant memories on demand using semantic, keyword, or hybrid search
- **Forget** — ages and removes stale memories based on configurable policy

You call the API from your agent, and RAM does the rest.

### Two-tier memory model

RAM organizes memory into two tiers, mirroring how humans remember things:

```
┌──────────────────────────────────────────────────────────────────┐
│                         Redis Agent Memory                       │
│                                                                  │
│  ┌─────────────────────────────┐  ┌──────────────────────────┐  │
│  │      Short-Term Memory      │  │    Long-Term Memory      │  │
│  │       (Session Tier)        │  │   (Persistent Tier)      │  │
│  │                             │  │                          │  │
│  │  • Raw messages             │  │  • Extracted facts       │  │
│  │  • Conversation context     │  │  • User preferences      │  │
│  │  • Recent interactions      │  │  • Summaries             │  │
│  │  • Per-session scope        │  │  • Cross-session scope   │  │
│  │  • Configurable TTL         │  │  • Semantic search       │  │
│  │                             │  │  • Deduplication         │  │
│  └─────────────────────────────┘  └──────────────────────────┘  │
│                         ↑                                        │
│                    Promotion engine                              │
│              (discrete / summary / preferences / custom)        │
└──────────────────────────────────────────────────────────────────┘
```

**Short-term (session) memory** holds raw conversation messages and recent context for a single session. It is scoped per session ID and expires based on TTL.

**Long-term memory** holds extracted, deduplicated, semantically-indexed knowledge about a user or entity. It persists across sessions and is searched using semantic embeddings.

The **promotion engine** runs in the background, extracting content from short-term memory and promoting it to long-term memory based on the configured extraction strategy.

### Deployment options

| | Redis Cloud | On-Premises |
|---|---|---|
| **Infrastructure** | Fully managed by Redis | You deploy on your Kubernetes cluster |
| **Status** | Public preview | Public preview |
| **Auth** | API key | Admin key (Control Plane) + Agent key (Data Plane); OIDC/JWT optional |
| **Setup time** | ~5 minutes | ~30 minutes |
| **Configuration** | Redis Cloud console + API | Helm chart values + Control Plane API |
| **Best for** | Fast start, SaaS apps | Enterprise, regulated, air-gapped |

### System architecture (on-premises)

For on-premises deployments, RAM runs as two separately-secured services:

```
┌────────────────────────────────────────────────────────────────────────┐
│                           Enterprise Network                           │
│                                                                        │
│  Platform Admin ──[ admin token ]──► ┌─────────────────────┐          │
│                                      │   Control Plane     │          │
│                                      │  /v1/stores         │          │
│                                      │  /v1/api-keys       │          │
│                                      └──────────┬──────────┘          │
│                                                 │ writes               │
│  AI Agent ─[ OIDC JWT or iris_ key ]──────────► ┌──────────────────┐  │
│                                      reads ◄────│  Metadata Redis  │  │
│                                      ┌──────────┴──────────┐         │
│                                      │    Data Plane       │          │
│                                      │  auth + authz       │          │
│                                      └──────────┬──────────┘          │
│                                                 │ allowed traffic      │
│                                      ┌──────────▼──────────┐          │
│                                      │    Store Redis      │          │
│                                      │  (session/LTM)      │          │
│                                      └─────────────────────┘          │
│                                                                        │
│  Customer IdP ──[ JWKS ]──────────────────────────────────────►        │
└────────────────────────────────────────────────────────────────────────┘
```

- **Control Plane** — admin API. Platform operators create stores and issue credentials. Never handles agent memory traffic.
- **Data Plane** — runtime API. AI agents call this for memory read/write. Validates identity and enforces authorization on every request.
- **Metadata Redis** — shared management store. Control Plane writes here; Data Plane reads here.
- **Store Redis** — actual memory data (sessions, long-term memories). Data Plane accesses it after authorization succeeds.

---

## Quick start — Redis Cloud

Get an AI agent writing and reading memory in under 5 minutes.

{{< note >}}
For detailed Redis Cloud console walkthroughs, see:
- [Create an Agent Memory service]({{< relref "/operate/rc/context-engine/agent-memory/create-service" >}})
- [View and manage your service]({{< relref "/operate/rc/context-engine/agent-memory/view-service" >}})
- [Use the Agent Memory API on Redis Cloud]({{< relref "/operate/rc/context-engine/agent-memory/use-agent-memory" >}})
{{< /note >}}

**Prerequisites**
- A Redis Cloud account
- Python 3.9+ or an HTTP client

### Step 1: Create a Redis database

In the Redis Cloud console, create a new database. Enable the Agent Memory feature when prompted.

Note the database endpoint and password — you will use these when creating an Agent Memory service.

### Step 2: Create an Agent Memory service

In the Redis Cloud console, navigate to **Agent Memory** and click **Create service**.

Configure:

- **Name** — a label for this service (e.g., `my-agent-dev`)
- **Database** — select the database you created in step 1
- **LLM provider** — select your embedding provider (OpenAI, Azure OpenAI, Bedrock, Vertex AI, or Ollama)
- **LLM API key** — your embedding provider API key

Click **Create**. After creation, copy the **API endpoint** and **API key** shown in the console.

### Step 3: Write your first memory

Use the REST API directly with any HTTP client.

```bash
BASE_URL="https://your-service.redis.io"  # from the console
API_KEY="your-api-key"                    # from the console
STORE_ID="your-store-id"                  # from the console

# Add a user message to session memory
curl -X POST "$BASE_URL/v1/stores/$STORE_ID/session-memory/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":  "user-123-session-1",
    "actorId":    "user-sarah",
    "role":       "USER",
    "content":    [{"text": "My name is Sarah and I prefer dark mode"}],
    "createdAt":  "2026-06-23T10:00:00Z"
  }'

# Add the assistant reply
curl -X POST "$BASE_URL/v1/stores/$STORE_ID/session-memory/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":  "user-123-session-1",
    "actorId":    "assistant",
    "role":       "ASSISTANT",
    "content":    [{"text": "Got it, Sarah! I'\''ve noted your dark mode preference."}],
    "createdAt":  "2026-06-23T10:00:01Z"
  }'
```

### Step 4: Read memory back

```bash
# Get the full session (returns all events in order)
curl "$BASE_URL/v1/stores/$STORE_ID/session-memory/user-123-session-1" \
  -H "Authorization: Bearer $API_KEY"

# Search long-term memory (available after background extraction runs)
curl -X POST "$BASE_URL/v1/stores/$STORE_ID/long-term-memory/search" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text":   "What are Sarah'\''s UI preferences?",
    "filter": {"ownerId": {"eq": "user-sarah"}},
    "limit":  5
  }'
```

### Step 5: Wire into an agent (Python)

```python
import httpx
import time
from openai import OpenAI

BASE_URL = "https://your-service.redis.io"
STORE_ID = "your-store-id"
API_KEY  = "your-api-key"
HEADERS  = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

openai = OpenAI()


def add_event(session_id: str, actor_id: str, role: str, text: str):
    httpx.post(
        f"{BASE_URL}/v1/stores/{STORE_ID}/session-memory/events",
        headers=HEADERS,
        json={
            "sessionId": session_id,
            "actorId":   actor_id,
            "role":      role.upper(),
            "content":   [{"text": text}],
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    ).raise_for_status()


def get_events(session_id: str) -> list:
    return httpx.get(
        f"{BASE_URL}/v1/stores/{STORE_ID}/session-memory/{session_id}",
        headers=HEADERS,
    ).raise_for_status().json()["events"]


def search_memory(query: str, owner_id: str) -> list:
    return httpx.post(
        f"{BASE_URL}/v1/stores/{STORE_ID}/long-term-memory/search",
        headers=HEADERS,
        json={"text": query, "filter": {"ownerId": {"eq": owner_id}}, "limit": 5},
    ).raise_for_status().json()["items"]


def chat(user_message: str, session_id: str, owner_id: str) -> str:
    memories = search_memory(user_message, owner_id)
    context  = "\n".join(m["text"] for m in memories)
    events   = get_events(session_id)
    history  = [
        {"role": e["role"].lower(), "content": e["content"][0]["text"]}
        for e in events[-10:]
    ]

    messages = [
        {"role": "system", "content": f"Helpful assistant.\n\nMemory context:\n{context}"}
    ] + history + [{"role": "user", "content": user_message}]

    reply = openai.chat.completions.create(model="gpt-4o", messages=messages) \
                  .choices[0].message.content

    add_event(session_id, owner_id,    "user",      user_message)
    add_event(session_id, "assistant", "assistant", reply)
    return reply


print(chat("What's my favorite UI theme?", "sess-001", "user-sarah"))
```

---

## Quick start — On-Premises

Deploy Redis Agent Memory on your Kubernetes cluster using the Redis Helm chart.

**Prerequisites**
- Kubernetes 1.25+
- Helm 3.8+
- Two Redis databases (Metadata Redis + Store Redis)
- License file and admin token from your Redis account team
- OIDC-compatible IdP (Okta, Entra ID, Keycloak, Auth0, Cognito, Dex, or any OIDC-conformant IdP)

### Step 1: Create the namespace and secrets

```bash
kubectl create namespace redis-agent-memory

# License file (provided by Redis)
kubectl create secret generic ram-license \
  --from-file=redis-agent-memory.lic \
  -n redis-agent-memory

# Admin token (provided by Redis for bootstrap, rotate after first deploy)
kubectl create secret generic ram-admin-token \
  --from-literal=token="your-bootstrap-admin-token" \
  -n redis-agent-memory
```

### Step 2: Create a Helm values file

Create `values.yaml`:

```yaml
global:
  licenseSecretName: ram-license

controlplane:
  adminTokenSecretName: ram-admin-token

  metadata:
    redis:
      url: "redis://:password@metadata-redis.internal:6379/0"

dataplane:
  auth:
    enabled: false          # legacy auth explicitly unsupported; use oidc
    oidc:
      enabled: true
      issuer: "https://idp.example.com/oauth2/default"
      jwks_uri: "https://idp.example.com/oauth2/v1/keys"
      audience:
        - "api://redis-agent-memory"
    agent_keys:
      enabled: true

  metadata:
    source: live            # reads from Metadata Redis in real time
    redis:
      url: "redis://:password@metadata-redis.internal:6379/0"

  memory:
    redis:
      url: "redis://:password@store-redis.internal:6379/1"

  llm:
    openai:
      api_key: "sk-..."
    embedding_model: "text-embedding-3-small"
```

### Step 3: Deploy with Helm

```bash
helm repo add redis-ram https://charts.redis.io/agent-memory
helm repo update

helm install redis-agent-memory redis-ram/redis-agent-memory \
  --namespace redis-agent-memory \
  --values values.yaml \
  --version <latest>
```

Verify both pods are running:

```bash
kubectl get pods -n redis-agent-memory
# NAME                                   READY   STATUS    RESTARTS   AGE
# redis-agent-memory-controlplane-xxx    1/1     Running   0          90s
# redis-agent-memory-dataplane-xxx       1/1     Running   0          90s
```

### Step 4: Create a memory store

The Control Plane admin API is available at port 8080. Use your admin token:

```bash
CONTROL_PLANE=http://redis-agent-memory-controlplane.redis-agent-memory.svc:8080
ADMIN_TOKEN="your-bootstrap-admin-token"

curl -X POST $CONTROL_PLANE/v1/stores \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app-memory",
    "description": "Memory store for my-app production"
  }'
```

### Step 5: Issue an agent key

```bash
STORE_ID="store-abc123"

curl -X POST $CONTROL_PLANE/v1/api-keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app-agent-key",
    "grants": [
      {
        "store_id": "'$STORE_ID'",
        "permissions": ["read", "write"]
      }
    ]
  }'
```

The `iris_` key is shown **once**. Store it securely in your secret manager or Kubernetes Secret immediately.

### Step 6: Call the Data Plane

```bash
DATA_PLANE=http://redis-agent-memory-dataplane.redis-agent-memory.svc:8081
IRIS_KEY="iris_key-xyz789.SecretPartHere"

# Add a session event
curl -X POST $DATA_PLANE/v1/stores/$STORE_ID/session-memory/events \
  -H "X-Api-Key: $IRIS_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":  "user-123-session-1",
    "actorId":    "user-1",
    "role":       "USER",
    "content":    [{"text": "I am deploying on AWS us-east-1"}],
    "createdAt":  "2026-06-23T10:00:00Z"
  }'

# Get session memory
curl $DATA_PLANE/v1/stores/$STORE_ID/session-memory/user-123-session-1 \
  -H "X-Api-Key: $IRIS_KEY"

# Search long-term memory
curl -X POST $DATA_PLANE/v1/stores/$STORE_ID/long-term-memory/search \
  -H "X-Api-Key: $IRIS_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text":   "which cloud region is the user deploying to?",
    "filter": {"ownerId": {"eq": "user-1"}},
    "limit":  5
  }'
```

---

## Memory concepts

### Session memory vs. long-term memory

#### Session memory

Session memory is the working memory for an active conversation. It holds:

- Raw message history (user turns, assistant turns)
- Scoped to a single session ID
- Expires according to the configured TTL (default: 24 hours)
- Returned in chronological order

Use session memory when you need conversation continuity within a session — so your agent knows what was said 10 messages ago.

#### Long-term memory

Long-term memory holds extracted, deduplicated facts and preferences about a user, entity, or topic. It:

- Persists across sessions
- Is indexed with semantic embeddings
- Is searched by meaning (semantic), keyword, or hybrid
- Is automatically deduplicated — RAM merges similar memories instead of creating duplicates
- Can be scoped to a user, a namespace, or a topic using custom metadata

Use long-term memory when you need context that spans sessions — so your agent knows the user's name, preferences, or history from a previous conversation.

### Extraction strategies

The extraction strategy controls how RAM promotes content from short-term to long-term memory.

| Strategy | What it extracts | Best for |
|---|---|---|
| `discrete` | Individual atomic facts ("user is vegetarian", "user lives in Seattle") | Factual chatbots, personal assistants |
| `summary` | A rolling summary of conversation highlights | Long-form assistants, support agents |
| `preferences` | User preferences and behavioral signals | Recommendation systems, personalization |
| `custom` | You define what to extract via a custom prompt | Domain-specific applications |

Configure the extraction strategy per store or globally:

```yaml
memory:
  extraction:
    strategy: discrete     # discrete | summary | preferences | custom
    custom_prompt: ""      # only used when strategy: custom
```

**Example — discrete extraction:**  
Input: `"I always work late, usually past midnight. I live in Austin and have a 3-year-old daughter."`  
Extracted memories:
- works late, usually past midnight
- lives in Austin
- has a 3-year-old daughter

**Example — summary extraction:**  
Input: a 20-message customer support conversation  
Extracted memory: `"User Sarah contacted support about billing discrepancy on invoice #4821. Resolved by applying a $15 credit. User expressed satisfaction with the resolution."`

### Search modes

| Mode | How it works | Best for |
|---|---|---|
| `semantic` | Vector similarity — finds memories that mean the same thing even if worded differently | General-purpose, conversational queries |
| `keyword` | Full-text search — finds memories containing exact terms | IDs, codes, names, structured identifiers |
| `hybrid` | Combination of semantic + keyword with score fusion | Production default; most reliable across query types |

**When to use hybrid:** Hybrid wins when your queries mix natural language intent with specific terms (names, IDs, technical terms). It runs both vector and keyword pipelines and fuses the scores, so it rarely misses on either dimension.

### Deduplication

RAM automatically deduplicates long-term memories at three levels:

| Level | What it checks | Example |
|---|---|---|
| Exact | Identical text strings | Two extractions producing word-for-word duplicates |
| Semantic | Meaning similarity above a configurable threshold | "User prefers Python" vs "User likes Python" |
| LLM-assisted | Uses an LLM to judge if two memories convey the same fact | "Sarah lives in Austin" vs "Sarah is based in Austin, TX" |

Tune the semantic similarity threshold:

```yaml
memory:
  deduplication:
    semantic_threshold: 0.95    # 0.0–1.0; higher = less aggressive dedup
    llm_assisted: true          # enables LLM-level dedup (costs tokens)
```

---

## Memory lifecycle

### The full lifecycle

```
User message arrives
        │
        ▼
┌───────────────┐
│  SHORT-TERM   │  Raw messages stored in session store
│    MEMORY     │  TTL clock starts
└───────┬───────┘
        │  background promotion (runs every N minutes)
        ▼
┌───────────────┐
│  EXTRACTION   │  LLM extracts facts / summary / preferences
│   PIPELINE    │  Deduplication check against existing LTM
└───────┬───────┘
        │  promotion succeeds
        ▼
┌───────────────┐
│  LONG-TERM    │  Memory stored with embedding
│    MEMORY     │  Access counter = 0
└───────┬───────┘
        │
        ├──────► Retrieved by search → access counter increments
        │
        ▼
┌───────────────┐
│   FORGETTING  │  Background job evaluates each memory
│    ENGINE     │  Criteria: age + access recency + access frequency
└───────┬───────┘
        │  memory marked for removal
        ▼
┌───────────────┐
│  COMPACTION   │  Periodic cleanup removes expired/forgotten memories
└───────────────┘
```

### Session memory TTL

Session memory expires automatically. The default TTL is 24 hours from last write.

```yaml
memory:
  session:
    ttl_seconds: 86400       # 24 hours (default)
    ttl_policy: sliding      # sliding (reset on write) or fixed (from first write)
```

After TTL expiry, session messages are deleted. Memories that were already promoted to long-term memory are not affected.

### Promotion

The promotion pipeline extracts content from session memory and writes it to long-term memory. It runs as a background job.

```yaml
memory:
  promotion:
    every_minutes: 5         # how often to run the promotion pipeline
    min_messages: 4          # minimum messages before extraction triggers
```

Promotion is idempotent — the same conversation will not produce duplicate memories because the deduplication pipeline runs as part of promotion.

### Forgetting

Long-term memories age and get removed if they are not accessed. This prevents the long-term store from growing unboundedly and keeps retrieved context relevant.

| Config key | Description | Default |
|---|---|---|
| `FORGETTING_ENABLED` | Whether forgetting is active at all | `true` |
| `FORGETTING_EVERY_MINUTES` | How often the forgetting job runs | `1440` (daily) |
| `FORGETTING_MAX_AGE_DAYS` | Maximum age of a memory regardless of access | `30` |
| `FORGETTING_BUDGET_KEEP_TOP_N` | For a given entity/session, keep at most this many memories | `100` |

```yaml
memory:
  forgetting:
    enabled: true
    every_minutes: 1440          # daily
    max_age_days: 30
    budget_keep_top_n: 100
```

**Tuning guidance:**
- Increase `max_age_days` for users who return infrequently (e.g., monthly support contacts)
- Decrease `budget_keep_top_n` for high-volume apps where you want to limit store size
- Set `enabled: false` if your use case requires permanent retention (compliance scenarios)

### Compaction

Compaction is a physical cleanup pass that removes forgotten and expired memories from the Redis store.

```yaml
memory:
  compaction:
    every_minutes: 60            # run compaction hourly
```

Increasing the interval reduces I/O at the cost of the store holding soft-deleted entries for longer.

---

## Store management

A store is a logical namespace for memory data. Stores let you isolate memory between applications, tenants, or environments without running separate RAM deployments.

Each store has:
- A unique `store_id`
- Its own isolated session and long-term memory data
- Its own set of agent keys (on-prem) or API keys (Cloud)
- Independent configuration (TTL, extraction strategy, etc.)

### Redis Cloud: store management

On Redis Cloud, stores are created and managed through the Redis Cloud console or the Cloud API. Each Agent Memory service automatically has a default store. Create additional stores for multi-tenant isolation.

### On-premises: Control Plane API

**Create a store**

```bash
curl -X POST http://controlplane:8080/v1/stores \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "customer-support-prod",
    "description": "Memory store for the customer support agent"
  }'
```

**List stores**

```bash
curl http://controlplane:8080/v1/stores \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Update a store**

```bash
curl -X PATCH http://controlplane:8080/v1/stores/store-7f3a92b1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'
```

**Delete a store**

```bash
curl -X DELETE http://controlplane:8080/v1/stores/store-7f3a92b1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Deleting a store removes all agent key grants for that store. It does not automatically delete the underlying memory data in Store Redis. Flush the Redis data separately if required.

### Multi-tenant patterns

**Pattern 1: One store per application**

```
Store: "customer-support-prod"   → customer support agent
Store: "onboarding-flow-prod"    → onboarding agent  
Store: "internal-helpdesk-dev"   → internal IT assistant (dev)
```

**Pattern 2: One store per customer tenant**

For SaaS platforms where each customer should be fully isolated:

```
Store: "tenant-acme-corp"        → ACME Corp's agent memory
Store: "tenant-globex"           → Globex's agent memory
Store: "tenant-initech"          → Initech's agent memory
```

**Pattern 3: Shared store with namespace isolation**

A single store, with session and memory scoping enforced by the `namespace` or `user_id` fields in the API. Use this when you want a single store for simplicity but still need per-user memory isolation.

---

## Authentication and authorization

### Overview

RAM uses a three-layer authorization model. Every request to the Data Plane is evaluated against all three layers:

```
Layer 1: Identity (who is this caller?)
    ↓
Layer 2: Store Grant (does this caller have access to this store?)
    ↓
Layer 3: Permission (does this caller have read and/or write permission?)
```

All three layers must pass. A valid identity with no store grant is rejected. A store grant without the right permission is rejected.

### Redis Cloud: API keys

On Redis Cloud, each service is accessed using an API key scoped to that service. Manage keys in the Redis Cloud console under **Agent Memory → API Keys**.

```bash
curl https://your-service.redis.io/v1/stores/$STORE_ID/session-memory/mysession001 \
  -H "Authorization: Bearer your-api-key"
```

### On-premises: two key types + optional OIDC

```
Control Plane  ←  Admin key     (operator access: store and key management)
Data Plane     ←  Agent key     (agent access: memory read/write)
Data Plane     ←  OIDC JWT      (optional: enterprise identity federation)
```

#### Admin key (Control Plane)

Platform operators use a static admin key to call the Control Plane API. This key never touches the Data Plane.

The admin key is sourced from a Kubernetes Secret mounted as a file. RAM reads it on each request, so rotating the Secret takes effect without a pod restart.

**Never distribute the admin key to AI agents or application services.**

#### Agent keys (`iris_` keys) — primary Data Plane credential

RAM-issued agent keys are the standard credential for AI agents and applications calling the Data Plane. They are:

- **Store-scoped** — each key is explicitly granted access to one or more stores
- **Permission-controlled** — read-only or read+write, per store
- **Mutable without reissue** — update grants without issuing a new key
- **Revocable instantly** — delete from Control Plane to block immediately
- **Rotation-safe** — new key can be issued and distributed before old key is revoked (make-before-break)

Agent keys look like: `iris_<keyId>.<secret>`

Use them via the `X-Api-Key` header:

```bash
curl http://dataplane:8081/v1/stores/$STORE_ID/session-memory/mysession001 \
  -H "X-Api-Key: iris_key-xyz789.SecretPartHere"
```

`X-Api-Key` takes precedence over `Authorization` if both are present.

### Agent key lifecycle

**Issue a key**

```bash
curl -X POST http://controlplane:8080/v1/api-keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent-key",
    "grants": [
      {"store_id": "store-abc123", "permissions": ["read", "write"]},
      {"store_id": "store-def456", "permissions": ["read"]}
    ]
  }'
```

The plaintext key is returned **once**. Store it in your secret manager immediately.

**Update grants (without reissuing)**

```bash
curl -X PATCH http://controlplane:8080/v1/api-keys/key-xyz789 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grants": [
      {"store_id": "store-abc123", "permissions": ["read"]}
    ]
  }'
```

The change takes effect on the next request — no redeployment of the agent needed.

**Rotate a key (make-before-break)**

```bash
# 1. Issue new key
curl -X POST http://controlplane:8080/v1/api-keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "my-agent-key-v2", "grants": [...]}'

# 2. Update your application to use the new key (deploy/update secret)

# 3. Revoke the old key after traffic has moved
curl -X DELETE http://controlplane:8080/v1/api-keys/old-key-id \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Both keys are valid during the overlap window. There is no downtime.

**Revoke a key**

```bash
curl -X DELETE http://controlplane:8080/v1/api-keys/key-xyz789 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Revocation is immediate. The next request using that key will receive `401 Unauthorized`.

### OIDC/JWT — optional enterprise path

If your organization requires agents to authenticate using your enterprise IdP (Okta, Entra ID, Keycloak, Auth0, Cognito, Dex), you can enable OIDC on the Data Plane in addition to agent keys.

```yaml
dataplane:
  auth:
    oidc:
      enabled: true
      issuer: "https://idp.example.com/oauth2/default"
      jwks_uri: "https://idp.example.com/oauth2/v1/keys"
      audience:
        - "api://redis-agent-memory"
      claims:
        store_id: "ram_store_id"    # JWT claim that maps to a store
        role: "ram_role"
    agent_keys:
      enabled: true                 # both can be active simultaneously
```

For OIDC callers, store authorization is determined by claims in the JWT. The `store_id` claim must match the store being accessed.

{{< note >}}
Setting `auth.enabled: true` is rejected at startup with a configuration error. On-prem deployments must use `auth.oidc` or agent keys.
{{< /note >}}

### HTTP response reference

| Status | Meaning | Common cause |
|---|---|---|
| `200 OK` | Request succeeded | — |
| `401 Unauthorized` | No valid credential | Missing or malformed token/key |
| `403 Forbidden` | Valid credential, insufficient authorization | Wrong store, missing permission, revoked key |
| `404 Not Found` | Store or resource does not exist | Wrong store ID |
| `503 Service Unavailable` | Data Plane cannot reach Metadata Redis | Infrastructure issue |

---

## Configuration reference

This section covers every configuration option for on-prem deployments. Redis Cloud configuration is managed through the console.

### Top-level structure

```yaml
global:
  licenseSecretName: ""

controlplane:
  adminTokenSecretName: ""
  metadata:
    redis:
      url: ""

dataplane:
  auth: {...}
  metadata: {...}
  memory: {...}
  llm: {...}
  worker: {...}
  logging: {...}
```

### Auth configuration

```yaml
dataplane:
  auth:
    enabled: false          # MUST be false on-prem; legacy auth not supported

    oidc:
      enabled: true
      issuer: ""
      jwks_uri: ""
      audience: []
      claims:
        store_id: ""
        role: ""

    agent_keys:
      enabled: true
```

### Memory configuration

```yaml
dataplane:
  memory:
    redis:
      url: ""
      pool_size: 20

    session:
      ttl_seconds: 86400
      ttl_policy: sliding   # sliding | fixed

    extraction:
      strategy: discrete    # discrete | summary | preferences | custom
      custom_prompt: ""
      every_minutes: 5
      min_messages: 4

    deduplication:
      semantic_threshold: 0.95
      llm_assisted: true

    forgetting:
      enabled: true
      every_minutes: 1440
      max_age_days: 30
      budget_keep_top_n: 100

    compaction:
      every_minutes: 60

    search:
      default_mode: hybrid  # semantic | keyword | hybrid
      top_k: 10
```

### LLM configuration

```yaml
dataplane:
  llm:
    embedding_model: "text-embedding-3-small"

    openai:
      api_key: ""
      base_url: ""          # override for Azure OpenAI or proxy

    azure_openai:
      api_key: ""
      endpoint: ""
      deployment_name: ""
      api_version: "2024-02-01"

    bedrock:
      region: ""
      model_id: ""

    vertex_ai:
      project: ""
      location: ""
      model: ""

    ollama:
      base_url: ""
      model: ""
```

### Environment variable overrides

All config values can be overridden with environment variables using the pattern `RAM_<SECTION>_<KEY>`:

| YAML path | Environment variable |
|---|---|
| `dataplane.auth.oidc.issuer` | `RAM_AUTH_OIDC_ISSUER` |
| `dataplane.memory.forgetting.max_age_days` | `RAM_MEMORY_FORGETTING_MAX_AGE_DAYS` |
| `dataplane.llm.openai.api_key` | `RAM_LLM_OPENAI_API_KEY` |

Environment variables take precedence over Helm values.

---

## Agent examples

{{< note >}}
There is currently no official Python SDK for the Agent Memory API. All examples use the REST API via `httpx`. The RAM API base URL and credentials differ by deployment:

- **Redis Cloud:** `https://your-service.redis.io`, credential via `Authorization: Bearer <api-key>`
- **On-Premises:** `http://dataplane:8081`, credential via `X-Api-Key: iris_<keyId>.<secret>`

All endpoints are scoped to a store: `/v1/stores/{storeId}/...`
{{< /note >}}

### Core concepts mapped to the API

| Concept | Endpoint |
|---|---|
| Add a conversation message | `POST /v1/stores/{storeId}/session-memory/events` |
| Get a session's messages | `GET /v1/stores/{storeId}/session-memory/{sessionId}` |
| Search long-term memory | `POST /v1/stores/{storeId}/long-term-memory/search` |
| Create long-term memories directly | `POST /v1/stores/{storeId}/long-term-memory` |
| Delete a session | `DELETE /v1/stores/{storeId}/session-memory/{sessionId}` |

### Example 1: Simple agent loop

A minimal agent that writes each exchange to session memory and searches long-term memory before responding.

```python
import httpx
import time
import uuid
from openai import OpenAI

BASE_URL = "https://your-service.redis.io"   # on-prem: http://dataplane:8081
STORE_ID = "your-store-id"
API_KEY  = "your-api-key"                    # on-prem: iris_keyId.secret

headers = {
    "Authorization": f"Bearer {API_KEY}",    # on-prem: use "X-Api-Key" instead
    "Content-Type": "application/json",
}

openai = OpenAI()


def add_event(session_id: str, role: str, text: str, actor_id: str = "assistant") -> dict:
    resp = httpx.post(
        f"{BASE_URL}/v1/stores/{STORE_ID}/session-memory/events",
        headers=headers,
        json={
            "sessionId": session_id,
            "actorId": actor_id,
            "role": role.upper(),
            "content": [{"text": text}],
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    )
    resp.raise_for_status()
    return resp.json()


def get_session(session_id: str) -> list[dict]:
    resp = httpx.get(
        f"{BASE_URL}/v1/stores/{STORE_ID}/session-memory/{session_id}",
        headers=headers,
    )
    resp.raise_for_status()
    return resp.json()["events"]


def search_long_term(query: str, owner_id: str, top_k: int = 5) -> list[dict]:
    resp = httpx.post(
        f"{BASE_URL}/v1/stores/{STORE_ID}/long-term-memory/search",
        headers=headers,
        json={
            "text": query,
            "filter": {"ownerId": {"eq": owner_id}},
            "limit": top_k,
        }
    )
    resp.raise_for_status()
    return resp.json()["items"]


def chat(user_message: str, session_id: str, owner_id: str) -> str:
    # owner_id is the actorId for user events and the ownerId filter for memory search —
    # they must match so retrieved memories align with what was stored.
    memories = search_long_term(user_message, owner_id)
    memory_context = "\n".join(m["text"] for m in memories)

    events = get_session(session_id)
    history = [
        {"role": e["role"].lower(), "content": e["content"][0]["text"]}
        for e in events[-10:]
    ]

    messages = [
        {"role": "system", "content": f"You are a helpful assistant.\n\nContext from memory:\n{memory_context}"}
    ] + history + [
        {"role": "user", "content": user_message}
    ]
    response = openai.chat.completions.create(model="gpt-4o", messages=messages)
    reply = response.choices[0].message.content

    add_event(session_id, "user", user_message, actor_id=owner_id)
    add_event(session_id, "assistant", reply)

    return reply


session_id = uuid.uuid4().hex
owner_id   = "user-alex"

print(chat("My name is Alex. I'm building a travel booking app.", session_id, owner_id))
print(chat("What are good tech stack options for it?", session_id, owner_id))
```

### Example 2: Create long-term memories directly

Use this to bulk-import knowledge or to manually store facts not captured from conversation.

```python
import httpx
import uuid

BASE_URL = "https://your-service.redis.io"
STORE_ID = "your-store-id"
API_KEY  = "your-api-key"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


def create_memories(owner_id: str, facts: list[str]) -> dict:
    memories = [
        {
            "id": uuid.uuid4().hex,
            "text": fact,
            "ownerId": owner_id,
            "memoryType": "semantic",
        }
        for fact in facts
    ]
    resp = httpx.post(
        f"{BASE_URL}/v1/stores/{STORE_ID}/long-term-memory",
        headers=headers,
        json={"memories": memories},
    )
    resp.raise_for_status()
    return resp.json()


result = create_memories("user-alex", [
    "Prefers Python and FastAPI for backend development",
    "Deploying on AWS us-east-1",
    "Has a team of 3 engineers",
])
print("Created:", result["created"])
```

### Example 3: Filtered long-term memory search

Search with filters to scope results to a specific user, namespace, or topic.

```python
resp = httpx.post(
    f"{BASE_URL}/v1/stores/{STORE_ID}/long-term-memory/search",
    headers=headers,
    json={
        "text": "cloud infrastructure preferences",
        "filter": {
            "ownerId":    {"eq": "user-alex"},
            "topics":     {"in": ["infrastructure", "cloud", "aws"]},
        },
        "filterOp": "all",    # "all" = AND (default), "any" = OR
        "limit": 10,
    }
)
items = resp.json()["items"]
for m in items:
    print(f"[{m['memoryType']}] {m['text']}")
```

### Example 4: Session summary

Set a session summary after long conversations to keep session memory compact.

```python
def set_summary(session_id: str, summary_text: str, up_to_event_id: str):
    resp = httpx.put(
        f"{BASE_URL}/v1/stores/{STORE_ID}/session-memory/{session_id}/summary",
        headers=headers,
        json={
            "text": summary_text,
            "summarizedUpToEventId": up_to_event_id,
        }
    )
    resp.raise_for_status()


set_summary(
    session_id="abc123",
    summary_text="User Alex discussed their travel booking app architecture. "
                 "Decided on FastAPI + React + AWS. Needs booking.com API integration.",
    up_to_event_id="eventid32charsalphanumeric0001",
)
```

### REST API quick reference

**Add a session event**

```bash
curl -X POST "$BASE_URL/v1/stores/$STORE_ID/session-memory/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "mysession001",
    "actorId":   "user-1",
    "role":      "USER",
    "content":   [{"text": "I prefer dark mode"}],
    "createdAt": "2026-06-23T10:00:00Z"
  }'
```

**Get session memory**

```bash
curl "$BASE_URL/v1/stores/$STORE_ID/session-memory/mysession001" \
  -H "Authorization: Bearer $API_KEY"
```

**Search long-term memory**

```bash
curl -X POST "$BASE_URL/v1/stores/$STORE_ID/long-term-memory/search" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text":   "UI preferences",
    "filter": {"ownerId": {"eq": "user-1"}},
    "limit":  5
  }'
```

**Create long-term memories**

```bash
curl -X POST "$BASE_URL/v1/stores/$STORE_ID/long-term-memory" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "memories": [
      {
        "id":         "mem001aaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "text":       "User prefers dark mode",
        "ownerId":    "user-1",
        "memoryType": "semantic"
      }
    ]
  }'
```

**Delete a session**

```bash
curl -X DELETE "$BASE_URL/v1/stores/$STORE_ID/session-memory/mysession001" \
  -H "Authorization: Bearer $API_KEY"
```
