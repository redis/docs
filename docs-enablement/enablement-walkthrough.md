# How a docs change would flow — a walkthrough to react to

*A companion to the [pre-read](docs-team-preread.md). Nothing here is decided — it's a concrete "what would this actually feel like" so we're reacting to something real instead of a blank page. Mark it up.*

The idea: **one flow, dialed to how much help a team needs** — from us drafting for a brand-new team, to a mature team self-serving with light review. Below is the flow followed all the way through for one change, then the same flow at three levels of support.

**Tooling status legend:** ✅ **exists today** · 🟡 **drafted, staged on branch `docs-enablement`** (not merged) · ❌ **still to build**. Steps that depend on a ❌ item only fully hold once it ships — which is the whole reason for **tooling-first: the tools land before we ask SMEs to contribute.**

---

## One change, start to finish

**Scenario:** an engineer (the **contributor / SME**) is developing a new user-facing setting → it needs a short task or concept page. A **writer** owns voice, structure, placement, and the merge. `main` is always publish-ready; **a merge to `main` fast-forwards to `latest`, so merge = live.** Work-in-progress and embargoed content stay on branches.

### Part 1 — the contributor (SME)

0. **Get access.** Fork the repo and open PRs from your fork — that works out of the box. Prefer to work directly in the repo instead? Ask in **#ask-docs** and we'll add you as a collaborator. Either way the clone carries our conventions via the committed root `CLAUDE.md`.
   - *Tooling:* ✅ fork + PR flow (works today) · ✅ repo write-access flow (already in use for cloud-docs contributors) · 🟡 committed root `CLAUDE.md` · ❌ `AGENTS.md` pointer for Codex users
1. **Track it.** Opens a "draft docs for &lt;feature&gt;" ticket (part of *their* definition of done), product-labeled, linked to the feature PR. For substantial work it pairs with a docs-team "review & publish" ticket.
   - *Tooling:* ✅ Jira DOC project + `docs-rs`/`docs-k8s` labels + PR↔Jira autolink + Slack↔Jira sync · ❌ two-ticket automation
2. **Check what exists first.** Searches the docs; if a related page exists, **folds into / cross-links** it rather than making an orphan or duplicate.
   - *Tooling:* ✅ repo grep + site search + Glean (cross-product) · ✅ `content/embeds/` (extend an embed vs. duplicate) · ❌ coverage-search step in `/draft-doc`
3. **Starts from a template.** `hugo new … --kind task`; sets `weight` to fit siblings, matches section `categories`.
   - *Tooling:* ✅ Hugo `hugo new --kind` + generic default archetype · 🟡 per-type `archetypes/{task,concept,reference}.md`
4. **Drafts with AI in the repo.** Claude inherits `CLAUDE.md` → drafts in our voice.
   - *Tooling:* ✅ Claude Code / Codex in-repo · ✅ per-product conventions (raw material) · 🟡 committed `CLAUDE.md` style rules · ❌ `/draft-doc` skill · ❌ author-voice profile
5. **Self-check + test.** Runs the self-review, fixes flags — then does the one thing tools can't: **actually runs the steps** and confirms it works.
   - *Tooling:* ✅ Vale (local; starter kit built) · ✅ shortcode-path hook (local) · ✅ local `hugo` build · ✅ `/edit` · 🟡 `/docs:review-doc` · ❌ frontmatter validator
6. **Opens a PR.** Fills the docs checklist; adds an `aliases` entry for any moved content. Below the starting-place bar → we **bounce it back** with a pointer (it stays an edit, not a rewrite).
   - *Tooling:* ✅ link-check + Hugo-build CI · ✅ `aliases` convention · 🟡 PR template + CONTRIBUTING + DoD · ❌ **PR-blocking gates** (link-check on `pull_request`, Vale-in-CI, shortcode hook → CI, frontmatter validator) — *the biggest gap: the gates aren't gates yet*

### Part 2 — the writer

0. **Ownership.** Primary (or backup) owner for the area, with a documented **team profile** (support tier, SMEs, conventions) so anyone can cover.
   - *Tooling:* ✅ repo review rights · ❌ per-team profiles · ❌ primary+backup map
