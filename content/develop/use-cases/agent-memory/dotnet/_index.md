---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed agent memory layer in C# with NRedisStack, ONNX Runtime, and standard Redis commands — working memory in a Hash, long-term semantic recall as JSON with a vector index, and an event log in a Stream.
linkTitle: NRedisStack example (C#)
title: Redis agent memory with NRedisStack
weight: 3
---

This guide shows you how to build a small Redis-backed agent memory layer in C# (.NET 8) with [NRedisStack]({{< relref "/develop/clients/dotnet" >}}) and the ONNX Runtime, using only standard Redis commands — no agent-memory SDK, no managed service. It includes a local web server built with the .NET [`HttpListener`](https://learn.microsoft.com/en-us/dotnet/api/system.net.httplistener) so you can send turns at the agent, watch working memory update in place, see semantically similar long-term memories recalled in real time, watch the write-time deduplication skip near-duplicates, and inspect the per-thread event log.

The embedder runs the ONNX-exported [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2) model — the same encoder the [Python]({{< relref "/develop/use-cases/agent-memory/redis-py" >}}) and [Node.js]({{< relref "/develop/use-cases/agent-memory/nodejs" >}}) examples use. .NET ONNX Runtime is the same C++ kernel that powers Python's `onnxruntime`, so the vectors produced here are numerically identical to the Python ones to within rounding noise. The distance bands the Python walkthrough quotes carry over to this demo without recalibration, and a memory written by one demo can be recalled by the other against the same Redis instance.

## Overview

The memory layer splits across three Redis primitives, each handling one tier:

* **Working memory** for the active session is a [Hash]({{< relref "/develop/data-types/hashes" >}}) at `agent:session:<threadId>` holding the goal, scratchpad, a rolling window of recent turns (as a JSON list inside one field), and a few audit timestamps. One [`HGETALL`]({{< relref "/commands/hgetall" >}}) returns the whole session in a single round trip; every write refreshes the key's [`EXPIRE`]({{< relref "/commands/expire" >}}) so idle sessions decay on their own.
* **Long-term memory** is a set of [JSON]({{< relref "/develop/data-types/json" >}}) documents at `agent:mem:<id>`, each carrying the memory text, a 384-dimensional embedding vector, and tag fields for user, namespace, kind (episodic / semantic), and source thread. A single [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers the [HNSW vector field]({{< relref "/develop/ai/search-and-query/vectors" >}}) and every metadata field, so one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call performs the KNN with the metadata pre-filter in the same round trip. Write-time deduplication runs the same KNN at insert time and skips a new memory whose nearest existing entry is within a tighter threshold.
* **Event log** for the agent's actions and observations is a [Stream]({{< relref "/develop/data-types/streams" >}}) at `agent:events:<threadId>`, appended with [`XADD MAXLEN ~`]({{< relref "/commands/xadd" >}}) so retention stays bounded automatically, replayed with [`XREVRANGE`]({{< relref "/commands/xrevrange" >}}).

That gives you:

* A single round trip per tier: one [`HGETALL`]({{< relref "/commands/hgetall" >}}) for the session, one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) for recall, one [`XADD`]({{< relref "/commands/xadd" >}}) for the event log.
* Sub-millisecond reads on every step of the agent loop, so the memory layer doesn't dominate per-step latency.
* Per-tier decay: short TTLs on working memory, longer on episodic memories, no TTL on semantic memories. Combined with a database-level [eviction policy]({{< relref "/develop/reference/eviction" >}}) (LFU is the common choice), memory stays bounded under pressure.
* Scoping enforced inside the query: a recall query for `user=alice` will never see `user=bob`'s memories, because the TAG filter goes into the same [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call as the KNN.

## How it works

Each turn through the agent loop touches all three tiers in one pass: append to working memory, recall similar long-term memories, write the turn back as a new memory (with deduplication), and append one event to the log.

### Per-turn flow

1. The application calls `embedder.EncodeOne(text)` to turn the incoming turn into a 384-dimensional `float[]`.
2. `session.AppendTurn(threadId, role, content, user, agentName)` reads the per-thread Hash with [`HGETALL`]({{< relref "/commands/hgetall" >}}), appends the new turn to the rolling window in application code, trims it back to the configured maximum, and writes the Hash back with [`HSET`]({{< relref "/commands/hset" >}}) + [`EXPIRE`]({{< relref "/commands/expire" >}}) inside a [`MULTI/EXEC`]({{< relref "/commands/multi" >}}). The session TTL refreshes on every write so an active thread stays alive.
3. `memory.Recall(vec, user, @namespace, k: 5)` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a TAG pre-filter and a `KNN 5` clause. Redis returns the closest matching memories together with their cosine distances; memories beyond the recall threshold are dropped before they reach the agent so an unrelated query doesn't surface confident-looking false positives.
4. `memory.Remember(text, vec, user, @namespace, kind)` runs the same KNN with a tighter dedup threshold. If an existing memory is within the threshold, the new write is skipped and the existing memory's `hit_count` is incremented with [`JSON.NUMINCRBY`]({{< relref "/commands/json.numincrby" >}}); otherwise a fresh JSON document is written with [`JSON.SET`]({{< relref "/commands/json.set" >}}) and a per-kind [`EXPIRE`]({{< relref "/commands/expire" >}}) — `episodic` defaults to seven days, `semantic` has no TTL by default.
5. `events.Record(threadId, action, detail)` appends one entry to the per-thread Stream with [`XADD MAXLEN ~`]({{< relref "/commands/xadd" >}}), bounding retention to roughly a thousand entries per thread without an explicit cleanup job.

The embedding is computed once and reused for steps 3 and 4 — there's no point encoding the same text twice. Recall runs before the write, so the agent doesn't see its own just-written turn echoed back as a recalled memory.

## The session store

`AgentSession` wraps the working-memory Hash and the rolling turn window ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/agent-memory/dotnet/AgentSession.cs)):

