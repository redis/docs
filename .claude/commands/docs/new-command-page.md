---
description: Flesh out a content/commands/*.md page for a new/updated Redis command from upstream sources
argument-hint: <command name(s)> + source links (GitHub PR(s), Jira ticket)
---

You're going to flesh out one or more Redis command reference pages under
`content/commands/`, using the upstream command definition and PR(s) as the
source of truth. Work from `$ARGUMENTS` (command names plus any GitHub PR / Jira
links). **Don't write or edit any page until I approve the plan** — plan first,
then implement.

1. **Identify the commands and sources.** From `$ARGUMENTS`, determine the
   command name(s) and collect every source link given (GitHub PR(s) in
   `redis/redis`, a Jira ticket, etc.). If a link is missing or looks wrong
   (e.g. a "PR" link that points at Jira), say so and ask for the right one
   rather than guessing.

2. **Check for existing skeletons.** Look for `content/commands/<cmd>.md`. A
   skeleton usually already exists (front matter + `TODO:` placeholders) and may
   have railroad SVGs at `static/images/railroad/<cmd>.svg`. Note what's already
   there so you only fill the gaps.

3. **Gather authoritative details.** Use the connected MCP tools:
   - **GitHub** — read each merged PR (`pull_request_read`) for syntax, options,
     behavior, and edge cases; read the upstream command definition
     `src/commands/<cmd>.json` (try `refs/heads/unstable`, or the PR's head ref)
     for exact arity, key specs, ACL categories, arguments, and `reply_schema`.
   - **Atlassian/Jira** — read the ticket for motivation and intended behavior.
     If you have no cloudId, call `getAccessibleAtlassianResources` first and
     pick the `redislabs.atlassian.net` entry.

   Confirm the front matter in the skeleton matches the upstream JSON (arguments,
   `arity`, `key_specs`, `acl_categories`, `complexity`, `since`). Flag any
   mismatch; otherwise leave front matter as-is.

4. **Read the closest analog page(s).** Find the nearest existing command page
   (e.g. a sibling or the cardinality/store/variant of the same family) and read
   it plus 1–2 related pages to match prose style, examples, and shortcodes.
   Reuse wording where the behavior is parallel.

5. **Follow the canonical command-page structure (below).** Do NOT copy an older
   page's layout if it predates this template.

   **Section order:**
   1. Intro paragraph(s) — no heading. BRIEF (1–2 sentences): what the command
      does. Do NOT restate per-argument mechanics (those live in the argument
      descriptions); deeper behavior goes in Details. Front-matter `description`
      is usually a good basis. (A cluster/multi-key `{{< note >}}` goes above the
      intro if the command is multi-key, matching sibling pages.)
   2. `## Required arguments` — omit if none. Args as
      `<details open><summary><code>arg</code></summary>` blocks.
   3. `## Optional arguments` — omit if none. Same `<details>` format.
   4. `## Examples` — omit if none. A `{{% redis-cli %}}` block.
   5. `## Details` — single umbrella for ALL prose (patterns, behavior,
      implementation, concepts, history). Use `###` subsections (preserve original
      section titles) when there are multiple topics. Patterns (incl. worked code)
      live here. Omit if the page has no prose.
   6. `## Redis Software and Redis Cloud compatibility` — the compatibility table.
      Omit only on preview features (e.g. array pages).
   7. `## Return information` — RESP2/RESP3 `{{< multitabs id="<cmd>-return-info" >}}`
      block; link reply types to `../../develop/reference/protocol-spec#…`.
   8. `## See also` — optional, trailing. **Related commands**, pipe-separated:
      `` [`CMDA`]({{< relref "commands/cmda/" >}}) | [`CMDB`]({{< relref "commands/cmdb/" >}}) ``
   9. `## Related topics` — optional, trailing. **Concept/guide links**, bulleted:
      `- [RedisJSON]({{< relref "/develop/data-types/json/" >}})`

   `See also` always precedes `Related topics`; both go after `Return information`.
   `## Details` is the ONLY place `###` (H3) is allowed — any other H3 is either an
   argument list to convert to `<details>` or a prose subsection to fold into Details.

   **Authoring conventions for argument `<details>`:**
   - Structure (which args, required vs optional, multiplicity, tokens) comes from
     the front-matter `arguments:` block — authoritative. Only the prose
     DESCRIPTIONS are authored.
   - Summary `<code>` token uses the syntax form: `FIELDS numfields field [field ...]`,
     `field value [field value ...]`, `COUNT count`, etc.
   - Repeating pairs/groups (`item increment [item increment ...]`,
     `field value [...]`) go in ONE `<details>` block, not split.
   - DO NOT put raw angle brackets in a `<code>` summary (`<LEFT | RIGHT>`) — the
     browser parses `<LEFT` as a tag. Drop them: use `LEFT | RIGHT`, `BEFORE | AFTER`.
     Required oneofs still go under Required arguments.
   - Mutually-exclusive option groups: state the exclusivity in a lead-in sentence
     under `## Optional arguments` (see `set`, `msetex`), not by bundling options
     into one `<details>`.

6. **Front-matter touch-ups.** If a railroad SVG exists but the front matter
   lacks it, add `railroad_diagram: /images/railroad/<cmd>.svg` (alphabetically,
   after `linkTitle`). Don't otherwise change verified front matter.

7. **Compatibility table — pick the right variant.** Brand-new commands not yet
   in Redis Software / Redis Cloud use the **"Not supported"** ❌ table (see
   `content/commands/asking.md`). Commands that are supported use the ✅ Standard /
   Active-Active table (see `content/commands/sintercard.md`). If you're unsure
   whether a new command has shipped to Software/Cloud, ask rather than assume.

8. **Plan, then implement on approval.** Present the plan (sections + key wording
   per page). After I approve, write the pages and replace every `TODO:` marker.

9. **Verify.**
   - Grep the finished pages for leftover `TODO` markers (expect none).
   - Confirm front matter still parses (opens/closes with `---`).
   - Confirm every `relref` / link target exists under `content/`.
   - Build/serve locally (`hugo server`) if available and load the pages; check
     that railroad diagrams, multitabs, and links render without errors.
   - **Test the examples and return types against the local Redis OSS server**
     (`redis-cli -h localhost -p 6379`). Verify it's a build new enough to support
     the command (`COMMAND INFO <cmd>`) and that each example's output matches what
     the page documents. NOTE: connecting to localhost requires bypassing the
     command sandbox (localhost isn't on the network allowlist) — the user can
     manage this with `/sandbox`.

When done, summarize the pages created/edited and the verification results, and
leave the changes staged for me to review — don't commit or open a PR unless I ask.
