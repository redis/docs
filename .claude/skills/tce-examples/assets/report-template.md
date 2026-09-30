# Phase 2 report

Return this filled in. Terse is fine; complete matters. The orchestrator reads every report
together before Phase 3, so state facts rather than reassurance — an honest "not tested,
toolchain missing" is more useful than an optimistic "should work".

---

## Report: `{{CLIENT_KEY}}` / `{{SET_ID}}`

**File written:** `<repo-relative path>`

**Started from:** `local_examples/...` | client repo `...` | new from sample
(If you started from an existing file, how many steps did it already have, and did you keep
all of them?)

**Steps implemented:** `<comma-separated, as they appear in the file>`

**Pre-existing steps preserved:** `<names>` | none in file

### Tested

```
<the run.sh command you used>
```

**Result:** PASS | FAIL | NOT RUN

If NOT RUN, say why (missing toolchain, no Redis, SKIP with unresolved path). Do not claim
a pass you didn't observe.

If FAIL, paste the relevant lines from `build/example-test-harness/results/<set>_<client>.log`.

### Output comments

How did you determine each `>>> ` value — observed from the actual run, or derived from the
reference? Flag any you could not confirm by running.

### API signatures

**Source:** `data/command-api-mapping/<COMMAND>.json`

Any command missing an entry for this client? Any signature in the mapping that looked wrong
against the client's real API?

### Deviations from the reference

Anything you did differently, and why. Client idiom is a legitimate reason; guessing is not.
If you changed the observable behaviour or the command sequence, say so loudly — that breaks
cross-client consistency and the orchestrator needs to decide, not discover.

### Questions the brief didn't answer

List them even if you worked around them. Repeated questions across agents mean the brief
needs fixing for next time.

### C# only — flavour

Which tab this file targets, and the deciding import line as written:
`using NRedisStack` present | absent