```csharp
using StackExchange.Redis;
using AgentMemoryDemo;

var mux = ConnectionMultiplexer.Connect("localhost:6379");
var db = mux.GetDatabase();

var session = new AgentSession(
    db,
    keyPrefix: "agent:session:",
    defaultTtlSeconds: 3600,  // one hour
    maxTurns: 20);            // rolling window per thread

string threadId = session.NewThreadId();
session.Start(threadId, user: "alice", agentName: "demo-agent",
    goal: "Plan next week's meetings.");
session.AppendTurn(threadId, role: "user",
    content: "Schedule a budget review with finance.",
    user: "alice", agentName: "demo-agent");
SessionState? state = session.Load(threadId);
Console.WriteLine($"{state?.TurnCount} {state?.RecentTurns.Count} {state?.TtlSeconds}");
```

The data model is one Hash per thread. The rolling turn window is stored as a JSON string in a single field so the whole session loads in one [`HGETALL`]({{< relref "/commands/hgetall" >}}) — the hash never grows in size or field count as the conversation goes on.

```text
agent:session:9f3d2a4b8c61
  thread_id=9f3d2a4b8c61
  user=alice
  agent=demo-agent
  goal=Plan next week's meetings.
  scratchpad=Need to confirm finance's availability.
  turn_count=4
  created_ts=1715990400.12
  last_active_ts=1715990650.83
  recent_turns=[{"role":"user","content":"...","ts":...}, ...]
```

Every write — `Start`, `AppendTurn`, `SetGoal`, `SetScratchpad` — runs the [`HSET`]({{< relref "/commands/hset" >}}) and [`EXPIRE`]({{< relref "/commands/expire" >}}) inside a [`MULTI`]({{< relref "/commands/multi" >}}) / [`EXEC`]({{< relref "/commands/exec" >}}) (via NRedisStack's `CreateTransaction`) so a connection drop between the two writes can't leave the session without a TTL.

## The long-term memory store

`LongTermMemory` owns the JSON documents, the vector index, the recall query, and the write-time deduplication ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/agent-memory/dotnet/LongTermMemory.cs)):

