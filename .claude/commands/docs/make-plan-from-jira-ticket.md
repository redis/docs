---
description: Build a doc plan from the Jira ticket implied by the current branch
argument-hint: (no args — uses current branch)
---

You're going to plan new documentation based on a Jira ticket. Don't write or
edit any files until I approve the plan.

1. **Find the ticket.** Run `git branch --show-current` and extract the
   `DOC-XXXX` key from the start of the branch name. If there isn't one, stop
   and tell me.

2. **Read the ticket.** Use the Atlassian MCP tools to fetch the issue from
   Redis Labs (cloudId `06f73ca7-8f2c-4392-b40a-08288e9d0ba3`). Pull:
   - summary, description, status, assignee
   - comments / discussion
   - any linked issues or Confluence pages worth a look

   Treat the ticket as a request for new documentation.

3. **Check whether the work is already shipped.** Look at the ticket's
   `status.statusCategory.key`. If it's `done` (e.g. "Complete", "Done",
   "Closed"), the doc has almost certainly already been written — don't
   fabricate a new plan. Instead, run an audit:

   - Find the merged work with `git log --all --oneline --grep=DOC-XXXX`.
   - Read each file those commits touched (use the diffs from `git show`
     to see exactly what was added).
   - Compare the shipped content against the ticket's brief, description,
     and any acceptance criteria in comments.
   - Present a short coverage table: each thing the ticket asked for vs.
     whether it shipped, with the file path for anything that did.
   - Call out any gaps (asks that weren't covered, or that may have been
     deferred to a different page).
   - **Do not call `ExitPlanMode`** — there's nothing new to plan. Ask the
     user which of these they want next: (a) plan a follow-up for any
     gaps, (b) point at a different `DOC-NNNN` branch, (c) stop. Wait for
     their pick before doing anything else.

   Otherwise (ticket is still open / in progress), continue to step 4.

4. **Draft a plan.** Produce an outline covering:
   - which page(s) to add or change, and where they sit in the docs tree
     (check neighbouring `_index.md` files to pick the right home)
   - section headings for each new or changed page
   - key points, examples, or diagrams the ticket calls for
   - anything the ticket leaves ambiguous that I should decide before you start

5. **Get sign-off.** Present the plan and call `ExitPlanMode` so I can approve
   it. Frame it so the default is "go ahead and implement" — I'll only push
   back if I want changes.
