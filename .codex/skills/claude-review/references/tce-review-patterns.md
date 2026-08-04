# TCE review patterns

Recurring defect classes in tabbed code examples (TCEs) — the multi-language blocks rendered
by the `clients-example` shortcode. Use when the review target touches
`local_examples/`, a client repo's doctests, `data/examples.json`, `config.toml`'s client
config, or `.claude/skills/tce-examples/`.

**This is a map of where to look, not evidence.** Verify every suspected hit against the
current file before reporting it. The generating agents work in parallel, so a defect you
recall from one file may already be fixed in another.

## Why a review is needed at all when tests pass

The harness proves the code *runs*. It cannot prove it is the *right* code. Everything in the
first section below passes a green test run.

---

## Class 1 — Output comments that don't match reality

**Schema:** `>>> ` comments are extracted and published as the shown output. A test asserting
on a variable says nothing about whether the comment next to it is right.

Look for:

- **Type drift.** Redis returns strings; the comment shows an integer. `# >>> 4972` where the
  client actually returns `'4972'`.
- **Language-native formatting written from memory rather than observed.** Ruby `inspect`
  emits `{"a"=>"b"}`, not `{a: "b"}`. Java `Map.toString()` emits `{a=b}`, no quotes. C#
  `HashEntry[]` has no useful `ToString()` at all.
- **Null representation.** `None` / `null` / `nil` / `<nil>` / `RedisValue.Null` all differ,
  and SE.Redis's null prints as an *empty string* — so `// >>> ` with nothing after it is
  indistinguishable from a formatting mistake.
- **Non-deterministic ordering presented as fixed.** `HGETALL` into a hash map, `SMEMBERS`,
  or an unsorted `ZRANGE` can reorder between runs. A stable `>>>` comment requires the
  example to sort explicitly (`TreeMap`, `sorted()`).

**Report as:** `output-comment-mismatch`, severity high — the reader copies this and sees
something else.

## Class 2 — Step-name drift across clients

**Schema:** the `clients-example` shortcode addresses code by `step=`. Every client in a set
must use the identical step name, spelled identically.

Look for a step present in most clients and misspelled, pluralised, hyphenated-vs-underscored,
or case-shifted in one. The symptom is a **silently empty tab** for that language: nothing
errors, the reader just gets a blank panel.

Cross-check against `data/examples.json` → `<set>` → `<client>` → `named_steps`, and against
`{{< clients-example set="…" step="…" >}}` on the page.

**Report as:** `step-name-drift`, severity high.

## Class 3 — Dropped pre-existing steps

**Schema:** three locations hold an example — `local_examples/<set>/<client>/` (staging, most
complete), the client repo (merged), and `tmp/clients/examples/` (transient). Staging routinely
has steps the client repo does not.

An agent that regenerates a file from a template, or starts from the client repo copy, silently
deletes the pending steps. Check the diff for **removed** `STEP_START` markers, not just added
ones. A file whose step count went down is the tell.

**Report as:** `dropped-existing-step`, severity high.

## Class 4 — Marker placement leaking scaffolding

**Schema:** content outside `HIDE`/`REMOVE` blocks is published verbatim — **including
comments**.

Look for:

- **The sample banner.** Every `assets/<client>/sample_*` file opens with a ~18-line header
  explaining the markers. It is not inside a `HIDE`/`REMOVE` block (it precedes the
  `EXAMPLE:` marker), so an agent that copies the sample wholesale publishes an essay about
  markers into the docs page. A real example starts directly with `EXAMPLE:` on line 1.
- Assertions, fixture setup, or `del`/`flushall` cleanup outside a `REMOVE` block.
- Unbalanced markers — a `REMOVE_START` with no `REMOVE_END` swallows the rest of the file, so
  the tab renders short or empty.
- Test annotations (`@Test`, `[Fact]`, `#[test]`) left visible.