```csharp
using AgentMemoryDemo;

var memory = new LongTermMemory(
    db,
    indexName: "agentmem:idx",
    keyPrefix: "agent:mem:",
    dedupThreshold: 0.20,    // cosine distance — tight at write time
    recallThreshold: 0.55);  // looser at read time
var embedder = await LocalEmbedder.CreateAsync();
memory.CreateIndex();  // idempotent

// Write a memory. The same KNN that powers recall also runs here at
// a tighter threshold so paraphrases of the same fact collapse.
float[] vec = embedder.EncodeOne("The user prefers light mode in editors.");
WriteResult result = memory.Remember(
    text: "The user prefers light mode in editors.",
    embedding: vec,
    user: "alice",
    @namespace: "default",
    kind: "semantic",
    sourceThread: "9f3d2a4b8c61");
Console.WriteLine($"deduped={result.Deduped} id={result.Id} dist={result.ExistingDistance}");

// Recall against a later question.
float[] q = embedder.EncodeOne("Which theme does this user like?");
var hits = memory.Recall(
    queryEmbedding: q,
    user: "alice",
    @namespace: "default",
    k: 5);
foreach (var h in hits)
{
    Console.WriteLine($"{h.Distance:F3} [{h.Kind}] {h.Text}");
}
```

### Data model

Each memory is a JSON document at `agent:mem:<id>`. The embedding is stored as a JSON array of floats so the document is human-readable from `redis-cli`; [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) still expects the *query* vector as raw `float32` bytes (packed by `LocalEmbedder.ToBytes` with explicit little-endian writes), regardless of how the indexed document stores it.

```json
agent:mem:7c3f8a1b9e02
{
  "id": "7c3f8a1b9e02",
  "user": "alice",
  "namespace": "default",
  "kind": "semantic",
  "source_thread": "9f3d2a4b8c61",
  "text": "The user prefers light mode in editors.",
  "embedding": [0.013, -0.041, ...],
  "created_ts": 1715990400.12,
  "hit_count": 0
}
```

The Redis Search index is declared on the JSON document type with alias names so the query syntax stays compact (`FieldName("$.user", "user")` writes `$.user AS user` into `FT.CREATE`):

```text
FT.CREATE agentmem:idx
  ON JSON PREFIX 1 agent:mem:
  SCHEMA
    $.text          AS text          TEXT
    $.user          AS user          TAG
    $.namespace     AS namespace     TAG
    $.kind          AS kind          TAG
    $.source_thread AS source_thread TAG
    $.created_ts    AS created_ts    NUMERIC SORTABLE
    $.hit_count     AS hit_count     NUMERIC SORTABLE
    $.embedding     AS embedding     VECTOR HNSW 6
                                       TYPE FLOAT32 DIM 384
                                       DISTANCE_METRIC COSINE
```

### The query

Both recall and dedup share the same hybrid query: a TAG pre-filter in parentheses followed by `=>[KNN k @embedding $vec]`. With `DIALECT 2`, Redis applies the filter first and KNN-ranks only the matching documents.

```text
FT.SEARCH agentmem:idx
  "(@user:{alice} @namespace:{default} @kind:{semantic})
     =>[KNN 5 @embedding $vec AS distance]"
  PARAMS 2 vec <384-float32-bytes>
  SORTBY distance
  RETURN 8 user namespace kind source_thread text created_ts hit_count distance
  DIALECT 2
```

`distance` is the cosine *distance* (0 means identical, 2 means opposite). Recall and dedup share the same query shape; only the threshold differs — strict at write time so the index doesn't fill with paraphrases of the same fact, looser at read time so the agent gets a wider net of relevant memories.

### Per-kind TTLs

`Remember` resolves the entry's TTL from the memory's `kind`:

| Kind      | Default TTL | When to use it                                              |
|-----------|-------------|-------------------------------------------------------------|
| `episodic` | 7 days     | Snapshots from a specific session that should decay.        |
| `semantic` | none       | Distilled facts and preferences the agent carries forward.  |

You can override per write with `ttlSeconds: ...` on `Remember`, or pass a different `ttlByKind: ...` map to the `LongTermMemory` constructor — for example, to give semantic memories a six-month TTL while leaving episodic memories at seven days.

## The event log

`AgentEventLog` is a thin wrapper over a per-thread Redis Stream ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/agent-memory/dotnet/AgentEventLog.cs)):

```csharp
var events = new AgentEventLog(db, maxLen: 1000);
events.Record(threadId, "turn_appended:user",
    "Schedule a budget review with finance.");
events.Record(threadId, "memory_written",
    "wrote 7c3f8a1b9e02 as semantic");

foreach (var e in events.Recent(threadId, count: 20))
{
    Console.WriteLine($"{e.Action} {e.Detail}");
}
```

