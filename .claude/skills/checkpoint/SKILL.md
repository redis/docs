---
name: checkpoint
description: Save a status checkpoint before switching tasks. Detects the project from the current git branch, then updates that project's plan file in ~/claude-overview/plans/ and its entry in ~/claude-overview/OVERVIEW.md — recording what got done this session, what's next, blockers, %-complete (if known), and a resume pointer. Also reconciles the plan's referenced Jira tickets (DOC-/RED-) against their live status via the Atlassian MCP so stale tickets get flagged. Use when the user says "checkpoint", "save my progress", "update my overview/plan before I switch", "log where I'm at", "snapshot this", or is about to switch tasks. Accepts a `--fast` argument (aliases `--local`/`--quick`) for a quick thread-only update that skips the Jira/GitHub reconciles.
---

# Checkpoint

Snapshot the current session's progress into the shared tracking files so you can switch tasks without losing state. This skill runs **from any session/repo** and writes to the `claude-overview` hub at `~/claude-overview/` (absolute path — not the current working directory).

> **First-time setup:** this skill expects a personal hub at `~/claude-overview/` (an `OVERVIEW.md` plus `plans/<project>.md` files). If you don't have one yet, see `_shared/status-workflow/README.md` and copy the templates there into `~/claude-overview/`.

> **Sandbox note:** when run from a repo other than `claude-overview` (e.g. `~/repos/docs`), writes to `~/claude-overview/…` fall outside the session's writable cwd and the sandbox will block them. That's expected — retry those Edits/Writes with the sandbox override. (Alternatively you can add `~/claude-overview` to your global write allowlist once.)

## Arguments

- **`--fast`** (aliases: `--local`, `--quick`) — **fast checkpoint from the current thread only.** Records the update using what's already known in this conversation, skipping every external/network reconcile. Use for small, frequent updates where a full reconcile is overkill. Specifically, in fast mode:
  - **Skip step 4 entirely** (no Atlassian/Jira MCP fetch — no drift reconcile).
  - **Skip the GitHub snapshot refresh in step 6** (no `gh` calls; leave the `🔀 GitHub` block untouched).
  - **Skip the `git log`/`git status` gathering in step 3** — take "what changed" from the conversation instead.
  - Still do the instant-local basics: project detection (step 1) and the resume pointer (step 2), plus the plan + OVERVIEW row/detail writes (steps 5–6).
  - In the step 7 report, **state that it was a `--fast` checkpoint** and that Jira/GitHub were **not** reconciled (so those may be stale — run a full `/checkpoint` to refresh them).

Default (no argument) runs all steps below, including the external reconciles.

## Steps

1. **Identify the current project.**
   - Run `pwd` and `git -C "$PWD" branch --show-current` to get the working dir and branch.
   - Match the branch (or its ticket key, e.g. `DOC-6645`) to a plan file: `grep -rli --exclude-dir=archive "<branch-or-ticket>" ~/claude-overview/plans/`. That plan file is the target. (Case-insensitive `-i` to match `/startwork`, so a lowercase branch name still matches `DOC-`/`RED-` keys. Exclude `archive/` — standup skips it too, so an archived plan must not shadow the active one.)
   - If exactly one plan matches, use it. If none or several match, **ask the user which project** this checkpoint is for (list the candidates).

2. **Capture the resume pointer.**
   - Branch = the current branch.
   - Session id = the current session. Prefer the `$CLAUDE_CODE_SESSION_ID` env var — it's the running session's exact id (matches `~/.claude/projects/<cwd-slug>/<id>.jsonl`). Only if it's unset, fall back to the most-recently-modified `.jsonl` in `~/.claude/projects/<cwd-slug>/` (the slug is the cwd with `/` → `-`, e.g. `-Users-you-repos-docs`), using its filename minus `.jsonl` — but note this fallback can pick another tab's session if two run in the same repo.

3. **Gather what changed this session.**
   - From the conversation: what got completed, what's now next, any new blockers or decisions.
   - From git _(skip in `--fast` — use the conversation only)_: `git -C "$PWD" log --oneline -10` (recent commits) and `git -C "$PWD" status --short` (uncommitted work). Mention committed drafts / staged work in the plan.
   - Do **not** invent a %-complete. Update it only if you can ground it (OKR sheet, a real done/total count, or the user tells you). Otherwise leave the existing number.

