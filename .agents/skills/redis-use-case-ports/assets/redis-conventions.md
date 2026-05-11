# Redis-docs conventions for client ports

Everything in this file is specific to the [`redis/docs`](https://github.com/redis/docs) repository and the conventions established by existing use cases (`session-store`, `rate-limiter`, `leaderboard`, `time-series-dashboard`, `cache-aside`).

A new use case implemented via the [`redis-use-case-ports`](../SKILL.md) skill should match these conventions unless there's a documented reason to deviate.

## Repository layout

A use case lives under:

```
content/develop/use-cases/<use-case-name>/
├── _index.md                       (landing page)
├── redis-py/                       (Python — reference implementation)
│   ├── _index.md
│   ├── cache.py                    (or whatever the helper is called)
│   ├── primary.py                  (mock primary store)
│   └── demo_server.py
├── nodejs/                         (Node.js, node-redis)
│   ├── _index.md
│   ├── cache.js
│   ├── primary.js
│   └── demoServer.js
├── go/                             (Go, go-redis)
│   ├── _index.md
│   ├── cache.go
│   ├── primary.go
│   ├── demo_server.go
│   ├── go.mod
│   └── go.sum
├── java-jedis/                     (Java, Jedis)
│   ├── _index.md
│   ├── RedisCache.java
│   ├── MockPrimaryStore.java
│   └── DemoServer.java
├── java-lettuce/                   (Java, Lettuce)
│   ├── _index.md
│   ├── RedisCache.java
│   ├── MockPrimaryStore.java
│   └── DemoServer.java
├── dotnet/                         (C#, StackExchange.Redis)
│   ├── _index.md
│   ├── RedisCache.cs
│   ├── MockPrimaryStore.cs
│   ├── Program.cs
│   └── <Project>.csproj
├── php/                            (PHP, Predis)
│   ├── _index.md
│   ├── Cache.php
│   ├── Primary.php
│   └── demo_server.php
├── ruby/                           (Ruby, redis-rb)
│   ├── _index.md
│   ├── cache.rb
│   ├── primary.rb
│   └── demo_server.rb
└── rust/                           (Rust, redis-rs)
    ├── _index.md
    ├── cache.rs
    ├── primary.rs
    ├── demo_server.rs
    └── Cargo.toml
```

PHP may also include a `stampede_worker.php` if the use case has a stampede test (see "PHP-specific" below).

## Target client libraries

| Subdir | Language | Client library | Library docs |
|---|---|---|---|
| `redis-py` | Python | [`redis-py`](https://redis.readthedocs.io/) | [/develop/clients/redis-py]({{< relref "/develop/clients/redis-py" >}}) |
| `nodejs` | Node.js | [`node-redis`](https://github.com/redis/node-redis) | [/develop/clients/nodejs]({{< relref "/develop/clients/nodejs" >}}) |
| `go` | Go | [`go-redis`](https://github.com/redis/go-redis) | [/develop/clients/go]({{< relref "/develop/clients/go" >}}) |
| `java-jedis` | Java | [Jedis](https://github.com/redis/jedis) | [/develop/clients/jedis]({{< relref "/develop/clients/jedis" >}}) |
| `java-lettuce` | Java | [Lettuce](https://github.com/redis/lettuce) | [/develop/clients/lettuce]({{< relref "/develop/clients/lettuce" >}}) |
| `dotnet` | C# | [StackExchange.Redis](https://stackexchange.github.io/StackExchange.Redis/) | — |
| `php` | PHP | [Predis](https://github.com/predis/predis) | — |
| `ruby` | Ruby | [`redis-rb`](https://github.com/redis/redis-rb) | [/develop/clients/ruby]({{< relref "/develop/clients/ruby" >}}) |
| `rust` | Rust | [`redis`](https://crates.io/crates/redis) (redis-rs) | — |

## Hugo conventions

### Use-case landing page (`<use-case>/_index.md`)

Frontmatter:

```yaml
---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: <one-line, ends with a period>
hideListLinks: true
linkTitle: <Short title>
title: Redis <full title>
weight: <next available among use cases>
---
```

Section skeleton (titles map to the standard outline used across existing use cases — `session-store`, `rate-limiter`, `leaderboard`, `cache-aside`):

1. ## When to use Redis `<thing>` — one-sentence definition of when the pattern applies.
2. ## Why the problem is hard — concrete failure modes that motivate Redis.
3. ## What you can expect from a Redis solution — bulleted capabilities.
4. ## How Redis supports the solution — paragraph + bulleted list of Redis features with `{{< relref >}}` shortcodes linking to command docs.
5. ## Ecosystem — language-specific libraries and frameworks that use this pattern.
6. ## Code examples to build your own Redis `<thing>` — list of links to per-client guides.

The "Code examples" section follows this format:

```markdown
The following guides show how to build a simple Redis-backed <thing>.
Each guide includes a runnable interactive demo for each of the following client libraries:

* [redis-py (Python)]({{< relref "/develop/use-cases/<use-case>/redis-py" >}})
* [node-redis (Node.js)]({{< relref "/develop/use-cases/<use-case>/nodejs" >}})
* [go-redis (Go)]({{< relref "/develop/use-cases/<use-case>/go" >}})
* [Jedis (Java)]({{< relref "/develop/use-cases/<use-case>/java-jedis" >}})
* [Lettuce (Java)]({{< relref "/develop/use-cases/<use-case>/java-lettuce" >}})
* [StackExchange.Redis (C#)]({{< relref "/develop/use-cases/<use-case>/dotnet" >}})
* [Predis (PHP)]({{< relref "/develop/use-cases/<use-case>/php" >}})
* [redis-rb (Ruby)]({{< relref "/develop/use-cases/<use-case>/ruby" >}})
* [redis-rs (Rust)]({{< relref "/develop/use-cases/<use-case>/rust" >}})
```

### Per-client guide page (`<client>/_index.md`)

Frontmatter:

```yaml
---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis <use case> in <language> with <client name>
linkTitle: <client> example (<Language>)
title: Redis <use case> with <client name>
weight: <unique 1-9>
---
```

Weights by client (so the sidebar ordering matches across use cases):

| Client | Weight |
|---|---|
| `redis-py` | 1 |
| `nodejs` | 2 |
| `go` | 3 |
| `java-jedis` | 4 |
| `java-lettuce` | 5 |
| `dotnet` | 6 |
| `php` | 7 |
| `ruby` | 8 |
| `rust` | 9 |

Section skeleton:

1. Lead paragraph (1–2 sentences linking to the client docs page).
2. ## Overview — what the use case does, what it gives you (bulleted), and how the data is stored in Redis.
3. ## How it works — numbered request flow.
4. ## The `<helper-name>` helper — API surface, brief usage example, and a `### Data model` subsection.
5. (Per-operation sections — names depend on use case. For cache-aside: "Cache-aside reads", "Stampede protection with a Lua lock", "Invalidation on write", "Field-level updates". For session-store: "Creating a session", "Refreshing a session", "Expiring a session". Match what the helper exposes.)
6. ## Hit/miss accounting *(if applicable)* — stats interface, with a code snippet.
7. ## Prerequisites — Redis running, client library version, install command.
8. ## Running the demo — command to start, what the UI shows, server URL.
9. ## The mock primary store — what it simulates, the read-latency knob.
10. ## Production usage — `###` subsections covering: TTL choice, invalidate-don't-sync, missing-record handling, lock TTL tuning, namespacing, plus any client-specific concerns (connection pool, async API, ThreadPool, etc.). Always finish with a `### Inspect cached entries directly in Redis` showing `redis-cli` commands.
11. ## Learn more — bulleted list of Redis commands used + the client docs link.

### Shortcodes

Always use Hugo `{{< relref >}}` for cross-doc links:

```markdown
* [`HGETALL`]({{< relref "/commands/hgetall" >}}) to read the cached record
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) for the single-flight lock
```

External links use plain Markdown `[text](https://...)`.

### Code references in prose

`(source)` links to local files use relative paths from the current `_index.md`:

```markdown
The `RedisCache` class wraps the cache-aside operations ([source](cache.py)):
```

## HTTP server choices per client

The demo HTTP server should use the language's standard library where possible:

| Client | HTTP server | Notes |
|---|---|---|
| `redis-py` | `http.server.ThreadingHTTPServer` | Standard library. |
| `nodejs` | `http` module | Standard library; manual route dispatch on `req.method` + `url.pathname`. |
| `go` | `net/http` | Standard library; `http.ServeMux`. |
| `java-jedis` | `com.sun.net.httpserver.HttpServer` | Bundled with JDK; `Executors.newFixedThreadPool(16)` for concurrency. |
| `java-lettuce` | `com.sun.net.httpserver.HttpServer` | Same as Jedis. |
| `dotnet` | ASP.NET Core minimal API | `Microsoft.NET.Sdk.Web`; `WebApplication.CreateBuilder()`. Bumps `ThreadPool.SetMinThreads(64, 64)` at startup if the demo has concurrent polling. |
| `php` | `php -S` (built-in dev server) | Per-request process, **stateless**. State that must persist between requests goes in Redis. |
| `ruby` | `webrick` | Standard library. |
| `rust` | `axum` + `tokio` | Not stdlib but the de-facto choice in the Rust async ecosystem; matches `session-store/rust`. |

**Avoid** pulling in additional web frameworks (Flask, Express, Spring, Sinatra). The point is to keep the demo self-contained and not teach a framework alongside Redis.

## Parallel-port smoke tests against a shared Redis

When Phase 2 of `SKILL.md` fans out 8 sub-agents in parallel, all 8 demo servers connect to the same local Redis. If the brief tells every agent to use the *default* queue/cache key prefix, the agents stomp on each other: agent A's workers happily claim and complete agent B's jobs (or invalidate agent B's cache entries), and Redis-side `KEYS '<prefix>:*'` cleanup wipes everyone's state. This is the unanimous finding across the eight `job-queue` agent reports.

To avoid it:

- **Brief each agent to add a `--queue-name` / `--key-prefix` CLI flag** (or env var) that defaults to the documented value but lets the agent run smoke tests under a port-specific suffix (e.g., `jobs-nodejs`, `cache-nodejs`).
- **Tell each agent to use a suffixed name during its own smoke tests**, and to leave the suffix-free default in the shipping code.
- **The `purge()` helper must be parameterised on the queue/cache name** and scope its `SCAN MATCH` to `<prefix>:{name}:*`, so a clean-up in one port's namespace can't touch another's.
- Alternative: run sibling agents against a per-port `--redis-db` number (e.g., `redis-cli -n 1`, `-n 2`, ...). Less ergonomic but a clean fallback if a use case can't easily parameterise its key prefix.

## PHP-specific notes

PHP runs each HTTP request in a fresh process under `php -S`. This means:

- **In-process state doesn't persist.** Cache stats, primary record state, primary read counters, and per-job-queue counters must live in Redis (under a `demo:*` keyspace, or a `<prefix>:{name}:stats` hash).
- **Spawning sub-processes from a request handler must detach from the dev server's listen socket.** This bites both `pcntl_fork` (forked children inherit the accept socket) and `proc_open` (children inherit FDs unless explicitly redirected). The fix is **`setsid` on Linux**, and a shell-based new-session wrapper on macOS (which lacks `setsid(1)`). The detach also needs to redirect stdin/stdout/stderr to files; closing them alone isn't enough.
- **Predis 3.x's `hset()` is variadic, not associative.** The 1.x `$redis->hset($key, ['field' => 'value'])` form raises `wrong number of arguments for 'hset'` against a 3.x client/server. Use `$redis->hset($key, 'field', 'value', 'field2', 'value2', ...)` and write a small `flattenFields()` helper if you're storing a map.
- The brief should call out that the cross-process supervision approach is **PHP-specific** in the production-usage section.

## .NET-specific notes

- The demo helper is synchronous to keep the code compact. .NET's `ThreadPool` grows by ~2 threads/second under load, which starves polling threads in the stampede / claim test and produces false fall-through reads. Call `ThreadPool.SetMinThreads(64, 64)` at startup as a workaround, and note in the production-usage section that a real helper would be `async` (using `HashGetAllAsync`, `ScriptEvaluateAsync`, `await Task.Delay`).
- Use `Environment.TickCount64` (not `Environment.TickCount`) for any deadline arithmetic.
- Use `Microsoft.NET.Sdk.Web` and minimal APIs. Reference `StackExchange.Redis` at a recent version (2.7+).
- **StackExchange.Redis intentionally does not expose blocking pops** (`BRPOPLPUSH` / `BLMOVE` with a timeout) because they would monopolise the multiplexer's single command pipeline. Use cases that need a blocking claim (job queue, etc.) should poll the non-blocking `IDatabase.ListRightPopLeftPush` on a short interval (50 ms is a reasonable default). Document this in the helper's "Claiming jobs" / "How it works" section.
- **`RedisChannel` no longer has an implicit `string` conversion in 2.7+.** `db.Publish(...)` needs `RedisChannel.Literal("channel:name")` or `RedisChannel.Pattern(...)` explicitly.
- StackExchange.Redis transparently caches Lua scripts: the first `ScriptEvaluate(script, keys, args)` sends `EVAL`, subsequent calls switch to `EVALSHA` automatically. No need to manage SHAs by hand.

## Java-specific notes

- **Jedis**: use `JedisPool` and acquire a `Jedis` instance per call with try-with-resources. Each transaction gets its own connection; no in-process lock is needed.
- **Jedis 5.x's `brpoplpush` takes integer seconds.** Sub-second blocking-claim timeouts (e.g. 500 ms polling windows) round up to 1 s on the wire. The polling loop still observes its stop flag promptly enough; just be aware the per-iteration block is longer than the reference suggests.
- **Lettuce**: by default the demo shares one `StatefulRedisConnection` across HTTP handlers. Lettuce is thread-safe for individual commands but pipelined sequences and transactions are connection-scoped — concurrent pipelines or `MULTI`/`EXEC` blocks on one connection can interleave. Options when an enqueue / update needs two-or-more commands atomic-ish: (a) wrap in a `ReentrantLock`; (b) use `MULTI`/`EXEC` with the same lock; (c) merge into a Lua script (preferred — atomic server-side and lock-free, but requires writing the script). The production-usage section should explain you'd switch to `ConnectionPoolSupport.createGenericObjectPool(...)` in production and drop the lock.
- Lettuce's `BLMOVE` accepts a `double` timeout in seconds with sub-second precision (`bRPopLPush(timeout: double)`). Don't use the older `long`-overload — pre-6.x builds treated values < 1 as "block forever".
- Both Java demos depend on a small classpath. The `_index.md` should give an example `javac` + `java` command listing the jars by name.

## Go-specific notes

- Use `package <use-case-package>` (e.g., `package cacheaside`) for all files, including the demo server. Expose the entry point as a `RunDemoServer()` function rather than `main()` directly.
- Ask the user to create a one-line `main.go` next to the files: `package main; import "<use-case-package>"; func main() { <pkg>.RunDemoServer() }`. This avoids the Go limitation that `package main` can't coexist with another package in the same directory.
- `go.mod` should declare `module <use-case-package>` and `require github.com/redis/go-redis/v9` at a recent stable version.

## Rust-specific notes

- Use the `redis` crate with features `["tokio-comp", "aio", "connection-manager"]`. The `connection-manager` feature gives `ConnectionManager` for cheap, cloneable, auto-reconnecting connections.
- `axum` + `tokio` for HTTP. `serde_json` for response shapes.
- The helper's loader callback should be `Fn(String) -> impl Future<Output = Option<HashMap<String, String>>>` so callers can pass an `async move` closure cleanly.
- Use raw string literals (`r##"..."##`) for the inlined HTML template.

## Mock primary store

Every client has a `MockPrimaryStore` that:

- Holds a small fixed set of sample records (use the same 4 product IDs across all clients: `p-001`, `p-002`, `p-003`, `p-004`).
- Has a configurable read latency in ms (default 150).
- Exposes `list_ids()`, `read(id)` (with the simulated sleep), `update_field(id, field, value)`, `reads()` (cumulative count), and `reset_reads()`.
- Is thread-safe (mutex around the records map, atomic on the counter).
- Lives entirely in-process — except in PHP, where it persists in Redis under `demo:primary:*` keys for cross-request survival.

## Library versions to standardise (when this skill is updated)

Pin the recommended versions in the `_index.md` Prerequisites section. As of the cache-aside use case:

| Client | Recommended version |
|---|---|
| `redis-py` | latest (any 5.x) |
| `node-redis` | latest 5.x |
| `go-redis` | v9.x |
| Jedis | 5.0+ |
| Lettuce | 6.1+ |
| StackExchange.Redis | 2.7+ |
| Predis | 3.x |
| `redis-rb` | 5.x |
| `redis-rs` | 0.24+ |

When this skill is reused, refresh these to the latest stable at that time.
