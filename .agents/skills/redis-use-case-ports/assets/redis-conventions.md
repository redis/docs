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
- **Predis `BRPOP` only accepts whole-second timeouts.** Sub-second polling intervals (e.g. a 50 ms `next_change` loop in the reference Python) need a workaround: use a 1 s `BRPOP` for change draining plus a separate fast pause-flag poll (e.g. 20 ms `usleep`) so pause/resume latency stays low even when the main `BRPOP` is parked.
- **Cross-process pause/resume goes through Redis flags.** Where threaded ports use a `threading.Event` (or equivalent) inside one process, PHP needs the demo server and the long-running sync worker to coordinate across processes. The pattern is two keys: `demo:sync:paused` (writer to worker) and `demo:sync:idle` (worker acks parked state). The demo's `/clear` and `/reprefetch` handlers set `paused=1`, spin-wait for `idle=1` with a 10 ms poll and a 2 s timeout, do the cache write, then set `paused=0`. The worker checks `paused` on each loop iteration; if set, writes `idle=1` and spin-waits for it to clear. Established in the prefetch-cache PHP port.
- **Mutation + change-event emit needs Lua-script atomicity** when the producer is also stateless (PHP). The reference Python uses an in-process `Lock` to make "mutate-then-emit" atomic; the PHP equivalent is wrapping the record write and the `LPUSH` (or `XADD`) onto the change feed in a single `EVAL`. Without this, two concurrent mutations on the same key can land in queue order opposite to their server-side commit order. (Audit-checklist row 16.)
- The brief should call out that the cross-process supervision approach is **PHP-specific** in the production-usage section.

## .NET-specific notes

- The demo helper is synchronous to keep the code compact. .NET's `ThreadPool` grows by ~2 threads/second under load, which starves polling threads in the stampede / claim test and produces false fall-through reads. Call `ThreadPool.SetMinThreads(64, 64)` at startup as a workaround, and note in the production-usage section that a real helper would be `async` (using `HashGetAllAsync`, `ScriptEvaluateAsync`, `await Task.Delay`).
- Use `Environment.TickCount64` (not `Environment.TickCount`) for any deadline arithmetic.
- Use `Microsoft.NET.Sdk.Web` and minimal APIs. Reference `StackExchange.Redis` at a recent version (2.7+).
- **StackExchange.Redis intentionally does not expose blocking pops** (`BRPOPLPUSH` / `BLMOVE` with a timeout) because they would monopolise the multiplexer's single command pipeline. Use cases that need a blocking claim (job queue, etc.) should poll the non-blocking `IDatabase.ListRightPopLeftPush` on a short interval (50 ms is a reasonable default). Document this in the helper's "Claiming jobs" / "How it works" section.
- **`RedisChannel` no longer has an implicit `string` conversion in 2.7+.** `db.Publish(...)` needs `RedisChannel.Literal("channel:name")` or `RedisChannel.Pattern(...)` explicitly.
- StackExchange.Redis transparently caches Lua scripts: the first `ScriptEvaluate(script, keys, args)` sends `EVAL`, subsequent calls switch to `EVALSHA` automatically. No need to manage SHAs by hand.
- **`IDatabase.KeyTimeToLive` collapses the `-2` (missing) and `-1` (no TTL) sentinels into a single `TimeSpan?` null.** For any `TTL` lookup that needs to distinguish them, send the raw command instead: `(long) db.Execute("TTL", key)` returns the integer the server actually replied with. (Audit-checklist row 15.)
- **`IServer.Keys` (the typed SCAN enumerator) requires `AllowAdmin = true` on the `ConfigurationOptions`** — which also grants `FLUSHDB` / `CONFIG`, a real security concern in production. Where SCAN-style enumeration is needed (e.g. a `clear()` helper) prefer `db.Execute("SCAN", cursor, "MATCH", pattern, "COUNT", count)` so the demo doesn't pull in admin-privileged client config.

## Java-specific notes

