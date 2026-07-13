# TCE example test harness

Runs a docs example set's per-client source files (from `local_examples/`) against a
**live throwaway Redis on `localhost:6379`**, using each library's real in-file
assertions. Built for the DOC-6823 work (making `try_it="false"` examples self-contained),
but reusable for any example set.

## Usage

```bash
./run.sh <example_set> [client ...]
# all clients:
./run.sh ss_tutorial
# one/some:
./run.sh set_tutorial rust-sync dotnet
```

`example_set` ∈ { `ss_tutorial`, `set_tutorial` } today. Results print as a matrix;
per-run logs land in `results/<set>_<client>.log`.

⚠️ Several examples call `FLUSHALL`/`FLUSHDB`, and the harness flushes before each run.
Point it only at a scratch Redis.

## Clients & how each is run

| Client | Toolchain | Notes |
|---|---|---|
| python | venv + `redis` | run script directly (`assert`) |
| node | `npm i redis`, ESM | run as `.mjs` |
| go | module + `go-redis` | `go test`; needs a sibling `package example_commands` stub |
| jedis | Maven + `jedis:5.2.0` | surefire include `**/*Example.java` (classes aren't `*Test`) |
| lettuce-async / -reactive | Maven + `lettuce-core:6.5.5.RELEASE` | same surefire include |
| ruby | `redis` gem | run script (`raise`/local `assert_equal`) |
| rust-sync | Cargo + `redis = "1.3"` | file is `#[cfg(test)]` → dropped in `src/lib.rs`, `cargo test` |
| rust-async | Cargo + `redis` (tokio-comp) + `tokio` | `#[tokio::test]` |
| php | Composer + `predis/predis` | `bootstrap.php` stubs `PredisTestCase` asserts; reflection finds the `test*` method |
| dotnet | `dotnet test` + xunit + `StackExchange.Redis` | `dotnet/stubs.cs` stands in for NRedisStack's `AbstractNRedisStackTest`/`EndpointsFixture`/`[SkippableFact]`/`DocsTests` collection |

## Gotchas learned

- **Version pins matter.** `redis-rs` is now **1.x** (`1.3`), not `0.27` — the old pin failed
  to compile `flushall` in a REMOVE block. Jedis 5.2, Lettuce 6.5.5, StackExchange.Redis 2.8.x.
- **Surefire only runs `*Test`/`*Tests` by default** — these classes are `*Example`, so the
  POMs add an explicit `<include>`. First run looked green with **zero tests** without it.
- The test scaffolding lives in `REMOVE_START` blocks; for py/ruby/node/go/rust/jedis/lettuce
  it's self-contained (stdlib asserts / JUnit), but **C# and PHP reference their repo's own
  test base classes**, which is why they need the stubs above.

## Adding a new example set

Add one block of `case "$set:$client"` → source-path lines in `src_path()` in `run.sh`.
Nothing else changes; deps are cached under `work/`.
