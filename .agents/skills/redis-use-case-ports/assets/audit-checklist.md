# Audit checklist — known bug classes

Phase 4 of the [`redis-use-case-ports`](../SKILL.md) workflow runs one audit sub-agent per row in this checklist, each scanning all 9 client implementations for **that specific class**.

This file is a **living document**. Every time external review (Cursor bugbot, human code review, a bug filed by a user) catches a class of bug in one of these implementations, add a row. Future projects benefit automatically.

Each row has:

- **Class** — short name.
- **What to scan for** — the specific pattern to grep / read for.
- **Pass criterion** — what the right answer looks like.
- **Sample audit prompt** — copy-paste-able prompt for the audit sub-agent.
- **Why this is on the list** — provenance.

---

## 1. WATCH/MULTI/EXEC coverage when a connection is shared

**What to scan for:** every site that issues `MULTI`, `WATCH`, transaction-style command blocks, or `pipeline()` with `.atomic()` semantics.

**Pass criterion:** if the client uses a single shared connection across threads/tasks (e.g. Lettuce `StatefulRedisConnection`, redis-rs `ConnectionManager` without pooling), every transaction block must be serialised — either by an in-process lock, or by checking out a dedicated connection from a pool per transaction. If the client uses per-call connection acquisition (e.g. JedisPool, ConnectionMultiplexer), no extra lock is needed but the transaction must complete within a single acquired connection.

**Sample audit prompt:**

> Audit every WATCH/MULTI/EXEC and transactional pipeline site across all 9 client implementations under `content/develop/use-cases/{{USE_CASE_NAME}}/`. For each site, identify whether the connection is shared across concurrent callers. If shared, confirm the transaction is serialised. Flag any uncovered site with file path and line number. Read at least the helper file in each client directory.