**Report as:** `leaked-scaffolding` or `marker-placement`, severity high.

## Class 5 — C# example in the wrong tab

**Schema:** `C#-*(NRedisStack)` and `C#-*(SE.Redis)` are fed from the *same* NRedisStack repo
directory, partitioned by a content filter: presence of `using NRedisStack` → NRedisStack
tabs; absence → SE.Redis tabs. `using NRedisStack.Tests` is excluded from that test (every
file has it for fixtures).

So the deciding factor is one import line, and both flavours compile and pass identically.
An unused or debug-leftover `using NRedisStack` relocates a finished example to the other tab
with no error anywhere.

Most command-page examples should be SE.Redis-flavoured — plain hash/list/string commands
don't need NRedisStack. Check the import against the intent stated in the PR or the brief.

**Report as:** `csharp-flavor`, severity high.

## Class 6 — Signatures not from the API mapping

**Schema:** `data/command-api-mapping/<COMMAND>.json` carries the real per-client signatures,
keyed by `mappingClientId` (see `build/example-test-harness/clients.tsv`).

Look for a plausible-but-wrong method name, a wrong overload, or a call that only compiles
because the argument happens to be permissive. Also flag the inverse: a mapping entry that
contradicts the example, since the mapping may be the thing that's stale.

Historic instance: a Jedis snippet that imported `RedisClient` and then called `jedis.hset(...)`
on it — two different APIs spliced together.

**Report as:** `wrong-api-signature`, severity high if the shown call doesn't exist.

## Class 7 — Test scaffolding that can't fail

**Schema:** these files are the test. If the assertions are vacuous, a broken example is green.

Look for:

- No assertion at all in the `REMOVE` blocks — just prints.
- Assertions on the wrong variable, or comparing a value to itself.
- A caught-and-swallowed error path (`Err(e) => println!(...)` in Rust, an empty `catch`) that
  turns a failure into a pass.
- Missing cleanup before the steps run, so the example only passes on a freshly flushed db —
  fine under the harness, misleading for a reader.

**Report as:** `assertion-weak` / `cleanup-missing`, severity medium unless it hides a real bug.

## Class 8 — Environment defects that manufacture false greens

Not defects in an example, but in what tests it. Worth flagging when a PR touches the harness:

- **Surefire matching zero tests.** The Java classes are `*Example`, not `*Test`, so a
  `pom.xml` lacking `<include>**/*Example.java</include>` runs nothing and exits 0.
  `fidelity/pom-lettuce-async.xml` and `pom-lettuce-reactive.xml` both shipped without it.
- **A wrapper exiting with the teardown's status.** A `run.sh` ending in
  `rm -fr <deps>` exits 0 regardless of the test result. All 11 original wrappers did this.
- **`dotnet test` filtering to nothing** when the `[Fact]` didn't survive outside a `REMOVE`
  block.
- **Wrong-case paths.** `cmds_*` sets use `local_examples/<set>/NRedisStack/`; `geoindex`,
  `search_quickstart`, and `time_series_tutorial` use `nredisstack/`. Both are tracked. On a
  case-insensitive filesystem a glob on the wrong spelling succeeds locally and breaks on
  Linux CI.

**Report as:** `other`, severity high — a false green is worse than a red.

## Class 9 — Shortcode and metadata drift

- `set=`/`step=` on the page not matching any key in `data/examples.json` → empty tab.
- A `lang_filter` value that isn't an exact `config.toml` display name. Matching is exact, not
  substring: `lang_filter="C"` does **not** match `C#-Sync (NRedisStack)`, and
  `lang_filter="Node"` does **not** match `Node.js`.
- `buildsUpon` naming a step that isn't on the same page.
- Hand-edited `data/examples.json` — it is generated by `build/make.py`.
- A client added to a set that doesn't actually support the command. An empty or wrong tab is
  worse than an absent one.

**Report as:** `other`, severity medium to high depending on whether a tab breaks.
