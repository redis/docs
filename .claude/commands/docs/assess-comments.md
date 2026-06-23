---
description: Reconcile and assess all comments on the current branch's PR across every tool and commenter — report only, no edits
argument-hint: "[commenter-login] (optional — defaults to all commenters)"
---

You're going to read **all** the comments on the pull request for the current
branch — from automation (Cursor Bugbot, the security scanner, the history bot,
the AI PR summary, CI) *and* from humans — and produce a single **reconciliation
report**: what each comment raises, where the tools **agree**, where they
**contradict each other**, and where they're chasing each other in circles. This
is the synthesis layer the individual tools don't have.

**This command assesses and reports. It does not edit PR content, commit, push,
or reply** — the one and only file it may write is its own coverage ledger
(step 11). Fixing is a separate step — hand the safe clusters to `/docs:bugbot`
or fix them yourself once you've seen the report.

It's also meant to be run **repeatedly** as the PR evolves: the bots tend to post
fresh comments after each round of fixes, so each run is a checkpoint — verify
the few highest-impact things deeply, leave a "story so far", and re-run to pick
up the rest. Don't try to settle the whole PR in one pass.

The command **tracks its own test coverage** in
`.claude/state/assess-comments.coverage.md`. Read it at the start of every run
(step 1) and update it at the end (step 11) — it's how the command knows,
honestly, which of its checks have actually fired on real data and which are
still unproven (ping-pong loop detection, notably). It's a *coverage* record,
not a correctness proof.

If `$ARGUMENTS` is given, treat it as a commenter login and assess **only** that
author's comments (match case-insensitively; `cursor` matches `cursor[bot]`).
With no arguments, assess **every** commenter — bots and humans alike, because
human intent ("this is a CTF example", "deliberate UK spelling in a quote") is
exactly what lets you adjudicate the tool findings.

1. **Load your coverage ledger, then find the branch and its PR.** First read
   `.claude/state/assess-comments.coverage.md` so you know which of your own
   checks are proven vs unproven this run (it also tells you to watch hardest for
   the untested ones — ping-pong loops especially). Then run
   `git branch --show-current`, and:

   ```
   gh pr view --json number,url,title,headRefName,body
   ```

   If there's no PR for this branch, stop and tell me — there's nothing to
   assess. Keep the PR `body`: the AI summary usually lives there and is
   **intent context**, not a finding to triage.

2. **Collect every comment, from every source.** Check all of these:

   - **Inline review comments** (tied to lines):
     ```
     gh api repos/{owner}/{repo}/pulls/<number>/comments --paginate
     ```
   - **Top-level PR / issue comments** (summaries, bot posts, human replies):
     ```
     gh api repos/{owner}/{repo}/issues/<number>/comments --paginate
     ```
   - **Review verdicts** (approve / request-changes bodies):
     ```
     gh api repos/{owner}/{repo}/pulls/<number>/reviews --paginate
     ```
   - **Thread resolution state** — *don't skip this.* The REST `comments`
     endpoint's `position`/outdated field is **not** a reliable "addressed"
     signal (a resolved thread routinely still reports `position` non-null). The
     authoritative signal is the GraphQL `reviewThreads`:
     ```
     gh api graphql -F query='query { repository(owner:"<owner>", name:"<repo>")
       { pullRequest(number:<number>) { reviewThreads(first:100) { nodes {
         isResolved isOutdated comments(first:100){ nodes {
           databaseId author{login} path body } } } } } } }'
     ```
     Use `databaseId` to map each thread back to the inline comments from the
     REST pull, so you know which are **resolved** vs **open**.

   For each comment capture: author `login`, `created_at`, the body, and for
   inline comments the `path`, line, and its thread's `isResolved` /
   `isOutdated`. If `$ARGUMENTS` was given, drop every comment whose author
   doesn't match it before going further.

   If nothing is left after filtering, stop and tell me.

