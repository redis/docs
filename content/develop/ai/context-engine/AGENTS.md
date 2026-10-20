# Redis Iris docs — conventions for AI-assisted editing

These pages document **Redis Iris**, the context engine for AI agents, and its services:
Agent Memory, Context Retriever, LangCache, and a Data Integration overview. The site
renders two directories as one Iris docs space with its own sidebar:

- `content/develop/ai/context-engine/` — concepts, quickstarts, SDK and REST examples,
  interactive demos, and the Data Plane API references.
- `content/operate/iris/` — Redis Cloud console procedures and self-managed Kubernetes
  deployment.

`content/operate/rc/context-engine/` holds bridge pages from the Redis Cloud navigation,
governed by the Redis Cloud conventions file under `content/operate/rc/`.

This file is duplicated in both Iris directories so that either one loads it on its own.
**Keep the two copies identical** — a change to one is a change to both.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file adds
structure, terminology, and disclosure rules for these directories, and wins where the
two conflict.

## Where new content goes

- **Redis Cloud console tasks**: `operate/iris/<service>/`, beside `create-service.md`.
- **Self-managed deployment**: `operate/iris/<service>/self-managed/`. Agent Memory and
  LangCache each have a full page set. Context Retriever's self-managed content is one
  page, `context-retriever/self-managed/_index.md`; extend it rather than starting a set.
- **Concepts, quickstarts, SDK and REST usage, demos**: `develop/ai/context-engine/<service>/`.
  Anything that spans services goes in `develop/ai/context-engine/concepts/`.
- **Never add content to `operate/rc/context-engine/`.** Each bridge page is a sentence
  or two and a link. Change one only when the page it points to moves or is renamed.
- **Data Integration is an overview and a demo only.** Its procedures live in the Redis
  Data Integration docs and the Redis Cloud RDI pages. Link to them; do not copy them.

Develop pages link to `operate/iris/` to create a Cloud service or deploy self-managed;
operate pages link to develop for concepts and the API. The Agent Memory and LangCache
self-managed indexes state that the develop API reference is the Data Plane API shared by
both deployment modes, and the Control Plane reference is self-managed only. Keep that split.

Frontmatter `categories` is fixed per directory: `docs, operate, iris` under
`operate/iris/`, `docs, develop, ai` under `develop/ai/context-engine/`. Copy `weight`
from siblings: in every service the concepts or overview page has weight 3 so it sorts
first, and the self-managed subtree has weight 40.

## Page types — copy from these

Where pages of one type have diverged, copy the page named here rather than the nearest
sibling.

| Page type | Copy from | Shape |
| --- | --- | --- |
| Cloud: create a service | `operate/iris/agent-memory/create-service.md` | Intro; `## Prerequisites and limitations`; `## Create a <Service> service` opening "From the Redis Cloud console, select…"; one `###` per console section with a `Setting name` / `Description` table; `## Next steps`. |
| Self-managed page set | `operate/iris/agent-memory/self-managed/` | Index with component, flow, and API-surface tables; prerequisites; deploy with a `## Before you install: check your values` table of checks, symptoms, and fixes; configuration; authentication opening with a `## Credentials` table; API examples; operations; configuration and troubleshooting. |
| Service landing | `develop/ai/context-engine/context-retriever/_index.md` | One-sentence takeaway; `tile-card` grid; `## What is <Service>?` with bold-lead bullets; `## Why use <Service>?` as two cards; `## Quick example`; get-started tabs. |

The three Agent Memory quickstarts follow one travel-planning scenario through the same
numbered headings; a change to one usually belongs in all three. The self-managed deploy
pages differ — Agent Memory numbers its `##` steps and LangCache does not — so match the
page you are editing. There are no Iris release notes here; Cloud launches go in the
Redis Cloud changelog.

Shared Cloud get-started and quickstart text comes from `content/embeds/rc-*` through
`embed-md`; edit the embed, not each page. `multitabs` offers Redis Cloud or self-managed
in a get-started section, and `tile-card` appears on landing pages only. A secret shown
only once gets a `> [!WARNING]` to save it. Console screenshots live in `/images/rc/`.

## Product and service names

| Use | Note |
| --- | --- |
| Redis Iris | First mention on a page; "Iris" after that. "Redis Iris context engine" is the section title; "context engine" is lowercase when it describes what Iris is. |
| Redis Agent Memory | First mention on Agent Memory's own pages. Later mentions use either form, and the self-managed pages repeat the full name throughout. Do not sweep one form into the other. |
| Context Retriever | The usual form, including on first mention. "Redis Context Retriever" appears on its index pages. |
| LangCache | The usual form. "Redis LangCache" appears in a few titles and intros; leave them. Never "Langcache", "Lang Cache", or "LC". |
| self-managed | The deployment mode on your own Kubernetes. Most pages say "self-managed", and two develop landing pages say "Redis Software"; match the page. |

Pages covering several services — landing, concepts, request flow — use the short forms.
Abbreviations such as RAM, AM, CR, and LC never appear in prose; the `ram-values.yaml`
filename and `LC-CL-1` checklist anchors are literals.

