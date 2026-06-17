# Client source map

Where each client keeps its Redis command definitions. Use this to find the file(s) to read.
**Treat it as a starting point** — for brand-new commands the exact files may not be listed
here yet; use the "finding new command files" recipe below.

## Repos, IDs, branches

| Client ID | Repo | Default branch | Language |
|---|---|---|---|
| `redis_py` | github.com/redis/redis-py | `master` | Python |
| `redisvl` | github.com/redis/redis-vl-python | `main` | Python |
| `node_redis` | github.com/redis/node-redis | `master` | TypeScript |
| `ioredis` | github.com/redis/ioredis | `main` | TypeScript |
| `go-redis` | github.com/redis/go-redis | `master` | Go |
| `jedis` | github.com/redis/jedis | `master` | Java |
| `lettuce_sync` / `lettuce_async` / `lettuce_reactive` | github.com/redis/lettuce | `main` | Java |
| `nredisstack_sync` / `nredisstack_async` | github.com/redis/NRedisStack | `master` | C# |
| `php` | github.com/predis/predis | `main` | PHP |
| `redis_rs_sync` / `redis_rs_async` | github.com/redis-rs/redis-rs | `main` | Rust |

(Branch names drift; if a fetch 404s, try `main`/`master`/`develop`.)

## Where command definitions live

- **redis_py** — `redis/commands/core.py`; module commands under
  `redis/commands/{json,search,vectorset,timeseries}/commands.py`.
- **node_redis** — one file per command under `packages/client/lib/commands/<CMD>.ts`
  (uppercase, e.g. `ARSET.ts`, `GETRANGE.ts`). Module commands live under
  `packages/{json,search,time-series}/lib/commands/`. Variants use suffixes
  (`ARGREP_WITHVALUES.ts`, `XADD_NOMKSTREAM.ts`).
- **ioredis** — `lib/utils/RedisCommander.ts` (generated interface).
- **go-redis** — split by type at repo root: `string_commands.go`, `list_commands.go`,
  `hash_commands.go`, …, plus `json.go`, `search_commands.go`, `vectorset_commands.go`,
  `timeseries_commands.go`. New command families often get a new `<type>_commands.go`.
- **jedis** — `src/main/java/redis/clients/jedis/Jedis.java` plus per-area interfaces under
  `src/main/java/redis/clients/jedis/commands/` and module dirs (`json/`, `search/`,
  `timeseries/`).
- **lettuce** — per-area interfaces under
  `src/main/java/io/lettuce/core/api/{sync,async,reactive}/Redis<Area>Commands.java`
  (e.g. `RedisStringCommands.java`). The three variants differ only by return wrapper
  (`V` vs `RedisFuture<V>` vs `Mono<V>`/`Flux<V>`), so read one and adapt.
- **nredisstack** — module commands under `src/NRedisStack/{Json,Search,TimeSeries}/...`;
  **core** commands come from the StackExchange.Redis dependency
  (`github.com/StackExchange/StackExchange.Redis`, `src/StackExchange.Redis/Interfaces/IDatabase.cs`
  and `IDatabaseAsync.cs`).
- **php (predis)** — `src/ClientInterface.php` for most signatures; container commands
  (XGROUP, XINFO) define subcommands in `@method` docblocks under `src/Command/Container/`.
- **redis-rs** — `redis/src/commands/mod.rs` (the `implement_commands!` macro block).

## Finding new command files (the AR* lesson)

When a command family is new, the map above won't list it. List the client's command
directory directly and filter:

```bash
# node_redis: every command is its own file — list the AR* ones
curl -s "https://api.github.com/repos/redis/node-redis/contents/packages/client/lib/commands?ref=master" \
  | grep -oE '"name": "AR[A-Z_]*\.ts"' | sort -u
```

For clients that group commands into one file (go-redis, redis-py, lettuce, jedis), fetch the
likely file and grep it for the command token (e.g. `ARSET`, `arSet`, `ar_set`) to confirm
presence and find the method.

**Network:** these calls hit `api.github.com` and `raw.githubusercontent.com`. The default
command sandbox blocks `raw.githubusercontent.com` — run fetches with the sandbox disabled,
or allow the host via `/sandbox`.
