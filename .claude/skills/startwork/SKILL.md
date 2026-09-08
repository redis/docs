---
name: startwork
description: Start focused work on one task — the "dive in" companion to /standup and /checkpoint. Given a project/ticket/branch (or the top OVERVIEW priority if none named), reads the claude-overview hub for that project, checks out the appropriate branch in the docs repo, and loads the matching product context (/rs, /k8s, or /ff) so the thread is ready to work. Read-only on the hub; it prepares, it does not record. Use when the user says "start work on <X>", "pick up <project>", "start on <X>", "dive into", "work on", "get me set up on", "resume <project>", "load context for", or names a project/ticket to begin.
---

# Start work

The "dive in" companion to `/standup` and `/checkpoint`. Where **standup** ranks *what* to do (read-only briefing) and **checkpoint** saves state on the way *out*, **startwork** gets a fresh thread fully loaded to *start* on **one** task: it reads the `claude-overview` hub for that project, **checks out the right branch** in the docs repo, and **loads the matching product context** (`/rs`, `/k8s`, `/ff`) — then tells you exactly where to start.

> **Naming note:** in this repo this skill is `startwork` because the repo already has a different `/pickup` skill (thawing a *parked PR*, pairs with `/park`). They're unrelated — this one is the standup/checkpoint companion.

Reads the hub at `~/claude-overview/` by **absolute path** (not the current working directory). **Read-only on the hub** — it never edits `OVERVIEW.md` or plans (that's `/checkpoint`'s job). Its only side effects are git operations (`fetch` / `checkout`) and loading a product-context skill.

> **First-time setup:** expects a personal hub at `~/claude-overview/`. If you don't have one, see `_shared/status-workflow/README.md`.

Run it from any repo — it resolves the hub and the docs repo by absolute path.

## Steps

1. **Identify the target project (resolve to exactly one).**
   - If the user named a project / ticket key / branch in the invocation, match it to a plan file (`grep -rli "<arg>" ~/claude-overview/plans/*.md`) and/or against the OVERVIEW at-a-glance rows.
   - If **no** argument, read `~/claude-overview/OVERVIEW.md` and **suggest the highest-leverage actionable project** — nearest hard deadline, then 🔴 > 🟡 > 🟢/🔵 priority, skipping anything `parked` / `not started` / fully `DONE` or currently blocked — and **ask the user to confirm or pick another**.
   - If the arg matches several plans, list the candidates and **ask which one**. Never guess when ambiguous.

2. **Read the hub for that project (read-only).**
   - The OVERVIEW row **and** the project's detailed section: status, priority, deadline, blockers, progress.
   - The plan file `~/claude-overview/plans/<project>.md`: **Next (pick up here)**, **Blocked / waiting on**, the **Resume** line (branch + session id), and the referenced Jira tickets + PR numbers.
   - Convert any relative dates with `date +%Y-%m-%d` — never guess today.

3. **Check out the appropriate branch.**
   - **Repo:** default to the docs clone at `~/repos/docs` (all plan branches/PRs live in `redis/docs`). If the plan's Resume/branch line points at a different repo (e.g. the Redis-Enterprise source repo at `~/repos/Redis-Enterprise`), use that. If genuinely ambiguous, ask.
   - **Branch:** take it from the plan's **Resume** line / branch reference. If the plan records none, derive it from the ticket key (e.g. `DOC-6576`) and confirm, or ask.
   - **Safety first — never discard uncommitted work.** Run `git -C <repo> fetch` then `git -C <repo> status --short`. If the working tree is **dirty**, **stop and surface it** — do not `stash`, `reset`, `checkout -f`, or discard anything. You may be mid-work on another task; offer to run `/checkpoint` on the current branch first, then let the user decide.
   - **If clean:** `git -C <repo> checkout <branch>`. If the branch is remote-only, `git -C <repo> checkout -b <branch> --track origin/<branch>`. If the local branch is **behind** `origin`, say so and **offer** to `git -C <repo> pull` (never force, never auto-pull).
   - Report the result: branch name, ahead/behind vs origin, and the last commit (`git -C <repo> log --oneline -1`).

4. **Load the product context.**
   - Map the project to its docs-context skill and **invoke it** so the source repo + conventions load:
     - **Redis Software** (RS release notes, RS release-process runbook, custom modules, etc.) → **`/rs`**
     - **Kubernetes / operator** (operator releases, K8s RBAC, K8s maintenance RN, etc.) → **`/k8s`**
     - **Feature Form** (restructure, develop/deploy/UI docs) → **`/ff`**
   - If the project maps to no known product context (e.g. professional-development, backlog-reduction), **skip and say so** — there's nothing to load.
   - If a project spans two products, load the one this task belongs to (ask if unclear).

5. **Pull live task signals** (best-effort — run in parallel, skip gracefully, never fabricate).
   - The plan's **Jira tickets** — live status/assignee via `searchJiraIssuesUsingJql` (`key in (…)`).
   - The plan's **PRs** — `gh pr view <n> --repo redis/docs --json state,reviewDecision,mergeable,isDraft,statusCheckRollup` for review/merge/CI state. (`gh` is sandbox-excluded, so it works in-sandbox; if it errors, see `/standup`'s operator note.)
   - Flag anything that **changed since the plan was last touched** — newly unblocked, PR now approved, ticket advanced/closed — so the thread starts from truth, not a stale plan.

6. **Brief: "you're set up — start here."** Keep it tight:
   - **One line:** project · priority · deadline.
   - **Branch:** `<branch>` checked out in `<repo>` (+ ahead/behind, + any dirty-tree warning that stopped the checkout).
   - **Context:** which product skill loaded (or "none — not a product-doc task").
   - **▶️ Start here:** the top **Next** action from the plan, adjusted for any live-signal change.
   - **⏳ Blockers:** anything still waiting, one line each.
   - Close by noting the user can run **`/checkpoint`** when they switch out.

## Rules

- **Read-only on the hub.** Startwork never edits `OVERVIEW.md` or any plan file — it reads them, acts on git, and loads context. Recording state is `/checkpoint`'s job.
- **Never discard uncommitted work.** A dirty working tree halts the checkout. No `stash` / `reset` / `-f` / discard without the user's explicit OK. Offer `/checkpoint` on the current branch first.
- **One project per run.** Resolve to a single plan + branch. If the target is ambiguous or unnamed, ask (or suggest the top OVERVIEW priority and confirm) — don't guess.
- **Best-effort signals; never fabricate status.** Jira / GitHub may be unavailable — skip and say so. Every "changed / approved / unblocked" claim must come from a live fetch this run, not memory.
- **Absolute paths.** Hub = `~/claude-overview/`; default git repo = `~/repos/docs`. Resolve both regardless of the current working directory.
- **Respect the hub's priorities.** When suggesting a project (no arg), hard deadlines and 🔴/#1 ordering win over recency.

## Operator note — git in the sandbox

`git fetch` / `checkout` / `pull` in `~/repos/docs` and reading `~/claude-overview/` are normal reads/writes within the clone and hub. If a git network op (`fetch`/`pull`) hits a TLS/keyring error in a restricted shell, that's the same environment restriction described in `/standup`'s operator note — retry outside the sandbox. `gh` is typically sandbox-excluded (`sandbox.excludedCommands: ["gh *"]` in `~/.claude/settings.json`), so PR lookups work in-sandbox.