1. **Picks up the review.** A briefing over the review + bug queues surfaces the ticket + PR.
   - *Tooling:* ✅ `/standup`·`/checkpoint`·`/pickup` suite (proven prototype) · ❌ team-adapted, queue-aware version
2. **Reviews at the right tier.** Routine additive → light lane (releases / security / API refs get the deep track). The human pass is **judgment-only** — voice, structure, placement, cross-links — because the gates handled the mechanics. Edits *from* the draft.
   - *Tooling:* ✅ Andy's `.claude/commands/docs/*` (pattern to build on) · ❌ review-tier policy · ❌ review agent (structured-review comment)
3. **Merges → publishes.** Merges to `main`; protected paths require a human reviewer first; on merge `main` fast-forwards to `latest` → live, no manual publish step.
   - *Tooling:* ✅ existing deploy pipeline · ✅ `main`+`latest` branches · ❌ CODEOWNERS · ❌ branch protection · ❌ `main → latest` auto-ff Action · ❌ gated auto-merge
4. **If something's wrong post-publish.** Publish is instant, so safety = **fast rollback**: a `revert` on `main` re-publishes the good state.
   - *Tooling:* ✅ `git revert` (+ the auto-ff Action, once built) · ❌ rollback runbook step

**Embargoed variant:** for a timed release, content sits on a **release branch** and merges to `main` at go-time, then auto-publishes.

---

## Same flow, three levels of support

The flow above is the **machinery**, and the whole point of it is that documenting a change gets **faster and simpler for everyone** — not that the work just moves onto the SME. What changes per team is only **how much we do together vs. the SME alone**, the **entry-point bar**, and the **review depth** — never the quality bar or the gates. New teams start at ①; the default trajectory is *toward* ③.

**① High-touch / hand-holding** — *new team, or complex / high-stakes content. This is the floor — the most support we offer.*
- **We gather the material and use automated change-detection** — a dev-repo scan surfaces docs-relevant PRs so changes don't slip, and we pull together the notes / spec / working config with the dev and draft from there.
- **We draft** and own placement from the start; deep review; first few PRs reviewed regardless.
- **Manual merge** after sign-off.
- *Graduates once the team reliably supplies accurate, complete raw material.*
- ⚠️ **What this replaces:** the old status quo where **a writer manually watches the repo** for changes. Detection is now **automated** (the dev-repo scan), and the dev still confirms and supplies the material — the piece that goes away is the writer monitoring by hand.

**② Light-touch** — *the walkthrough above; a team contributing steadily.*
- SME opens a **draft PR from a template**; we coach, review closely, own IA.
- We edit *from* their draft; **manual merge** after light review.
- *Graduates once their PRs clear the bar first-try with sound placement.*

**③ Self-serve** — *goal state (e.g. a matured Iris).*
- Team **drafts + self-reviews + opens ready PRs**; we do a **light final review** only.
- **Gated auto-merge** for routine content (gates green + no Bugbot issues + self-review clean + a readiness label) — the Iris semi-automation ask, *earned*. **Security-relevant changes always get a human reviewer before publish, on every path** — no auto-merge exceptions.
- *Can move back to light-touch if quality slips (reviewed each quarter / per N PRs).*

---

## What we'd need to build, in order

1. 🔴 **Add the PR gates, tiered by strictness.** **Blocking:** valid frontmatter + Hugo build + shortcode paths — a broken build is a broken live page, so these stop a merge. **Advisory (non-blocking):** link-check and Vale style — surfaced on the PR to fix, never a merge-blocker. *(Everything else rests on this.)*
2. **Merge the staged contributor kit** — `CLAUDE.md` + per-type archetypes + CONTRIBUTING + PR template + DoD.
3. `/docs:review-doc` self-review skill.
4. CODEOWNERS + branch protection (the protected-path floor).
5. `main → latest` auto-ff Action (merge = live).
6. `review_status` field + page banner.
7. `/draft-doc` + the review agent.
8. Two-ticket automation, per-team profiles, team-adapted `/standup`.

**The one honest caveat:** every ❌ above is why we can't ask teams to contribute yet — this is the picture *after* the tools ship. That ordering (tools first) is the thing I most want us to agree on Wednesday.