`Record` calls [`XADD`]({{< relref "/commands/xadd" >}}) with `MAXLEN ~ 1000` (StackExchange.Redis's `useApproximateMaxLength: true`). The tilde lets Redis trim in whole-node units instead of exactly-N units, which is much cheaper at the cost of overshooting the bound by up to a node's worth — the right tradeoff for an audit log where exact length doesn't matter.

The Stream is independent of the session Hash and the long-term JSON documents: it answers "what just happened" without competing with either of those for indexing or memory budget. Consumer groups (not used in this demo) would let downstream workers — summarisers, consolidators, audit pipelines — replay the log without losing position.

## Concurrency caveats

The three helpers above trade correctness under heavy concurrency for clarity. Each is fine on a single-process demo, but lifting the code into a real multi-worker agent surfaces three races worth knowing about:

* **Working memory is read-modify-write.** `AgentSession.AppendTurn` calls [`HGETALL`]({{< relref "/commands/hgetall" >}}), mutates the `recent_turns` list in application code, and writes the Hash back with [`HSET`]({{< relref "/commands/hset" >}}). Two concurrent turns on the same thread can both read the same `recent_turns`, append different entries, and write back — last writer wins, the other turn is silently lost. The robust fix is either a [`WATCH`]({{< relref "/commands/watch" >}}) / [`MULTI`]({{< relref "/commands/multi" >}}) / [`EXEC`]({{< relref "/commands/exec" >}}) loop around the read-modify-write or a small [Lua script]({{< relref "/commands/eval" >}}) that does the append atomically server-side.

* **Long-term dedup is not atomic.** `LongTermMemory.Remember` runs a [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) KNN lookup, decides whether the candidate is a duplicate, and (if not) calls [`JSON.SET`]({{< relref "/commands/json.set" >}}). Two workers seeing the same fact in flight can each fail to see the other's not-yet-committed write and both insert a new memory. The pragmatic fix is to accept that the index will occasionally hold near-duplicates and run a background consolidator that periodically scans for memory pairs within a tight distance and merges them, rather than trying to make the write itself atomic.

* **The active thread is server state.** The demo server keeps a single `CurrentThreadId` that `/new_thread` and `/reset` mutate. `HandleTurn` reads it without coordination, so a turn racing with a thread rotation can apply to the previous thread. This is cosmetic for a one-user browser demo. A multi-user agent would carry the thread id on the request itself rather than as shared server state.

Those caveats are deliberate. A more conservative implementation would obscure the Redis-shaped parts of the pattern; the demo prioritises a small, readable code path that maps directly onto the commands in the prose above.

## Pre-seeding long-term memory

In a real deployment the memory store fills up organically as the agent reasons over user turns: each turn produces zero or more memories that flow into the store, with deduplication catching repeats. For the demo, `SeedMemory.cs` pre-loads a small set of mixed semantic and episodic memories so the very first recall query returns something useful ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/agent-memory/dotnet/SeedMemory.cs)):

```csharp
using AgentMemoryDemo;

var memory = new LongTermMemory(db);
var embedder = await LocalEmbedder.CreateAsync();
memory.CreateIndex();
SeedMemory.Seed(memory, embedder, user: "default", @namespace: "default");
```

The seed list mixes long-lived facts and preferences (`semantic`) with snapshots of past sessions (`episodic`), so the **Kind to write** control in the demo has something to switch between when a new turn is being remembered.

## The interactive demo

