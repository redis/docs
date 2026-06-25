---
name: redis-use-case-ports
description: Port a Redis use-case example (cache-aside, session store, rate limiter, leaderboard, etc.) to all 9 supported client libraries in parallel, with cross-client synthesis and audit
---

# Redis Use-Case Client Ports

This skill describes how to implement a single Redis use case across all 9 client libraries (`redis-py`, `node-redis`, `go-redis`, Jedis, Lettuce, StackExchange.Redis, Predis, `redis-rb`, `redis-rs`) — fast, consistently, and with a meaningful end-to-end review.

It is intended for any agent that can spawn parallel sub-agents and synthesise their outputs. It assumes the host repo is [`redis/docs`](https://github.com/redis/docs) and that each use case lives under `content/develop/use-cases/<use-case-name>/`.

## When to use this skill

Use this skill when:

- A new Redis use case has been scoped (intro page draft, helper API surface, demo behaviour).
- The same example needs to be implemented across all 9 client libraries with consistent helper API, demo behaviour, and prose structure.
- You want to avoid the consistency drift, missed audits, and per-client divergence that come with implementing 9 ports serially.

Do NOT use this skill for:

- Single-language code samples (use [`generate-tce-examples`](../generate-tce-examples/SKILL.md) for tabbed multi-language examples within a single doc page).
- Bug fixes on an existing use case (one targeted edit doesn't need the fan-out).
- Cross-cutting refactors that touch many use cases at once (handle per-use-case, in sequence).

## Workflow at a glance

The workflow has seven phases. Phase 1 is sequential and human-reviewed; phases 2–6 are mechanical and benefit from parallelism + automated review.

1. **Reference implementation** (sequential, human-in-the-loop) — One language (default: `redis-py`). Establishes conventions and acts as the spec for the other 8.
2. **Parallel build** — Spawn 8 sub-agents in one message, one per remaining client. Each follows [`assets/brief-template.md`](assets/brief-template.md) and returns a report per [`assets/report-template.md`](assets/report-template.md).
3. **Synthesis** — Read all 8 reports. Identify cross-cutting issues, spec ambiguities, and retrofit candidates (including for the reference implementation).
4. **Targeted audit** — Spawn code-reviewer sub-agents per bug class from [`assets/audit-checklist.md`](assets/audit-checklist.md), each scanning all 9 implementations for that specific class.
4b. **Independent review** — Hand the full codebase to a fresh reviewer (different model, no context) to catch what structured audits missed. Append any new bug classes to `assets/audit-checklist.md`.
5. **Retrofit** — Apply fixes. Parallel fan-out if mechanical; sequential (in the main thread) if judgement-heavy or needing user input.
6. **Cross-client diff** — Final consistency pass against [`assets/cross-diff-checklist.md`](assets/cross-diff-checklist.md).

Each phase has a specific output and gate; do not skip phases.

## Phase 1 — Reference implementation

Goal: produce one working client implementation that establishes every convention the other 8 will follow.

Steps:

1. Draft the use-case landing page (`content/develop/use-cases/<use-case-name>/_index.md`) following the section skeleton in [`assets/redis-conventions.md`](assets/redis-conventions.md#use-case-landing-page).
2. Implement the reference client. Default to `redis-py` because Python's syntax surfaces design decisions most clearly.
3. End-to-end smoke-test against a local Redis. Verify the demo runs in a browser and the headline behaviours work.
4. **Pause for user review** before continuing to Phase 2. The reference implementation's conventions propagate to 8 parallel sub-agents — getting it right matters.

Outputs of Phase 1:

- `content/develop/use-cases/<use-case-name>/_index.md` (landing page)
- `content/develop/use-cases/<use-case-name>/redis-py/` (full implementation: guide + helper + primary + demo server)
- A captured helper API surface (method names, return shapes) that all other clients must match

## Phase 2 — Parallel build

Goal: produce 8 client implementations in one wall-clock unit instead of eight.

Spawn 8 `general-purpose` sub-agents in a **single message** (multiple Agent tool calls in one turn so they run concurrently). Each gets:

- The full brief from [`assets/brief-template.md`](assets/brief-template.md), filled in with the use case specifics.
- A pointer to the reference implementation (path + helper API surface).
- The HTML template at [`assets/html-template.html`](assets/html-template.html), to be inlined in the target language's preferred string-literal style.
- The target client (one of: `nodejs`, `go`, `java-jedis`, `java-lettuce`, `dotnet`, `php`, `ruby`, `rust`).
- A **required** report template (see [`assets/report-template.md`](assets/report-template.md)) the agent must fill in and return.

Sub-agents must:

- Smoke-test their implementation against Redis on a unique port (avoid 8080 / 8769 / and other ports commonly in use).
- Run `redis-cli FLUSHDB` before their tests.
- Report stampede-test results (concurrency, primary reads, elapsed ms).
- NOT assume cross-client coordination — each agent works in isolation.

Outputs of Phase 2:

- Eight client implementations, each with `_index.md`, helper file, primary file, demo server, and any language-specific config (`go.mod`, `Cargo.toml`, `*.csproj`).
- Eight structured reports collected in the calling agent's context.

## Phase 3 — Synthesis

Goal: extract cross-cutting findings that no single sub-agent could see.

Read all 8 reports plus your memory of the reference implementation. Look for:

- **Repeated spec ambiguities.** If 3+ agents asked the same question, the spec is unclear. Fix it.
- **Pattern divergence.** Agents that diverged in the same way usually indicate a missing convention. Add it.
- **Cross-client asymmetries that matter.** *"Lettuce flagged connection-scoped transaction state; Jedis didn't mention it because Jedis uses per-call connections from a pool"* — this comparison is only visible at synthesis time.
- **Retrofit candidates for the reference implementation.** Sub-agents often find better idioms; if one applies cleanly to the reference, propose it.

Decide which findings should:

- Apply to all clients (retrofit pass in Phase 5).
- Apply to a subset (document why).
- Stay as per-client deviations (document why in the relevant guide's "Production usage" section).

Surface judgement-heavy decisions to the user before Phase 5. Do not silently apply cross-cutting changes that affect the user-facing API or prose.

## Phase 4 — Targeted audit

Goal: catch known bug classes before users do.

For each row in [`assets/audit-checklist.md`](assets/audit-checklist.md), spawn an `Explore` or code-reviewer sub-agent that scans all 9 implementations for **that specific class**. Audits are sharper when scoped to one bug pattern at a time — broad "look for issues" passes miss the specific stuff.

Examples of audit prompts:

- *"Audit every WATCH/MULTI/EXEC site in the 9 client implementations at `content/develop/use-cases/<use-case-name>/` for whether they are covered by serialisation when the connection is shared. Flag any uncovered site."*
- *"Audit every deadline / timeout calculation in the 9 client implementations for integer overflow. The .NET case uses Environment.TickCount; check that all clients use a clock that doesn't wrap within the relevant window."*

Append any new bug classes discovered during this audit (or by external review like Cursor's bugbot) to [`assets/audit-checklist.md`](assets/audit-checklist.md). This file is a living document — every future project benefits from the rows added in this one.

## Phase 4b — Independent review

Goal: catch bugs the structured audits missed by handing the codebase to a fresh reviewer with no context.

Phase 4's targeted audits work well for known bug classes (the rows in `audit-checklist.md`). They're less good at the unknown unknowns — bugs where the *shape* of the audit prompt anchors the auditor to a false-positive answer. The pub/sub project's first Phase 4 said all 8 sibling ports passed the subscribe-ack check; an independent Codex review then found that Jedis returned its Subscription before the spawned thread had even sent the SUBSCRIBE, PHP's `waitForSubscription` silently fell through on timeout, PHP's Linux branch recorded the wrong PID, and Rust's duplicate-name check released its lock across the await. All four were real correctness bugs that Phase 4 had cleared.

Run an independent reviewer (different model, fresh context — the [`codex:rescue`](../../codex/) skill is a good fit, with a prompt that lists files plus the specific concerns: correctness bugs, cross-client divergence, doc drift) **before** declaring Phase 4 done. Treat its findings as candidates for the Phase 5 retrofit, with the orchestrator triaging which to accept (some "race conditions" are safe by accident — e.g. redis-py and go-redis subscribe-ack — because the synchronous socket write closes the window before the helper returns).

**Verify each finding against the current file before fixing it.** Independent reviewers occasionally work from a stale snapshot — the file they reviewed was correct when they started, but a parallel agent kept editing it during the review window. Several of the Jedis and PHP findings on the semantic-cache project turned out to be the agent re-discovering a fix that had already landed minutes earlier (the EXISTS-race comment, the 1 MiB body cap, the docs paragraph about classpath resources). `grep` the finding's described pattern against the current file before opening an Edit — a one-second sanity check saves an inadvertent revert.

Add a new row to `assets/audit-checklist.md` for any *class* of bug the reviewer found that wasn't already covered, so the next project's Phase 4 won't have to rediscover it.

## Phase 5 — Retrofit

Goal: apply the fixes from synthesis + audit.

Decision tree:

- **Mechanical change in same place across all clients** (e.g., rename a method) → spawn N parallel agents, each given the same instruction.
- **Mechanical change with per-client variations** (e.g., apply the equivalent of `TickCount64` for each language's clock) → sequential in the main thread, lower risk of subtle per-client bugs.
- **Judgement-heavy change** (e.g., "add not-found sentinel caching") → discuss with user, then sequential.

After retrofitting, run smoke-tests for the affected clients again. A retrofit that breaks the smoke test is worse than the original bug.

## Phase 6 — Cross-client diff

Goal: confirm the 9 clients are consistent on the things that should be consistent.

Run a final pass against [`assets/cross-diff-checklist.md`](assets/cross-diff-checklist.md). This can be done by a sub-agent with read-only access. Report any divergences and either justify them (per-language idiom) or fix them.

## Anti-patterns to avoid

- **Spawning Phase 2 before user-reviewed Phase 1.** Conventions established in Phase 1 propagate to 8 agents. Getting Phase 1 wrong wastes 8 implementations of work.
- **Treating sub-agent reports as just code.** If you don't ask for structured insight in the brief, you don't get it. Phase 3 synthesis depends on Phase 2 reports being rich.
- **Skipping Phase 4 because everything compiled.** Compilation passes are not bug audits. The Lettuce `txLock`-missing-in-`loadWithSingleFlight` bug and the .NET `Environment.TickCount` 24.9-day wraparound both compiled cleanly and passed smoke tests. Phase 4 exists specifically to catch this kind of issue.
- **Letting `audit-checklist.md` stagnate.** The checklist's value compounds across projects. Every external bug found should be added.
- **Doing Phase 5 retrofit purely sequentially "to be safe."** That erases the time savings of Phase 2. Use the decision tree.

## Maintenance

This skill grows over time:

- New bug classes go into [`assets/audit-checklist.md`](assets/audit-checklist.md).
- New consistency rules go into [`assets/cross-diff-checklist.md`](assets/cross-diff-checklist.md).
- HTML/UI improvements go into [`assets/html-template.html`](assets/html-template.html) once and propagate via the next use case.
- Redis-docs-specific conventions go into [`assets/redis-conventions.md`](assets/redis-conventions.md).

Keep `SKILL.md` itself focused on the workflow. The concrete artefacts live in `assets/`.

## Reference projects

- [`content/develop/use-cases/cache-aside/`](../../../content/develop/use-cases/cache-aside/) — the worked example that produced this skill. Includes the conventions, helper API shape, and prose structure that the templates encode.
- [`content/develop/use-cases/session-store/`](../../../content/develop/use-cases/session-store/) — earlier worked example. Same shape, different helper API.
- [`content/develop/use-cases/job-queue/`](../../../content/develop/use-cases/job-queue/) — the project that introduced rows 11–13 of [`audit-checklist.md`](assets/audit-checklist.md) (token-checked atomic state transitions, crash-window fallback timer, shared-keyspace collision in parallel smoke tests).
- [`content/develop/use-cases/pub-sub/`](../../../content/develop/use-cases/pub-sub/) — the first non-keyspace use case ported. Introduced rows 14–18 of [`audit-checklist.md`](assets/audit-checklist.md) (subscribe-ack race, concurrent-name reservation, detached-worker PID capture, silent timeout fallthrough, server-wide PUBSUB introspection) plus the pub/sub conventions section in [`redis-conventions.md`](assets/redis-conventions.md). Also the project that motivated adding Phase 4b (independent review) after Codex caught four real bugs that Phase 4 cleared.
- [`content/develop/use-cases/recommendation-engine/`](../../../content/develop/use-cases/recommendation-engine/) — the first ML / vector-search use case. Introduced the **ML / vector-search use cases** section in [`redis-conventions.md`](assets/redis-conventions.md) (per-client embedding library table, pre-computed `catalog.json` wire format, FFI / Ruby-version setup blockers, per-port deviation conventions) and rows 24–28 of [`audit-checklist.md`](assets/audit-checklist.md) (vector dim mismatch in client-side blend helpers, L2 normalisation silently skipped by the embedding wrapper, TAG escape must include the backslash itself, connection-wide state toggle race on a shared client, weight=0 must disable not normalise to default). Each of the five new rows came from a real bug — bugbot or Codex caught all of them; the Python reference shipped with the TAG-escape bug originally.
- [`content/develop/use-cases/feature-store/`](../../../content/develop/use-cases/feature-store/) — the first streaming-feature-store use case (HEXPIRE / HTTL per-field TTL + a long-lived in-process worker thread next to the demo server). Introduced the **Streaming-worker / background-task patterns** section in [`redis-conventions.md`](assets/redis-conventions.md) (pre-flight in-flight flag, worker lifetime decoupled from request lifetime, stop semantics, per-client HEXPIRE pipeline reply-shape table) and rows 35–37 of [`audit-checklist.md`](assets/audit-checklist.md) (HEXPIRE / HTTL per-field reply-code checking, pause-and-wait-idle race in worker-thread reset paths, worker stop with bounded join + silent thread abandonment). The reference Python implementation shipped without the in-flight flag and the stop-timeout recovery; Codex caught both on later ports and the Python retrofit followed.
- [`content/develop/use-cases/semantic-cache/`](../../../content/develop/use-cases/semantic-cache/) — the second ML / vector-search use case. Cache-on-LLM-responses backed by Redis Search KNN with a thresholded hit/miss decision and tenant/locale/model-version metadata filtering. Introduced rows 29–34 of [`audit-checklist.md`](assets/audit-checklist.md): embedder Predictor / Session thread-safety on shared instances (DJL needs `synchronized`, ONNX is fine); library config keys that look real but don't take effect (WEBrick's `MaxRequestBodySize` is not an option name; the body cap must be enforced in user code); lockfile pinning a newer runtime than the manifest declares (composer.lock requiring PHP 8.4 while composer.json said `^8.2`); NaN / Inf parsing via language-specific quirks (PHP `(float)"nan"` → 0.0 silently, must use textual rejection before parsing); per-language strings in HTML that's shared across language demos (badge text, default threshold must be populated via `/state` at first load); docs wire-form snippets must show escaped TAG values (`gpt\-4\.5\-2026`, not `gpt-4.5-2026`). Also the project that motivated the Phase 4b note about verifying independent-review findings against the current file before applying — several Jedis and PHP "missing" findings were actually re-discoveries of fixes that had landed minutes earlier.
