# Sub-agent report — required format

Every Phase 2 build sub-agent must return its result in this format. The synthesis phase (Phase 3 of [`SKILL.md`](../SKILL.md)) depends on these reports being structured and complete.

Copy this template into your final response and fill in every section. Terse responses ("done, it works") block synthesis and will be sent back.

---

## Report

### Status

One of:
- `success` — fully implemented, all smoke tests pass.
- `partial` — implemented but with a known limitation. Explain in **Deviations**.
- `blocked` — could not complete. Explain in **Blockers**.

### Client

`{{CLIENT}}` (one of: `nodejs`, `go`, `java-jedis`, `java-lettuce`, `dotnet`, `php`, `ruby`, `rust`).

### Files created

List every file you wrote, with absolute path:

```
- content/develop/use-cases/<use-case>/<client>/_index.md
- content/develop/use-cases/<use-case>/<client>/<helper file>
- ...
```

### Smoke-test results

Fill in real numbers from your test run. Anything missing here is a red flag.

| Test | Result |
|---|---|
| First read (cache miss) | `hit=false`, redis ~X ms, total ~Y ms |
| Second read (cache hit) | `hit=true`, redis ~X ms, total ~X ms |
| `POST /invalidate` | `deleted=true` |
| `POST /update` + reread | `hit=false`, record reflects update |
| **Stampede @ 20 concurrent → primary reads** | **X** (must be 1) |
| Stampede elapsed | ~X ms |
| `POST /reset` | counters zeroed |

### Assumptions made

Anything you decided without explicit instruction from the brief. One bullet per assumption.

Examples:
- "Assumed lock TTL of 2000ms matches the reference implementation."
- "Assumed the demo HTTP server should bind to 0.0.0.0 (parent agent's brief said 'localhost')."

### Deviations from the reference

Anywhere you knowingly diverged from the reference Python implementation, with a one-line rationale. One bullet per deviation.

Examples:
- "Used `ConnectionManager` instead of a raw `Connection` because it's the idiomatic shared-connection type in `redis-rs`."
- "Serialised WATCH/MULTI/EXEC behind a `ReentrantLock` because Lettuce's `StatefulRedisConnection` is single-connection and transactions are connection-scoped."

If you have zero deviations, write `None`.

### Language/library surprises

Things you learned about this client that the reference Python implementation didn't surface. These often turn into cross-client lessons during synthesis. Include surprises even if you worked around them.

Examples:
- ".NET's ThreadPool grows by ~2 threads/second, so synchronous polling under high concurrency starves and triggers fall-through to the loader. Worked around with `ThreadPool.SetMinThreads(64, 64)` but a production helper would be `async`."
- "PHP requests are stateless, so in-process stats counters can't work; moved to Redis-backed counters under `demo:cache_stats`."
- "Lettuce's `StatefulRedisConnection` is thread-safe for individual commands but transactions are connection-scoped, so concurrent transactions on one connection interleave."

If you have nothing to report here, you probably weren't looking hard enough. Re-read your implementation and find at least one. If genuinely nothing, write `None — implementation translated directly`.

### Spec or reference ambiguities encountered

Anywhere the brief or reference left you guessing. The synthesis phase fixes these for future use cases. One bullet per ambiguity.

Examples:
- "Brief said 'invalidate on update' but didn't specify whether `update` should also write to the cache (no — invalidate-only is safer and matches reference)."
- "Reference uses `hit_rate_pct` rounded to 1 decimal; I matched, but the rounding rule wasn't stated."

### Suggestions

Anything you'd change in the reference, the spec, or another client (you may not have seen others' code but you can guess at language-specific traps).

Examples:
- "The reference's `get_ttl` returns -2 for missing keys; for users this is more confusing than `None`. Worth wrapping at the helper level."
- "Suggest adding a `cache_negative` config flag — the not-found case currently re-hits the primary on every request."

If none, write `None`.

### Open questions for the orchestrator

Things you need a decision on before this implementation can be considered final.

Examples:
- "Should `update_field` refresh TTL or preserve remaining TTL? Reference refreshes; I matched."
- "Should the HTML page differ between clients beyond the pill text?"

If none, write `None`.

### Clean-up status

Confirm the working tree is clean after your tests:

- [ ] No compiled artefacts left (`*.class`, `bin/`, `obj/`, `target/release/`, `node_modules/`, `vendor/`).
- [ ] No demo server processes still running.
- [ ] No temp lock files in Redis (verified via `redis-cli KEYS 'lock:*'` returns empty).

If any of these are not done, explain why.