- **Jedis**: use `JedisPool` and acquire a `Jedis` instance per call with try-with-resources. Each transaction gets its own connection; no in-process lock is needed.
- **Jedis 5.x's `brpoplpush` takes integer seconds.** Sub-second blocking-claim timeouts (e.g. 500 ms polling windows) round up to 1 s on the wire. The polling loop still observes its stop flag promptly enough; just be aware the per-iteration block is longer than the reference suggests.
- **Lettuce**: by default the demo shares one `StatefulRedisConnection` across HTTP handlers. Lettuce is thread-safe for individual commands but pipelined sequences and transactions are connection-scoped — concurrent pipelines or `MULTI`/`EXEC` blocks on one connection can interleave. Options when an enqueue / update needs two-or-more commands atomic-ish: (a) wrap in a `ReentrantLock`; (b) use `MULTI`/`EXEC` with the same lock; (c) merge into a Lua script (preferred — atomic server-side and lock-free, but requires writing the script). The production-usage section should explain you'd switch to `ConnectionPoolSupport.createGenericObjectPool(...)` in production and drop the lock.
- **Lettuce sync API does not cooperate with `setAutoFlushCommands(false)`.** Each sync call internally awaits its `CompletableFuture`; with auto-flush off, those futures never complete because nothing flushes. Symptom: bulk-load deadlocks silently — no exception, just a hung process. Use the **async API** (`RedisAsyncCommands<K,V>`) for any pipelined batch where you intend to flush at the end: queue commands without awaiting each one, then `connection.flushCommands()` and await the futures in bulk. Documented after the prefetch-cache Lettuce port hit it during testing.
- Lettuce's `BLMOVE` accepts a `double` timeout in seconds with sub-second precision (`bRPopLPush(timeout: double)`). Don't use the older `long`-overload — pre-6.x builds treated values < 1 as "block forever".
- Both Java demos depend on a small classpath. The `_index.md` should give an example `javac` + `java` command listing the jars by name.
- **JDK version: pick text blocks (15+) or string concatenation (11+) and apply it across both Java ports of the same use case.** Text blocks (`"""..."""`) keep the inlined HTML readable; concatenation works on older JDKs. The cache-aside Java ports use concatenation with JDK 11+ prereq; the prefetch-cache Java ports use text blocks with JDK 17+ prereq. Either is fine — just don't mix within a use case, and set Prerequisites accordingly.

## Go-specific notes

- Use `package <use-case-package>` (e.g., `package cacheaside`) for all files, including the demo server. Expose the entry point as a `RunDemoServer()` function rather than `main()` directly.
- Ask the user to create a one-line `main.go` next to the files: `package main; import "<use-case-package>"; func main() { <pkg>.RunDemoServer() }`. This avoids the Go limitation that `package main` can't coexist with another package in the same directory.
- `go.mod` should declare `module <use-case-package>` and `require github.com/redis/go-redis/v9` at a recent stable version.
- **go-redis encodes the `TTL` sentinels `-2` / `-1` as raw nanoseconds**, not seconds-scaled. `client.TTL(...).Result()` returns `time.Duration(-2)` (one nanosecond) for a missing key, and a naive `int(d.Seconds())` truncates it to `0`. For any `TTL` lookup, bypass the typed wrapper: `client.Do(ctx, "TTL", key).Int64()` returns the integer reply directly. Same idiom maps to the .NET `Execute("TTL", ...)` workaround. (Audit-checklist row 15.)

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

### Locked-emit ordering for producer/consumer use cases

When the mock primary store doubles as the *producer* of a change feed that some downstream consumer (CDC worker, sync worker, replicator) drains — as in the prefetch-cache use case — every mutation method must emit its change event **while the mutation lock is still held**. The append-to-queue cannot happen after the lock is released, even though the queue itself is thread-safe.

Without this, two concurrent `update_field` calls can mutate the records map in one order (T1 then T2 → primary state ends at T2's value) and then enqueue their events in the opposite order (T2 then T1 → consumer applies T1 last → cache ends at T1's value, divergent from primary).

The reference Python pattern is an `_emit_change_locked(...)` helper called inside each `with self._lock:` block. The equivalent in other languages:

| Language | Pattern |
|---|---|
| Python | `_emit_change_locked` inside `with self._lock:` |
| Node.js | mutation + emit are synchronous within the same function; no `await` between them (single-threaded event loop guarantees serial execution) |
| Go | `defer mu.Unlock()` + `emitChangeLocked` before the deferred unlock |
| Java | `synchronized (lock) { ...mutate...; emitChangeLocked(...); }` |
| C# | `lock (_lock) { ...mutate...; EmitChangeLocked(...); }` |
| PHP | Lua scripts that combine the record write and the `LPUSH` server-side (no in-process lock to hold across requests) |
| Ruby | `@lock.synchronize { ...mutate...; emit_change_locked(...); }` |
| Rust | `emit_locked(...)` while the `MutexGuard` is still in scope (call before drop) |

See audit-checklist row 16 for the audit prompt.

## Streaming-worker / background-task patterns