`Program.cs` runs a .NET [`HttpListener`](https://learn.microsoft.com/en-us/dotnet/api/system.net.httplistener) on port 8093, dispatching to handlers on the thread pool. The HTML page exposes three live panels — working memory, recalled memories, event log — plus a memories table for admin actions. Endpoints:

| Endpoint            | What it does                                                                    |
|---------------------|---------------------------------------------------------------------------------|
| `GET  /state`       | Index info, current session, in-scope long-term memories, and recent events.    |
| `POST /turn`        | Embed the text, append to working memory, recall similar memories, optionally write a new memory (with dedup), append an event. |
| `POST /new_thread`  | Start a fresh thread; long-term memory and other threads are untouched.         |
| `POST /reset`       | Drop every long-term memory and re-seed the sample set.                         |
| `POST /drop_memory` | Delete a single long-term memory by id.                                         |

The server holds one `LocalEmbedder`, one `AgentSession`, one `LongTermMemory`, and one `AgentEventLog` for the lifetime of the process. The "current thread" is a single property on the demo object that the **New thread** button rotates — every browser tab inherits the same thread until you explicitly start a new one.

## Run the demo locally

1.  Clone the [`redis/docs`](https://github.com/redis/docs) repository and change into the example
    directory:

    ```bash
    git clone https://github.com/redis/docs.git
    cd docs/content/develop/use-cases/agent-memory/dotnet
    ```

2.  Restore and build the project. You'll need the [.NET 8 SDK](https://dotnet.microsoft.com/download)
    or later:

    ```bash
    dotnet build
    ```

3.  Make sure a Redis instance with Redis Search and Redis JSON is running locally on
    port 6379. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}})
    ships both, or [Redis 8]({{< relref "/develop/ai/search-and-query" >}}) with the
    Search and JSON modules enabled.

4.  Start the demo. The first run downloads the
    [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2) ONNX
    weights (around 90 MB) and `vocab.txt` into a local `model_cache/` directory next
    to the binary:

    ```bash
    dotnet run
    ```

5.  Open <http://localhost:8093> and try some turns:

    *  **"Remind me which theme I prefer in editors."** — paraphrase of a seeded
       semantic memory ("The user dislikes dark mode and prefers a high-contrast
       light theme..."). You should see that memory recalled with a cosine
       distance around 0.47, comfortably under the 0.55 default recall
       threshold.
    *  **"What did we discuss about the order-routing outage?"** — paraphrase of
       a seeded episodic memory; the postmortem memory should recall around
       0.44. Switch the **Kind to write** dropdown to `skip` so the question
       itself doesn't enter long-term memory.
    *  **"I prefer concise answers without filler phrases."** — paraphrase of
       a seeded *semantic* memory. Switch the **Kind to write** dropdown to
       `semantic` so the dedup KNN runs in the same kind as the seed (dedup
       is scoped per kind, on purpose, so an episodic write can't collapse
       onto a semantic memory). You should then see the write **deduped**
       onto the existing memory at a cosine distance around 0.15, with
       `hit_count` ticking up in the memories table.
    *  **"My favorite color is teal."** — unrelated to any seed; nothing
       recalls above the threshold (every seed lands above 0.8), and the new
       memory is written as `episodic` (or `semantic`, depending on the
       dropdown) under a fresh id.
    *  Switch the **User** field to `bob` and re-ask any of the above — recall
       returns nothing because the seed memories live under `default`. That's
       the TAG pre-filter at work inside [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).
    *  Slide the **Recall threshold** down to 0.30 to see borderline paraphrases
       drop out of the recall set, then back up to 0.70 to watch them return.

    The .NET ONNX Runtime is the same C++ kernel that powers Python's
    `onnxruntime`, so distances here match the Python demo to four decimal
    places. `Xenova/all-MiniLM-L6-v2` puts a faithful paraphrase in the
    0.15 – 0.50 cosine-distance range, a loose paraphrase or related topic in
    the 0.50 – 0.80 range, and unrelated queries above 0.8 — which is what
    motivates the 0.55 default recall threshold and the 0.20 default dedup
    threshold. A stricter embedding model (or a domain-tuned one) would let
    you tighten both; a noisier one would push them up. The right thresholds
    are always a function of the model, the corpus, and how conservative the
    agent needs to be about accepting a memory as a match.

The server is read/write against your local Redis. The default memory index is `agentmem:idx`, JSON keys live under `agent:mem:`, session Hashes under `agent:session:`, and event Streams under `agent:events:`. Useful flags (pass them after `--`, e.g. `dotnet run -- --no-reset`):

* `--no-reset` — keep the existing long-term memories across restarts instead of dropping and re-seeding.
* `--session-ttl-seconds` — change the working-memory TTL (default 3600).
* `--dedup-threshold` — change the cosine-distance cutoff for write-time deduplication.
* `--recall-threshold` — change the default cosine-distance cutoff for recall.
