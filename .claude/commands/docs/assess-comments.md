---
description: Reconcile and assess all comments on the current branch's PR across every tool and commenter — report only, no edits
argument-hint: "[commenter-login] (optional — defaults to all commenters)"
---

You're going to read **all** the comments on the pull request for the current
branch — from automation (Cursor Bugbot, the security scanner, Redis repo
memory, the AI PR summary, CI) *and* from humans — and produce a single
**reconciliation report**: what each comment raises, where the tools **agree**,
where they **contradict each other**, and where they're chasing each other in
circles. This is the synthesis layer the individual tools don't have.

**This command assesses and reports. It does not edit PR content, commit,
push, or reply, and it writes nothing to disk.** Fixing is a separate step.
Note that `/docs:bugbot` only triages and fixes **Cursor Bugbot's own**
comments — so it's the right hand-off *only* for bugbot-sourced clusters. Safe
fixes that came from humans, Codex, the security bot, etc. won't be touched by
`/docs:bugbot`; apply those directly (or ask me to) once you've seen the
report.

It's also meant to be run **repeatedly** as the PR evolves: the bots tend to
post fresh comments after each round of fixes, so each run is a checkpoint —
verify the few highest-impact things deeply, leave a "story so far", and
re-run to pick up the rest. Don't try to settle the whole PR in one pass.