These apply to any use case whose demo runs a long-lived in-process worker thread alongside the HTTP handler (streaming-feature-store updaters, background sync workers, CDC consumers, scheduled reindexers). The shape is similar to the pub/sub workers above but without the network primitive — the cross-port traps are about thread lifecycle and pause / wait-idle race conditions, not about ack handshakes.

### Pre-flight in-flight flag before the pause check

Every worker that exposes both `pause()` and `wait_for_idle()` (or equivalent) must set its `tick_in_flight` flag to `true` **before** the `paused` check inside the tick loop, with a `finally` / `defer` / `ensure` block that clears it on every exit path. The reference shape (Python-style pseudocode) is:

```python
while not self._stop_event.is_set():
    self._stop_event.wait(timeout=self.tick_seconds)
    if self._stop_event.is_set():
        break
    self._tick_in_flight.set()
    try:
        if not self._paused.is_set():
            self._tick()
    except Exception:
        ...
    finally:
        self._tick_in_flight.clear()
```

The point is that an external caller can do `pause() + wait_for_idle() + reset()` and be guaranteed the reset's `DEL` sweep runs only after the in-flight tick has drained. If the flag is set **inside** the `not paused` branch, a concurrent `pause` + `wait_for_idle` can fall straight through while the tick is still mid-write, and the streaming `HSET` recreates an entry the reset just enumerated for deletion — leaving a streaming-only hash with no key-level TTL. Audit-checklist row 30 covers this.

The outer `try/finally` (or `defer`, or `ensure`) wrapping the **whole tick loop** must also clear `running` and `tick_in_flight` on every exit path, so a worker that exits via an uncaught exception leaves the lifecycle state where the next `start()` can spin a fresh thread.

### Worker lifetime decoupled from request lifetime

Workers spawned from an HTTP request handler must not inherit the request's cancellation context. In Go specifically, calling `worker.Start(ctx)` with the `*http.Request.Context()` kills the worker as soon as the request completes — a particularly easy mistake because the Go community style strongly encourages passing `ctx` through everything. The fix is for `Start` to derive `context.Background()` (or use `context.WithCancel(context.Background())` for its own cancellation) internally; the HTTP `ctx` is only for the request's own work.

The same shape applies to .NET (`CancellationToken` from the request) and Rust (`tokio_util::sync::CancellationToken` from the handler). The lifecycle of the worker is the lifetime of the **demo server process**, not the lifetime of any single request.

### Worker stop semantics

If the stop path uses a bounded `join` / `wait` / `await`, the timeout-expired branch must escalate — log + indefinite join, interrupt + wait, or fall through to a `waitForIdle()` on the in-flight flag. A bare `thread.join(timeout=N); thread = None` (drop the handle, move on) is silent thread abandonment, regardless of whether the daemon-thread shape lets the process exit cleanly. Audit-checklist row 31 covers this; the reference Python implementation shipped without it and was retrofitted after Codex flagged the same shape in the Ruby port.

### HEXPIRE pipeline reply shapes vary across clients

`HEXPIRE` returns one status code per requested field. Inside a pipeline / multi block the per-client decode shape varies:

| Client | Pipeline-mode HEXPIRE reply | Notes |
|---|---|---|
| redis-py | `[int, int, ...]` flat list | `await pipe.execute()` gives back the per-field codes directly. |
| node-redis 5.x | `MultiErrorReply` per failed code | Inside `multi/exec`. Use `execAsPipeline()` for a plain array reply if no transactional guarantee is needed. |
| go-redis v9 | `[]int64` from `cmd.Result()` | Inspect via `redis.IntSliceCmd`. |
| Jedis | `List<Long>` from `Response.get()` | After `pipeline.sync()`. |
| Lettuce | `List<Long>` from `RedisFuture<List<Long>>.get()` | Use `async()` then `awaitAll` or `awaitOrCancel`. |
| StackExchange.Redis | `RedisResult[]` — one per field | `(long)results[i]` to read each code. |
| Predis 3 | `array<int>` from the `pipeline()` callback's return value | The typed `hexpire()` decode preserves the per-field shape. |
| redis-rb | `Array<Integer>` from `redis.pipelined { ... }` | Use `redis.call('HEXPIRE', key, ttl, 'FIELDS', n, *names)`; the typed binding is not stable on 5.4. |
| redis-rs | `Vec<Vec<i64>>` — outer pipeline wraps the inner array, take `[0]` | `pipe.cmd("HEXPIRE")...query_async::<Vec<Vec<i64>>>(&mut conn)`. |

In every client the helper must iterate the per-field codes and raise / throw on anything other than `1` (assuming no `NX | XX | GT | LT` flag is in use). A discarded reply or a check that only looks at the first element silently leaves the rest of the fields un-TTL'd. Audit-checklist row 29 covers this.

