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
8. ## Running the demo — opens with a `### Get the source files` subsection (a `curl` block that pulls the port's files from GitHub raw URLs), then a `### Start the demo server` subsection (the run command, expected log output, the `http://...` URL, and any environment-override flags). See [Source links and "Get the source files" block](#source-links-and-get-the-source-files-block) below.
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

### Source links and "Get the source files" block

A `_index.md` page is rendered to HTML on the docs site. Readers see the rendered HTML in a browser, not the source tree in this repo — so a relative-path link like `[source](cache.py)` 404s in production. Use a full GitHub blob URL instead:

```markdown
The `RedisCache` class wraps the cache-aside operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/<use-case>/<client>/cache.py)):
```

Use the same pattern for every code reference: function-of-mention link, "see X for the full implementation", etc. The URL pins to `main`, so the docs always link to the latest code; if you ever need to pin to a specific docs version, swap `main` for the release tag.

For the standalone `[FileName.ext](FileName.ext)` link style (used when listing related files like `[AsyncSessionStore.java](AsyncSessionStore.java)`), keep the link text as the bare filename and only rewrite the URL to the GitHub blob.

The `## Running the demo` section in every per-client guide must open with a `### Get the source files` subsection, so a reader can go from "I'm reading the docs in a browser" to "I have the files locally and can run them" without already having the repo. The standard shape:

````markdown
## Running the demo

### Get the source files

The demo consists of <N> files. Download them from the [`<client>` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/<use-case>/<client>) on GitHub, or grab them with `curl`:

```bash
mkdir <use-case>-demo && cd <use-case>-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/<use-case>/<client>
curl -O $BASE/<file1>
curl -O $BASE/<file2>
...
```

### Start the demo server

From that directory:

```bash
<run command>
```

<existing prose — log output, http URL, env-override flags — stays from here>
````

Per-client variations:

- **Rust ports with a `src/` layout** (some use cases use it, some have flat layouts driven by explicit `path =` directives in `Cargo.toml`): `mkdir -p <use-case>-demo/src && cd <use-case>-demo`, then `curl -O $BASE/Cargo.toml` for top-level files and `curl -o src/<file> $BASE/src/<file>` for sources under `src/`. Match the on-disk layout — don't invent a `src/` if the use case doesn't have one.
- **Node.js / PHP**: include `package.json` / `composer.json` in the curl block, and follow up with `npm install` / `composer install` before the run command.
- **.NET**: include the `*.csproj` in the curl block; `dotnet run` resolves dependencies on first invocation.
- **Go**: include `go.mod` and `go.sum`. If the use case uses the `RunDemoServer()` pattern (because `package main` and the use-case package can't share a directory), the curl block creates the small `cmd/demo/main.go` shim file too — the existing prose already explains the pattern; preserve it.
- **Java**: include all source files; the existing `javac` instructions stay.

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

## Pub/sub-specific notes

These apply to any use case whose helper exposes a `SUBSCRIBE` or `PSUBSCRIBE` primitive (pub/sub broadcasters, keyspace-notification listeners, WebSocket-fan-out demos, etc.). Pub/sub touches a fundamentally different set of Redis primitives from the keyspace use cases, and the per-client divergence is much wider than for cache-aside-style ports.

### Subscribe-acknowledgement handshake

Every helper that creates a Subscription **must not return the handle to the caller** until Redis has acknowledged the SUBSCRIBE / PSUBSCRIBE for every target. The acknowledgement is what tells Redis to route subsequent PUBLISHes to this client; if the caller's next line is `hub.publish(...)`, the publish can race ahead of the subscribe on the wire and the first message is silently dropped.

Per-client status:

| Client | Subscribe primitive | Ack guarantee | Helper must... |
|---|---|---|---|
| redis-py | `PubSub.subscribe(**bindings)` | First call reads ack synchronously; multi-channel calls only ack the first | Single-target subs are safe; for multi-channel subs document the residual race or split into per-target calls. |
| node-redis 5.x | `client.subscribe(channel, listener)` | Returns `Promise<void>` resolved on ack | `await` the promise before registering the Subscription. |
| go-redis | `client.Subscribe(ctx, channels...)` | Synchronous socket write; ack is read by the channel pump | Safe as long as Redis processes commands in receive order, which is always. |
| Jedis | `jedis.subscribe(JedisPubSub, channels...)` | **Blocks the calling thread**; ack arrives via `onSubscribe`/`onPSubscribe` | Spawn a thread for the blocking call, and `CountDownLatch.await(...)` the per-target acks in the parent before returning. |
| Lettuce | `psConnection.sync().subscribe(...)` vs `.async()` | `sync()` blocks until ack; `async()` returns `RedisFuture<Void>` immediately | **Use `sync()`**. `async()` without an awaited future is the canonical foot-gun. |
| StackExchange.Redis | `ISubscriber.Subscribe(RedisChannel, handler)` | Synchronous; returns after Redis ack | Use `RedisChannel.Literal(...)` and `RedisChannel.Pattern(...)` (no implicit string conversion in 2.7+). |
| Predis (PHP) | `$client->pubSubLoop(...)` runs inside the spawned worker | Worker subscribes asynchronously to the parent | Parent polls `PUBSUB NUMSUB`/`NUMPAT` for a delta from a pre-spawn snapshot, with a bounded timeout that **returns a status** and surfaces failure (silent fall-through reintroduces the race). |
| redis-rb | `redis.subscribe(*targets) do |on| ... end` | Blocks the connection until unsubscribe | Spawn a thread; use a `Queue` latch populated by `on.subscribe`/`on.psubscribe`; `@ready_latch.pop` in the parent and check the value (push `false` from a rescue block to propagate startup failure). |
| redis-rs | `pubsub.subscribe(channel).await` / `psubscribe(pattern).await` | Awaited future resolves after ack | The `await` is the handshake. The only trap is the `on_message()` stream borrowing from `pubsub`, which forces the spawned task to own `pubsub`. |

The audit-checklist row "Subscribe-acknowledgement race in pub/sub-style helpers" (#14) covers this class. Phase 4 audit prompts must adversarially verify the wait is reachable and awaited, not just that it exists in the code.

### Pattern field availability differs across clients

When a `PUBLISH` matches a `PSUBSCRIBE` pattern, Redis sends both the matched channel and the originating pattern over the wire. Some client libraries surface both to the listener callback; others surface only the channel. Helpers must close over the pattern per-binding when the library doesn't pass it through, so `ReceivedMessage.pattern` is correctly populated for pattern subscribers (and `null`/`None` for exact-match subscribers).

| Client | Pattern reaches the listener? |
|---|---|
| redis-py | Yes, in the dispatched dict's `pattern` key |
| go-redis | Yes, on `redis.Message.Pattern` (empty string for exact-match) |
| Jedis | Yes — separate `onMessage(channel, msg)` and `onPMessage(pattern, channel, msg)` overrides |
| Lettuce | Yes — overloaded `message(channel, msg)` and `message(pattern, channel, msg)` (the three-arg form's first arg is the pattern, not the channel — easy to mix up) |
| node-redis 5.x | **No** — `pSubscribe` listener gets `(message, channel)` only. Bind one listener per pattern, closing over the pattern string. |
| StackExchange.Redis | **No** — handler gets `(RedisChannel matchedChannel, RedisValue value)`. Helper must remember the pattern per binding and either look it up or run a glob matcher to recover it. |
| redis-rb | Yes — `on.pmessage do \|pattern, channel, raw\|` |
| Predis | Yes — `pubSubLoop` event has `pattern` set on `pmessage`-type events |
| redis-rs | Yes — `Msg::get_pattern()` returns the matched pattern (or empty for exact-match) |

### `PUBSUB NUMSUB` return-shape normalisation

The raw `PUBSUB NUMSUB ch1 ch2 ...` reply is a flat alternating array (`[ch1, count1, ch2, count2, ...]`). Different clients decode it differently — some to a `Map`/`Hash`, some to a list of pairs, some leave it flat. Helpers must **normalise to a deterministic `{channel: count}` map keyed by the caller's input order**, so the JSON wire shape matches across all 9 ports and the shared UI JavaScript works uniformly.

| Client | Native shape | Helper must do |
|---|---|---|
| redis-py | `list[tuple[str, int]]` | Convert to dict; preserve caller order |
| node-redis 5.x | `object {ch: count}` (may omit zero entries) | Re-project through caller's channel list; fill missing with 0 |
| go-redis | `map[string]int64` | Re-project through caller's channels for stable order |
| Jedis | `Map<String, Long>` | Walk caller's channel list, pull from map |
| Lettuce | `Map<String, Long>` (insertion-order-undefined) | `LinkedHashMap` keyed by caller's channel order |
| StackExchange.Redis | No high-level wrapper — `db.Execute("PUBSUB","NUMSUB",...)` returns a flat `RedisResult` array | Pair-walk the array |
| Predis | `executeRaw(['PUBSUB','NUMSUB',...])` flat array | Pair-walk |
| redis-rb | Flat array via `redis.pubsub("numsub", *channels)` | Pair-walk |
| redis-rs | `Vec<(String, i64)>` or HashMap depending on `FromRedisValue` impl | Coerce to HashMap |

### `PUBSUB CHANNELS`, `NUMPAT`, `NUMSUB` are server-wide

These are global counters on the Redis server, not per-client or per-connection. During Phase 2 parallel smoke tests, every agent's pubsub clients contribute to the same NUMPAT and the same NUMSUB. Tests must use **delta-from-pre-snapshot** comparisons, never absolute equality. Phase 2 briefs should explicitly tell agents to:

- Use port-prefixed channel and pattern names (`smoke-{client}:test`, `smoke-{client}:*`) so cross-agent fan-out doesn't pollute their results.
- Treat any introspection assertion as `≥ n` (not `== n`) where `n` is the count they themselves added, plus the pre-test snapshot.

Test-setup hygiene: before a smoke test, `redis-cli client list type pubsub` shows whether any prior sessions still hold pubsub connections (`lib-name=redis-py`, `cmd=psubscribe`, large `age` and `idle` values). These don't show in `ps` because they're often inside detached or daemon-thread processes. The Phase 4 / Phase 5 retrofit cycle for pub/sub will hit them if not.

### Detached-worker PID capture (PHP-style ports)

When a port spawns subscriber workers as external processes (PHP under `php -S`), the PID recorded for later signalling must be the **worker's** PID, not a short-lived wrapper's:

- `proc_open(['setsid', '-f', ...])` returns the `setsid` wrapper's PID — `setsid -f` forks, exec's the worker as the new session leader, and the wrapper exits. Subsequent `posix_kill($recordedPid, ...)` is a no-op.
- The correct cross-platform pattern is a shell wrapper that backgrounds the worker and echoes its real PID through `& echo $!`: `proc_open(['/bin/sh', '-c', "$workerCmd >>$log 2>&1 </dev/null & echo $!"], ...)`. The parent reads `$!` from the wrapper's stdout pipe.
- If process-group detachment is required (immunity to the dev-server process group's SIGHUP on Linux), prepend `setsid ` (no `-f`) **inside** the shell wrapper. `setsid` then exec-replaces in-place, so the PID `$!` captured is still the worker's.
- The descriptor spec on `proc_open` only covers FDs 0–2. Higher FDs (the dev server's listening socket) leak into the child unless they were opened `O_CLOEXEC`, or the child explicitly closes them. PHP's `php -S` doesn't always set CLOEXEC on its listener, so workers can end up holding the port open after the dev server dies. Worth mentioning in the port's "Production usage" section.

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
