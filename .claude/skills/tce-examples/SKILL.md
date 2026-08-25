---
name: tce-examples
description: "Create or extend tabbed code examples (TCEs) — the multi-language code blocks rendered by the clients-example shortcode. Use when a docs page needs client examples added, when auditing a command page for missing client coverage, when an example set needs a new step, or when a client needs backfilling into an existing set. Covers audit, parallel generation across clients, live testing, and Codex review."
---

# Tabbed code examples (TCEs)

Take a docs page that demonstrates Redis commands and produce working, tested examples for every
supported client library, wired into the page with the `clients-example` shortcode.

This is **AI-in-the-loop work.** The parsing is mechanical and already scripted (Phase 0); the
code generation is not. Each client has real API differences, real return-shape differences, and
real idioms — that judgment is yours. What the reference files give you is the durable facts, so
you don't re-derive (or misremember) them.

## The client table

**`build/example-test-harness/clients.tsv` is the single source of truth for client identity** —
display names, component ids, API-mapping keys, `local_examples` directory aliases, filename
conventions, and where each client is testable. Read it before you touch anything:

```bash
column -t -s$'\t' build/example-test-harness/clients.tsv
```

Do not restate its contents in prose, in a brief, or in another table. The five duplicated
client tables in the skill this replaced had all drifted from `config.toml`; that is the failure
mode this file exists to prevent.

## Three file locations, one lifecycle

An example lives in up to three places, and **which one you read from matters**:

| Location | Role | Notes |
|---|---|---|
| `local_examples/<set>/<client>/` | **Staging** — tested, pending upstream merge | Usually the *most complete* version. Has steps the client repo doesn't. |
| Client repo (`repo_path` in clients.tsv) | **Source of truth** — merged upstream | What the site build actually fetches. |
| `tmp/clients/examples/<client>/` | **Test bed** — gitignored, transient | Where files get staged to run. Never author here. |

> **Read `local_examples/` first.** If the file exists there it supersedes the client repo copy.
> Starting from the client repo — or from a blank file — silently drops the pending steps. This
> is the single most common way TCE work goes wrong.

## Phases

Each phase has a gate. Don't skip them; the whole point of the ordering is that a mistake in
Phase 1 gets multiplied by every agent in Phase 2.

### Phase 0 — Audit

```bash
python3 .claude/skills/tce-examples/scripts/audit_page.py content/commands/hset.md
```

Wraps the repo's existing parsers (`build/components/cli_parser.py`,
`build/components/markdown_parser.py`) so the four CLI source formats and the
`> ` / `redis> ` / `127.0.0.1:6379> ` prompt handling stay correct without being restated here.
Emits a human table plus `--json` for a machine-readable work plan: per CLI block, the source
format, line range, commands, `set`/`step` if already wired, existing coverage from
`data/examples.json`, and which clients are missing.

**Gate:** you can name the set id, the step names, and the exact client list before writing code.

### Phase 1 — Reference implementation

Write **one** client by hand — default `redis-py`, because Python surfaces design decisions most
plainly. Test it (Phase 3 for that client alone). This fixes the step names, the command
sequence, and the expected-output comments that every other client must match.

**Gate: show the user the reference before Phase 2.** Its conventions propagate to a dozen
parallel agents; a wrong step name here costs a dozen retrofits.

### Phase 2 — Parallel fan-out

Spawn one subagent per remaining client, **all in a single message** so they run concurrently.
Fill in `assets/brief-template.md` per agent. Each brief must carry:

- The reference implementation file, and the step names as a closed list.
- The client's row from `clients.tsv` (target path, filename, aliases).
- The relevant `data/command-api-mapping/<COMMAND>.json` entries — the real signatures. Do not
  let an agent guess a method name.
- The client's `assets/<assets>/*_TEST_PATTERNS.md` **and** its working sample.
- **The most complete existing version of the file**, per the lifecycle table above, with an
  explicit instruction to extend rather than replace.
- For C#: which flavor. See "The two C# clients" below — this is not optional context.

Each agent returns `assets/report-template.md`. Read all of them before Phase 3: repeated
questions mean the brief was ambiguous, and identical divergences across agents usually mean a
convention is missing rather than that a dozen agents each erred.

### Phase 3 — Test

```bash
redis-server --daemonize yes            # scratch instance; the harness FLUSHes it
build/example-test-harness/run.sh --fidelity cmds_hash
```

See `reference/testing.md` for both environments, what each client needs, and the known traps.

**Gate:** every client PASS, or SKIP with a stated reason. A silent SKIP is a failure.

### Phase 4 — Codex review

An independent reviewer with fresh context, invoked per client in parallel. Catches the class the
harness structurally cannot: tests that pass while the expected-output comments are wrong, step
names that drifted, an API the docs shouldn't showcase, scaffolding that leaks into the rendered
page. Invocation and schema in `reference/testing.md`.

