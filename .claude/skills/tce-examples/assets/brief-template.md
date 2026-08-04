# Phase 2 fan-out brief

Fill this in per client and pass it as the subagent prompt. One agent per client, **all
spawned in a single message** so they run concurrently.

Everything below is required. An agent missing the "most complete existing version" pointer
will create a fresh file and silently drop pending steps — the single most common way this
work goes wrong.

---

## Brief: `{{CLIENT_KEY}}` for example set `{{SET_ID}}`

You are implementing one client's version of a tabbed code example (TCE) for the Redis docs.
Other agents are doing the other clients concurrently from the same reference. Do not
coordinate with them; do not touch any file outside the one you are told to write.

### What to produce

A single file at:

```
{{TARGET_PATH}}
```

Filename convention for this client: `{{FILENAME_CONVENTION}}`
(from `build/example-test-harness/clients.tsv`, column `filename`)

### The spec

The reference implementation is **`{{REFERENCE_PATH}}`**. Match it: same Redis commands, same
order, same observable behaviour. Where this client's idiom differs, follow the idiom — but
the commands and the results must line up.

Steps to implement, exactly these names, exactly this spelling:

```
{{STEP_NAMES}}
```

Do not rename, add, split, or merge steps. Step names are how the docs page addresses your
code; a drifted name renders an empty tab.

### Start from the existing file — do not start from scratch

{{EXISTING_FILE_INSTRUCTION}}

<!-- Use ONE of these, per the lifecycle table in SKILL.md:
  - "`local_examples/<set>/<client>/<file>` already exists and is the most complete version.
     Read it, keep every step it already has, and ADD the new step(s). It has steps the
     client repo copy does not."
  - "No file in local_examples/. The client repo copy at `<repo>/<repo_path>/<file>` is the
     source of truth — copy it and add the new step(s)."
  - "No existing file in either location. Create a new one from
     `.claude/skills/tce-examples/assets/<assets>/<sample>`."
-->

### API signatures — do not guess

The real signatures for this client are in:

```
{{API_MAPPING_FILES}}
```

Read them. If a command you need is missing for this client, say so in your report and stop
rather than inventing a plausible method name.

### Client conventions

- Patterns: `.claude/skills/tce-examples/assets/{{ASSETS_DIR}}/{{PATTERNS_FILE}}`
- Working sample: `.claude/skills/tce-examples/assets/{{ASSETS_DIR}}/{{SAMPLE_FILE}}`

Read both. The patterns file carries the traps specific to this client.

**Two rules about the sample:**

1. **Never copy its banner comment.** The sample opens with a ~18-line header explaining the
   markers. Comment lines outside a `HIDE` or `REMOVE` block are published verbatim into the
   docs. Your file starts directly with `{{COMMENT_PREFIX}} EXAMPLE: {{SET_ID}}` on line 1.
2. **Take its structure, not its step list.** The sample demonstrates several unrelated steps
   to show the range of patterns. You implement the step list above.

### Markers

Structure, in order:

```
EXAMPLE marker  →  HIDE: imports + connection  →  REMOVE: pre-test cleanup
→  STEP: example code with `>>>` output comments
→  REMOVE: assertions  →  REMOVE: post-test cleanup  →  HIDE: disconnect
```

Full semantics: `for-ais-only/tcedocs/SPECIFICATION.md`. Do not work from memory.

The `>>> ` comments are extracted into the docs as the shown output. They must match what
this client **actually returns** — right type, right formatting, right null representation.
A passing test does not prove a correct output comment.

{{CSHARP_FLAVOR_NOTE}}

<!-- For C# clients ONLY, include:
  ### Which C# flavour

  This example is for the **{{NREDISSTACK|SE.REDIS}}** tab.

  Both C# tabs are fed from the same NRedisStack repo directory, partitioned on whether the
  file imports NRedisStack:
    - NRedisStack tab: DOES import `using NRedisStack`
    - SE.Redis tab:    does NOT — plain `using StackExchange.Redis` only
  (`using NRedisStack.Tests` is excluded from that test; every file has it for fixtures.)

  Getting this wrong puts a working, passing example in the wrong tab. Most command-page
  examples are SE.Redis-flavoured, because plain hash/list/string commands don't need
  NRedisStack.
-->

### Do NOT run the test harness

State this explicitly in the brief. **Concurrent agents must not run the harness**: it
`FLUSHALL`s a shared Redis between clients and stages into shared directories under
`tmp/clients/examples/`, so parallel runs corrupt each other's state and produce
meaningless pass/fail. The orchestrator tests serially in Phase 3.

Tell the agent to report its file as **untested**, and to derive its `>>>` values from the
reference plus this client's documented return types — then say which values it could not
confirm. An honest "unconfirmed" is what makes Phase 3 worth running.

Offline checks that touch neither Redis nor shared state are fine and worth asking for:
`node --check`, `ruby -c`, `php -l`, `gofmt -e`, `python3 -m py_compile`.

> If you are running a **single** agent rather than a batch, it can test:
> `build/example-test-harness/run.sh {{CLIENT_KEY}} {{SET_ID}}` (needs a scratch Redis; use
> `--list` first if it SKIPs). Only lift the restriction when exactly one agent is running.

### Report back

Return `.claude/skills/tce-examples/assets/report-template.md`, filled in. The orchestrator
reads all reports together — repeated questions across agents mean the brief was ambiguous,
and that's worth knowing.