The Context Retriever Python package is `redis-context-retriever` and imports as
`context_surfaces`. Some link text calls it the "Context Surfaces Python Client"; keep that
where it names the Python client, and match the page.

## Components, isolation units, and credentials

**Data Plane**, **Control Plane**, and **Identity Service** are capitalized in prose.
Each service has its own isolation unit — a **store** in Agent Memory, a **cache** in
LangCache, a **surface** in Context Retriever — and on Redis Cloud the console object is
a **service**. Never swap one unit's name for another's.

Credential names differ by deployment mode and service and are not interchangeable:

- **Self-managed**: an **admin token** for the Control Plane and an **agent key**, minted
  by the Identity Service, for the Data Plane. The `## Credentials` table on each
  authentication page is the canonical list; link to it rather than restating it.
- **Redis Cloud, Agent Memory and LangCache**: prose says both "service key" and "API
  key"; match the page. The console labels are **API keys** and **New API key**; bold
  them as shown.
- **Redis Cloud, Context Retriever**: an **admin key** for administration and an **agent
  key** for tool calls.

Agent Memory and LangCache self-managed share the Identity Service and its grant model.
When a change touches one page set, check the sibling's matching page and say in the pull
request whether it needs the change too; do not assume it does.

Placeholders follow the page set: `<store-id>` on self-managed pages, `<STORE_ID>` in
the Agent Memory quickstarts.

## LangCache is not linked from the Iris-wide pages

The Iris landing pages, concepts page, and request-flow page do not link to or name
LangCache; they say "semantic caching", and their banners name only Agent Memory and
Context Retriever. The LangCache pages themselves stay where they are. Do not add a
LangCache tile, link, or named mention to those pages. The request-flow diagram's
`langcache` node ID is an identifier its edges refer to; never rename a node ID to match
a label.

_Transitional. Once the Iris-wide pages link to LangCache again, delete this section._

## Preview banners carry product status

Preview status is set with `bannerText` in frontmatter. `bannerChildren: true` shows the
banner on every page under that section index that has no `bannerText` of its own; a
page's own `bannerText` replaces the inherited one. Inline wording such as "during public
preview" in a prerequisites note carries the same status.

**Do not add, remove, or reword a banner or inline preview wording** while editing for
another reason. Status changes are made in one pass across both directories at a launch.
When a new page lands under a section that sets `bannerChildren`, check that the
inherited banner describes the new page's deployment mode, and flag it if it doesn't.

_Transitional. Once no Iris page carries `bannerText`, delete this section._

## API reference specs are generated — never hand-edit them

The spec file beside each `api-reference.md` and `control-plane-api-reference.md` page is
unedited generator output from the product's API definition; hand edits have been
reverted. If a spec is wrong, flag it. Explanatory prose goes on the pages, never in the spec.

## Interactive demos

Each demo page says the demo runs in the browser and connects to no service; keep that.
The service demos share one food-delivery dataset, and each demo's behavior lives in its
script under `static/js/`, so demo prose changes only together with the script.

## Document current behavior only

Do not foreshadow planned support, future feature expansions, or roadmap items — even
when a specification, an internal document, or a subject-matter expert mentions them.
Planned work slips, changes shape, or gets cut, and removing a promise from a published
page is visible to customers.

Wrong: "The reference will document this once the schema is updated." Right: state what
the reader can do today, and link to where it is documented.

**Carve-out — deprecation and removal notices are correct and expected.** The rule bans
promising something the reader will *gain*, not telling them what is going away.
Customers need lead time to migrate, and a warning is sometimes published ahead of the
removal itself to give them that time. Gains are out. Losses are in.

## Do not publish ahead of customer availability

Content describing a feature or a service does not go live until customers can use it.
The gate is availability to customers — not that the code merged, and not that the
capability exists in an internal build. A service or feature that is cut or deferred
takes its documentation with it: remove the content rather than softening it into a
promise. Do not add a tile, tab, or link for a service that has no published pages.

Drafting ahead is normal. Draft, verify, open the pull request, and hold it.

## The Iris source is private

The Iris source repositories are not public, so a file path or repository URL is a dead
end for every reader. These pages link to no Iris source; do not add a link. The SDK
packages on PyPI and npm and the container images on Docker Hub are public, and linking
to them is correct.

Where a statement was only defensible because it cited code, it either stands on its own
as documented behavior or it comes out. "Check the source for the valid values", in any
phrasing, means the page has a real gap. Flag it rather than shipping it.

Document what a reader deploys, configures, or calls: components, Secrets, Helm values,
config keys, endpoints, and error messages. Internal ticket keys, build tooling, and
internal code names appear in no page. Published pages carry no audit trail: strip
verification notes, "verified against" lines, source lists, and freshness dates.

## Flag rather than decide

- **A Helm value, default, image tag, or chart version cannot be confirmed** against a
  published artifact. Never infer one from a development copy.
- **A page names the services as a fixed set**, such as "all four services", and the set
  looks wrong. Say so; do not recount.
- **A statement's deployment mode is unclear** — Redis Cloud, self-managed, or both.
- **Internal material contradicts a published page.** The internal version may describe
  unreleased behavior, a rename, or the other mode.
- **A term appears that this file does not cover.**