`HTTL` follows the same per-field-array shape with `-1` (no TTL) and `-2` (missing field/key) sentinels. The helper must normalise to a per-field array even when the reply is `nil` / `None` / `null` for a missing key — default missing slots to `-2` so callers never index out of range.

### Stats counters across stateless and stateful runtimes

Worker tick counts, write counts, and reads-per-second counters live in process memory for the threaded ports (Python, Node, Go, Jedis, Lettuce, Rust, .NET, Ruby). For PHP under `php -S`, where the demo server and the worker run as separate processes, the counters move into Redis under a `fs:control:*` / `<prefix>:control:*` keyspace and the demo server / worker both `INCRBY` / `GET` against them. This is the same pattern as the prefetch-cache PHP port's cross-process pause flags (row 5 + the PHP-specific section above) but generalised to any counter the UI needs to display.

### Reference projects

* [`content/develop/use-cases/feature-store/`](../../../content/develop/use-cases/feature-store/) — established this section's conventions. Each port has a `StreamingWorker` (or equivalent) implementing the pause-and-wait-idle pattern, the outer lifecycle try/finally, and the per-field HEXPIRE reply check.

## ML / vector-search use cases

These apply to any use case whose helper has to embed text (or any other modality) into a vector and store the bytes in a Redis Search VECTOR field — recommendation engines, semantic search, RAG retrieval, classification feature stores. The shape is fundamentally different from the keyspace use cases because each port has to choose its own embedding library, and the library choice has real implications for setup ergonomics, performance, and which sentence encoder it ships.

### Embedding library per client

Aim for libraries that are mainstream, locally-runnable (no API key, no paid service), and ship a 384-dim sentence encoder so a single index schema works across all 9 ports. The reference set, established by the recommendation-engine use case, is:

| Client | Library | Model | Setup notes |
|---|---|---|---|
| `redis-py` | [`sentence-transformers`](https://www.sbert.net/) | `sentence-transformers/all-MiniLM-L6-v2` | `pip install sentence-transformers`; model downloads on first `encode` into `~/.cache/huggingface`. |
| `nodejs` | [`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers) | `Xenova/all-MiniLM-L6-v2` | `npm install @xenova/transformers`; downloads ONNX weights into the npm install dir on first call. |
| `go` | [Hugot](https://pkg.go.dev/github.com/knights-analytics/hugot) (pure-Go ONNX backend) | `sentence-transformers/all-MiniLM-L6-v2` | `go get github.com/knights-analytics/hugot`; the `NewGoSession(ctx)` backend uses `gomlx` and needs **no ONNX shared library** install — important for cross-platform docs. |
| `java-jedis` / `java-lettuce` | [DJL](https://djl.ai/) + `ai.djl.huggingface:tokenizers` + `ai.djl.onnxruntime:onnxruntime-engine` | `sentence-transformers/all-MiniLM-L6-v2` | DJL pulls native libs via Maven; the ONNX engine ships its own runtime. The Java ports use Maven (`pom.xml`) for this — a deviation from `streaming/java-jedis`'s plain `javac` style, but DJL's transitive deps make Maven the only sane build option. |
| `dotnet` | [`SmartComponents.LocalEmbeddings`](https://www.nuget.org/packages/SmartComponents.LocalEmbeddings) | `bge-micro-v2` (bundled with the package, 384-dim) | The package only exposes its bundled model. Re-tooling to MiniLM via raw `Microsoft.ML.OnnxRuntime` is possible but adds substantial boilerplate. Document the model mismatch in the port's guide. |
| `php` | [`codewithkyrian/transformers`](https://packagist.org/packages/codewithkyrian/transformers) | `Xenova/all-MiniLM-L6-v2` | Requires PHP's FFI extension. The cli-server SAPI (`php -S`) defaults to `ffi.enable=preload`, which blocks the runtime. Run with `php -d ffi.enable=true -S ...` — and **document this in the demo file header comment**, not just the guide, so readers copying the run command from the source get the right invocation. |
| `ruby` | [`informers`](https://github.com/ankane/informers) (Andrew Kane / ankane) | `sentence-transformers/all-MiniLM-L6-v2` | Pulls in the `onnxruntime` gem, which **requires Ruby ≥ 3.2**. macOS's system Ruby is 2.6.x; the guide's prerequisites must point users at Homebrew / `rbenv` / `asdf` and explicitly warn off `/usr/bin/ruby`. |
| `rust` | [`fastembed`](https://crates.io/crates/fastembed) | `AllMiniLML6V2` (preset) | The crate bundles tokenizers and uses `ort` for ONNX. Builds clean on stable Rust; first call downloads model files into `./models/`. |

When porting a new ML-style use case, **the brief must list the library per port explicitly** — the choice is not obvious from the use case spec, and subagents will spend hours rediscovering the right library if left to their own devices.

### Pre-computed artefact wire format

Use cases that ship pre-computed assets (item embeddings, indexed corpora, learned weights) should adopt the recommendation-engine `catalog.json` shape so the same loader works across all 9 ports:

```json
{
  "model": "<HF hub ID of the encoder that produced these vectors>",
  "dim": 384,
  "products": [
    {
      "id": "...",
      "name": "...",
      "...other structured fields...": "...",
      "embedding_b64": "<base64 of float32 little-endian bytes, length dim * 4>"
    }
  ]
}
```

Each port's catalog builder re-computes the embeddings under its own library and writes its own `catalog.json` — vectors are not shared across ports (different ONNX implementations produce numerically-identical-ish but not bit-equal output, and different models produce non-comparable vectors entirely). The on-disk *format* is shared so the loaders are parallel.

The `embedding_b64` field carries raw little-endian float32 bytes, base64-encoded. This is the same byte sequence that gets written to Redis as the `embedding` hash field — the loader can decode-once and `HSET` the bytes directly. Avoid storing embeddings as JSON number arrays: they're 3-4× larger on disk and require per-port parsing/repacking before the `HSET` write.

### Vector dim mismatch and L2 normalisation invariants

Any helper that combines two vectors arithmetically (session blending, EWMA averaging, dot products outside of the FT.SEARCH query) must defend against (a) length mismatch — a stale session vector left in a user hash from a previous model — and (b) un-normalised stored vectors. The audit checklist row 24 (vector dim mismatch) and row 25 (L2 normalisation silently skipped) cover the specific tests. Highlights:

- **Don't trust the library's `normalize: true` kwarg.** Some libraries don't propagate the flag through their pipeline-output unwrap step. Always add an explicit L2-normalise in the wrapper's encode path. Silent un-normalised vectors don't break KNN search (Redis Search normalises internally for cosine distance) but they do break any client-side blend / EWMA that assumes unit magnitudes.
- **Validate vector length at the read boundary.** When the helper reads a stored vector (typically a session vector from a user hash), it should check the byte length against the configured `vector_dim` and discard mismatched data — same outcome as an empty session. The Python reference's `_bytes_to_vec` is the model; the Go and .NET subagents both missed this on first port and bugbot caught it. ([Audit row 24](audit-checklist.md))

### Per-port deviations from the model spec — call them out

When a library / typed API forces a deviation from the reference's documented behaviour (e.g. Lettuce 7's `TextFieldArgs.weight(long)` won't accept a fractional weight; .NET's `SmartComponents.LocalEmbeddings` only ships `bge-micro-v2`), call out the deviation in two places:

1. **A `{{< note >}}` block in the port's `_index.md`**, right under the schema or API code where the deviation appears.
2. **A code comment at the deviation site**, citing the library constraint that forced it.

Examples from the recommendation-engine ports:

- Lettuce's `_index.md` notes `description` text weight is 1.0 (not 0.5) because `TextFieldArgs.weight(long)` accepts integers only.
- .NET's `_index.md` lede names `bge-micro-v2` explicitly and notes the other ports use MiniLM but the schema works for both.

The cross-diff checklist (`cross-diff-checklist.md`) catches *undocumented* deviations; a noted deviation passes the audit. Don't try to force every port to be byte-identical when a library API genuinely forbids it.

### Cross-port numerical-invariant smoke testing

Use cases that produce deterministic numerical outputs (the recommendation-engine demo's session-blended search returns p001 at `d=0.340, score=0.175` for a standard query) should bake one such invariant into the smoke checklist:

> After clicking p001 twice, the next session-blended search must return p001 first with `d ≈ 0.340, score ≈ 0.175`. Any port whose numbers differ by more than ~0.01 has a bug in the encoder, the byte packing, the cosine math, or the EWMA blend.

The recommendation-engine ports running MiniLM through ONNX (Rust, Jedis, Lettuce, Ruby, PHP after the L2-normalise fix) all match to four decimals; the .NET port using `bge-micro-v2` produces different numbers but the *shape* of the result (p001 first, identical score-from-distance arithmetic) holds. Treat the invariant as a per-model expected-value table, not a single hardcoded number.

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
