# Claude Review Patterns

This is the living memory file for recurring review patterns in Claude-authored work. These entries are heuristics for where Codex should look during a review. They are not evidence by themselves.

When adding a new entry, use this schema:

```markdown
## Pattern Name

**Status:** candidate | recurring | established
**Source:** file, PR, review date, or pasted review excerpt
**What to check:** concrete search/read strategy
**Pass criterion:** what correct behavior looks like
**False-positive guard:** when this pattern does not apply
**Suggested review prompt:** optional focused prompt for future reviewers
```

## Stale Snapshot Findings

**Status:** established
**Source:** `.agents/skills/redis-use-case-ports/SKILL.md`, Phase 4b independent review notes.
**What to check:** Before reporting or fixing any issue found by a prior reviewer, grep or read the current file for the described pattern and verify the exact line still exists.
**Pass criterion:** Every finding cites the current file state, not a stale diff, parallel-agent snapshot, or earlier review comment.
**False-positive guard:** If the finding is about a removed line or an already-fixed block, do not report it; at most mention that the prior concern appears resolved.
**Suggested review prompt:** Verify each candidate finding against the current workspace before reporting it. Flag stale findings separately from real current issues.

## Cross-Client Drift

**Status:** established
**Source:** `.agents/skills/redis-use-case-ports/SKILL.md` synthesis, targeted audit, and cross-client diff workflow.
**What to check:** For changes under `content/develop/use-cases/` or client examples, compare equivalent behavior across all touched client implementations and their guides.
**Pass criterion:** Shared helper APIs, demo behavior, constants, error handling, return shapes, and prose claims are consistent unless a per-client deviation is explicit and justified.
**False-positive guard:** Do not require byte-for-byte code similarity; language idioms, library APIs, and runtime constraints can justify different implementations.
**Suggested review prompt:** Compare the touched client implementation against its siblings and the reference implementation. Report only divergences that change behavior, docs truth, or user expectations.

## Generated Docs Or Data Drift

**Status:** recurring
**Source:** Redis docs skill workflows that require examples, mappings, shortcodes, and generated data to stay in sync.
**What to check:** When docs pages reference examples, shortcodes, command metadata, JSON mappings, navigation, or generated artifacts, verify the backing files changed too, or that no backing change is needed.
**Pass criterion:** User-facing docs, example IDs, shortcode paths, data entries, and generated outputs agree with each other.
**False-positive guard:** Some generated files are intentionally not committed; check repo convention before requiring an artifact update.
**Suggested review prompt:** Trace every new or changed docs reference to its backing shortcode, data file, example file, or generated artifact, and flag broken links or stale mappings.

## Timeout And Race Assumptions

**Status:** established
**Source:** `.agents/skills/redis-use-case-ports/assets/audit-checklist.md` entries on deadline overflow, subscribe acknowledgement races, background worker stop behavior, and polling loops.
**What to check:** Inspect asynchronous helpers, worker threads, subscription setup, polling loops, lock TTLs, timeout arithmetic, and shutdown paths.
**Pass criterion:** A helper should not return before required background setup is complete; timeout math should use safe clocks; stop paths should be bounded and leave state coherent.
**False-positive guard:** Some synchronous client calls close the race window by completing the protocol write before returning; verify the actual library behavior before reporting.
**Suggested review prompt:** Audit every async, polling, subscription, and worker-lifecycle path touched by the diff for return-before-ready, silent timeout fallthrough, unbounded waits, and unsafe deadline arithmetic.

## Inert Or Imaginary Configuration

**Status:** established
**Source:** `.agents/skills/redis-use-case-ports/assets/audit-checklist.md` semantic-cache notes about config keys that looked valid but did not take effect.
**What to check:** For new framework, server, client, build, or package configuration, confirm the option name exists in the real API or in nearby working code.
**Pass criterion:** The configuration is accepted by the runtime/tool and actually enforces the behavior claimed in docs or code comments.
**False-positive guard:** Do not require external documentation for obvious existing repo patterns; nearby tested usage can be sufficient evidence.
**Suggested review prompt:** Verify that each new config option is a real option for the selected framework version and that the code does not rely on a setting the runtime ignores.

## Redis Search TAG Escaping Drift

**Status:** established
**Source:** `.agents/skills/redis-use-case-ports/assets/audit-checklist.md` semantic-cache notes about escaped TAG values in docs wire-form snippets.
**What to check:** Inspect Redis Search TAG query examples and prose snippets that include punctuation such as hyphens, dots, braces, spaces, or backslashes.
**Pass criterion:** TAG values shown in query strings escape special characters correctly, including the escape character itself where required.
**False-positive guard:** Do not apply query-string escaping rules to stored raw values, non-TAG fields, or examples intentionally showing unescaped user input before escaping.
**Suggested review prompt:** Check every changed Redis Search TAG filter and docs snippet for correct escaping of punctuation in the query wire form.

## Shared Demo UI Text Drift

**Status:** recurring
**Source:** `.agents/skills/redis-use-case-ports/assets/audit-checklist.md` semantic-cache notes about per-language strings in shared HTML.
**What to check:** When multiple demos share HTML, JavaScript, screenshots, or prose templates, look for language-specific labels, default values, or comments that should be populated dynamically.
**Pass criterion:** Shared UI assets do not hardcode one client language's values unless the asset is used only for that client.
**False-positive guard:** Per-language guide prose and per-client server files may intentionally include client-specific naming.
**Suggested review prompt:** Inspect shared demo assets for hardcoded per-client labels, thresholds, ports, or copy that should come from `/state`, config, or each implementation.
