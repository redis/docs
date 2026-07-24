---
name: standup
description: Start-of-day / back-at-desk briefing. Reads the claude-overview hub (~/claude-overview/OVERVIEW.md + plans/), pulls live signals from Jira, GitHub, Google Calendar, Gmail, and Slack, then recommends a ranked "do this next" list with the reason for each. Read-only — it advises, it does not modify plans. Use when the user says "standup", "what should I work on", "what's next", "start my day", "catch me up", "back at my desk", "good morning", or asks where to pick up. Accepts a `--fast` argument (aliases `--local`/`--quick`) for a quick hub-only briefing that skips the live signal fetches.
---

# Standup

The inverse of `/checkpoint`. Where checkpoint saves state on the way out, standup reads the hub and current signals and tells you **where to dive in right now**. This skill reads from the `claude-overview` hub at `~/claude-overview/` (absolute path — not the current working directory) and is **read-only**: it never edits plans or `OVERVIEW.md`. If it finds drift worth persisting, it offers to run `/checkpoint` rather than writing itself.

> **First-time setup:** expects a personal hub at `~/claude-overview/`. If you don't have one, see `_shared/status-workflow/README.md`.

Run it from any repo — it always reads the hub by absolute path.

## Arguments

- **`--fast`** (aliases: `--local`, `--quick`) — **fast briefing from the hub only.** Reads `OVERVIEW.md` + the active plans and ranks from those alone, **skipping every live signal fetch** (the slow part). Use for a quick "where do I pick up" when you don't need overnight-change detection. Specifically, in fast mode:
  - **Skip step 2 entirely** — no Jira, GitHub (`gh`), Calendar, Gmail, or Slack fetches.
  - **Rank (step 3) from the hub only** — plans' **Next (pick up here)** + OVERVIEW priority order/deadlines.
  - **Output (step 4):** keep **📌 Top of the day**, **▶️ Do next (ranked)**, **⏳ Still blocked**, and resume pointers. For **🔀 My open PRs & issues**, read the OVERVIEW **`🔀 GitHub`** snapshot block (the documented fallback) instead of live `gh`. **Omit 🆕 Changed since last checkpoint and 📎 Flagged to revisit** — both are signal-derived.
  - **State up front that it's a `--fast` briefing** — signals weren't pulled, so anything since the hub's last update won't show; run a full `/standup` for live change detection.

Default (no argument) runs all steps below, including the live signals.

## Steps

1. **Read the hub.**
   - `~/claude-overview/OVERVIEW.md` — the at-a-glance table + active-priority sections. This is the source of priority order and deadlines.
   - The active `~/claude-overview/plans/*.md` files (skip `archive/` and anything marked DONE/parked/not-started unless the user asks). Each plan's **Next (pick up here)**, **Blocked / waiting on**, and **Resume** lines are the raw material.
   - Note the priority signals already encoded: 🔴 > 🟡 > 🟢/🔵, explicit "#1 priority", and hard deadlines (e.g. a GA date). Convert relative dates using `date +%Y-%m-%d` — never guess today.

2. **Pull live signals** _(**skip this entire step in `--fast`** — brief from the hub only)_ (each is **best-effort — skip gracefully and say so if unavailable**; never block the briefing on a signal, never guess a status from memory). Run the independent fetches in parallel:

   - **Jira** — extract the ticket keys referenced across the active plans (`grep -rhoiE '(DOC|RED)-[0-9]+' ~/claude-overview/plans/*.md | sort -u`) and batch-fetch live status/assignee via `searchJiraIssuesUsingJql` (`key in (…)`). Flag: newly **assigned to you**, newly **closed/resolved** (→ possibly unblocked or already-done), and status advances. (Same reconcile logic as `/checkpoint` step 4.)
   - **GitHub** (docs repo `redis/docs`, local clone `~/repos/docs`). Fetch three things:
     - *My open PRs:* `gh pr list --repo redis/docs --author "@me" --state open --json number,title,reviewDecision,isDraft,updatedAt`. Flag **ready to merge** (reviewDecision APPROVED + not draft), **approved but still draft** (un-draft + merge), and **stale** (no update in >2 weeks).
     - *Issues assigned to me:* `gh issue list --repo redis/docs --assignee "@me" --state open --json number,title,updatedAt`. (Authored issues are usually empty — assignee is the useful list.)
     - *Plan-referenced PRs:* for PR numbers named in the plans (`grep -rhoE '#[0-9]{3,5}'`), `gh pr view <n> --repo redis/docs --json state,reviewDecision,statusCheckRollup,mergeable,title` to catch newly **approved / failing-CI / merged**.
     - If `gh` errors, check `gh auth status`; a keyring "token invalid" or an `api.github.com` TLS/x509 error in a restricted shell is usually an environment restriction rather than real auth loss — see the operator note at the bottom of this skill. Skip GitHub and say so only if it truly can't reach the API.
   - **Calendar** — today's events via the Google Calendar MCP (`list_events` for today). Use them to time-box recommendations ("do X before the 2pm SME meeting") and to flag prep needed for upcoming meetings.
   - **Gmail** — recent/unread mail (past ~1–2 days) from people the plans say you're **blocked on or waiting for**. Surfaces "you've been unblocked" signals. Use `search_threads` scoped to those senders + recency.
   - **Slack** — two passes via the Slack MCP search:
     - *Mentions/DMs* — recent (past ~1 day, `to:me`) messages that might change priorities. These feed the ranked list and "Changed" section.
     - *Saved items* (`is:saved`, recent-first) — your flagged-to-revisit pile. **Note:** results sort by message post date, not save date, so this is a standing backlog spanning weeks/months, **not** an overnight-change signal — keep it out of the ranked "Do next." Drop empty-body/bot entries, cap at ~8, and cross-reference against the active plans so items tied to current work (a PR on a live project, a bug from a stakeholder) are highlighted.

