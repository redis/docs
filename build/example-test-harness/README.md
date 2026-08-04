# TCE example test harness

Runs a docs example set's per-client source files (from `local_examples/`) against a
**live throwaway Redis on `localhost:6379`**, using each library's real in-file
assertions. Built for the DOC-6823 work (making `try_it="false"` examples self-contained),
but reusable for any example set.

## Usage

```bash
./run.sh [--portable|--fidelity] <example_set> [client ...]
# all clients, portable (default):
./run.sh ss_tutorial
# one/some:
./run.sh set_tutorial rust-sync dotnet
# resolve source paths only — no Redis, no toolchains:
./run.sh --list cmds_hash
```

**Two modes.** `--portable` (default) is the original behaviour: each toolchain is
self-bootstrapped into a cached `work/` dir, no client repo clones needed, with C#/PHP running
against local stubs. `--fidelity` runs in `tmp/clients/examples/` using the tracked manifests in
`fidelity/` and real client repo clones, so an example executes the way it does upstream — run
`./bootstrap.sh` first. Iterate in portable; confirm in fidelity.

`example_set` no longer needs a code change. Paths resolve by convention from
`local_examples/<set>/<client>/`, using the directory aliases in `clients.tsv`; the explicit
`legacy_src_path()` case block covers only the older sets whose files live elsewhere
(`local_examples/tmp/datatypes/...`, `ruby/`, `php/`, `client-specific/`). Results print as a
matrix; per-run logs land in `results/<set>_<client>.log`.

⚠️ Several examples call `FLUSHALL`/`FLUSHDB`, and the harness flushes before each run.
Point it only at a scratch Redis. Runs are serial for this reason.

## Compatibility notes

If you have muscle memory or notes from the pre-`clients.tsv` version:

- **Old client names still work.** `python`, `node`, `go`, `php`, `dotnet` and the rest are
  accepted as aliases and resolve to the same files. `clients.tsv` column `key` holds the new
  canonical names (`redis-py`, `node-redis`, `go-redis`, `predis`, `nredisstack`).
- **Log filenames use the canonical key.** `results/cmds_hash_redis-py.log`, not
  `..._python.log`. Anything grepping the old path needs updating.
- **A bare `./run.sh <set>` now attempts 16 clients, not 12** — `lettuce-sync` (which had a POM
  and a runner but was missing from `CLIENTS_ALL`) plus the three additional C# rows. Clients
  with no source for the set report `SKIP`, so the extra rows are informational.
- **An unknown client name is now a hard error** (exit 2) instead of a mid-run
  "command not found".
- **Seven sets became testable** that previously had no entry and were skipped by omission:
  `cmds_hash`, `cmds_string`, `cmds_generic`, `cmds_cnxmgmt`, `arrays_tutorial`,
  `fastapi_tutorial`, `vecset_tutorial`. `cmds_cnxmgmt` is deliberately skipped via
  `illustrative_reason()` — its files contain only `auth1`/`auth2`, which need a `test-user`
  ACL identity a scratch Redis has no reason to define. Skipping it explicitly keeps the rule
  that **a red result always means a real defect**.

## Clients & how each is run

| Client | Toolchain | Notes |
|---|---|---|
| python | venv + `redis` | run script directly (`assert`) |
| node | `npm i redis`, ESM | run as `.mjs` |
| ioredis | `npm i ioredis`, ESM | run as `.mjs` (separate `work/ioredis` dir from node-redis) |
| go | module + `go-redis` | `go test`; needs a sibling `package example_commands` stub |
| jedis | Maven + `jedis:7.5.3` | surefire include `**/*Example.java` (classes aren't `*Test`) |
| lettuce-sync / -async / -reactive | Maven + `lettuce-core:6.5.5.RELEASE` | same surefire include |
| ruby | `redis` gem | run script (`raise`/local `assert_equal`) |
| rust-sync | Cargo + `redis = "1.3"` | file is `#[cfg(test)]` → dropped in `src/lib.rs`, `cargo test` |
| rust-async | Cargo + `redis` (tokio-comp) + `tokio` | `#[tokio::test]` |
| php | Composer + `predis/predis` | `bootstrap.php` requires `vendor/autoload.php` (so `Predis\Client` resolves without an in-file `require`) and stubs `PredisTestCase` asserts; reflection finds the `test*` method |
| dotnet | `dotnet test` + xunit + `StackExchange.Redis` | `dotnet/stubs.cs` stands in for NRedisStack's `AbstractNRedisStackTest`/`EndpointsFixture`/`[SkippableFact]`/`DocsTests` collection |

## Gotchas learned

- **Version pins matter.** `redis-rs` is now **1.x** (`1.3`), not `0.27` — the old pin failed
  to compile `flushall` in a REMOVE block. Portable: Jedis 7.5.3, Lettuce 6.5.5,
  StackExchange.Redis 3.0.0.
- **Surefire only runs `*Test`/`*Tests` by default** — these classes are `*Example`, so the
  POMs add an explicit `<include>`. First run looked green with **zero tests** without it.
  `fidelity/pom-lettuce-async.xml` and `pom-lettuce-reactive.xml` shipped without it and were
  silently reporting PASS having executed nothing. The generated fidelity Java wrapper now fails
  unless it observes `Tests run: [1-9]`, and the C# wrapper fails on `No test matches`.
- **A wrapper must not end with its teardown.** Every original `tmp/clients/examples/*/run.sh`
  ended with `rm -fr <deps>`, so the script's exit status was the `rm`'s — always 0 — and a
  failing example reported success. Generated wrappers capture `rc` before teardown and
  `exit $rc`.
- The test scaffolding lives in `REMOVE_START` blocks; for py/ruby/node/go/rust/jedis/lettuce
  it's self-contained (stdlib asserts / JUnit), but **C# and PHP reference their repo's own
  test base classes**, which is why they need the stubs above.

## Adding a new example set

Usually nothing to do. If the files live at `local_examples/<set>/<client>/`, resolution finds
them by convention — check with `./run.sh --list <set>`.

You only need to touch `run.sh` when:

- the files live somewhere non-conforming → add lines to `legacy_src_path()`;
- a client directory uses a new spelling → add it to that client's `local_dirs` aliases in
  `clients.tsv` (pipe-separated). Match the on-disk case exactly: `cmds_*` sets use
  `NRedisStack/` while `geoindex` and friends use `nredisstack/`, and a case-insensitive
  filesystem will happily resolve the wrong one into a path that doesn't exist in git;
- the set cannot run against a scratch Redis by design → add it to `illustrative_reason()`
  so it reports `SKIP` with a reason instead of `FAIL`.

## Fidelity mode dependency versions

`fidelity/` holds the tracked manifests. They intentionally differ from the portable POMs:

| | portable | fidelity |
|---|---|---|
| jedis | 7.5.3 | 7.4.0 |
| lettuce-core | 6.5.5.RELEASE | 7.4.0.RELEASE |

The fidelity pins are what the current `local_examples/` Java files were actually tested
against; the portable jedis 7.5.3 bump was deliberate (the search examples need the
`RedisClient` API it introduced). **Not yet reconciled** — a Java example can pass in one mode
and fail in the other. Settling on one version per client means running both Java toolchains
against `search_quickstart`, `geoindex`, and the Java-heavy command sets.
