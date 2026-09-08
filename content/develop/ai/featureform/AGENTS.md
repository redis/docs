# Redis Feature Form docs — conventions for AI-assisted editing

These pages document **Redis Feature Form**, a feature platform. The documentation is
split across two directories by audience:

- `content/develop/ai/featureform/` — authoring and serving features: concepts,
  quickstart, definitions files, providers, workspaces, querying, serving.
- `content/operate/featureform/` — deploying the product and configuring
  authentication.

This file is duplicated in both directories so that either one loads it on its own.
**Keep the two copies identical** — a change to one is a change to both.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file adds
terminology and disclosure rules for these directories, and wins where the two conflict.

## The source is private — the open source carve-out does not apply here

The root file notes that documentation under `content/develop/` legitimately links to
source code and documents implementation internals, because the products documented
there are open source. **Feature Form is not.** Its source repository is private, so a
file path, repository URL, or "see the implementation" pointer is a dead end for every
reader of these pages.

These pages currently contain no source links. Do not add one.

Where a statement was only defensible because it cited code, it either stands on its own
as documented behavior or it comes out. "Check the source for the supported providers",
in any phrasing, means the page has a real gap. Flag it rather than shipping it.

Published pages carry no audit trail. Strip verification notes, "verified against"
lines, source lists, and freshness dates.

## Product names

| Use | Not | Note |
| --- | --- | --- |
| Redis Feature Form | Featureform, Feature form | First mention on a page. |
| Feature Form | Featureform, FF | Every later mention on that page. |
| feature platform | feature store | What the product is. The pages use "feature platform"; "feature store" appears nowhere in them. |

**"Featureform" as one word is a code identifier, never prose.** It is correct in the
Python package (`import featureform as ff`), in a module path, and in a type name such as
`ff.FeatureformError`. It is wrong in a sentence.

The command-line tool is `ff`. Use the literal in commands, and never as an abbreviation
for the product in prose.

## Resource vocabulary

The concepts page at `content/develop/ai/featureform/concepts.md` defines the resource
types and is the canonical source for them. Do not restate those definitions on another
page — link to it with `{{< relref "/develop/ai/featureform/concepts" >}}`. The
distinctions below are the ones most often gotten wrong.

- **Features and labels have the same shape and different jobs.** A feature is model
  input read at inference time. A label is the target value a model is trained to
  predict, and feeds offline training rather than online serving. They are not
  interchangeable.
- **A dataset registers data that already exists** in an offline store. A
  **transformation** produces a new dataset from existing ones. Neither is a "source" —
  that word is not a resource type here.
- **A feature view is the only graph resource downstream applications read from.**
  Applications do not query features directly.
- **A workspace is the isolation boundary.** Nothing is shared between workspaces. Never
  describe a resource as shared, global, or deployment-wide unless the page says so.

Provider **roles** are literal values — `offline-store`, `online-store`, `compute`,
`streaming` — and are not reworded or capitalized to fit a sentence. A provider fills one
or more roles; it is not "an offline store" in prose where the role name is meant.

## Materialization is described abstractly — never expose the storage layout

Feature Form materializes feature values into an online store, typically Redis. Describe
what materialization achieves — that values are populated and available to serve — and
stop there.

**Never document how those values are laid out in Redis.** No key formats, no key naming
schemes, no hash field names, no reserved metadata fields, no internal encodings. This is
a deliberate decision, not an omission to helpfully fill in: the layout is internal, it
changes without notice, and a reader who builds against it builds on sand.

The same holds for the planner and the task DAG. What a change causes is documentable;
how the work is scheduled and executed internally is not.

## Do not weaken the credential claim

These pages state that Feature Form never stores credentials in any form — not
plaintext, not hashed, not encrypted — and that a provider configuration carries only a
reference to a separately registered secret backend.

That is a security claim about the product. Do not soften it, qualify it, or restate it
in looser words while editing nearby prose. If something appears to contradict it, flag
it; do not resolve it in the text.

Examples never contain a real credential, host, or account identifier. A secret reference
in an example is a reference, such as `env:PG_PASSWORD` — not a value.

## Document current behavior only

Do not foreshadow planned support, future feature expansions, or roadmap items — even
when a specification, an internal document, or a subject-matter expert mentions them.
Planned work slips, changes shape, or gets cut, and removing a promise from a published
page is visible to customers.

- Wrong: "Support for additional providers is planned."
- Wrong: "This provider is expected to gain streaming support."
- Right: state which providers and roles are documented today, and stop.

**Carve-out — deprecation and removal notices are correct and expected.** The rule bans
promising something the reader will *gain*, not telling them what is going away.
Customers need lead time to migrate, and a warning is sometimes published ahead of the
removal itself to give them that time.

The test: does the sentence tell the reader they will gain something, or lose something?
Gains are out. Losses are in.

## Do not publish ahead of customer availability

Content describing a feature does not go live until customers can use it. The gate is
availability to customers — not that the code merged, and not that the capability exists
in an internal build. A feature that is cut or deferred takes its documentation with it:
remove the content rather than softening it into a promise.

Drafting ahead is normal. Draft, verify, open the pull request, and hold it.

## Flag rather than decide

- **A provider, role, or resource field cannot be confirmed** against the documented
  behavior. Never infer a supported provider or an accepted argument.
- **An example would need a credential, a real endpoint, or infrastructure detail** to
  work as written.
- **Internal material contradicts a published page.** The internal version does not
  automatically win — it may describe unreleased behavior or an internal rename.
- **A term appears that neither this file nor the concepts page covers.**
