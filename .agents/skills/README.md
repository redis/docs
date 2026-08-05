# Agent Skills

This directory holds skills written for the Augment agent. It is **no longer the primary
location** — Claude Code skills live in [`.claude/skills/`](../../.claude/skills/) and Codex
skills in [`.codex/skills/`](../../.codex/skills/).

## Available Skills

### `redis-use-case-ports`

Orchestrates a full Redis use-case implementation across all 9 supported client libraries
(`redis-py`, `node-redis`, `go-redis`, Jedis, Lettuce, StackExchange.Redis, Predis, `redis-rb`,
`redis-rs`) using a parallel-build → synthesise → audit workflow.

**Use when**: A new use case (cache-aside, session store, rate limiter, leaderboard, etc.)
needs to be ported to all 9 clients with consistent helper APIs, demo behaviour, and prose
structure — and you want parallel sub-agents rather than implementing serially.

**Assets**: `brief-template.md` (for parallel build agents), `report-template.md` (structured
agent output), `audit-checklist.md` (known bug classes — a living document),
`cross-diff-checklist.md` (consistency rules across clients), `redis-conventions.md`
(repo-specific layout and Hugo conventions), and `html-template.html` (shared demo UI).

## Moved: tabbed code examples

`extract-redis-cli-examples` and `generate-tce-examples` have been replaced by a single phased
skill at **[`.claude/skills/tce-examples/`](../../.claude/skills/tce-examples/SKILL.md)**.

It covers the same ground — auditing a page for missing client coverage, then generating
examples across every supported client — plus live testing and Codex review. The per-client
`*_TEST_PATTERNS.md` files and working samples moved with it, into
`.claude/skills/tce-examples/assets/`.

What changed, beyond the location:

- **Auditing is scripted.** `scripts/audit_page.py` wraps the repo's own parsers
  (`build/components/cli_parser.py`, `build/components/markdown_parser.py`) instead of
  restating their rules in prose.
- **Client identity has one source.** `build/example-test-harness/clients.tsv` replaces the
  five overlapping tables the old skill carried, which had drifted from `config.toml`.
- **Generation is parallel.** One sub-agent per client, spawned together, from a shared brief.
- **Testing is driven, not manual.** See below.

## Test environment setup

The tabbed-code-example test environment used to be a zip file passed around by hand. It is
now generated:

```bash
build/example-test-harness/bootstrap.sh        # scaffold tmp/clients/examples/, clone client repos
build/example-test-harness/bootstrap.sh --check   # report gaps, change nothing
```

`bootstrap.sh` materialises the (gitignored) `tmp/clients/examples/` tree from the tracked
manifests in `build/example-test-harness/fidelity/`, clones the client repos it needs, and
reports which toolchains are missing. Then:

```bash
build/example-test-harness/run.sh cmds_hash              # portable: cached deps, no clones needed
build/example-test-harness/run.sh --fidelity cmds_hash   # fidelity: real manifests, real clones
build/example-test-harness/run.sh --list cmds_hash       # just resolve source paths
```

Both modes need a scratch Redis on `localhost:6379` — they `FLUSHALL` between clients, so do
not point them at anything you care about.

See [`.claude/skills/tce-examples/reference/testing.md`](../../.claude/skills/tce-examples/reference/testing.md)
for which mode to use when, and for the false-green traps both modes now guard against.
