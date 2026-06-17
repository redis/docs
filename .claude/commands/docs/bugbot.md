---
description: Triage and fix valid Cursor Bugbot comments on the current branch's PR
argument-hint: (no args — uses current branch's PR)
---

You're going to review the comments left by **Cursor Bugbot** on the pull
request for the current branch, decide which raise genuine problems, and fix
the ones that do.

1. **Find the branch and its PR.** Run `git branch --show-current`. Then find
   the open PR for that branch:

   ```
   gh pr view --json number,url,title,headRefName
   ```

   If there's no PR for this branch, stop and tell me — Bugbot only comments on
   PRs, so there's nothing to triage.

2. **Collect Bugbot's comments.** Bugbot posts as the `cursor[bot]` app, and its
   feedback shows up in two places, so check both:

   - **Inline review comments** (tied to specific lines):
     ```
     gh api repos/{owner}/{repo}/pulls/<number>/comments --paginate
     ```
   - **Top-level PR comments** (the summary):
     ```
     gh api repos/{owner}/{repo}/issues/<number>/comments --paginate
     ```

   Filter both for comments whose author `login` is `cursor` / `cursor[bot]`
   (match case-insensitively, and also treat any comment whose body mentions
   "Bugbot" as a candidate). For each one, capture the body, and for inline
   comments the `path` and line so you know exactly what code it's flagging.

   If there are no Bugbot comments, stop and tell me — nothing to do.

3. **Triage each issue.** For every distinct issue Bugbot raises, read the
   actual code it points at (don't trust the comment blindly — open the file)
   and decide for yourself whether it's valid. Bugbot has false positives, so
   be critical. Classify each as one of:

   - **Valid** — a real bug, broken link/shortcode, factual error, or anything
     that would genuinely hurt the docs or a reader.
   - **Invalid / won't-fix** — a false positive, a deliberate choice, or out of
     scope for this branch.

   This is a docs repo, so weigh issues the way they matter here: broken
   `relref`/`image`/`embed-md` paths, wrong commands or code samples, incorrect
   technical claims, and US-vs-UK spelling all count as real; stylistic nits
   that don't affect correctness usually don't.

4. **Show me the triage before changing anything.** Present a short table:
   each issue, the file/line, your verdict (valid / invalid), and a one-line
   reason. Don't edit yet.

5. **Fix the valid ones.** Apply the fixes for everything you marked valid,
   keeping each change minimal and matching the surrounding style. For issues
   you marked invalid, leave the code alone — just note why in your summary so
   I can sanity-check your reasoning.

6. **Wrap up.** Summarise what you changed (with file paths) and what you
   deliberately skipped and why. Don't commit, push, or reply to the PR
   comments unless I ask you to.