**Gate:** no unresolved `severity: high`.

### Phase 5 — Retrofit

Fix, then re-run Phases 3–4 for touched clients only.

> **Verify each finding against the current file before editing it.** Reviewers work from a
> snapshot; a parallel agent may have already fixed the thing being reported. `grep` for the
> described pattern first — a one-second check that prevents reverting a good fix.

### Phase 6 — Wire into the docs

1. Place files at `local_examples/<set>/<client>/<filename>` per `clients.tsv`.
2. Add or update the shortcode. Use **named** parameters:
   `set`, `step`, `description`, `difficulty`, `buildsUpon`. The guidance in
   `for-ais-only/tcedocs/README.md` on writing descriptions and choosing difficulty is current
   and good — follow it there rather than guessing.
3. Rebuild and confirm the steps landed:
   ```bash
   python3 build/make.py
   jq '.<set> | keys' data/examples.json
   ```

**Gate:** `hugo serve`, open the page, confirm the right tabs appear, the correct step is
highlighted, and no `REMOVE`/`HIDE` scaffolding is visible.

## Using the samples as templates

Each `assets/<client>/sample_*` file is a **working, runnable** example — that's the point, it
gives you a compilable starting shape. Two rules when working from one:

1. **Never copy the banner comment.** Each sample opens with a ~18-line header explaining the
   markers. Comment lines that are not inside a `HIDE` or `REMOVE` block are **published
   verbatim** into the rendered docs. A real example starts directly with `// EXAMPLE: <name>`
   on line 1, optionally `BINDER_ID` on line 2.
2. **Take the structure, not the step list.** Samples deliberately demonstrate several unrelated
   steps to show the range of patterns. A generated example normally covers one command page.

Always read the matching `*_TEST_PATTERNS.md` alongside the sample — it carries the per-client
traps (surefire include rules, Rust file placement, PHP test-base class, C# fixture API).

## Markers

`EXAMPLE:`, `BINDER_ID`, `HIDE_START`/`HIDE_END`, `REMOVE_START`/`REMOVE_END`,
`STEP_START <name>`/`STEP_END`. Full semantics — including what each does to the rendered output
— are specified in `for-ais-only/tcedocs/SPECIFICATION.md`; read it there rather than working
from memory. The structural pattern:

```
EXAMPLE marker  →  HIDE: imports + connection  →  REMOVE: pre-test cleanup
→  STEP: the example code, with `>>>` output comments
→  REMOVE: assertions  →  REMOVE: post-test cleanup  →  HIDE: disconnect
```

**Step naming:** one example per command page → the command name (`hmget`). Multiple → numbered
(`scan1`, `scan2`). Lowercase, concise, and **identical across every client in the set**.

## The two C# clients

`C#-Sync (NRedisStack)` and `C#-Sync (SE.Redis)` are not two codebases. Both are fed from the
same `NRedisStack` repo directory, partitioned by a content filter in `data/components/`:

- imports `using NRedisStack` → the **NRedisStack** tabs
- does **not** import it → the **SE.Redis** tabs
- `using NRedisStack.Tests` is excluded from that test — every file has it for fixtures

So a single `.cs` file feeds one tab or the other, never both, and the deciding factor is an
import line. Most command-page C# examples are SE.Redis-flavored, because plain hash/list/string
commands don't need NRedisStack. Both flavors carry identical test scaffolding, so this is a
**generation** distinction, not a testing one — the same runner handles both.

Getting the flavor wrong puts a working, passing example in the wrong tab. Say which flavor you
want in the brief, and check it in review.

## Validation checklist

- [ ] Every client in the Phase 0 work plan implemented (not "all 12" — read `clients.tsv`)
- [ ] Method signatures taken from `data/command-api-mapping/`, not guessed
- [ ] Step names identical across clients, and matching the reference
- [ ] Pre-existing steps preserved, not overwritten
- [ ] Markers placed so no scaffolding or banner text reaches the rendered page
- [ ] Expected-output comments (`>>>`) match what the client actually returns
- [ ] Assertions and cleanup inside `REMOVE` blocks
- [ ] Test keys deleted both before and after
- [ ] C# files carry the intended flavor

## Guardrails

- **Don't invent method names.** If `data/command-api-mapping/` lacks the command for a client,
  read the client source (see `.claude/skills/command-api-mapping/` for how) or omit that client
  and say so — don't guess a plausible signature.
- **Don't add a client that doesn't support the command.** An empty or wrong tab is worse than
  an absent one.
- **Don't edit `data/examples.json`.** It's generated by `build/make.py`.
- **Don't author in `tmp/clients/`.** It's gitignored and transient; work lands in
  `local_examples/`.
