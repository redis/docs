# Parallel build agent brief — template

Copy this template, fill in the `{{PLACEHOLDERS}}`, and pass the result to one sub-agent per target client in Phase 2 of the [`redis-use-case-ports`](../SKILL.md) workflow.

Each sub-agent runs in isolation and produces one client implementation. Send all sub-agent invocations in a **single message** so they run concurrently.

---

## Brief

You are implementing the **`{{CLIENT}}`** client port of the **`{{USE_CASE_NAME}}`** Redis use case for the [`redis/docs`](https://github.com/redis/docs) repo.

### Context

This use case is being implemented across 9 client libraries in parallel. The Python (`redis-py`) reference implementation already exists at:

- `{{REFERENCE_PATH}}` (typically `content/develop/use-cases/{{USE_CASE_NAME}}/redis-py/`)
- Reference files: `_index.md`, helper file (e.g. `cache.py`), primary file (`primary.py`), demo server (`demo_server.py`)

Your output goes under:

- `content/develop/use-cases/{{USE_CASE_NAME}}/{{CLIENT}}/`

### What the helper must do

Match the reference implementation's API surface exactly (method names, return shapes, behaviour). The reference is the spec.

For this use case the helper exposes:

{{HELPER_API_SURFACE}}

### File layout for `{{CLIENT}}`

Follow the conventions in [`assets/redis-conventions.md`](redis-conventions.md#per-client-file-layout). At a minimum:

- A `_index.md` Hugo guide page following the section skeleton in `redis-conventions.md`.
- A helper class/module file (e.g., `Cache.cs`, `cache.go`, `RedisCache.java`).
- A `MockPrimaryStore` (or equivalent) with the same product records as the reference.
- A demo server that exposes HTTP endpoints: `GET /`, `GET /products`, `GET /read?id=`, `GET /stats`, `POST /invalidate`, `POST /update`, `POST /stampede`, `POST /reset`.
- Any language-specific config (`go.mod`, `Cargo.toml`, `*.csproj`, etc.).

### HTML template

Inline the shared HTML page in your demo server in your language's preferred string-literal style (e.g. multi-line `+`-concatenated string in Java, raw `r##"..."##` in Rust, here-doc in Ruby, etc.). The template with `{{OPTIONS}}`, `{{PRIMARY_LATENCY}}`, and `{{CACHE_TTL}}` placeholders lives at:

- `.agents/skills/redis-use-case-ports/assets/html-template.html`

Update only the **pill text** at the top of `<body>` to reflect your client library + HTTP framework (e.g., `node-redis + Node.js standard http module`).

### Stampede protection

The helper must use a Lua single-flight lock to funnel concurrent cache misses through a single primary read. Both scripts live in the reference implementation:

```lua
-- Acquire (returns 1 if lock acquired, 0 otherwise)
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return 1
end
return 0

-- Release (only if we still own the lock)
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
```

Tokenise the lock with a per-caller random value (8+ bytes hex). The release script must check the token.

### Smoke tests you MUST run before reporting

1. Start Redis if not running. Run `redis-cli FLUSHDB` to clear state.
2. Start your demo server on a **unique port** (avoid 8080, 8769, ports 8770–8775 if other agents may be using them; pick something in 8780–8830).
3. `GET /read?id=p-001` → expect cache miss, latency ≥ primary latency, `hit: false`.
4. `GET /read?id=p-001` → expect cache hit, latency << primary latency, `hit: true`.
5. `POST /invalidate id=p-001`.
6. `POST /update id=p-002 field=stock value=99`. Then `GET /read?id=p-002` should return updated record with `hit: false` (the update invalidates).
7. `POST /stampede id=p-003 concurrency=20`. **Expect exactly 1 primary read for 20 concurrent callers.** Anything else is a stampede-protection failure that must be fixed before you report.
8. `POST /reset` and verify stats zero out.
9. Stop the demo server. Clean up any compiled artefacts (`*.class`, `bin/`, `obj/`, `target/`, `node_modules/`) so the working tree is clean.

### Conventions to follow

- Method names match the reference (`get`, `invalidate`, `update_field`/`updateField`, `stats`, `reset_stats`/`resetStats`, `ttl_remaining`/`ttlRemaining`).
- Stats response shape: `{ hits, misses, stampedes_suppressed, hit_rate_pct, primary_reads_total, primary_read_latency_ms }`.
- Read response shape: `{ id, record, hit, redis_latency_ms, total_latency_ms, ttl_remaining, stats }`.
- Stampede response shape: `{ id, concurrency, primary_reads, elapsed_ms, results, stats }`.
- Cache key prefix `cache:product:` (or whatever the reference uses for this use case).
- Lock key prefix `lock:cache:product:` (parallel to cache key).
- TTL in seconds; lock TTL in milliseconds. Configurable via constructor args.
- See [`assets/redis-conventions.md`](redis-conventions.md) for the full convention list.

### Stop before you report if

- You can't make stampede produce exactly 1 primary read for 20 concurrent callers.
- You can't get the demo to compile/run end-to-end.
- The reference implementation's API doesn't translate cleanly to your language and you need a deviation that you can't justify with a clear one-line rationale.

In any of those cases, report what you tried and why it doesn't work. Do NOT silently ship a broken implementation.

### Report format

When you're done (or stuck), return a single response in the format described in [`assets/report-template.md`](report-template.md). Fill in every field. The report drives the synthesis phase — terse "it worked" reports are not useful.
