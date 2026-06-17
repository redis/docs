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

## 17. Subscribe-acknowledgement race in pub/sub-style helpers

**What to scan for:** the constructor or registration path of any subscriber object (pub/sub Subscription, message-listener, channel consumer). Specifically, the code path between "request the SUBSCRIBE / PSUBSCRIBE" and "return the Subscription handle to the caller".

**Pass criterion:** the helper must not return its Subscription until Redis has acknowledged the subscribe for every target. Synchronous-socket clients (redis-py's `PubSub.execute_command`, go-redis's `client.Subscribe`, Lettuce's `sync()`, StackExchange.Redis's `ISubscriber.Subscribe`) are safe by construction — the bytes are written and (for sync APIs) the ack is read before return. Helpers whose subscribe runs on a **spawned thread** (Jedis, redis-rb), a **spawned process** (PHP under `php -S`), or a **fire-and-forget async future** (Lettuce `async()`) need an **explicit handshake**: a `CountDownLatch` decremented by `onSubscribe`/`onPSubscribe`, a `Queue` latch populated by `on.subscribe`/`on.psubscribe`, a NUMSUB/NUMPAT-delta wait, or an awaited future. Without the handshake, a `PUBLISH` issued immediately after a successful subscribe response can race ahead of the SUBSCRIBE on the wire and the first message is silently dropped.

**Sample audit prompt:**

> Audit every Subscription / subscriber constructor in the 9 client implementations under `content/develop/use-cases/{{USE_CASE_NAME}}/`. For each, trace the path from "request SUBSCRIBE" to "return the handle to the caller". Classify each as (a) synchronous send + synchronous ack — safe, (b) synchronous send only (ack read later by dispatch) — safe iff Redis processes commands in receive order, (c) fire-and-forget async — racy, (d) spawned thread/process — racy unless an explicit handshake is wired up. For (c) and (d), confirm the handshake exists and is awaited before return. Flag any helper that returns the Subscription before the SUBSCRIBE has been acknowledged for every target. Read the helper file in every client.

**Why on list:** Pub/sub use case, Codex independent review. Lettuce `async().subscribe(...)` discarded its `RedisFuture`. Jedis spawned a thread that called the blocking subscribe but the parent didn't wait. PHP spawned a worker process and the parent kept polling NUMPAT after a 2-second timeout but silently fell through on failure. All three shipped clean Phase 4 audit passes because the audit prompt looked for the *existence* of a handshake without verifying it was *awaited*. Future Phase 4 prompts must adversarially verify the wait is reachable on every code path.

---

## 18. Concurrent-name reservation race in async helpers