**Why on list:** Cursor bugbot caught a missing `txLock` around `loadWithSingleFlight`'s repopulate `MULTI`/`EXEC` in the cache-aside Lettuce port. The `updateField` site had the lock; the repopulate site didn't. ([PR #3291 comment](https://github.com/redis/docs/pull/3291#discussion_r3209490076))

---

## 2. Deadline arithmetic overflow

**What to scan for:** any place a "deadline" or "until" value is computed by adding a duration to a monotonic clock. Especially `Environment.TickCount`, `os.clock()`, anything that returns 32-bit milliseconds.

**Pass criterion:** the clock used has a wrap interval much greater than the deadline window. For 32-bit millisecond counters (~24.9-day wrap), the deadline calculation must use a 64-bit clock variant (`Environment.TickCount64`, `time.monotonic_ns`, `System.nanoTime`, `Instant`).

**Sample audit prompt:**

> Audit every deadline or timeout calculation in the 9 client implementations under `content/develop/use-cases/{{USE_CASE_NAME}}/`. For each, identify the clock source and its wrap interval. Flag any case where the clock could wrap between `start + delta` and the loop comparison. Particularly check .NET (`TickCount` vs `TickCount64`), Java (`currentTimeMillis` vs `nanoTime`), Rust (`Instant`), Python (`time.monotonic`), Go (`time.Now`).

**Why on list:** Cursor bugbot caught `Environment.TickCount + _lockTtlMs` in the cache-aside .NET port — wraps to a negative value every 24.9 days, immediately exiting the poll loop and defeating stampede protection at the wraparound boundary. ([PR #3291 comment](https://github.com/redis/docs/pull/3291#discussion_r3209490088))

---

## 3. Lua single-flight lock release with caller token

**What to scan for:** the release script for the single-flight lock.

**Pass criterion:** the release script must check that the caller still owns the lock before deleting. The pattern is:

```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
```

A naked `DEL` without the token check is a bug: if the lock expired and was re-acquired by another caller, the original caller's unconditional `DEL` would release someone else's lock.

**Sample audit prompt:**

> Audit the Lua lock release path in every client implementation under `content/develop/use-cases/{{USE_CASE_NAME}}/`. Confirm each one checks the unique caller token before deleting. Flag any naked `DEL` of the lock key. Also confirm the token is unique per caller (not shared via a constant).

**Why on list:** Standard Redlock-style pattern. Easy to forget, especially when porting from a reference that has it.

---

## 4. ThreadPool / runtime ramp-up under synchronous polling

**What to scan for:** stampede polling loops that block on `Thread.Sleep`, `usleep`, `tokio::time::sleep`, etc., when the spawned tasks rely on an automatically-growing thread pool.

**Pass criterion:** either (a) the polling is async/non-blocking, (b) the runtime is pre-warmed (e.g. `ThreadPool.SetMinThreads`), or (c) the spawn count is bounded to fit within typical runtime defaults. A synchronous poll loop in a runtime with slow worker ramp-up will time out and trigger fall-through to the loader, breaking stampede protection.

**Sample audit prompt:**

> Audit how each client's stampede test spawns concurrent callers and whether the polling/wait path uses synchronous blocking. For runtimes with elastic thread pools (.NET, Java with `Executors.newCachedThreadPool`, Python with default `ThreadPoolExecutor`), confirm the spawn count is matched by an appropriately sized pool, OR the runtime has been pre-warmed. Flag any synchronous blocking poll loop running in a starved pool.

**Why on list:** .NET cache-aside port initially produced 2 primary reads instead of 1 for 25-concurrent stampede — the .NET ThreadPool was growing by ~2 threads/sec and the polling threads were starving. Fixed by `ThreadPool.SetMinThreads(64, 64)` at startup, documented in the production-usage section.

---

## 5. Stateless-runtime state assumptions

**What to scan for:** in-process state (counters, caches, primary record store) in any client whose runtime is request-per-process (PHP under `php -S`).

**Pass criterion:** state that must persist across requests lives outside the process (typically in Redis under a `demo:*` keyspace) for stateless runtimes.

**Sample audit prompt:**

> Identify which client implementations run under a stateless request-per-process model. For those, audit any in-process state (counters, primary record store) and confirm it lives in Redis or some other shared store. Flag any in-process state that wouldn't survive a request boundary.

**Why on list:** PHP cache-aside port — stats counters in process memory wouldn't survive across `php -S` requests; primary record updates wouldn't either. Resolved by storing everything in Redis under `demo:cache_stats` and `demo:primary:*`.

---

## 6. Stampede test concurrency vs lock TTL

**What to scan for:** the relationship between (a) the stampede test's concurrency limit, (b) the lock TTL, (c) the primary read latency.

**Pass criterion:** lock TTL > (primary read latency × safety margin). Concurrency × (poll interval + Redis RTT) << lock TTL, otherwise polling callers fall through. Document the math somewhere in the production-usage section.

**Sample audit prompt:**

> For each client implementation, identify the lock TTL, the primary read latency, the polling interval, and the maximum stampede concurrency the demo allows. Confirm the inequality: lock TTL > primary read latency × 2, and (concurrency × Redis RTT) << lock TTL. Flag any client where these don't hold.

**Why on list:** Multiple ports needed a higher lock TTL or smaller wait_poll_ms to keep all stampede callers within the polling window. Easy to break by changing one constant in isolation.

---

## 7. Negative-result caching policy

**What to scan for:** what the helper does when `loader()` returns null/None/nil for a non-existent key.

**Pass criterion:** behaviour is consistent across clients and documented. Either (a) don't cache the negative result (current default — but every probe re-hits primary), or (b) cache a short-TTL sentinel with explicit invalidation on creation. Whichever is chosen, all 9 clients must agree.

**Sample audit prompt:**

> For each client, identify the behaviour when `loader` returns a not-found result (`null`, `None`, `nil`, `Option::None`). Confirm all 9 clients have the same policy. Flag any inconsistency. Confirm the `_index.md` "Production usage" section discusses negative caching.

**Why on list:** Subtle inconsistency risk. Some ports might cache the empty hash, some might not — the reference's behaviour propagates by accident, not by spec.

---

## 8. Hit-rate calculation precision and integer-division bugs

**What to scan for:** the formula that produces `hit_rate_pct`.

**Pass criterion:** when `total == 0`, returns 0.0 without dividing by zero. Otherwise, returns a value rounded to 1 decimal place using consistent rounding (banker's rounding, round-half-up, etc. — pick one and use it everywhere). Beware integer-division bugs: `(100 * hits) / total` in a statically-typed language can truncate if `hits`/`total` are ints.

**Sample audit prompt:**

> Compare the `hit_rate_pct` calculation across all 9 client implementations. Run mental tests: total=0, total=3 hits=1, total=7 hits=1, total=10 hits=7. Confirm all 9 produce consistent output (within rounding-mode noise). Flag any zero-division risk or integer-truncation bug.

**Why on list:** Easy to get subtly wrong per language. The reference output is the test oracle.

---

## 9. Demo HTTP port conflicts

**What to scan for:** the default port used by the demo server.

**Pass criterion:** different clients use *different* default ports (or the same default and the user is expected to override). All clients accept `--port` (or equivalent flag/env var). No client hardcodes a port commonly held by other dev tooling (e.g. `8080` is fine, but check `8769` is not on macOS Okta's reserved list).

**Sample audit prompt:**

> List the default port used by each of the 9 demo servers and the flags they accept to override. Flag any client that uses an unusual default or doesn't accept an override.

**Why on list:** During parallel smoke-testing, a leftover demo server on a shared port can hijack subsequent test requests. Each agent should pick a unique port in their brief.

---

## 10. Compiled-artefact cleanup

**What to scan for:** working tree state after smoke-testing.

**Pass criterion:** the client directory contains source files + config files only. No `*.class`, `bin/`, `obj/`, `target/`, `node_modules/`, `vendor/`, `Cargo.lock` (unless committed), etc.

**Sample audit prompt:**

> For each client implementation, list every file in the directory and flag any compiled artefacts, dependency directories, or lock files that should be in `.gitignore`. Refer to the standard list in `.gitignore` (or build one).

**Why on list:** Easy to forget after a smoke-test pass. Multiple of the cache-aside ports left build output that had to be cleaned manually.

---

## 11. Token-checked atomic state transitions (multi-step state machines)

**What to scan for:** any helper that issues a state transition (e.g. `complete`, `fail`, `reclaim`) keyed on a per-claim or per-session token. The pattern involves: HGET the token, compare against the caller's token, then LREM/LPUSH/HSET/EXPIRE on multiple keys.

**Pass criterion:** the token check **and** the dependent multi-key writes must run inside a **single Lua script**, not split between client-side code and a follow-up pipeline. A client-side `HGET → if matches → MULTI/EXEC` pattern has a TOCTOU window: between the HGET and the EXEC, the reclaimer can move the job and a new worker can re-claim it, at which point the old worker's `LREM` removes the new claimant's processing entry and the `LPUSH` puts a duplicate ID into pending/completed/failed.

**Sample audit prompt:**

> Audit complete/fail/reclaim (or equivalent) in all 9 client implementations of `content/develop/use-cases/{{USE_CASE_NAME}}/`. For each, verify (a) the token check (`HGET claim_token` vs caller-token) happens **inside the same Lua script** as the LREM and the LPUSH, not in client code; (b) the script returns a non-success value when the token doesn't match; (c) the reclaim path **clears the token and resets the claim timestamp** atomically when it moves a job back to pending, otherwise a worker finishing its hang right after reclaim could still pass the token check on the next call. Flag any uncovered site.

**Why on list:** Job-queue use case, Phase 4 audit. Same shape as row 3 (single-flight lock with token) but generalised to multi-step state machines where the token guards a `LREM + HSET + LPUSH` sequence, not just a `DEL`.

---

## 12. Crash-window fallback timer on claimed-but-unwritten state

**What to scan for:** any helper where a worker `BLMOVE`s (or `BRPOPLPUSH`es) an ID from a pending list into a processing list, then **immediately afterward** writes `claimed_at_ms` / `claim_token` via a follow-up call. There is a small window (microseconds, but real) where the worker process can die between the move and the write, leaving the ID stranded in the processing list with no `claimed_at_ms` for the reclaim sweep to compare against.

**Pass criterion:** the reclaim script must include a fallback path that recovers the stranded job. The standard shape is: a job is stale if **either** `claimed_at_ms > 0 AND (now - claimed_at_ms) > visibility_ms` **or** `claimed_at_ms == 0 AND (now - enqueued_at_ms) > 2 × visibility_ms`. The fallback timer uses `enqueued_at_ms` (which was written by `enqueue()`) and a longer threshold (typically 2×) so it doesn't fire spuriously against a worker that's only milliseconds behind on writing its metadata.

**Sample audit prompt:**

> For each of the 9 client implementations in `content/develop/use-cases/{{USE_CASE_NAME}}/`, locate the reclaim Lua script. Confirm it handles the case where `claimed_at_ms` is missing or zero by falling back to `enqueued_at_ms` plus a longer threshold (typically `2 × visibility_ms`). Also confirm `enqueue()` writes `enqueued_at_ms` (so the fallback has something to compare against) and the reclaim path resets `claimed_at_ms` to 0 and clears `claim_token` when moving a job back to pending. Flag any port where the fallback is missing — those ports can lose work to a single kill-9.

**Why on list:** Job-queue use case, Phase 4 audit. The race window is tiny but real, and the fix is mechanical (a few extra Lua lines). Every job-queue-style use case ported in the future should preserve this pattern.

---

## 13. Shared-keyspace collision during parallel smoke tests

**What to scan for:** the helper's default key prefix (cache name, queue name, namespace). When Phase 2 fans out 8 sub-agents in parallel, each runs its own demo server against the same local Redis. If every demo uses the same default prefix (`cache:product:*`, `queue:jobs:*`, etc.), the agents stomp on each other's state and the smoke tests become unreliable.

**Pass criterion:** the helper is parameterised on a name/prefix argument, and the demo server exposes a `--queue-name` (or `--key-prefix`, `--cache-name`, etc.) flag / env var. Each Phase 2 agent uses a port-specific suffix during its smoke tests (e.g. `jobs-nodejs`, `jobs-go`) but the **default** in the shipping code remains unsuffixed so end-user docs and `redis-cli` examples are unchanged. The helper's `purge()` must scope its `SCAN MATCH` to `<prefix>:{name}:*` using the parameterised name, not a hard-coded constant.

**Sample audit prompt:**

> For each of the 9 client implementations of `content/develop/use-cases/{{USE_CASE_NAME}}/`, verify the helper accepts a name/prefix parameter and the demo server exposes a CLI flag to override the default. Confirm `purge()` (or equivalent reset path) uses `SCAN MATCH` against the parameterised prefix, not a hard-coded literal. Flag any port where the default is hard-coded all the way through, since that port can't run smoke tests safely alongside its siblings.

**Why on list:** Unanimous finding across all 8 sub-agent reports in the job-queue use case — every agent had to add their own queue-name flag mid-port to avoid colliding with the other 7 demos running against the same Redis. The brief should call this out from the start so it doesn't reappear.

---

## 14. Empty-fields `HSET` guard in change-event consumers

**What to scan for:** any code path that takes a "fields" payload from a change event / message / callback and forwards it to `HSET` (or the client-equivalent `hSet` / `hSetMultiple` / `HashSet` / `hMSet` / etc.). Typically this is a CDC consumer, sync worker, or write-through path.

**Pass criterion:** before the `HSET` call, the code explicitly guards against `fields` being null, missing, or empty, and returns early on the malformed case (or routes to a dead-letter, etc.). The guard must run before the pipeline / transaction is opened.

**Sample audit prompt:**

> Audit every code path in the 9 client implementations under `content/develop/use-cases/{{USE_CASE_NAME}}/` that forwards a fields payload from a change-event / callback / message to `HSET` (or the client equivalent). For each, confirm there is an explicit early-return guard for null / missing / empty fields **before** any pipeline or transaction is constructed. Flag any port without the guard with file path and line number.

**Why on list:** Every Redis client tested in the prefetch-cache use case raises or panics on `HSET` with an empty fields mapping: redis-py `DataError`, node-redis throws, Predis "wrong number of arguments", redis-rs **panics** on `pipe().hset_multiple(&key, &[])`, Jedis errors, go-redis errors. A defensive `|| {}` fallback that LOOKS like it handles the empty case is actually misleading — Cursor bugbot caught this on the reference implementation. ([PR #3317 comment](https://github.com/redis/docs/pull/3317))

---

## 15. TTL sentinel preservation across libraries

**What to scan for:** any `TTL` / `ttl_remaining` / `ttlRemaining` helper that wraps the client's TTL command. Particularly any code that converts the library's return type (often `time.Duration`, `TimeSpan?`, `Long`) into integer seconds.

**Pass criterion:** the helper returns **`-2`** for a missing key and **`-1`** for a key with no TTL, as integer seconds (or the language's native integer type). Libraries encode these sentinels inconsistently:

- **redis-py**: returns `int` directly with `-2` / `-1` preserved.
- **go-redis**: returns `time.Duration` with `-2` / `-1` as **raw nanoseconds** (not seconds-scaled). A naive `int(d.Seconds())` truncates to `0`.
- **StackExchange.Redis**: `KeyTimeToLive` returns `TimeSpan?` and collapses **both** missing-key and no-TTL into `null` — a null-coalesce loses the `-2` sentinel.
- **node-redis / Jedis / Lettuce / Predis / redis-rb**: return integer-typed seconds with `-2` / `-1` preserved.

The recommended cross-client idiom is to **bypass the library wrapper** and send the raw command (`client.Do(ctx, "TTL", key).Int64()` in Go, `IDatabase.Execute("TTL", key)` in .NET) so the integer reply comes through untouched.

**Sample audit prompt:**

> For each port's `TTLRemaining` (or equivalent) under `content/develop/use-cases/{{USE_CASE_NAME}}/`, confirm it returns `-2` for a missing key and `-1` for a key with no TTL. Test each by reading a non-existent ID and by running `PERSIST` on an existing cache key then reading it. Flag any port that returns `0`, `null`, or collapses the two sentinels into one value.

**Why on list:** Caught in the prefetch-cache cross-port audit. go-redis and StackExchange.Redis both shipped with subtle bugs in their TTL conversion that the audit caught. ([PR #3317 audit B](https://github.com/redis/docs/pull/3317))

---

## 16. Locked-emit ordering for producer/consumer queues

**What to scan for:** any mock primary store, in-memory writer, or producer that (a) mutates internal state under a lock and (b) appends a corresponding event to an out-of-process or out-of-thread queue/stream/channel. Typical methods: `add_record` / `update_field` / `delete_record`, `enqueue`, `publish_change`.

**Pass criterion:** the queue append happens **inside the same locked section** as the state mutation, not after it. Without this, two concurrent mutations can complete in one order but enqueue their events in the opposite order, and a downstream consumer applies them out of order — the cache ends up divergent from the source. For cross-process producers (PHP, etc.), the equivalent is wrapping the mutation + `LPUSH` in a Lua script so the server enforces ordering.

**Sample audit prompt:**

> Audit every mutation method in each port's mock primary store (or equivalent producer) under `content/develop/use-cases/{{USE_CASE_NAME}}/`. For each, confirm the change event is appended to the queue / stream / channel **while the mutation lock is still held** (or, for cross-process ports, wrapped in a Lua script that combines the record write and the LPUSH server-side). Flag any port where the emit happens after the lock release.

**Why on list:** Locked-emit ordering is what guarantees a CDC consumer can replay events deterministically. Caught and fixed in the prefetch-cache reference's `_emit_change_locked` pattern after Codex review; the prefetch-cache cross-port audit confirmed all 9 ports preserve the invariant, including PHP's Lua-script equivalent. ([PR #3317 audit C](https://github.com/redis/docs/pull/3317))

---

## How to add a new row

When a bug class is identified after this skill has been used:

1. Pick the next number.
2. Fill in **Class**, **What to scan for**, **Pass criterion**, **Sample audit prompt**, **Why on list**.
3. The "Why on list" entry should cite the source (PR comment URL, issue number, etc.) so future maintainers can verify the rule is still relevant.
4. Test the audit prompt by running it against a known-good codebase — it should produce 0 findings. A prompt that produces false positives is worse than no prompt.