4. **Reconcile the plan's Jira tickets** (via the Atlassian MCP). _**Skip this entire step in `--fast`.**_
   - Extract the ticket keys referenced in the **target plan only**: `grep -oiE '(DOC|RED)-[0-9]+' ~/claude-overview/plans/<project>.md | sort -u`.
   - Fetch their live status in one batch — `searchJiraIssuesUsingJql` with `key in (DOC-123, RED-456, …)`, requesting `status`, `assignee`, and `summary`. (Fall back to per-ticket `getJiraIssue` only if the JQL batch fails.)
   - Reconcile against the plan and flag drift — don't silently rewrite:
     - Ticket is **Done/Closed/Resolved** in Jira but still under **Next** or **Blocked / waiting on** → move it to **Done** (note the Jira status) or flag it for the user.
     - Ticket **assignee changed** (esp. assigned to you, or reassigned away) → note it on the relevant line.
     - Ticket **status advanced** (e.g. To Do → In Progress) → update the plan's wording to match.
     - Blocker whose ticket is now resolved → move out of **Blocked / waiting on**.
   - **Trust the plan's nuance over Jira's terse fields.** The plan often carries richer context (who said what, sub-tasks, "shipped per release board") than the ticket. Use Jira to catch *drift* (closed/reassigned/advanced), not to overwrite hand-written notes.
   - If the Atlassian MCP is unavailable or unauthenticated, **skip this step** and say so in the report — never block the checkpoint on it, and never guess a ticket's status.

5. **Update the plan file** (`~/claude-overview/plans/<project>.md`):
   - Bump `_Last updated:_` to today (`date +%Y-%m-%d` — never guess).
   - Move finished items into **Done** (check them off / add them).
   - Update **Next (pick up here)** so the top item is the true next action.
   - Update **Blockers / waiting on** (add new, remove cleared ones).
   - Refresh the **Resume** line (panel-first format): `**Resume:** branch \`<branch>\` → switch branch, then pick the latest session in the Claude panel history _(terminal alt: \`claude --resume <session-id>\`)_`.

6. **Update `~/claude-overview/OVERVIEW.md`** for the same project:
   - Bump `_Last updated:_` at the top to today.
   - Update the project's **at-a-glance table row** (progress + immediate next/blocker).
   - Update the project's detailed section (Status, Next, Blockers, progress bar) to match the plan.
   - Keep every other project untouched.
   - **Refresh the `🔀 GitHub — my open PRs & issues` snapshot block** (the one cross-project section checkpoint may touch). _**Skip this bullet in `--fast`** — leave the block as-is._ Re-run `gh pr list --repo redis/docs --author "@me" --state open --json number,title,reviewDecision,isDraft,updatedAt` and `gh issue list --repo redis/docs --assignee "@me" --state open --json number,title,updatedAt`, rewrite the block, and bump its `Snapshot <date>` line to today. If `gh` can't reach the API (keyring/TLS error in a restricted shell — see the standup skill's operator note), leave the block as-is and say it's stale.

7. **Report** a 3-5 line summary of exactly what you changed (which plan, which OVERVIEW row, new next-action, resume pointer) plus any Jira drift you found (tickets closed/reassigned/advanced since the plan was last touched) so the user can eyeball it before switching. _In `--fast`, there's no Jira/GitHub drift to report — instead note that it was a fast checkpoint and that those reconciles were skipped (may be stale)._

## Rules

- **Low friction:** apply the updates directly; only stop to ask if you can't identify the project. Report clearly afterward so the user can correct.
- **Scope to one project:** only touch the plan + OVERVIEW entry for the project detected from the branch. Never rewrite other projects' sections.
- **Never fabricate status or %-complete** — ground it or leave it. This includes Jira: only report a ticket's status from a live MCP fetch, never from memory or inference.
- **Jira is for catching drift, not authority.** Reconcile only the target plan's tickets, prefer the plan's hand-written nuance over terse Jira fields, and never let an unreachable Atlassian MCP block the checkpoint.
- **Preserve structure and tone** of the existing files (compact headers, checkbox lists, progress bars).
- If the project has **no plan file yet**, offer to create one from the standard template used by the other files in `~/claude-overview/plans/` (see `_shared/status-workflow/plans/example-project.md`).