**What to scan for:** any helper that does "check map for duplicate → release lock → do async work → acquire lock → insert". This shape is common in Rust (`std::sync::Mutex` is `!Send`, so can't be held across `await`) and any async language where the check and the insert are bracketed by an `await` that releases the lock implicitly.

**Pass criterion:** the name (or other unique key) must be **atomically reserved** at the duplicate-check step, before any await. Two patterns are acceptable: (a) a separate `pending: Mutex<HashSet>` set that's locked alongside the live map at the check, holds the name during the async work, and is cleared in both success and error paths; (b) insert a sentinel/placeholder into the live map before awaiting, replace with the real value on success or remove on failure. A pure "re-check on insert and bail if someone else got there first" pattern silently leaks the loser's now-orphaned async work, so it's not enough.

**Sample audit prompt:**

> For each helper in the 9 client implementations of `content/develop/use-cases/{{USE_CASE_NAME}}/` that does "name uniqueness check → async work → insert into a registry", verify the name is atomically reserved before the async portion. Flag any helper that releases its registry lock between the check and the insert without reserving the name (placeholder, pending-set, or equivalent). Two concurrent callers with the same name must produce one success and one error, never two successes that overwrite each other.

**Why on list:** Pub/sub use case, Codex independent review. Rust's `register()` locked the subscriptions HashMap, checked for the name, released the lock, ran `pubsub.subscribe(...).await`, re-acquired the lock, and called `subs.insert(...)` unconditionally. Two concurrent same-name registrations both passed the check, both subscribed live, and the second `insert` overwrote the first — leaking a live Subscription whose handle was unreachable and whose task could not be stopped via the registry.

---

## 19. Detached-worker PID capture

**What to scan for:** in any port that spawns subscriber/worker processes from a request handler (typically PHP under `php -S`, but any helper that uses `proc_open`, `subprocess.Popen`, `child_process.spawn`, `posix_spawn`, etc.), how is the worker's PID recorded? Look for `proc_get_status()['pid']` after `proc_open([...])`, or `pid` properties on subprocess handles.

**Pass criterion:** the recorded PID must be the **worker's** PID, not a wrapper's. Specifically: `proc_open(['setsid', '-f', ...])` returns the `setsid` wrapper's PID; `setsid -f` forks, the child execs the worker, the wrapper exits, and the recorded PID is now dead. Any later `posix_kill($recordedPid, ...)` is a no-op (or worse, kills an unrelated process if the PID has been reused). The right pattern is a shell wrapper that backgrounds the worker and echoes its real PID via `& echo $!`, captured from `proc_open`'s stdout pipe — works the same on Linux and macOS. If process-group detachment is required, put `setsid` (no `-f`) *inside* the shell wrapper so it exec-replaces in-place and the PID is preserved.

**Sample audit prompt:**

> For every port in `content/develop/use-cases/{{USE_CASE_NAME}}/` that spawns external worker processes, trace how the worker's PID is recorded. Confirm the recorded PID corresponds to the actual long-running worker, not a short-lived wrapper (`setsid -f`, `nohup` forking into background, daemon-style double-fork). Cross-check by running the demo, recording state.pid, and running `ps -p $pid` — they must match. Flag any port where the recorded PID is a wrapper.

**Why on list:** Pub/sub use case, Codex independent review. The PHP port shipped with a `PHP_OS_FAMILY === 'Darwin'` shell-wrapper branch that correctly captured the worker PID, and a Linux branch using `proc_open(['setsid', '-f', ...])` that captured the (already-dead) setsid wrapper PID. Smoke tests ran on macOS so the Linux bug never surfaced. Future ports that use platform-specific worker-spawn paths must verify both branches end up with a usable worker PID.

---

## 20. Silent timeout fallthrough in readiness waits

**What to scan for:** functions named `waitFor*`, `pollUntil*`, `awaitReady`, etc. that loop with a deadline. Especially ones that return `void` / `None` / `()` instead of a status.

**Pass criterion:** if the wait deadline expires without the readiness condition becoming true, the function must surface the failure — either via a return value (`bool`, `Result`, exception) or by propagating an error to the caller. A function that silently returns on timeout has reintroduced the exact race the wait exists to close. The caller must check the return and react (typically: tear down the partial state and propagate the failure).

**Sample audit prompt:**

> For each helper in `content/develop/use-cases/{{USE_CASE_NAME}}/` that contains a deadline-bounded polling loop (looking for `while < deadline`, `loop { tokio::select! { ... timeout ... } }`, `Thread.sleep` inside an `until`, etc.), confirm the function communicates whether the condition was met or the deadline expired. Flag any function whose timeout path is "fall through anyway", "let the caller find out later", or similar wording. Cross-check the call sites — even a function that returns a status is broken if the caller ignores it.

**Why on list:** Pub/sub use case, Codex independent review. PHP's `waitForSubscription()` had an explicit `// Fall through anyway — the worker may still be coming up` comment after its 2-second deadline. The caller didn't check, so a `subscribe()` that never got Redis to acknowledge the PSUBSCRIBE would still register the (dead) subscription in the demo's state, and the very first publish that followed would silently miss the subscriber. The whole point of the wait is to close that race; silently returning defeats it.

---

## 21. Pub/sub introspection commands are server-wide

**What to scan for:** any test or smoke-test step that asserts an **absolute** value of `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, or `PUBSUB NUMPAT`. Especially common in pub/sub-style use cases.

**Pass criterion:** smoke tests against a Redis instance that **might** be shared (Phase 2 parallel runs, dev boxes with prior sessions still holding pubsub clients, CI runners with multiple use cases sharing one Redis) must compare a **delta from a pre-test snapshot**, not an absolute count. Channel-name prefixing (`smoke-{client}:test`) helps for `PUBSUB CHANNELS` but doesn't help for `PUBSUB NUMPAT` — that's a single global counter that includes every pattern subscriber from every connected client. A prior session's `psubscribe` to `*` will keep NUMPAT ≥ 1 indefinitely (until the TCP connection is reaped by Redis's idle timeout).

**Sample audit prompt:**

> For each smoke-test step in the brief and in the per-client `_index.md` files of `content/develop/use-cases/{{USE_CASE_NAME}}/`, identify every assertion against `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, or `PUBSUB NUMPAT`. Confirm the assertion is delta-based (or uses `>= n` with `n ≥ 1` to allow for sibling pollution). Flag any test that expects an exact absolute value of these counters. Also confirm the test-setup hygiene includes a way to identify stale pubsub clients from prior sessions (`redis-cli client list type pubsub`), even if not a way to forcibly clear them.

**Why on list:** Pub/sub use case, surfaced repeatedly during Phase 2 sub-agent reports. Multiple agents had to switch from "expect NUMPAT == 1" to "expect NUMPAT ≥ 1" after sibling agents on the same Redis added their own pattern subscribers. During Phase 5 retrofit smoke-testing, a stale `python3 demo_server.py` from earlier in the session was holding `notifications:*` pattern open, polluting NUMPAT and triggering the PHP auto-seed timeout. The class of issue is permanent in pub/sub: NUMPAT/CHANNELS/NUMSUB are global by Redis design and tests must reflect that.

---

## 22. Typed `XAUTOCLAIM` wrappers that silently drop the deleted-IDs slot

**What to scan for:** any helper that calls the client library's typed `xautoclaim` / `XAutoClaim` / `StreamAutoClaim` wrapper. Look at the return-type binding: does it expose a third slot (deleted IDs / `deleted_messages` / `deletedIds`) alongside the next-cursor and claimed-messages?

**Pass criterion:** the helper must surface the third slot of the Redis 7+ `XAUTOCLAIM` reply (the IDs whose stream payload was trimmed out before the claim ran). The reference helper's API is `(claimed, deleted_ids)` — and the caller is expected to log/route the deleted IDs to a dead-letter store. If the client library's typed wrapper hides the third slot (extremely common), the helper must drop to a raw-command path (`client.Do("XAUTOCLAIM", ...)`, `Jedis.sendCommand(XAUTOCLAIM, ...)`, `connection.dispatch(CommandType.XAUTOCLAIM, NestedMultiOutput, ...)`, `redis.call('XAUTOCLAIM', ...)`, `redis::cmd("XAUTOCLAIM").query_async(...)`) and parse the three-element reply by hand. **A wrapper that returns `(cursor, messages)` only — with no compile-time hint that a third slot exists — silently makes the dead-letter path invisible.**

**Sample audit prompt:**

> Audit every `XAUTOCLAIM` call site across the 9 client implementations under `content/develop/use-cases/{{USE_CASE_NAME}}/`. For each, identify whether the helper goes through the client library's typed wrapper or through a raw command. For the typed wrappers, verify against the library's documentation or source whether the wrapper surfaces all three reply elements (next-cursor, claimed-messages, deleted-IDs). Flag any helper that uses a typed wrapper whose return type omits the deleted-IDs slot — that helper has silently lost the dead-letter signalling path. Cross-check the helper's `_index.md` "Production usage" prose to confirm the deleted-IDs handling is documented for the reader.

**Why on list:** Streaming use case, Phase 2 cross-port finding. Confirmed in **five** independent ports:

- **go-redis v9.18.0** — `client.XAutoClaim(...)` and `XAutoClaimJustID(...)` both parse the reply and call `rd.DiscardNext()` on the third element. Workaround: `client.Do(ctx, "XAUTOCLAIM", ...)` with manual parsing.
- **Jedis 5.0.1 and 6.2.0** — `xautoclaim(...)` returns `Map.Entry<StreamEntryID, List<StreamEntry>>` (only 2 slots). Workaround: `Jedis.sendCommand(STREAM_AUTOCLAIM, ...)` with manual decode.
- **Lettuce 6.5.0** — `RedisCommands.xautoclaim(...)` returns `ClaimedMessages<K,V>` exposing only the cursor and claimed messages. Workaround: `connection.dispatch(CommandType.XAUTOCLAIM, new NestedMultiOutput<>(...), args)`.
- **redis-rb 5.x** — typed `redis.xautoclaim` is decoded via the generic `HashifyStreamAutoclaim` proc, which drops the third element. Workaround: `redis.call('XAUTOCLAIM', ...)` with manual parsing.
- **redis-rs 0.24** — no typed `xautoclaim` wrapper exists at all, so the helper must use `redis::cmd("XAUTOCLAIM").arg(...).query_async()` directly.

This is the most common class of finding in streaming-style ports. The reference's `(claimed, deleted_ids)` API surface assumed wrappers preserve all three reply elements; they don't. Every future port must verify whether its library's typed wrapper has caught up before relying on it.

---

## 23. Handover-then-delete safety on consumer removal

**What to scan for:** any helper / demo path that removes a consumer from a consumer group. Look for the sequence (a) handover the consumer's pending entries to a peer, then (b) `XGROUP DELCONSUMER`. The handover is typically a per-consumer `XPENDING ... CONSUMER` walk plus `XCLAIM` at `MIN-IDLE-TIME 0`.

**Pass criterion:** the `XGROUP DELCONSUMER` call must run **only after the handover has provably succeeded**. Specifically:

- Every error from the handover path (`XPENDING` failure, `XCLAIM` failure, partial-batch break, deadline timeout, etc.) must abort the removal. Do not log-and-continue.
- The handover must verify the source consumer's PEL is empty before deletion, OR the caller must surface the partial-handover failure so the user can retry.
- The registry-removal step (popping from the in-process workers map) must happen **after** the destructive `DELCONSUMER`, not before — otherwise a thrown exception between map-pop and DELCONSUMER leaves a half-removed worker.

A naked `try { handover() } catch { ignore } finally { delete_consumer() }` is the **wrong shape**. `XGROUP DELCONSUMER` destroys the PEL of the deleted consumer — any entries the handover failed to move are unreachable by `XAUTOCLAIM` afterwards. The destruction is silent: no error, no log on the Redis side, no count of lost messages.

**Sample audit prompt:**

> Audit every consumer-removal path in the 9 client implementations under `content/develop/use-cases/{{USE_CASE_NAME}}/`. For each port's `remove_worker` (or equivalent) helper, trace the error-handling boundary between the `handover_pending` (or equivalent) call and the `XGROUP DELCONSUMER` call. Flag any port where: (a) handover errors are silently swallowed before delete fires; (b) the in-process registry entry is removed before delete fires (so a thrown exception between the two leaves a half-removed worker); (c) a partial-handover return value is accepted without verifying the source consumer's PEL is empty. Cross-check the demo's HTTP `/remove-worker` handler — if it returns 200 on a failed handover, the bug is user-visible.

**Why on list:** Streaming use case, Phase 4b Codex independent review. Targeted Phase 4 audits cleared `remove_worker` paths in `rust`, `go`, `nodejs`, and `dotnet`; Codex's fresh-context review then found that all four shipped variants of the same pattern:

- **rust** ([`demo_server.rs:154-160`](../../../content/develop/use-cases/streaming/rust/demo_server.rs)) — `handover_pending(...).await.unwrap_or(0)` swallows errors, then `delete_consumer` runs unconditionally. `event_stream.rs:367-376` discards `XCLAIM` failures as an empty claim list.
- **go** ([`demo_server.go:187-193`](../../../content/develop/use-cases/streaming/go/demo_server.go)) — `HandoverPending` correctly returns errors, but the caller logs them and continues to `DeleteConsumer`.
- **nodejs** ([`demoServer.js:635-649`](../../../content/develop/use-cases/streaming/nodejs/demoServer.js)) — `handoverPending` breaks and returns a partial count on `xPendingRange` or `xClaim` errors (`eventStream.js:365-399`). `removeWorker` then deletes regardless.
- **dotnet** ([`Program.cs:429-433`](../../../content/develop/use-cases/streaming/dotnet/Program.cs)) — `HandoverPending` catches `RedisServerException` and breaks early (`EventStream.cs:321-333`), returning whatever count it has. The caller stops the worker and deletes the consumer; if `StreamClaim` threw, the worker is already gone from `_workers` before `DELCONSUMER` runs.

The reference (`redis-py/demo_server.py:590-598` + `event_stream.py:263-274`) aborts on handover errors before `delete_consumer` is reached, but the reference's `handover_pending` raises rather than returning partial counts — so the safe pattern is implicit and easy to miss when porting to languages where errors are returned values.

---

## 24. Vector dimension mismatch in client-side blend / arithmetic helpers

**What to scan for:** any helper that iterates one vector and indexes another (`for i in query: mixed[i] = a*query[i] + b*session[i]`, `for i in prev: mixed[i] = α*next[i] + (1-α)*prev[i]`, or the equivalent in any language). Typical sites: `blendVectors(query, session, weight)`, `ewmaBlend(prev, next, alpha)`, dot-product / cosine helpers.

**Pass criterion:** dim mismatch is caught and handled before the arithmetic. Two defensive layers, mirroring the Python reference:

1. **At the read boundary.** When the helper reads a stored vector from Redis (e.g. the session vector in a user features hash), it validates the byte length against the index's configured `vector_dim` and drops the vector if it doesn't match. A stale session that doesn't match the current model is treated as "no signal" — same outcome as an empty session.
2. **At the arithmetic boundary.** The blend / EWMA helpers themselves check `len(a) == len(b)` at entry and return the longer/safer input unchanged on mismatch, rather than indexing out of range.

A pure "validate at read" defense is not enough — callers can wire their own session sources (mocks in tests, externally-provided session vectors from another service) and bypass the read path. A pure "validate in the blend" defense is not enough either — silently treating a stale session as "no signal" is the right user-facing behaviour for a model change, which the read-boundary check delivers; the blend-boundary check is just the safety net.

**Sample audit prompt:**

> For each port under `content/develop/use-cases/{{USE_CASE_NAME}}/`, locate any function that takes two vectors and combines them element-wise (typically `blendVectors`, `ewmaBlend`, dot-product helpers). For each, verify (a) the function checks the two inputs are the same length before indexing, and (b) the path that loads stored vectors from Redis validates their length against the configured `vector_dim` and discards mismatched ones at the boundary. Flag any helper where a stale session vector from a previous model could panic / throw / produce a silently-wrong result.

**Why on list:** Recommendation-engine use case, Cursor bugbot. Go's `blendVectors` and `ewmaBlend` panicked on length mismatch; .NET's `BlendVectors` / `EwmaBlend` threw `IndexOutOfRangeException`. The Python reference handled it correctly because `_bytes_to_vec` validates length at the read boundary, but neither the Go nor .NET subagent translated that defense across — the bug only triggers when an operator regenerates the catalog with a different-dim model and restarts with `--no-reset`, leaving stale session vectors at the old dim. ([PR #3331](https://github.com/redis/docs/pull/3331))

---

## 25. L2 normalisation silently skipped in embedding wrappers

**What to scan for:** the embedding helper in any port that wraps a library claiming to produce normalised vectors. Look at the call site (e.g. `pipeline('embeddings', model)` with a `normalize: true` kwarg, or `model.encode(text, normalize_embeddings=True)`) and confirm the output is actually unit-norm.

**Pass criterion:** every stored vector and every query-time vector has L2 norm `≈ 1.0`. Verify with a one-liner:

```python
import redis, struct, math
r = redis.Redis(decode_responses=False)
v = r.hget('product:p001', 'embedding')
arr = struct.unpack(f'<{len(v)//4}f', v)
print(math.sqrt(sum(x*x for x in arr)))  # expect ≈ 1.0
```

If the embedder ships unnormalised vectors, the Redis Search cosine-distance index still works correctly (Redis normalises internally for cosine), but **any client-side arithmetic that blends a stored vector with a freshly-computed query vector under-weights the stored side** — because the stored side has higher magnitude. Symptoms: session blending appears to do almost nothing; EWMA averaging produces unexpected magnitudes. The bug is silent — search rankings look plausible, just not as session-influenced as the spec promises.

The fix is an explicit L2-normalise in the wrapper's encode path, regardless of what the library claims. Treat the library's "normalised" kwarg as untrusted.

**Sample audit prompt:**

> For each port under `content/develop/use-cases/{{USE_CASE_NAME}}/`, locate the embedding wrapper (typically `Embedder`, `LocalEmbedder`, `embeddings.X`). After the catalog is built, run the verification one-liner — read the first product's stored embedding, unpack it as `<dim>` little-endian float32s, compute the L2 norm, confirm it's between 0.99 and 1.01. Flag any port where the norm is significantly off; the wrapper needs an explicit normalise step regardless of what the library's `normalize: true` flag suggests.

**Why on list:** Recommendation-engine use case, surfaced during smoke testing. The PHP port's `Embedder` passed `normalize: true` to TransformersPHP's `pipeline()`, but unwrapping `$result[0]` returned the un-normalised inner array — vectors stored at norm ≈ 3.23. The bug was invisible in pure-KNN search (Redis normalises for cosine) and only became visible when session-blended search produced a markedly weaker signal than the other 7 ports. Fixed by adding an explicit `l2Normalise()` in the wrapper's encode path. ([PR #3331](https://github.com/redis/docs/pull/3331))

---

## 26. TAG escape character set must include the backslash itself

**What to scan for:** the helper's TAG-value escape function (typically `escapeTagValue`, `_escape_tag_value`, `EscapeTagValue`). Look at the character set being escaped — usually defined as a constant set or string like `",.<>{}[]\"':;!@#$%^&*()-+=~| "`.

**Pass criterion:** the **backslash character itself** must be in the escape set, in addition to the brace, brace-closing, pipe, dash, etc. The standard set is:

```
\,.<>{}[]"':;!@#$%^&*()-+=~| <space>
```

Without the backslash in the set, a TAG value containing `\` (e.g. a category like `c\d` or a brand with a Windows-style path) gets passed through unescaped. The `\` then "eats" the next character's escape — e.g. `\}` becomes a literal close-brace escape inside the `{...}` block, leaving the TAG block parser confused and the FT.SEARCH parser unable to close the predicate.

**Sample audit prompt:**

> For each port's TAG escape function under `content/develop/use-cases/{{USE_CASE_NAME}}/`, list every character in the escape set. Confirm the backslash `\` is one of them. Test the function with these inputs and verify the output (and the resulting `@tag:{...}` clause) parses without errors against Redis: `\` (single backslash), `\\}` (backslash + brace), `a-b c` (hyphen + space), `foo|bar` (pipe), `foo}bar` (brace). Flag any port that omits the backslash from the escape set.

**Why on list:** Recommendation-engine use case, Cursor bugbot caught it on the reference Python implementation. The original `_TAG_SPECIAL` set included braces, brackets, pipes, and operators but not the backslash itself. The fix is a one-character addition to the set; if you don't catch it in the reference before fanning out, all 8 ports inherit the bug. ([PR #3331 bugbot](https://github.com/redis/docs/pull/3331))

---

## 27. Connection-wide state toggle race on a shared client

**What to scan for:** any helper that toggles a connection-level setting around a batch of writes — `setAutoFlushCommands(false) / flushCommands() / setAutoFlushCommands(true)` (Lettuce), `pipeline.multi() / pipeline.exec()` on a shared connection without a per-call lease (Lettuce / redis-rs without pool), or any analogous "set option, do work, restore option" pattern.

**Pass criterion:** either (a) the connection is acquired per call from a pool (no shared state to race on), (b) the toggle is replaced with a primitive that doesn't share state with concurrent callers (sync API, Lua script, dedicated connection), or (c) the toggle is serialised with a lock that blocks every other caller on the same connection for the duration of the batch — and the lock's existence is documented in the production-usage section so users know to switch to a pool in production.

A common foot-gun is "auto-flush off → queue commands → flush → auto-flush on" wrapped in a `try/finally` on a shared connection. The auto-flush flag is per-connection, not per-call. Two concurrent handlers can interleave: handler A turns auto-flush off, handler B's commands queue up under A's flag, A flushes, A's `finally` restores auto-flush on, B's queued commands have already been flushed by A's flush, B's `finally` turns auto-flush on again (no-op) — the visible behaviour might still pass smoke tests because Redis processes commands in order, but B's commands have lost their batching guarantees, and any subtle dependency on flush ordering breaks under load.

**Sample audit prompt:**

> For each port under `content/develop/use-cases/{{USE_CASE_NAME}}/`, scan for any place that toggles a connection-level setting around a batched write (`setAutoFlushCommands`, manual flush, etc.). For each site, confirm one of: (1) it runs on a per-call leased connection from a pool, (2) it's wrapped in a lock that serialises concurrent callers on that connection, or (3) it's been replaced with a primitive that doesn't share connection state. Flag any toggle on a shared connection that isn't serialised, particularly anything in `recordClick`, `enqueue`, `publish` — endpoints that an HTTP server might fan out across thread-pool workers.

**Why on list:** Recommendation-engine use case, Codex independent review. Lettuce's `Recommender.recordClick` toggled `setAutoFlushCommands(false)` on a `StatefulRedisConnection` shared across the demo's 16-thread HTTP executor. Under concurrent load, threads could observe each other's flag flips and produce non-deterministic flush behaviour. Fixed by replacing the four batched async writes with four sequential `sync()` calls — sub-millisecond locally, eliminates the shared state. ([PR #3331](https://github.com/redis/docs/pull/3331))

---

## 28. Weight / threshold of zero must disable, not normalise to default

**What to scan for:** any helper that accepts a "weight", "threshold", "alpha", or similar tuning parameter, and clamps it. Look for `if weight <= 0: weight = default` or `weight = max(weight, 0.15)` at the top of the function.

**Pass criterion:** zero (and negative) values must be honoured as "disable this contribution" — the documented escape hatch — not silently coerced up to the default. The pattern is:

```python
if not affinities or affinity_weight <= 0:
    return sorted(candidates, key=lambda c: c.score)
