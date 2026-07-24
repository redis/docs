# Status-tracking workflow (standup / startwork / checkpoint)

A lightweight system for staying on top of many parallel docs projects: a private local **hub** of markdown + a few **slash-command skills** that form a daily loop. The skills are checked into this repo, so once you pull the branch they're available in any Claude Code session started here. You just add your own hub.

## The daily loop

| Skill | When | What it does | Writes? |
|---|---|---|---|
| **`/standup`** | Start of day / back at desk | Reads the hub + pulls **live signals** (Jira, GitHub, Calendar, Gmail, Slack) → ranked "do this next" list, each with a reason | Read-only |
| **`/startwork <project>`** | Diving into one task | Reads that project's plan → checks out the right branch → loads product context (`/rs`, `/k8s`, `/ff`) → briefs where to start | Read-only on hub (git checkout only) |
| **`/checkpoint`** | Switching tasks / end of a block | Detects the project from the git branch → updates its plan + OVERVIEW row (done / next / blockers / resume) → reconciles its Jira tickets against live status | Writes hub |

They compose: **standup** tells you what to do → **startwork** loads it → work → **checkpoint** saves state.

> **Why `/startwork` and not `/pickup`?** This repo already has an unrelated `/pickup` skill (thawing a *parked PR*, pairs with `/park`). The standup companion is named `/startwork` here to avoid the collision. Natural-language triggers like "pick up featureform", "work on X", or "resume X" still invoke it.

## Setup (one time, ~5 minutes)

1. **Pull this branch** (or merge it) so the skills land in `.claude/skills/`. They auto-register — no config.

2. **Create your private hub** at `~/claude-overview/` and seed it from these templates:
   ```
   mkdir -p ~/claude-overview/plans
   cp .claude/skills/_shared/status-workflow/OVERVIEW.template.md ~/claude-overview/OVERVIEW.md
   cp .claude/skills/_shared/status-workflow/plans/example-project.md ~/claude-overview/plans/<your-first-project>.md
   ```
   Fill in `OVERVIEW.md` (the at-a-glance table + a detail section per project) and one plan file. Start with a single project and grow from there.

3. **Keep the hub private.** It's your personal working state — don't commit it. Add `claude-overview/` to your global gitignore, or just keep it outside any repo (the default `~/claude-overview/` already is).

4. **Connect the live integrations** (optional but that's the point of `/standup`):
   - **Jira** via the Atlassian MCP connector.
   - **GitHub** via the `gh` CLI (`gh auth login`).
   - **Calendar / Gmail / Slack** via their MCP connectors.
   Every signal is best-effort — if one isn't connected, the skills skip it and say so. `/standup --fast` and `/checkpoint --fast` skip all live fetches for a quick hub-only pass.

## How it works / design principles

- **Split read from write.** `standup`/`startwork` never edit the hub; `checkpoint` is the only writer — so you can run standup any number of times a day with zero risk.
- **Never fabricate status.** Every "PR approved / ticket closed / newly unblocked" claim comes from a **live fetch this run**, not memory. If a source is down, the skill says so.
- **The plan carries nuance; live tools catch drift.** Reconciling tickets flags *changes* (closed, reassigned, advanced); the hand-written plan stays the source for the "why."
- **Resume pointers.** Every plan records the branch + Claude session to jump back into.
- **Respect real priorities.** Hard deadlines and explicit priority order beat raw recency in the ranked output.

## The hub layout

```
~/claude-overview/
├── OVERVIEW.md              # at-a-glance table + per-project detail + GitHub snapshot
└── plans/
    ├── <project-a>.md       # Next / Blocked / Resume / Done per project
    └── <project-b>.md
```

The plans are the source of truth; the skills read and maintain them. Templates for both files live next to this README.

## Adapting it

These skills are wired for the Redis docs team: they default to the `redis/docs` repo at `~/repos/docs`, load the `/rs` `/k8s` `/ff` product contexts, and reconcile `DOC-`/`RED-` Jira keys. If you work in a different repo or tracker, edit those references in the three `SKILL.md` files — the structure carries over unchanged.
