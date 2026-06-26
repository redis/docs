---
name: claude-review
description: Use when asked to independently review Claude-authored docs or code changes, Claude-generated diffs, or Claude PR work in the Redis docs repo.
---

# Claude Review

Use this skill for independent reviews of Claude-authored work in this repo. The goal is to find real correctness, docs, consistency, test, and maintainability issues without becoming biased by past Claude behavior.

## Required References

Read these before reviewing:

- [`references/review-style.md`](references/review-style.md) for output format and severity.
- [`references/claude-review-patterns.md`](references/claude-review-patterns.md) for recurring review patterns.

Treat the pattern file as a map of places to inspect, not as evidence. The current diff and current workspace always win.

## Workflow

1. Identify the review target:
   - Prefer the user-supplied diff, PR, branch, or file list.
   - If the target is local, inspect `git diff`, `git status --short`, and the touched files before judging.
   - If the target is a PR, inspect the PR diff and any relevant review comments.
2. Read the nearby source of truth:
   - Adjacent docs pages, examples, tests, config, data files, shortcodes, generated mappings, or skill instructions touched by the change.
   - Existing repo conventions before claiming a convention was violated.
3. Use `claude-review-patterns.md` as a targeted checklist:
   - Pick only patterns relevant to the touched files and change type.
   - For each suspected issue, verify the exact current file and line before reporting it.
   - Do not report a pattern match unless it causes an actionable problem in this change.
4. Produce findings first:
   - Order by severity.
   - Include precise file/line references.
   - Explain the user-visible or maintainer-visible impact.
   - Keep summaries secondary and brief.
5. If no issues are found:
   - Say that clearly.
   - Mention residual risk, unrun tests, or review limits.

## Independence Rules

- Historical patterns suggest what to inspect; they never prove a current bug.
- Never assume Claude made a mistake because Claude made a similar mistake before.
- Verify against the current workspace to avoid stale-snapshot findings.
- Prefer fewer, stronger findings over broad speculative concerns.
- Do not modify this skill or its references during a review unless the user explicitly asks.

## Skill Memory Updates

At the end of a review, add a short `Suggested skill-memory updates` section only if the review revealed a reusable pattern that is:

- concrete enough to scan for in future reviews;
- backed by a current finding or a clearly described false positive;
- not already covered by [`references/claude-review-patterns.md`](references/claude-review-patterns.md).

Suggest the update text, but do not apply it unless explicitly asked. New entries should follow the schema in `claude-review-patterns.md`.