```

Not:

```python
if affinity_weight <= 0:
    affinity_weight = 0.15  # WRONG — caller cannot disable
```

The first form lets a caller pass `0` to bypass the bonus entirely (and a downstream test can pass `weight=0` to assert "rerank not applied"). The second form makes the API silently uncallable in disabled-mode — the caller is forced to either accept the default or skip the call. Plus it lies about the API: the parameter name says "weight" but the value is being treated as "magic non-default-must-be-positive".

**Sample audit prompt:**

> For each helper under `content/develop/use-cases/{{USE_CASE_NAME}}/` that accepts a tuning weight, threshold, or alpha parameter, confirm that passing `0` or a negative value disables the contribution rather than being silently rewritten to the default. Read the helper's docstring to see whether "disable via zero" is the documented behaviour — if so, the implementation must honour it. Flag any port where `weight <= 0` is clamped up to a non-zero default.

**Why on list:** Recommendation-engine use case, Codex independent review. Rust's `rerank`, Jedis's `rerank`, and Lettuce's `rerank` all rewrote `affinity_weight <= 0` to `0.15` at the top of the function, even though the Python reference treated `<= 0` as the disable case. Three of the eight subagent ports independently introduced the same regression — strongly suggests this is a default reach in many typed-language idioms (Java/Rust/Kotlin) that's easy to drop without thinking.

---

## 29. Embedder Predictor / Session is not always thread-safe on a shared instance

**What to scan for:** the embedding wrapper's `encodeOne` / `encode_many` / `EncodeInternal` methods, and how the wrapper is reached from the HTTP handler. Particularly look at the handler executor (cached thread pool, `Executors.newCachedThreadPool`, async runtime with multiple workers, `HttpListener` callback) — does the wrapper hold any mutable state across calls, and is the underlying library documented as thread-safe?

**Pass criterion:** the embedder is either (a) documented as thread-safe and used without synchronisation (e.g. ONNX Runtime's `InferenceSession`), (b) documented as not-thread-safe and the wrapper serialises every call (e.g. DJL `Predictor` wrapped in `synchronized` methods), or (c) the handler dispatcher is single-threaded so concurrency never arises. The wrapper's code or docstring should state which case applies so the reader doesn't have to derive it.

This is **distinct from row 1** (which is about Redis connections and `MULTI/EXEC` interleaving). Row 1 is about transaction state on a shared Redis connection; this row is about model-inference state on a shared ML client.

**Sample audit prompt:**

> For each port under `content/develop/use-cases/{{USE_CASE_NAME}}/`, locate the embedding wrapper and the HTTP server's request executor. For each port, classify (a) thread-safe library with no app-level locking needed, (b) not-thread-safe library with explicit serialisation in the wrapper, or (c) single-threaded dispatcher so the question doesn't arise. Cite the line numbers. Flag any port where the wrapper shares mutable state across calls and the handler executor is multi-threaded but no synchronisation is in place. Verify by reading the library's docs / source for the underlying `Predictor` / `Pipeline` / `Session` type's thread-safety contract — don't trust the agent's choice without a citation.

**Why on list:** Semantic-cache use case. The Jedis port shipped with a DJL `Predictor` shared across an `Executors.newCachedThreadPool` HTTP server, no synchronisation — Codex caught it. Jedis's `LocalEmbedder` was fixed by marking `encodeOne` / `encodeMany` `synchronized`. The Lettuce port (built after the Jedis lesson) included the synchronization from the start. The .NET port correctly uses an `InferenceSession` without locking because ONNX Runtime documents `Run` as thread-safe; the docstring calls that contract out so the reader knows why no lock is present. ([PR #3354 Codex review])

---

## 30. Library config keys that look real but don't take effect

**What to scan for:** any place the demo configures a server-side limit (body size cap, connection timeout, max request bytes, max headers, etc.) by passing a named option to a library constructor. Check the **library's documented option names** — not what looks like it should work.

**Pass criterion:** every limit the demo *advertises* in prose is actually enforced. The way to verify is to test the limit — send a request that should be rejected, confirm the response shape — not just look at the code. If the library doesn't expose the limit you need, the demo enforces the limit explicitly in user code (e.g. read at most N bytes, then check) and the prose accurately describes that path.

**Sample audit prompt:**

> For each port under `content/develop/use-cases/{{USE_CASE_NAME}}/`, identify every server-side limit the demo claims to enforce (POST body size, request timeout, connection cap, etc.). For each one, find the line of code that's supposed to enforce it. Then verify the option name against the library's current documentation (e.g. WEBrick's actual config keys, `com.sun.net.httpserver` knobs, `http.Server` fields, Express middleware names). Flag any limit whose enforcement relies on an option name the library doesn't recognise — those are silent no-ops.

**Why on list:** Semantic-cache use case. The Ruby port passed `MaxRequestBodySize: MAX_BODY_BYTES` to `WEBrick::HTTPServer.new` — but `MaxRequestBodySize` is not a valid WEBrick option. The handler's `req.body` then read whatever the client sent. Codex flagged it ("the body cap is effectively a no-op") and the fix was an explicit `body_too_large?` check that examines `Content-Length` before reading the body. The class of bug is broader: any library configuration knob that's accepted as a keyword arg or property setter without validation can silently be ignored.

---

## 31. Lockfile pins a newer runtime than the manifest declares

**What to scan for:** the manifest's declared minimum runtime version (PHP `^8.2` in `composer.json`, Ruby `>= 3.0` in `Gemfile`, Rust `rust-version = "1.74"` in `Cargo.toml`, Node `engines.node` in `package.json`) versus the actual transitive dependency requirements in the lockfile (`composer.lock`, `Gemfile.lock`, `Cargo.lock`, `package-lock.json`).

**Pass criterion:** either (a) the lockfile resolves transitively to versions compatible with the manifest's declared minimum, or (b) the manifest declares the higher minimum that the lockfile actually requires. A common form of this bug: a transitive dependency bumps its own minimum-version requirement; lock resolution picks up the new transitive; the lockfile now demands a higher runtime than the manifest advertises, and `composer install` / `bundle install` fails for users on the declared minimum.

For PHP specifically, the fix is to add `"platform": {"php": "8.2.0"}` (or whichever minimum) under `composer.json`'s `config` block — this pins Composer to resolve transitives compatible with that version. Other ecosystems have equivalents (Bundler's `ruby` directive in `Gemfile`, Cargo's `rust-version`, npm's `engines` enforcement via `engine-strict`).

**Sample audit prompt:**

> For each port that ships a lockfile under `content/develop/use-cases/{{USE_CASE_NAME}}/`, identify the manifest's declared minimum runtime version. Then grep the lockfile for transitive dependencies that declare their own minimum (`"php": ">=X"`, `required_ruby_version`, `rust-version`, etc.). Confirm the highest transitive minimum is ≤ the manifest's declared minimum. Flag any port where the lockfile demands a higher runtime than the manifest — that port's `*install` step fails for users on the documented minimum.

**Why on list:** Semantic-cache use case. The PHP port's `composer.json` declared `"php": "^8.2"` while `composer.lock` resolved `symfony/string` v8.0.x, which requires `php >= 8.4`. Users on PHP 8.2 or 8.3 hit `composer install` failures. Fixed by adding `"platform": {"php": "8.2.0"}` to `composer.json`. Caught by Codex review. ([PR #3354])

---

## 32. NaN / Inf parsing via language-specific quirks

**What to scan for:** every place a floating-point parameter is parsed from user-controlled input (CLI flag, environment variable, HTTP form field, JSON body). Look at the parsing function (`float()`, `parseFloat()`, `strconv.ParseFloat`, `(float)$x`, `Float()`, etc.).

**Pass criterion:** strings like `"nan"`, `"inf"`, `"+infinity"`, `"-inf"` must not produce a value that bypasses downstream comparisons. The cross-language quirks:

- **Python** `float("nan")` → actual NaN (IEEE-754); `is_finite` catches it.
- **JavaScript** `parseFloat("nan")` → NaN; `Number.isFinite` catches it.
- **Go** `strconv.ParseFloat("nan", 64)` → NaN; `math.IsNaN` catches it.
- **PHP** `(float)"nan"` returns `0.0`, **not** NaN. `is_finite(0.0)` is true. The textual NaN reaches downstream code as `0.0` and silently corrupts any comparison.
- **Rust** `"nan".parse::<f64>()` → `Ok(NaN)`; `is_finite` catches it.
- **Java** `Double.parseDouble("NaN")` → actual NaN; `Double.isFinite` catches it.
- **C#** `double.Parse("NaN", CultureInfo.InvariantCulture)` → NaN; `double.IsFinite` catches it.

The robust pattern is **textual rejection before parsing**: lowercase the input, check membership in the set `{"nan", "inf", "infinity", "+inf", "-inf", "+infinity", "-infinity"}`, and only then call the language-native parser. The Python reference does this; the textual-rejection branch is what the PHP port needed and what Codex flagged when the env-var path bypassed it.

**Sample audit prompt:**

> For each port under `content/develop/use-cases/{{USE_CASE_NAME}}/`, locate every place a floating-point parameter is parsed from external input (CLI flag, env var, HTTP form field). For each parser, mentally run it against the inputs `"nan"`, `"inf"`, `"-inf"`, `"infinity"`, `"junk"`. Confirm each input is rejected (falls back to default, returns error, or clamps out of the meaningful range). Pay special attention to PHP's `(float)` cast and any other language where the implicit cast silently returns `0.0` on garbage input. Flag any path that admits a non-finite value to a downstream comparison.

**Why on list:** Semantic-cache use case. PHP's `load_config()` parsed `SEMCACHE_THRESHOLD` with a bare `(float)` cast — `(float)"nan"` returned `0.0` silently, the `is_finite` check immediately downstream passed, and the cache's default threshold landed at `0.0`. Every paraphrase lookup became a miss. Codex flagged it; the fix was to route the env-var value through the same `clamp_threshold` helper the HTTP boundary already used (which textually rejects "nan" / "inf" before parsing). ([PR #3354 Codex review])

---

## 33. Per-language strings in HTML that's shared across language demos

**What to scan for:** in any use case that copies the same `index.html` across all language demos verbatim (the standard pattern in `redis-use-case-ports`), audit the HTML for **hardcoded language-specific strings**: stack badge text (`"redis-py + sentence-transformers + ..."`), default values that the server should be authoritative on (default threshold, default port displayed in copy), code-block snippets that reference one language's syntax.

**Pass criterion:** every per-language string in the shared HTML is populated at request time via `/state` (or equivalent boot-up handshake) rather than baked into the HTML literal. The handshake returns enough info that the JS can render: a `stack_label` string, a `default_threshold` number, any per-language config the badge / lede / placeholders need. The HTML opens with placeholder content (`"loading…"`) and the first call to `/state` overwrites it.

**Sample audit prompt:**

> For each port under `content/develop/use-cases/{{USE_CASE_NAME}}/`, diff `index.html` against the reference's `index.html` byte-for-byte. They should be identical. Then audit the reference's `index.html` for any string that names a specific language, library, model, or config default — those are exactly the strings that need to be populated from `/state` at runtime, not baked into the HTML. Flag any hardcoded per-language string in the reference HTML. Then verify the server's `/state` response includes the field the HTML reads, and that the JS sets the value on first render (typically inside a `refreshState` or equivalent on page load).

**Why on list:** Semantic-cache use case. Codex caught a hardcoded `"redis-py + sentence-transformers + Python standard library HTTP server"` badge in the Node.js port's `index.html` — the agent had copied the reference HTML verbatim and the badge was telling Node.js users they were running Python. The fix was to add `stack_label` and `default_threshold` to `/state` and have the JS render both on first load. Same fix propagated to all 7 sibling demos. ([PR #3354 Codex review])

---

## 34. Docs wire-form snippets must show escaped TAG values

**What to scan for:** every code block in the use case's `_index.md` that shows a literal `FT.SEARCH` (or `FT.AGGREGATE`) query string with a TAG predicate (`@tenant:{...}`, `@category:{...}`, `@brand:{...}`). Check whether the TAG value contains any character that Redis Search treats as TAG-value syntax: `.` `-` `,` `<` `>` `{` `}` `[` `]` `"` `'` `:` `;` `!` `@` `#` `$` `%` `^` `&` `*` `(` `)` `+` `=` `~` `|` space, backslash.