If `$ARGUMENTS` is given, treat it as a commenter login and assess **only**
that author's comments (match case-insensitively; `cursor` matches
`cursor[bot]`). With no arguments, assess **every** commenter — bots and
humans alike, because human intent ("this is a CTF example", "deliberate UK
spelling in a quote") is exactly what lets you adjudicate the tool findings.

1. **Find the branch and its PR.** Run `git branch --show-current`, and:

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
   - **Top-level PR / issue comments** (summaries, bot posts, human replies,
     Redis repo memory):
     ```
     gh api repos/{owner}/{repo}/issues/<number>/comments --paginate
     ```
   - **Review verdicts** (approve / request-changes bodies):
     ```
     gh api repos/{owner}/{repo}/pulls/<number>/reviews --paginate
     ```
   - **Thread resolution state** — *don't skip this.* The REST `comments`
     endpoint's `position`/outdated field is **not** a reliable "addressed"
     signal (a resolved thread routinely still reports `position` non-null).
     The authoritative signal is the GraphQL `reviewThreads`:
     ```
     gh api graphql -F query='query { repository(owner:"<owner>", name:"<repo>")
       { pullRequest(number:<number>) { reviewThreads(first:100) { nodes {
         isResolved isOutdated comments(first:100){ nodes {
           databaseId author{login} path body } } } } } } }'
     ```
     `first:100` covers any normal PR, but unlike the `--paginate`d REST calls
     it does **not** page — so if a PR genuinely has >100 review threads (or a
     thread with >100 comments), check `pageInfo.hasNextPage` and follow the
     cursor, or you'll silently miss resolution state and skew the
     open/resolved split.

     Use `databaseId` to map each thread back to the inline comments from the
     REST pull, so you know which are **resolved** vs **open**.

   For each comment capture: author `login`, `created_at`, the body, and for
   inline comments the `path`, line, and its thread's `isResolved` /
   `isOutdated`. If `$ARGUMENTS` was given, it narrows which comments become
   **findings you cluster and adjudicate** (steps 4–7) to the matching author
   — but **don't discard the others**. Always retain every review verdict and
   the full set of open findings as *context*, because step 8
   (approval-over-open-finding) needs to see approvals and bot findings
   together; filtering them out would silently disable that safety check. In
   filtered mode, run step 8 against the full comment set, not the filtered
   one.

   If no comment **or review verdict** matches `$ARGUMENTS`, stop and tell me
   — a reviewer who left only an approve/request-changes verdict still counts
   as a match.

3. **Tag each comment _and review verdict_ by its source role.** You're
   reconciling *roles*, not usernames. Reviews are first-class here: a
   **request-changes** (or any review whose body raises specific, actionable
   points) is a *finding* from its author's role, not just an approve/reject
   signal for step 8 — tag and carry it forward like any comment. (A bare
   approval with no actionable body stays a step-8 signal only.) Classify
   each author as one of:

   - **bugbot** — author `login` is `cursor` / `cursor[bot]`. **Tag by
     author, not body text:** a *human* reply that quotes or mentions
     "Bugbot" is still a human comment — don't tag it bugbot (that would
     mis-route it to `/docs:bugbot`). Only treat a body mention of "Bugbot" as
     a signal when the author is some other bot relaying bugbot's output.
   - **security** — the security scanner
   - **repo-memory** — the Redis repo memory bot (`github-actions[bot]`
     comment containing the `<!-- redis-repo-memory -->` marker and a "🧠
     Redis Memory" heading). See step 3a — this is a distinct role from
     plain CI, because it's a live pointer into project history, not a
     status check.
   - **summary** — the AI PR summary (usually the PR body or a bot comment)
   - **ci** — `github-actions` / build / staging-link bots (everything else
     posted by automation, including the Jira-link and staging-link comments)
   - **human** — everyone else

   Treat **summary** and plain **ci** (staging links, build status) as
   *context*, not findings — they tell you what the author intended and
   whether the build is healthy. Don't raise them as issues.

3a. **Mine repo memory for prior art, cheaply first.** Redis repo memory's
    comment renders each related item as a one-line title echo — that
    rendered line is not useful. But the same comment carries a hidden
    `<!-- redis-repo-memory-data: <base64> -->` block at the bottom: decode
    it (`base64 -d` the payload, it's a JSON array) to get, per item, a
    `score` (lower = closer match), a `sourceUrl`, and a `bodySummary`
    truncated to roughly 500 characters. You already fetched this comment in
    step 2 — decoding costs nothing.

    - Use `score` to rank the related items; don't treat the comment's own
      display order as relevance.
    - For a `push_summary`/commit-typed item, the `bodySummary` preview is a
      genuine slice of the real `/reflect`+`/finalize` message (verified: it
      correctly led with the actual "verified X against the source rather
      than the PR description" finding, not a title echo). It's often
      enough on its own to judge relevance, and sometimes enough to cite.
    - It is **truncated**, though — a real distillation easily runs to
      1,500+ characters and the cut can land mid-thought, before a second or
      third finding. Don't treat the preview as complete.

    For the items whose score and preview show real overlap with a cluster
    you're about to adjudicate (steps 4–7) — same file/subsystem, or the
    same bot raising a similar-shaped claim — pull the **full** message
    before citing it as precedent:

    - For a PR: `gh pr view <n> --json state,mergedAt,mergeCommit` — if
      merged, the squash commit at `mergeCommit.oid` carries the full
      distillation. Fetch it with `git log -1 --format=%B <oid>` (or
      `gh api repos/{owner}/{repo}/commits/{oid} --jq .commit.message` if
      the commit isn't in your local history).
    - For a bare commit link: the same `git log -1 --format=%B <sha>` — it
      may be a smaller, less distilled message, so weight it accordingly.

    Don't do the full fetch for every related item indiscriminately — it
    costs a network round-trip per item, on top of decoding the blob. Reach
    for it only once the cheap preview says it's worth it.

    Use what you find as **precedent, cited by PR number**, in step 7's
    adjudication — e.g. "PR #3604's squash message documents that bugbot's
    concurrency heuristic over-fires on async fire-on-call ordering; today's
    finding has the same shape, so treat it as low-confidence on that
    precedent" (see the calibration patterns in step 7 for the specific,
    durable axes worth watching for). A precedent is supporting evidence for
    your own verification, not a substitute for it — still open the current
    file and check.

4. **Cluster findings by what they touch, not by who said them.** Group the
   actual findings — from bugbot, security, humans, **and actionable
   review-verdict bodies (step 3)** — by file + line, or by shared theme when
   they're not line-specific. One cluster may hold comments from several
   tools pointing at the same code — that overlap is the whole point.

5. **Split clusters into OPEN and RESOLVED — and treat them differently.**
   Using the resolution state from step 2, mark each cluster open or
   resolved. An active PR is almost always a mix; don't let resolved threads
   drown the open ones.

   - **Open clusters** are your real work — they go through prioritise →
     adjudicate (the steps below).
   - **Resolved clusters** are *not* re-litigated as fresh findings. But they
     aren't worthless either — do two cheap, high-value things with them:
     - **Fix-quality spot-check.** For a sample of resolved findings (favour
       the higher-impact ones), check that the committed change *actually
       addressed* the point, not just silenced the comment — e.g. if a
       reviewer asked to remove a term or fix a command, confirm it's
       genuinely gone/correct in the current file. Flag any "fixed in name
       only."
     - **"Resolved ≠ fixed" flag.** Call out any thread that is **resolved
       but has no corresponding code change** (resolved, `isOutdated` false,
       and no intervening commit touched the line). These are often
       legitimate deferrals ("leaving as-is pending eng decision before GA")
       — but that's a future obligation hiding inside a green checkmark, so
       surface it. **Mandatory deep-verify:** any such thread that the bot
       rated **High (or Critical) severity** must be opened and verified
       against the current code *this round*, regardless of the depth cap in
       step 6 — a serious bug must never hide behind a green checkmark just
       because the run hit its budget. If it's genuinely fixed, say so; if
       it's resolved-but-still-present, that's a headline.
   - Resolved threads also feed **bot calibration** (step 7): the ratio of a
     bot's findings that humans accepted-and-fixed vs dismissed tells you how
     much to trust that bot's next *solo* finding this round. Note it when
     it's informative — you don't need to persist it anywhere; if it matters
     again, repo memory will surface this PR next time something similar
     comes up, and the squash message will carry the same ratio in context.

6. **Prioritise, and cap how deep you go.** This command is meant to be run
   **repeatedly** over a PR's life — the bots re-comment after each round of
   fixes, so a single run is never the whole story. Don't try to verify every
   cluster to the bottom. Rank the **open** clusters by impact — broken
   `relref`/`image`/`embed-md` paths, wrong commands or code samples,
   incorrect technical claims, and anything that breaks a feature the PR
   description calls out, rank highest; pure style nits lowest — and pick **at
   most the top 3–5** to verify in depth this round. The rest you list
   shallowly (see step 9) as "not assessed this round" so the next run can
   pick them up.

   Three things always make the deep-verify set regardless of the cap,
   because they're the failures a reconciler exists to catch:
   **contradictions**, **ping-pong loops**, and **resolved-but-not-outdated
   High/Critical findings** (step 5). Everything else competes for the
   remaining slots.

   One assessment runs *outside* the cap entirely: **subsystem churn** (step
   7). Churn is a pattern across findings — including ones you deferred this
   round and ones from prior rounds — so judge it against the **full**
   open+recent set, never just the capped deep set. If a deferred cluster
   turns out to be part of a churn pattern, pull it into deep-verify; the cap
   must not hide churn.

7. **Adjudicate the chosen clusters — and verify, don't trust.** For each
   cluster in your deep set, open the file it points at (and the underlying
   data it depends on) and judge for yourself; these tools have false
   positives, and a single tool can be *correct about the code but wrong
   about impact*, or *plausible but refuted once you read the data*. Label
   each:

   - **Agreement** — multiple sources flag the same thing → high confidence
     it's real.
   - **Contradiction** — sources disagree, *or* a finding conflicts with
     stated human intent or the PR summary (e.g. security flags a sample
     that a human said is a deliberate CTF example). Call these out
     loudest — they're where blind auto-fixing does damage.
   - **Ping-pong** — a genuine loop is narrower than it looks. Using
     `created_at` order and the commits in between, flag it **only** when
     *the same concern is reopened* (a finding you thought fixed comes back),
     or *a fix for tool A's comment re-triggered tool B in a cycle*
     (A→fix→B→fix→A…). It is **not** ping-pong when a fix round simply
     prompts a re-scan that surfaces **new, independent findings** — even if
     they land in the region you just edited. That's normal iteration; treat
     those as fresh clusters, not a loop. When it *is* a true loop, flag it
     rather than extending it. If repo memory surfaces an earlier PR on the
     same file, check whether its squash message already describes a loop or
     a settled fixed-point — that's the fastest way to tell which one you're
     in.
   - **Subsystem churn** — distinct from ping-pong, and the *earlier*
     warning sign. Look across fix rounds: if several findings (even new,
     independent ones) keep landing on the **same area of code you keep
     patching**, the symptom isn't any single finding — it's that the
     subsystem is under-specified and each patch just exposes the next
     adjacent gap. Incrementally fixing the latest one tends to trigger
     another round. When you see this, **recommend a single consolidated
     redesign of that subsystem rather than another patch** — that's the
     move that actually ends the churn. If a repo-memory-linked PR's squash
     message already names this subsystem's churn history, cite it — it
     tells you how many rounds it took last time and what finally ended it.
   - **Solo** — a single source, no corroboration → judge it on its merits
     and say how confident you are. A solo finding you've *verified against
     the code and data* is high-confidence even with one source.
   - **Stale / already-addressed** — the code no longer matches what the
     comment describes; a later commit already handled it.

   US-vs-UK spelling counts as a real issue in this docs repo even though
   it's small; pure style nits usually don't.

   **Known bugbot calibration patterns** (durable across many PRs — not tied
   to any one of them, so kept here rather than relying on repo memory to
   resurface them): bugbot is strong on **pure language/API semantics** it
   can evaluate from the source alone (e.g. `Double.MIN_VALUE` is the
   smallest *positive* double, not `-Infinity`), and on **cross-file
   doc-consistency / procedure-completeness** (two files in a PR that must
   agree by construction). It's unreliable on **runtime mechanics invisible
   in the diff**: async dispatch order (a `CompletableFuture`/`allOf` "race"
   is often already ordered by call-site on one connection), npm/package
   transitive-dependency hoisting (a metapackage's declared deps land
   hoisted-flat, so "missing dependency" claims from import analysis alone
   are often wrong), list-vs-single-item REST endpoint shape (a field present
   on `GET /pulls/{n}` may be absent from the `GET /pulls` list shape bugbot
   generalized from), and test-marker stripping the build performs
   independently of `REMOVE` regions. It can also cite a **stale PR
   description** as ground truth rather than checking whether the
   description or the code is the side that's out of date. When a finding
   falls in one of these blind spots, verify against the actual
   runtime/build behavior before trusting it.

8. **Cross-check review verdicts against open findings.** Separately from the
   clusters, line up the PR's **review verdicts** (approve / request-changes)
   against the findings still open. Flag the dangerous combination
   explicitly: **a human approval (especially a low-confidence one —
   "skimmed it", "LGTM", "didn't review in detail") sitting on top of an
   unresolved bot finding.** Neither the reviewer nor the bot is wrong alone,
   but together they can let a real issue merge — exactly the gap a
   reconciler should catch. Surface it even when the PR is marked WIP /
   don't-merge.

9. **Produce the reconciliation report.** One row per **open cluster you
   deep-verified this round** (step 7) — those are the only clusters with a
   real verdict. Open clusters you deferred under the step-6 cap do **not**
   get a table row or a verdict (you haven't verified them); they're listed,
   plainly marked unverified, in the "story so far" below. The table never
   promises more coverage than you actually did.

   | Cluster | File / line | Sources | Verdict | Recommended action |
   |---|---|---|---|---|

   - **Verdict**: agreement / contradiction / ping-pong / churn / solo /
     stale. Where a repo-memory-linked squash message informed the verdict,
     cite the PR number inline (e.g. "solo, but matches #3604's precedent").
   - **Recommended action**: one of — *safe to fix* (uncontested and
     low-risk; hand **bugbot-sourced** clusters to `/docs:bugbot`, but apply
     safe fixes from any other source — human, Codex, security — directly,
     since `/docs:bugbot` won't touch those); *needs your call* (contradiction,
     approval-over-finding, or a serious repo-memory-sourced precedent);
     *dismiss* (false positive — say why); *already handled* (stale).

   Then, in this order:
   - the **headline** — contradictions, ping-pong loops, **subsystem churn
     (with its consolidate-don't-patch recommendation)**, and any
     approval-over-open-finding from step 8 (these need a human) first;
   - the **safe-to-fix** list;
   - what you're **dismissing** and why, so I can sanity-check your
     reasoning;
   - a short **resolved-threads** note (from step 5) — only what's worth
     saying: any "fixed in name only" or "resolved ≠ fixed / deferred"
     flags, and a bot-calibration line if it's informative. Don't list
     cleanly-resolved threads one by one; a count is enough;
   - a **"Story so far"** line: which open clusters you deep-verified this
     round, how many you deferred as "not assessed this round" (list them by
     one-line title), how many threads were already resolved, which
     repo-memory-linked PRs you actually opened and used as precedent (by
     number, so I can follow the trail), and a reminder that re-running after
     the next round of fixes will pick up the deferred ones plus any new
     comments. This is a checkpoint, not a verdict on the whole PR.

10. **Offer a second opinion via Codex, only if it's available.** Check
   whether the Codex CLI is installed — run `command -v codex`. If it is, end
   by suggesting the user get an independent review of the same diff the bots
   saw:

   ```
   /codex:review --base main --scope branch
   ```

   Frame it as optional and note it adds runtime, and that it's worth it
   mainly for the contested or high-impact clusters — the ones where a
   second model disagreeing (or agreeing) changes your confidence. Don't run
   it yourself: `/codex:review` is user-invoked only, and this command is
   report-only. If `command -v codex` finds nothing, say nothing about Codex.

11. **Stop there.** Don't edit, write, or delete anything; don't commit,
    push, or reply to the PR. Your output is the assessment — I'll decide
    what to act on.
