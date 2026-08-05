# Testing and evaluating TCE examples

Two environments and one Codex gate. Client identity for all of them comes from
`build/example-test-harness/clients.tsv`.

## Which environment

| | `--portable` (default) | `--fidelity` |
|---|---|---|
| Dependencies | self-bootstrapped into `work/`, **cached** | tracked manifests in `fidelity/`, reinstalled every run |
| Client repos | none needed | clones required (`bootstrap.sh`) |
| C# / PHP | local stubs (`dotnet/stubs.cs`) | the real `Doc.csproj` / real PHPUnit |
| Clients | 13 (no C) | 13 (no RedisVL) |
| Speed | seconds once warm | minutes — full toolchain install per client |

**Iterate in portable, confirm in fidelity.** Portable is the fast loop because `work/`
persists between runs. Fidelity is the pre-merge check: it runs the example the way the
client repo will, which is the only way to catch a failure caused by the real test base
class, the real dependency versions, or the real project layout.

```bash
redis-server --daemonize yes                       # scratch instance — the harness FLUSHes it
build/example-test-harness/run.sh cmds_hash                    # portable, all clients
build/example-test-harness/run.sh cmds_hash redis-py jedis     # portable, some clients
build/example-test-harness/run.sh --fidelity cmds_hash         # fidelity
build/example-test-harness/run.sh --list cmds_hash             # resolve sources only, no Redis
```

`--list` is the fastest way to answer "did it even find my file?" before blaming a toolchain.

## Setting up fidelity mode

```bash
build/example-test-harness/bootstrap.sh              # scaffold + clone/update client repos
build/example-test-harness/bootstrap.sh --no-clone   # scaffold only
build/example-test-harness/bootstrap.sh --check      # report gaps, change nothing
```

It materialises `tmp/clients/examples/` (gitignored) from `fidelity/` and generates each
client's `run.sh`. The wrappers are generated, not tracked, because they are one to three
lines each and differed only in the command — three different argument conventions between
them was what made the old environment impossible to drive. Re-run it any time; it's
idempotent.

`bootstrap.sh` ends with a toolchain report. A `MISSING` line there is why a client SKIPs.

## Why the Redis phase is serial

Several examples call `FLUSHALL`/`FLUSHDB`, and the harness flushes before each client, so
runs cannot share a Redis instance concurrently. Per-DB isolation doesn't help — `FLUSHALL`
crosses databases. Running each client against its own instance would mean rewriting the
connection string in the example under test, which defeats the point of testing what ships.

So the harness runs clients one at a time. **The parallelism in this workflow is in Phase 2
code generation, not test execution.** Portable mode's dependency cache is what makes the
iteration loop fast; fidelity mode reinstalls everything per client by design (see
"Teardown", below).

## Teardown

Every fidelity wrapper deletes its dependency cache on exit (`venv`, `node_modules`,
`target`, `vendor`, `Cargo.lock`, `.gems`). This is deliberate — it matches the hand-built
environment and guarantees no stale artifacts — but it means fidelity mode cannot be made
fast, and dependency/build work cannot be hoisted into a parallel phase. If fidelity runs
ever need to be quick, that's the trade to revisit first.

Portable mode caches in `work/` and does not tear down.

## Traps this harness now guards against

These are all real failures that produced green results before:

- **Surefire runs zero tests and exits 0.** The Java classes are named `*Example`, not
  `*Test`, so a `pom.xml` without `<include>**/*Example.java</include>` matches nothing and
  "passes". `fidelity/pom-lettuce-async.xml` and `pom-lettuce-reactive.xml` were both
  missing it. The generated Java wrapper now fails unless it sees `Tests run: [1-9]`.
- **A wrapper's exit code was the teardown's.** Every original wrapper ended with
  `rm -fr <deps>`, so the script exited 0 whatever the test did — a failing example reported
  success. The generated wrappers capture `rc` before teardown and `exit $rc`.
- **`dotnet test` matching no tests.** If the `[Fact]` doesn't survive outside a `REMOVE`
  block, the filter matches nothing. The generated C# wrapper treats
  `No test matches`/`No test is available` as failure.
- **Wrong-case example paths.** `cmds_*` sets use `local_examples/<set>/NRedisStack/` while
  `geoindex`, `search_quickstart`, and `time_series_tutorial` use `nredisstack/`. Both are
  tracked in git. On a case-insensitive filesystem (macOS default) a glob on the wrong
  spelling succeeds and yields a path that doesn't exist in git and fails on Linux CI, so
  resolution matches directory names with exact case.
- **One C# file counted as four clients.** Four `clients.tsv` rows share the `dotnet`
  runner. Only the primary row may claim a legacy path entry, or a single `.cs` file gets
  reported as four passing clients — and an NRedisStack-flavoured file gets credited to the
  SE.Redis tab.

## Known divergence: Java versions

| | jedis | lettuce-core |
|---|---|---|
| portable (`pom-*.xml`) | 7.5.3 | 6.5.5.RELEASE |
| fidelity (`fidelity/pom-*.xml`) | 7.4.0 | 7.4.0.RELEASE |

Not yet reconciled. The fidelity pins are what the current `local_examples/` Java files were
actually tested against, so they're the known-good pair; the portable jedis 7.5.3 bump was
deliberate (the search examples need the `RedisClient` API it introduced). Settling on one
version per client requires running both Java toolchains against the search sets and the
Java-heavy command sets. Until that's done, **a Java example that passes in one mode may
fail in the other**, and that's information rather than a bug.

## Codex evaluation (Phase 4)

An independent reviewer with fresh context. It catches what the harness structurally cannot:
the harness proves the code *runs*, not that it's the right code. Wrong `>>>` output
comments, drifted step names, an API the docs shouldn't showcase, a C# file in the wrong
flavour, scaffolding that leaks into the rendered page — all of these pass tests.

The binary ships inside the ChatGPT desktop app and is **not on `PATH`**:

```bash
CODEX="$(command -v codex || echo /Applications/ChatGPT.app/Contents/Resources/codex)"
```

This makes the gate macOS-and-desktop-app dependent, which is why it's a local pre-merge
step rather than CI.

One invocation per client, in parallel (these are read-only, so they don't contend):

```bash
SKILL=.claude/skills/tce-examples
"$CODEX" exec \
  --cd "$PWD" \
  --sandbox read-only \
  --output-schema "$SKILL/schema/codex-verdict.json" \
  -o "$TMPDIR/verdict-$CLIENT.json" \
  "Review the TCE example at $FILE for the $CLIENT client.

   Reference implementation (the spec): $REFERENCE
   Step names, exactly: $STEPS
   Client API signatures: data/command-api-mapping/$COMMAND.json
   Per-client conventions: $SKILL/assets/$ASSETS/*_TEST_PATTERNS.md

   Check, in priority order:
   1. Do the '>>> ' output comments match what this client actually returns, including
      type and formatting? (Tests passing does not prove this.)
   2. Are step names identical to the reference, spelled the same way?
   3. Are the method signatures the ones in the API mapping?
   4. Would any scaffolding, assertion, banner comment, or REMOVE/HIDE content reach the
      rendered page?
   5. For C#: does the presence or absence of 'using NRedisStack' match the intended tab?

   Report only actionable defects in this file. Do not restate what is correct."
```

`--output-schema` forces schema-valid JSON, so the orchestrator can gate on it without
parsing prose. Read `.codex/skills/claude-review/references/tce-review-patterns.md` for the
recurring defect classes; it's a map of where to look, not evidence.

**Gate:** no unresolved `severity: "high"`. Verify every finding against the current file
before acting on it — a parallel agent may already have fixed it.