3. **Synthesize a ranked recommendation.** Combine the plans' stated next-actions with what the live signals changed. Rank by: (a) hard deadline proximity, (b) explicit priority order from OVERVIEW, (c) **newly unblocked** work (do the thing that was waiting the moment it frees up), (d) quick wins that unblock others. Down-rank anything still blocked.

4. **Output** — keep it tight and skimmable:
   - **📌 Top of the day** — 1 line on the single highest-leverage thing and why.
   - **▶️ Do next (ranked)** — 3–5 concrete actions, each with a one-line *why* (deadline / newly unblocked / someone waiting) and its **resume pointer** (project, branch, `claude --resume <session>` from the plan's Resume line) so you can jump straight in.
   - **🆕 Changed since last checkpoint** — newly unblocked, newly blocked, newly assigned, PRs now approved, meetings today that need prep. Only include real, signal-backed items.
   - **🔀 My open PRs & issues** — open PRs authored by you on `redis/docs` (each with merge-readiness: ready / approved-but-draft / stale) + issues assigned to you. Sort merge-ready first — these are the fastest wins.
   - **⏳ Still blocked** — one line each, who/what it's waiting on.
   - **📎 Flagged to revisit** — your Slack saved items (filtered/capped per step 2). List each with source + one-line gist; **flag the ones that map to an active plan** ("← ties to <project>"). This is a don't-let-these-rot tail, deliberately *below* the deadline-driven sections and not ranked into "Do next." Omit the section entirely if there are no non-noise saved items.
   - If Jira/GitHub reconciliation surfaced **drift** from the plans (ticket closed but still under Next, PR merged, etc.), note it and **offer to run `/checkpoint`** to persist the corrections. Do not write files from standup.

## Rules

- **Read-only.** Standup never edits `OVERVIEW.md` or plan files. It recommends; `/checkpoint` records. Safe to run any number of times a day.
- **Never fabricate status.** Every "newly closed / approved / assigned" claim must come from a live fetch this run, not memory or inference. If a signal source is down, say "couldn't check X" — don't guess.
- **Best-effort signals.** Any of Jira / GitHub / Calendar / Gmail / Slack may be unauthenticated or unavailable (non-interactive sessions, expired tokens). Skip the missing ones, note them briefly, and brief on the rest.
- **Respect the hub's priorities.** Deadlines and the 🔴/#1 ordering from OVERVIEW win over raw recency. A hard GA date outranks nice-to-haves.
- **Concrete over comprehensive.** The goal is "start here," not a full status dump — that's what OVERVIEW.md is for. Cap the ranked list at ~5.

## Operator note — GitHub / `gh`

`gh` needs both the OS keyring (for the token) and network access to `api.github.com`. In a restricted shell those can be unavailable, producing a keyring "token invalid" message or an `api.github.com` x509/TLS verification error — neither means the token is actually bad (verify with `gh auth status` in a normal shell). For the GitHub signal to work reliably, `gh` should be run in an environment where the keyring and `api.github.com` are reachable. You can manage what the sandbox permits via the `/sandbox` command; a one-time allow for `gh` / `api.github.com` makes this seamless. Until then, the OVERVIEW `🔀 GitHub` snapshot block is the fallback source.