3. **Tag each comment by its source role.** You're reconciling *roles*, not
   usernames. Classify each author as one of:

   - **bugbot** — `cursor` / `cursor[bot]`, or any body mentioning "Bugbot"
   - **security** — the security scanner
   - **history** — the commit-history / semantic-similarity bot
   - **summary** — the AI PR summary (usually the PR body or a bot comment)
   - **ci** — `github-actions` / build / staging-link bots
   - **human** — everyone else

   Treat **summary**, **ci**, and staging-build links as *context*, not
   findings — they tell you what the author intended and whether the build is
   healthy. Don't raise them as issues.

4. **Cluster findings by what they touch, not by who said them.** Group the
   actual findings (from bugbot, security, history, humans) by file + line, or
   by shared theme when they're not line-specific. One cluster may hold comments
   from several tools pointing at the same code — that overlap is the whole
   point.

5. **Split clusters into OPEN and RESOLVED — and treat them differently.** Using
   the resolution state from step 2, mark each cluster open or resolved. An
   active PR is almost always a mix; don't let resolved threads drown the open
   ones.

   - **Open clusters** are your real work — they go through prioritise →
     adjudicate (the steps below).
   - **Resolved clusters** are *not* re-litigated as fresh findings. But they
     aren't worthless either — do two cheap, high-value things with them:
     - **Fix-quality spot-check.** For a sample of resolved findings (favour the
       higher-impact ones), check that the committed change *actually addressed*
       the point, not just silenced the comment — e.g. if a reviewer asked to
       remove a term or fix a command, confirm it's genuinely gone/correct in
       the current file. Flag any "fixed in name only."
     - **"Resolved ≠ fixed" flag.** Call out any thread that is **resolved but
       has no corresponding code change** (resolved, `isOutdated` false, and no
       intervening commit touched the line). These are often legitimate
       deferrals ("leaving as-is pending eng decision before GA") — but that's a
       future obligation hiding inside a green checkmark, so surface it.
       **Mandatory deep-verify:** any such thread that the bot rated **High (or
       Critical) severity** must be opened and verified against the current code
       *this round*, regardless of the depth cap in step 6 — a serious bug must
       never hide behind a green checkmark just because the run hit its budget.
       If it's genuinely fixed, say so; if it's resolved-but-still-present,
       that's a headline.
   - Resolved threads also feed **bot calibration**: the ratio of a bot's
     findings that humans accepted-and-fixed vs dismissed tells you how much to
     trust that bot's next *solo* finding. Note it when it's informative.

6. **Prioritise, and cap how deep you go.** This command is meant to be run
   **repeatedly** over a PR's life — the bots re-comment after each round of
   fixes, so a single run is never the whole story. Don't try to verify every
   cluster to the bottom. Rank the **open** clusters by impact — broken
   `relref`/`image`/`embed-md` paths, wrong commands or code samples, incorrect
   technical claims, and anything that breaks a feature the PR description calls
   out, rank highest; pure style nits lowest — and pick **at most the top 3–5**
   to verify in depth this round. The rest you list shallowly (see step 9) as
   "not assessed this round" so the next run can pick them up.

   Three things always make the deep-verify set regardless of the cap, because
   they're the failures a reconciler exists to catch: **contradictions**,
   **ping-pong loops**, and **resolved-but-not-outdated High/Critical findings**
   (step 5). Everything else competes for the remaining slots.

7. **Adjudicate the chosen clusters — and verify, don't trust.** For each
   cluster in your deep set, open the file it points at (and the underlying data
   it depends on) and judge for yourself; these tools have false positives, and
   a single tool can be *correct about the code but wrong about impact*, or
   *plausible but refuted once you read the data*. Label each:

   - **Agreement** — multiple sources flag the same thing → high confidence it's
     real.
   - **Contradiction** — sources disagree, *or* a finding conflicts with stated
     human intent or the PR summary (e.g. security flags a sample that a human
     said is a deliberate CTF example; bugbot wants a refactor the history bot
     says was reverted before). Call these out loudest — they're where blind
     auto-fixing does damage.
   - **Ping-pong** — using `created_at` order and the commits in between, spot
     cases where a fix for one tool's comment re-triggered another tool, or the
     same spot has been edited back and forth. Flag the loop rather than
     extending it.
   - **Solo** — a single source, no corroboration → judge it on its merits and
     say how confident you are. A solo finding you've *verified against the code
     and data* is high-confidence even with one source.
   - **Stale / already-addressed** — the code no longer matches what the comment
     describes; a later commit already handled it.

   US-vs-UK spelling counts as a real issue in this docs repo even though it's
   small; pure style nits usually don't.

