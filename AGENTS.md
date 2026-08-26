# Redis docs — conventions for AI-assisted editing

Conventions for drafting and editing pages in this repository. Everything here is a
property of the site or of the house style, so it holds everywhere.

**This file stays small on purpose.** It carries only what is true across every product.
As soon as a rule needs a product-specific caveat, it belongs in that product's
`AGENTS.md` instead — where it can be stated with its exception, and loaded only by
sessions editing those pages.

Product directories under `content/operate/` and `content/develop/` add their own
`AGENTS.md` covering terminology and disclosure. Read it before editing prose in one of
those directories. Where it conflicts with this file, the product file wins.

**Disclosure rules are not uniform across this repo.** Open source documentation under
`content/develop/` and `content/commands/` legitimately links to source code and
documents implementation internals, because the implementation is public and is part of
the product. Commercial product directories do not. Never carry a disclosure rule from
one product's pages into another's — check that product's `AGENTS.md`.

## Before applying any rule here

If a term, structure, or frontmatter shape is already used consistently across this
section's pages, that usage wins until it is deliberately changed everywhere at once. A
single page that disagrees with its neighbors is a page to fix; twenty that agree are a
convention.

Do not normalize an inconsistency you noticed while doing unrelated work — note it and
move on. Where a rule below says otherwise for a specific term, that rule wins.

## Style

- Google developer documentation style.
- Lead with the takeaway. The most useful sentence goes first.
- Present tense, active voice, second person. "The operator detects the change", not
  "changes are detected".
- Short sentences. Split anything with three clauses.
- Plain verbs: `use`, not `utilize`. Contractions are fine.
- Sentence-case headings. Procedure titles start with a verb: "Create a role".
- Numbered steps, one action per step. Call them **steps**, never "flows".
- Expand every acronym on first use in a page, including familiar ones: RBAC, CRD, TLS.
- No marketing register: not "seamless", "powerful", "simply", "easily", "just".
- No directional language ("above", "below", "on the left"). Link to the thing.
- Prefer `replica`, `allowlist`, `denylist`.

## Prose form and code form are different

Use the readable form in prose and the literal identifier only where the reader types
it, or once in parentheses on first mention.

Configuration keys, API fields, custom resource kinds, command names, and endpoint paths
are never reworded, re-cased, or pluralized to fit a sentence. If a sentence reads badly
around a literal, rewrite the sentence.

## Site mechanics

- **Cross-references use the relref shortcode**, not markdown paths:
  `{{< relref "/operate/rs/clusters/new-cluster-setup" >}}`. A broken relref fails the
  build. Link text is descriptive — never "click here" or a bare URL.
  **relref validates the page, never the heading** — a relref with a dead `#anchor`
  builds clean, so check the anchor against the built page yourself.
- **Prefer an internal relref to an external anchor** where we document the same thing.
  The relref is build-checked; an external anchor is not, and upstream restructures
  without telling us.
- **Pin GitHub deep links to a commit SHA**, never a moving branch. Line anchors such as
  `#L99-L130` drift silently as the file changes, so verify the lines at the SHA you
  pin. A link to a repository or file as a whole may stay on the default branch.
- **Never link a scroll-to-text fragment** (`#:~:text=`). It is not a real anchor, it
  breaks on any upstream rewording, and no checker can validate it.
- **Preserve shortcodes, frontmatter, and code fences verbatim.** Do not reformat them.
- **Frontmatter**: copy the shape from a sibling page in the same directory rather than
  composing one. `title` and `linkTitle` are effectively universal; `description`,
  `weight`, and `categories` are common but not required — a page without one is not a
  defect to fix. Key casing is inconsistent across the corpus (`title` and `Title`,
  `linktitle` and `linkTitle`) — match the directory you are in and do not normalize.
- **Inline HTML comments are for open items only** — a TODO or an unresolved question
  someone still has to act on. Never narrate a resolved decision or record where content
  came from. Delete a comment when its item is resolved rather than rewriting it as a
  note. Ticket references such as `<!--RED-12345-->` stay.
- **Examples must be runnable by the reader.** Use angle-bracket placeholders such as
  `<your-cluster-name>`, and never real credentials, addresses, or customer data.
- **New pages**: check whether the topic already exists and prefer extending or
  cross-linking an existing page. Prefer consolidated pages with H2 sections over many
  small files. Never leave a new page unlinked from its section index.

## Editing scope

Edit only what was asked. If a neighboring page or section also needs work, name it in
one sentence and stop.

An editorial pass should leave a page shorter, not longer. Do not add summary sections,
boilerplate introductions, or transitions the original did not have. If a section needs
new material to be usable, say so instead of writing it.

## Flag rather than decide

- **A technical fact looks wrong.** Never silently correct a command, value, field name,
  port, or version-specific fact. Say what looks wrong and leave it.
- **The change would remove or soften a documented limitation.** Weakening a published
  "no" is a product claim, not an edit.
- **A term appears that this file does not cover.**