**Pass criterion:** TAG values that contain any of those characters are shown **escaped** with a leading backslash on each special character. Wire-form blocks (in `text` code fences) show single backslashes (`gpt\-4\.5\-2026`); in-language source blocks (where the demo code is shown verbatim) show the right number of backslashes for that language's string-literal escape rules (double backslashes inside double-quoted Go / Java / Rust / C# strings; single backslashes inside PHP / Ruby single-quoted strings; etc.). Either way, the snippet a reader could paste into `redis-cli` works.

**Sample audit prompt:**

> For each `_index.md` under `content/develop/use-cases/{{USE_CASE_NAME}}/`, find every code block that contains a `FT.SEARCH` or `FT.AGGREGATE` query string with a `@<field>:{<value>}` TAG predicate. For each value, identify whether it contains any TAG-syntax character (`.`, `-`, `,`, `:`, `@`, `#`, `$`, space, backslash, etc.). Confirm those characters are backslash-escaped in the snippet at the right level for the code fence's surrounding context (single backslashes in `text` fences; whatever the language requires in source-code fences). Flag any snippet that shows an unescaped special character in a TAG value — that snippet would parse as multiple tokens if a reader pasted it into `redis-cli`.

**Why on list:** Semantic-cache use case. Codex caught `@model_version:{gpt-4.5-2026}` in the .NET `_index.md` — the unescaped hyphens and dot mean a parser would see three tokens (`gpt`, `4`, `5-2026`) rather than one. The same defect was present in all 8 sibling `_index.md` files (inherited from the Python reference). A reader pasting the snippet into `redis-cli` would get a confused response and not know the docs were wrong. ([PR #3354 Codex review])

---

## 35. HEXPIRE / HTTL per-field reply-code checking

**What to scan for:** every call site of `HEXPIRE`, `HEXPIREAT`, `HPEXPIRE`, `HPEXPIREAT`, `HTTL`, `HPTTL`, or any client-library typed wrapper around them. Look at how the per-field array reply is consumed.

**Pass criterion:** `HEXPIRE`-family commands return one status code per requested field, not a single success/failure. Each code is:

* `1` — TTL set / updated.
* `2` — the expiry was `0` or in the past, so Redis deleted the field instead of attaching a TTL.
* `0` — an `NX | XX | GT | LT` conditional flag was specified and not met.
* `-2` — no such field, or no such key.

The helper must **iterate the reply array and raise/throw on any code other than `1`** (when no conditional flag is in use), so the "every streaming write renews its TTL" invariant fails loudly rather than silently leaving a field with no expiry attached. A naked `await client.hexpire(...)` (or `pipe.hexpire(...)` whose result is discarded) is the wrong shape — the call can "succeed" at the RESP level and still have left every field un-TTL'd.

`HTTL` returns the same array shape (per-field integer seconds, with `-2` for missing fields and `-1` for fields with no TTL). When the key is missing entirely, some libraries return a list-of-`-2` of the right length, others return `nil` / `None` / `null`. The helper must normalise to a per-field array of integers, defaulting missing/short replies to `-2` so callers never index out of range.

**Sample audit prompt:**

> For each port under `content/develop/use-cases/{{USE_CASE_NAME}}/`, locate every `HEXPIRE` (or family) call site and every `HTTL` call site. For HEXPIRE: confirm the helper iterates the per-field array and raises / throws on any code other than `1` (or documents why a specific non-`1` code is acceptable). A discarded reply or a check that only looks at the first element is a bug. For HTTL: confirm the helper normalises the reply to a per-field array even when the key is missing, with `-2` as the default for missing slots. Flag any port where a partial or `null` reply could cause an index-out-of-range error, a silent loss of the dead-letter signal, or a per-field TTL that never actually got set.

**Why on list:** Feature-store use case, Codex independent review. The Python reference originally awaited `hexpire(...)` and discarded the per-field reply; for the streaming-feature-store pattern to work, every streaming write **must** renew the per-field TTL on every call. A single code of `2` (which means "Redis deleted the field because the expiry was already in the past") looks like success but is actually data loss. The defensive shim for HTTL was needed because redis-rs's typed wrapper, redis-rb's `call`-style return, and several of the pipelined clients all surface partial / `nil` arrays differently when the key has expired between the caller's check and the HTTL itself.

---

## 36. Pause-and-wait-idle race in worker-thread reset paths

**What to scan for:** every worker-thread tick loop that supports `pause()` plus an external `reset` / `clear` / `purge` path. Look at where the in-flight flag (`tick_in_flight`, `_tickInFlight`, `Volatile.Read(ref _tickInFlight)`, etc.) is set relative to the `paused` check inside the tick loop.

**Pass criterion:** the in-flight flag must be set to `true` (or `1`) **before** the pause check, with a `finally` / `defer` / `ensure` block clearing it on every exit path. The combination lets an external caller do:

```
worker.pause()           # stop future ticks
worker.wait_for_idle()   # wait for the current tick to drain
store.reset()            # safe to delete keys now
worker.resume()
```

If the in-flight flag is set **inside** the `if not paused: ...` branch, there is a window between the pause check and the actual tick where a concurrent `pause()` + `wait_for_idle()` observes `tick_in_flight=false` AND `paused=true`, falls straight through, and runs the `DEL` sweep while the tick is mid-write. The streaming write then recreates a hash entry that was just enumerated for deletion — leaving a streaming-only hash with no key-level TTL. Symptom: "0 leftover keys" smoke test fails sporadically, often only under load.

The lifecycle flags (`running`, `tick_in_flight`) must be cleared in an **outer** `try/finally` / `defer` (around the whole tick loop, not just one iteration) so a thread that exits via an uncaught exception or a panic leaves the worker in a state where `start()` can spin a fresh thread. Without the outer clear, the demo's "is the worker running?" indicator gets stuck on, and a subsequent `start()` becomes a no-op.

**Sample audit prompt:**

> Audit every worker-thread tick loop in the 9 client implementations under `content/develop/use-cases/{{USE_CASE_NAME}}/`. For each, verify (a) the in-flight flag is set to true BEFORE the `paused` check, not inside the `not paused` branch; (b) a finally / defer / ensure clears the in-flight flag on every exit path including the paused-and-skipped path; (c) an outer try/finally around the whole tick loop clears both `running` and the in-flight flag so a panic / uncaught exception doesn't strand the lifecycle state. Run a quick stress test: 5x `reset` + `bulk-load` against an active streaming worker; the final keyspace must contain 0 leftover streaming-only hashes. Flag any port where (a), (b), or (c) is missing — those ports can produce ghost entries under concurrent reset.

**Why on list:** Feature-store use case. Codex flagged the bug first on the Go port; once articulated, the same shape needed fixing in 7 of the 8 sibling ports (only Node.js's single-threaded event loop was immune). The reference Python implementation **shipped without the fix** — Codex caught it on a later client, and Python was retrofitted to match (the in-flight `threading.Event`, the pre-flight set, and the `wait_for_idle()` recovery now match the other 8 ports). Future Phase 1 reference implementations of streaming-worker-style use cases must adopt the pattern from the start.

---

## 37. Worker stop with bounded join + silent thread abandonment

**What to scan for:** every `stop()` / `Stop()` / `StopAsync()` / shutdown method on a worker that owns a thread, task, or goroutine. Look at how the parent waits for the worker to exit.

**Pass criterion:** if the wait is bounded (`thread.join(timeout=2.0)`, `worker.join(2000)`, `task.Wait(2000)`, etc.), the timeout-expired path must escalate, not silently move on. Acceptable shapes:

* **Warn + indefinite wait.** Log a warning and call `thread.join()` (no timeout) so the parent at least observes that the stop took longer than the budget but never returns while the thread is still alive. This is the right shape for demos and well-behaved workers.
* **Force-interrupt + wait.** Cancel the task's cancellation token, send `Thread.interrupt()`, send `SIGTERM`, etc., and only then return. The right shape for production code where the worker might be stuck in a blocking I/O call.
* **Recovery via the in-flight flag.** Pair the bounded join with a `waitForIdle()` (polling the in-flight flag) that runs after the join. The in-flight flag's lifecycle (per row 36) is the eventual truth — even if the thread is still alive, once `tick_in_flight=false` the worker is safe to operate on. This is how Jedis and Lettuce ship in the feature-store ports.

A bare `thread.join(timeout=N); self._thread = None` (drop the handle, move on) is the wrong shape. The thread is still running, holding a Redis connection, potentially writing during the next bulk-load. The demo "works" because Python daemon threads die when the process exits — but `stop()` was supposed to be a clean shutdown, and silently abandoning the thread defeats every test that relies on it.

**Sample audit prompt:**

> For each port under `content/develop/use-cases/{{USE_CASE_NAME}}/`, locate the worker's stop / shutdown method. If it uses a bounded join / wait (any timeout, any unit), verify one of these three recovery paths is present: (a) on timeout, log a warning and join indefinitely; (b) on timeout, force-interrupt the worker and then wait; (c) on timeout, fall through to a `waitForIdle()` (or equivalent in-flight-flag poll) that provides the actual safety guarantee. Flag any port where the timeout path is "set the handle to null and return" — that's silent thread abandonment, regardless of how the demo behaves under normal load.

**Why on list:** Feature-store use case, Codex independent review of the Ruby port. The same shape was already in the Python reference (`thread.join(timeout=2.0)` then `self._thread = None`) but no earlier audit flagged it; Codex caught it on Ruby and the Python retrofit followed. Jedis / Lettuce had the bounded join but were saved by an explicit `waitForIdle()` after it — that's recovery shape (c) above, and it's the reason the bug never surfaced in those clients. Go / .NET / Rust / Node.js / PHP all use unbounded waits and are fine. The bug class is real even when masked by the in-flight-flag recovery; future ports should pick one shape and apply it consistently.

---

## How to add a new row

When a bug class is identified after this skill has been used:

1. Pick the next number.
2. Fill in **Class**, **What to scan for**, **Pass criterion**, **Sample audit prompt**, **Why on list**.
3. The "Why on list" entry should cite the source (PR comment URL, issue number, etc.) so future maintainers can verify the rule is still relevant.
4. Test the audit prompt by running it against a known-good codebase — it should produce 0 findings. A prompt that produces false positives is worse than no prompt.