8. **Cross-check review verdicts against open findings.** Separately from the
   clusters, line up the PR's **review verdicts** (approve / request-changes)
   against the findings still open. Flag the dangerous combination explicitly:
   **a human approval (especially a low-confidence one — "skimmed it", "LGTM",
   "didn't review in detail") sitting on top of an unresolved bot finding.**
   Neither the reviewer nor the bot is wrong alone, but together they can let a
   real issue merge — exactly the gap a reconciler should catch. Surface it even
   when the PR is marked WIP / don't-merge.

9. **Produce the reconciliation report.** One row per **open** cluster:

   | Cluster | File / line | Sources | Verdict | Recommended action |
   |---|---|---|---|---|

   - **Verdict**: agreement / contradiction / ping-pong / solo / stale.
   - **Recommended action**: one of — *safe to fix* (uncontested and low-risk →
     hand to `/docs:bugbot`); *needs your call* (contradiction, approval-over-
     finding, or history-bot warning); *dismiss* (false positive — say why);
     *already handled* (stale).

   Then, in this order:
   - the **headline** — contradictions, ping-pong loops, and any approval-over-
     open-finding from step 8 (these need a human) first;
   - the **safe-to-fix** list;
   - what you're **dismissing** and why, so I can sanity-check your reasoning;
   - a short **resolved-threads** note (from step 5) — only what's worth saying:
     any "fixed in name only" or "resolved ≠ fixed / deferred" flags, and a bot-
     calibration line if it's informative. Don't list cleanly-resolved threads
     one by one; a count is enough;
   - a **"Story so far"** line: which open clusters you deep-verified this round,
     how many you deferred as "not assessed this round" (list them by one-line
     title), how many threads were already resolved, and a reminder that
     re-running after the next round of fixes will pick up the deferred ones plus
     any new comments. This is a checkpoint, not a verdict on the whole PR.

10. **Offer a second opinion via Codex, only if it's available.** Check whether
   the Codex CLI is installed — run `command -v codex`. If it is, end by
   suggesting the user get an independent review of the same diff the bots saw:

   ```
   /codex:review --base main --scope branch
   ```

   Frame it as optional and note it adds runtime, and that it's worth it mainly
   for the contested or high-impact clusters — the ones where a second model
   disagreeing (or agreeing) changes your confidence. Don't run it yourself:
   `/codex:review` is user-invoked only, and this command is report-only. If
   `command -v codex` finds nothing, say nothing about Codex.

11. **Update your coverage ledger — automatically, but evidence-gated.** Open
    `.claude/state/assess-comments.coverage.md` and update it to reflect what
    *actually fired on real data this run*:

    - For each capability you genuinely exercised, bump its **encounters**, set
      **last verified** to today, and add this PR (with a comment id or commit
      SHA) to **Evidence**. Raise confidence per the scale — but **never raise a
      confidence without a citable artifact.** No evidence, no bump.
    - A capability counts as **🟢 corroborated** only on ≥2 *distinct* PRs, or
      once with an independent `/codex:review` concurrence on the same finding.
    - If you hit a **rare pattern for the first time** — a real ping-pong loop, a
      resolved-but-still-broken thread — record its concrete signature in the
      **Worked examples library** (tools involved, comment ids, commits). This is
      how detection sharpens over time.
    - Refresh ⏳ **decaying** entries you re-confirmed this run.
    - If the run revealed that an *instruction* in this command should change
      (a heuristic nearly missed something), **don't edit the command yourself**
      — note the suggested refinement in your output and let me decide.

    The ledger update is the one file you *may* write. After writing it, **tell
    me plainly that the command learned something and updated its own coverage
    ledger**, name what changed in one line, and remind me I can include that
    change in the PR or leave it out — my call.

12. **Stop there.** Don't edit anything except the coverage ledger (step 11);
    don't commit, push, or reply to the PR. Your output is the assessment —
    I'll decide what to act on.
