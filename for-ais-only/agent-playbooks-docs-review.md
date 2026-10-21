# Agent Playbooks developer documentation review

Updated **2026-10-14** after the developer review feedback, rebase onto the current Iris navigation, standard TCE migration, and agent-integration pass. **Ready for local human expert review of the core developer experience.** The extraction pipeline remains outside this work. The changes are prepared for a draft, WIP PR. No publication gate is included; merging to `main` publishes the pages.

## First-time developer improvements

The FAQ explains where to find refund status. The separate `refund-support-reply` skill drafts a customer reply from a reported stage or a missing refund, chooses a supporting template, preserves the customer's exact stage, and asks for missing input. The agent-integration guide retrieves context through the SDK before the turn, then lets OpenAI Agents SDK or LangGraph select and load a skill through MCP. Both languages use the ordinary “Processing” task without naming a skill, print tool arguments and the final reply, and retain returned identifiers and URIs. Its result no longer depends on a question that the FAQ can answer alone. Tool selection remains model-dependent; the documented checks do not promise a fixed call sequence.

Code examples now use the repository’s `clients-example` system, with canonical Python, TypeScript, and Bash sources in `local_examples/iris/playbooks/`. Readers can expand an example and copy its complete program. The separate downloadable programs and their generation are removed. Main walkthrough copies retain their publications; withdrawal and permanent deletion have separate source sets requiring an explicit entry identifier. Python and TypeScript skill copies keep the shared package-preparation prerequisite. Site generation uses the existing local-examples processor; `build/agent_playbook_docs/examples.py` is only an adapter for validation of those same processed sources and named steps.

Repeated setup prose was shortened. Authoring now contrasts broad questions/descriptions with task-specific wording. Intents are identified as optional context returned in discovery rather than similarity inputs. Retrieval includes a concrete republishing race and guidance for comparing relevant and nearby out-of-scope questions. The extra prose is concentrated in runnable-example instructions, expected outcomes, and evaluation cases. The draft banner and alpha package versions remain unchanged; no beta release claim was inferred from editorial feedback.

## Operator documentation handoff

**The developer PR does not include operator pages.** The separate stacked branch `MOD-19679-playbook-operator-docs` now starts the self-managed operator scaffold; see its [operator review handoff](agent-playbook-operator-docs-review.md) for verified routes, release sources, and remaining work. It follows the existing Iris layout, especially `content/operate/iris/agent-memory/` and its `self-managed/` section. Keep developer guides focused on content authoring, retrieval, and runtime integration.

The intended section is `content/operate/iris/agent-playbook/`, matching the singular developer URL. These are proposed destinations, not published routes or claims that every deployment option is available:

| Future operator material | Pattern and developer handoff |
|:-------------------------|:-----------------------------|
| `_index.md` | Deployment-options landing page, following Agent Memory. Link from the developer overview once it exists. Describe only supported deployment options. |
| `create-service.md` | Service/playbook provisioning prerequisites and readiness. Link from Quickstart's “Before you begin” for the supported managed path. |
| `view-service.md` | Where to obtain the runtime endpoint and playbook identifier, inspect readiness, and configure retrieval. Link from Quickstart's connection values and Retrieval's administrator settings. Use the final page's real anchors. |
| Key administration and authentication | Follow the access-management pattern in Context Retriever and the self-managed authentication guide in Agent Memory. Explain provisioning, expiry/revocation, and playbook action grants; link from Quickstart and Concepts. Choose final filenames when the operator scope is agreed. |
| `self-managed/` | Index, prerequisites, deployment planning, data-plane configuration, deployment procedures, authentication, operations, and control-plane reference. Link its setup route from Quickstart and its configuration guidance from Retrieval. Keep administrative credentials separate from runtime keys. |
| Source connection and extraction settings | Link from Proposals only after the separate extraction work is implemented and reviewed. Configuration is operator work; reviewing candidates remains developer work. |

The developer PR leaves operator handoffs unresolved. The operator stack adds working links for the overview, quickstart, key administration, and retrieval settings. Extraction setup and managed onboarding remain deferred. Do not link the remaining proposed paths or invent console instructions; resolve their handoffs when verified guidance exists.

## Completeness assessment

The API reference covers all **37 public SDK operations**, and every operation is now described in the guides. The displayed examples execute **33 synchronous Python operations**, with equivalent TypeScript and HTTP examples, plus a standalone asynchronous search. Proposal purging remains a commented alternative; bulk FAQ deletion, bulk skill deletion, and clearing are documented in a maintenance table rather than run during the walkthroughs. These counts measure documentation coverage, not live-service correctness.

| Area | Assessment |
|:-----|:-----------|
| First useful result | Covered: connection, health request, FAQ creation, exact-version review, publication, search, discovery, update, and cleanup. |
| FAQ and skill lifecycle | Covered: complete immutable versions, explicit publication, rollback, withdrawal, deletion, package preparation, resource reads, entry inventory, and version-history pagination. |
| Retrieval | Covered: search versus discovery, the authoring fields used for semantic matching, exact filters, pins, thresholds, count limits, preview budgets, and publication changes during skill loading. |
| Proposals and evidence | Covered: inbox pagination and search, manual creation, duplicate review, evidence submission, candidate replacement with revision checks, acceptance, publication, dismissal, restoration, retention, and promotion history. |
| MCP | Covered: working agent integration, three retrieval tools, authentication, progressive loading, tool failures, standard resource reads, and text/binary results. |
| SDK maintenance tasks | Covered: pagination through empty pages, optional totals, lookup by identifier or immutable key, found/missing results, content digests, bulk cleanup, asynchronous Python, timeouts, and custom-client ownership. |
| Core features arriving through Iris | The reviewed data-plane contracts align with the SDK. Browser administration, operator setup, and extraction configuration are separate from this developer path. Future MCP skill extensions are not implemented and should not be presented as available. |

## Coverage added

The user authorized these additions after the initial review. They extend existing pages without adding another reader path.

1. **Semantic matching inputs.** FAQs and Retrieval now identify the FAQ question or skill name and description as the embedded fields. Intents, FAQ answers, metadata, skill instructions, and supporting files do not affect similarity scores. Attribute filters are explained separately. Source: `../iris/playbook/dataplane/internal/usecases/candidates/processor.go`, `embeddingInput`.
2. **Entry inventory, history, and lookup.** FAQs and Skills now include cursor loops for entries and full version history. The shared lookup example resolves the same FAQ by identifier and immutable key, handles found/missing results, and exposes latest/publication digests, version count, and the version limit. Concepts and Limits explain permissions, live lists, empty pages, and unknown totals. Sources: `entries/lookup.go`, `entries/service.go`, and the list/lookup structures in `playbook/dataplane/api/redis.ai.playbook.dataplane.smithy` under `../iris`.
3. **Proposal inbox, duplicate review, and history.** Proposals now includes inbox and trash pagination and semantic search. It explains the typed duplicate conflict and `existingProposalId`, reviewing before attaching evidence, and the distinct `promoting` and `promoted` states. Sources: `../iris/playbook/dataplane/internal/usecases/proposals/service.go`, `internal/adapters/repositories/proposals.go`, and `internal/domain/proposal.go`.
4. **Asynchronous Python and client configuration.** Quickstart now contains a standalone `async with Playbook(...)` search example, request timeout guidance, and a pointer for custom HTTP clients and their ownership. Source: `../iris-sdks/playbook-python-sdk/src/redis_agent_playbook/sdk.py` and the [published SDK documentation](https://pypi.org/project/redis-agent-playbook/0.1.0a2/).
5. **MCP resources and binary files.** MCP describes `resources/templates/list`, `resources/read`, text/blob decoding, empty blobs, and current-publication access. Skills distinguishes descriptor digests, HTTP content digest headers, and normalized entry digests. Sources: `../iris/playbook/dataplane/internal/adapters/handlers/mcp/skill_resources.go`, `tools.go`, and the resource handler. Proposed `skills/list`, `skills/get`, and directory-resource extensions remain deferred.
6. **Precise restrictions and maintenance scope.** Skills names the archive restrictions on symbolic links and special files while explaining support for regular binary files. Concepts replaces “embedding identity” with the fixed provider, model, and dimensions. Limits documents bulk deletion and clear scopes, permissions, defaults, partial progress, and count semantics. Sources: `../iris/playbook/dataplane/internal/usecases/candidates/skill_archive.go`, the playbook configuration contract, and the public bulk/clear operations.

## Tone and terminology

The prose leads with developer tasks and uses concrete descriptions of instructions, scripts, references, and templates. It preserves the product name **Redis Agent Playbooks**, the singular URL/package name `agent-playbook`, lowercase **skill** and **playbook** in ordinary prose, and the distinction between **entry versions** and **proposal revisions**. Acceptance/promotion creates an unpublished FAQ; publication remains a separate action. Frontmatter and API schemas are unchanged.

The earlier teaching pass reviewed the pages as a new developer, a skill author, and a product reviewer. The overview now explains what Playbooks supplies at runtime and how applications control agent context and actions. The discovery guide shows a first request before configuration details. Authoring guidance distinguishes descriptions used for matching from instructions used to perform a task. Evaluation guidance names concrete checks: paraphrases, similar questions outside an answer's scope, correct template selection, and preservation of customer-provided information. Repeated package/reference introductions were removed. That pass shortened the section by 148 words without changing the examples. The subsequent first-time developer improvements described in this report intentionally revise the skill package and MCP task, add final FAQ retrieval, and provide complete programs through standard TCE sources. Frontmatter and the API contract remain unchanged.

All four SVG diagrams, their embeds, sizing attributes, and diagram-specific references were removed. The existing explanations and numbered retrieval steps stand on their own.

The second example audit corrected three practical issues:

- Proposal replacement now edits the action just retrieved, preserving its fields and using the corresponding revision. It no longer pairs a fresh revision with the original creation payload, which could overwrite another reviewer's changes.
- Skill versioning now adds a chat-channel attribute while preserving the package and existing attributes. The sequential walkthrough makes a real content change without requiring an unshown file edit mid-script. The sample skill has distinct steps for listed and missing refunds and a response template with a clearly marked placeholder.
- The HTTP error example now exits unsuccessfully after a failed request and handles a non-JSON error body. Python resource reads report missing skills or templates clearly and still close streams.

The test fixture now returns the actual uploaded template bytes and a matching file digest. Regression checks exercise earlier reviewer changes and JSON/non-JSON errors in Python, TypeScript, and HTTP.

## Scope and reader path

There are ten public pages under `content/develop/ai/context-engine/agent-playbook/`. The plural product name remains Redis Agent Playbooks. The URL path is singular. The old developer path and the complete operator draft have been removed. No old-path aliases are needed for this unpublished branch.

A developer receives an existing ready playbook, its data-plane endpoint, and scoped keys. The reader path is **publish and search an FAQ → discover knowledge → update a published version → add skills or review proposals → connect an agent through MCP**. No console screens, installation route, CLI commands, or unreleased SDK interfaces are invented.

| Page | Type | Outline |
|:-----|:-----|:--------|
| [Overview](../content/develop/ai/context-engine/agent-playbook/_index.md) | Overview | Product purpose; choose skills or FAQs; get started; find each guide and reference. |
| [Concepts](../content/develop/ai/context-engine/agent-playbook/concepts.md) | Concepts | Playbooks and access; entries; immutable versions; publication; discovery; proposals; evidence. |
| [Quickstart](../content/develop/ai/context-engine/agent-playbook/quickstart.md) | How-to | Connection prerequisites; create a refund-status FAQ; review and publish; search; discover; update; clean up; asynchronous Python. |
| [FAQs](../content/develop/ai/context-engine/agent-playbook/manage-faqs.md) | How-to | Write answers and retrieval context; create drafts; promote reviewed proposals; publish; update; list entries and history; look up state; withdraw or delete. |
| [Skills](../content/develop/ai/context-engine/agent-playbook/manage-skills.md) | How-to | Agent Skills format; package and validation; upload; review and publish; version; load text/binary files; list entries and history; withdraw or delete. |
| [Proposals](../content/develop/ai/context-engine/agent-playbook/proposals.md) | How-to | Browse and search the inbox; create; review duplicates; attach evidence; edit; accept and publish; dismiss/restore/purge; inspect history; review opt-in extraction output. |
| [Retrieval](../content/develop/ai/context-engine/agent-playbook/retrieval.md) | How-to | Discovery selection and controls; pins; preview budgets; progressive skill disclosure; search and its request controls. |
| [MCP](../content/develop/ai/context-engine/agent-playbook/mcp.md) | How-to | Three tools; transport and headers; standard Python, TypeScript, and curl clients without a model; skill resources; connection failures. |
| [Agent integration](../content/develop/ai/context-engine/agent-playbook/agent-integration.md) | How-to | Application-controlled discovery before a turn; agent-controlled skill loading through MCP; OpenAI Agents SDK and LangGraph in Python/TypeScript; output checks; missing or stale knowledge. |
| [API reference](../content/develop/ai/context-engine/agent-playbook/api-reference.md) | Reference | Interactive public data-plane contract and downloadable OpenAPI. |
| [Limits](../content/develop/ai/context-engine/agent-playbook/limits.md) | Reference | Content ceilings; retrieval and pagination constraints; proposal/evidence limits; retention; status codes; conflicts; safe retries; bulk cleanup. |

FAQ means frequently asked question; API means application programming interface; SDK means software development kit; MCP means Model Context Protocol; HTTP means Hypertext Transfer Protocol.

## Product boundaries to preserve

- Creating and appending produce unpublished immutable versions. Publishing selects one exact version. Withdrawal retains history; deletion removes the entry family.
- Proposal authoring currently supports ADD/new-entry FAQs, not skill proposals or updates to existing entries. Acceptance promotes one reviewed candidate to an unpublished FAQ; publication is separate.
- Proposal evidence is immutable source context supplied by the caller. It is not a correctness vote or independently verified attribution, and it is not copied to an accepted FAQ.
- Search and discovery serve current publications. Type-specific search can override threshold and count. Combined discovery uses playbook thresholds, pins, and a preview budget. Pins bypass semantic ranking and filters but consume budget.
- MCP and direct management reads have different serving boundaries. MCP tools serve only current publications. Copy the returned entry/version pair and resource addresses.
- The source connection and extraction activation belong to management. The proposal guide explains reviewing its output without introducing operator setup or internal worker design.

## Sources and release qualification

The public reference remains matched to **`redis-agent-playbook==0.1.0a2`**, **`@redis-iris/agent-playbook@0.1.0-alpha.2`**, and the locked SDK contract. Both published packages were used for example validation. The [source lock](../build/agent_playbook_docs/source-lock.json) records the contract and usage overlay. The final comparison used local Iris at **`fac2560f19b8af03f7f2794f54fddd108755fe01`** and `iris-sdks` at **`31dcb7046443777a451f0e5e64199383f2151b34`**. The SDK source check passes, and all vendored request/response schemas match the current local SDK contract.

Extraction implementation, binding setup, source provenance extensions, and SDK alignment for that pipeline belong to the separate PR requested by the user. The existing conditional overview of extraction is retained and is not counted as completed pipeline documentation. The main checkout's binding contract still states that its slice does not run extraction. No extraction worktree or live worker was validated in this pass.

Implementation and public contracts take precedence over stale design text. The core technical design document still calls version digests private and browser administration a non-goal, while the current public contract and implementation expose content digests and support browser administration. Those design-document discrepancies are outside this docs edit.

Review foundations:

- [Repository conventions](../AGENTS.md), [developer guidance](../AI_AGENT_DEVELOPER_GUIDE.md), and neighboring Context Retriever and Agent Memory pages informed navigation, frontmatter, and explanation depth.
- The official [PyPI package](https://pypi.org/project/redis-agent-playbook/0.1.0a2/) supplied supported client names and workflows. The package is an alpha prerelease and requires Python 3.10 or later.
- The [Agent Skills specification](https://agentskills.io/specification) is linked from the skill guide. Service-specific packaging and limits remain Redis-specific.
- [LangSmith skills](https://docs.langchain.com/langsmith/skills) describes skills through concrete tasks and optional helper scripts. The [Deep Agents skills guide](https://docs.langchain.com/oss/python/deepagents/skills) explains descriptions, instructions, and supporting files loaded as needed. The editorial takeaway is to explain what an agent does with a skill and when each file is useful. Redis discovery remains task-based; the docs do not adopt another framework's startup loading behavior.
- Google's [Gemini Enterprise Skill Registry overview](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/skill-registry) and [skill registration guide](https://docs.cloud.google.com/agent-registry/register-skills) provided references for package structure, prerequisites, and lifecycle explanations. Redis retains its own terms, limits, and explicit publication step. These references do not establish Redis execution, installation, or governance capabilities.

## Quickstart scope

FAQ creation and semantic search provide the first useful result without packaging files, connecting an agent framework, or configuring extraction. The quickstart follows one refund-support example through publication, search, filtered discovery, a complete version update, and cleanup. This follows Agent Memory's pattern of one scenario with several useful capabilities. Skill packaging and proposal review remain in their task guides so the first request needs only an existing playbook and a scoped key.

## Example pattern

- Author code in `local_examples/iris/playbooks/`, with standard `EXAMPLE`, `STEP_START`, and `STEP_END` markers. Match step names across the Iris variants; use `lang_filter` for the shared shell package or Python-only async example.
- Use `clients-example` shortcodes for task steps. Installation commands remain Bash fences. Administrative and package values stay pinned to their reviewed alpha versions.
- The standard processor owns rendering and marker removal. The scoped adapter reads the same source files and named ranges to run API-contract, request-equivalence, resource, revision/conflict, error, and MCP checks.
- Main full-program copies retain samples. Withdrawal and deletion are independently runnable; keep their named steps in separate source sets and require `PLAYBOOK_FAQ_ID` or `PLAYBOOK_SKILL_ID`.
- Skill package preparation comes from the Bash source’s `playbook-skill-package` step. Python and TypeScript readers run that step first; the HTTP full program includes it.
- The Iris-aware Markdown legend avoids identifying the Python SDK as redis-py or listing unrelated native Redis clients. Other products retain the existing legend.
- The product-name opening is held for the author’s decision. This pass does not change it.

## Maintain the API reference

The service's public Smithy projection generates OpenAPI; the docs consume the versioned public contract used by the SDK. `prepare_reference.py` adds titles, summaries, tags, and ordering only. It does not create a separate hand-authored API contract or fetch a moving upstream branch during a site build.

From the docs repository:

```sh
python -m pip install -r build/agent_playbook_docs/requirements.txt
python build/agent_playbook_docs/check_sdk_source.py --sdk-repo ../iris-sdks
npm ci --prefix build/agent_playbook_docs
python build/local_examples.py
python build/agent_playbook_docs/examples.py build/agent_playbook_docs/.generated
build/agent_playbook_docs/node_modules/.bin/tsc -p build/agent_playbook_docs
python -m pytest build/agent_playbook_docs --rootdir . -q
```

To refresh presentation from an approved contract:

```sh
python build/agent_playbook_docs/prepare_reference.py --data-plane ../iris-sdks/openapi-playbook.json
```

For a new release, review contract changes, regenerate, update the package/source lock, and validate together. The scoped workflow checks the public contract, documentation links, TypeScript compilation, and the displayed example sequences. It installs the pinned public SDKs; a private SDK checkout is not needed in CI.

## Validation and human review

- Before the agent-integration pass, the migration passed 54 scoped checks on 2026-10-14. These cover the public schema and source lock, page relrefs, six direct API guide sequences in all three languages, three additional runs with missing totals, six found/missing lookup cases, three tests preserving earlier proposal edits, six JSON/non-JSON request failure cases, standalone asynchronous Python, two MCP agent runs, two MCP tool-error cases, the hosted MCP request configuration and tool-call output, six full-program executions that retain published samples, source/step coverage checks, twelve fresh-shell withdrawal/deletion checks, and cleanup continuing after a failed key revocation. Paginated examples must continue through an empty page and preserve cursors containing reserved URL characters.
- TypeScript examples compile with strict checking against the published alpha SDK. Python and HTTP examples execute against the same local contract fixture. Each request and JSON response is checked against the vendored public OpenAPI contract. The fixture does not implement a semantic search engine.
- The source lock matches the local SDK contract, usage overlay, and both package versions. The wire contract was not changed.
- Framework checks run the actual SDKs against local MCP and controlled model responses. They verify SDK discovery before the first model call, context delivery, propagation of returned identifiers, resource loading, tool failures, and stale recovery. These tests establish framework plumbing rather than model judgment; the separate real-model matrix covers that behavior. Model requests use a local endpoint and test keys; tracing is disabled during checks.
- The earlier full site build and preview passed with Hugo Extended 0.143.0, `HUGO_TIMEOUT=600s`, and a temporary compatibility mount for unrelated CMEK pages. Current `main` fixes those pages and restores the image shortcode; the latest rebase no longer needs that mount. CI pins 0.143.1.
- The first-time developer pass renders all ten pages and verifies all 72 remaining internal references, including section anchors; the four dynamic API model anchors are also verified in Chrome. The OpenAPI download resolves; the separate sample downloads are replaced with full-program copying. The existing unit link test checks pages only; rendered anchor and asset checks remain separate. Markdown exports contain no raw shortcodes, tab separators, or TODO comments. The displayed programs and copied sources are validated by the scoped checks and TypeScript compilation.
- Earlier Chrome checks covered all ten developer pages at 1,440 px and 390 px, all 53 TCE groups and 155 client-step bindings at each width. Collapsed copies match the named steps; expanded copies match the processed full programs. All four dynamic model anchors render, and no page overflows either viewport. The rendered pages and fresh build output contain no removed playbook diagrams.
- The workflow passes `actionlint`. Frontmatter and the public contract are unchanged. The example execution and compilation checks use the final displayed code.

The earlier 28 walkthrough/download programs and package preparation passed against local Iris at `9f7f0da22b10cc9b858cdf7d5da31362adf57ef7`, built from the current checkout. The isolated stack uses separate metadata/content Redis instances, real Identity Service keys, and `text-embedding-3-small` with 1,536 dimensions. Python, TypeScript, and OpenAI hosted HTTP MCP run with `gpt-5-mini` and return the expected Processing reply. A temporary HTTPS proxy made the local data plane reachable for hosted MCP and rewrote the Host header for the loopback listener; the tunnel, services, Redis containers, and temporary model credentials were removed afterward. The MCP prompt now requires loading the selected skill and copying its returned resource URI after a real agent constructed an invalid relative URI.

`build/agent_playbook_docs/live_examples.py` provisions a disposable playbook per case, uses reader keys for retrieval and MCP, and removes its playbook and keys. Select the configured embedding model with its flags and set `OPENAI_API_KEY` to include the four agent cases; missing model credentials are reported as explicit skips. All current MCP clients connect from the application runtime. The older 29-case record, including hosted HTTP, remains in `/tmp/playbook-docs-live-20261012/validation-summary.json`; current integration evidence is listed in Agent-integration validation.

A live maintenance probe confirms bulk FAQ/skill deletion. It also confirms an unresolved release mismatch: the pinned alpha SDK/public contract retains `ClearPlaybook` on the data plane, but the current service has removed that route (404) and its control-plane clear succeeds. The public alpha contract and package pins remain intact; a TODO in Limits marks the clearing guidance for release-owner review before launch. This is the only operation removed when comparing the current service's generated public operation set to the SDK contract.

Concepts now links to four browser-verified model anchors in the API reference. The reference enables the built-in schema index and opt-in rendering of its existing Markdown introduction/download links. The introduction and its download link are visible at 1,440 px and 390 px without overflowing the viewport. Another product's reference is checked to retain its presentation. The remaining Concepts diagram belongs to the author's next pass. Alpha pins are intentional until the launch update; extraction availability and operator pages remain deferred. Duplicate-conflict recovery still needs focused runtime review beyond the normal walkthroughs. Standard MCP resource templates and reads now pass against the Helm deployment using a returned template URI. Human experts should confirm release claims and defaults before removing the draft notice. The draft PR lists two developer-docs follow-ups: missing diagrams and the separate API/features alignment pass. Familiar acronym expansions (API, SDK, HTTP, FAQ, MCP, and URI) were removed at the author's request. No publication gate or operator pages are included.


## Local feedback checkpoints

Navigation integration, the `manage-faqs` URL, and simplified naming explanations each have a separate conventional commit and focused checks. The TCE migration has independent Python, TypeScript, and Bash reviews. A high-severity full-copy issue found during review is fixed: copying a withdrawal example no longer also copies permanent deletion. Original API step bodies are preserved byte for byte; the public contract/package pins and held brand opening are unchanged.

Earlier builds used an untracked compatibility mount for unrelated CMEK pages. The rebase onto `73123a200` includes the upstream CMEK fixes and restored image shortcode. No compatibility shim or CMEK edits belong to the Playbooks commits.

The 2026-10-14 live gate runs the migrated walkthroughs and six full-program copies against the existing licensed Helm deployment, using real embeddings and scoped keys. All 27 locally reachable cases pass. Hosted HTTP MCP is explicitly skipped because no public HTTPS endpoint is configured. Python MCP initially hit an incompatible optional compression dependency in the shared environment; the unchanged example passes in a clean Python 3.13 environment with the documented pins. The 54 scoped checks also pass there. Sanitized evidence is in `/tmp/playbook-feedback-commits-20261014/live/`, `live-python-retest/`, and `browser-results.json`. Each live case removes its disposable playbook and keys; cleanup attempts every resource even after an earlier failure.

## Agent-integration validation

The integration pass remains one local conventional commit. `/mcp/` keeps its URL and focuses on the three tools, standard client usage, and resources. The new `agent-integration/` guide shows a linear sequence in Markdown and separate OpenAI Agents SDK/LangGraph sections, each with Python and TypeScript TCEs. The hosted Responses API program is replaced by direct curl MCP usage, so every current example connects from the application runtime. The sample task does not name a skill.

The exact framework pins are in the scoped manifests and page install commands. Python LangChain's MCP namespace is beta and requires the tested MCP 2.x/FastMCP 4.x combination. Playbooks SDK pins and its public API contract remain unchanged.

All **126 scoped checks** pass after narrowing the basic MCP clients to connection, tool listing, and discovery. Controlled model responses verify SDK-before-model ordering, context shape, competing previews, FAQ answers without skill loading, distinct empty/budget/failure cases, tool error propagation, and recovery using a different entry identifier and version. They also reject unsafe drafts after a failed tool followed by successful unrelated discovery, both sequentially and in parallel. Basic client checks verify returned JSON, empty and budget-excluded discovery, structured-content/text fallback, JSON-RPC and tool errors, invalid JSON, and incomplete curl transfers. Skill loading and resource fetching remain in the framework examples. Strict TypeScript compilation and dependency checks pass.

The seven changed programs pass against the existing licensed Helm deployment, including four real-model runs. A separate **20-case real-model matrix** uses the canonical skill instructions/template with controlled knowledge responses: competing previews, mixed FAQ/skill context, stale publication with a different identifier/version, missing input, and tool failures. All pass across both frameworks and languages. This supplements the controlled-model plumbing tests; generated wording is not fixed.

Real probes exposed models drafting unsupported guidance after tool failures. The programs now track unresolved failures by tool name and suppress that draft; successful discovery cannot hide a failed load or fetch. Successful same-tool recovery clears its failure. Independent Python, TypeScript, and curl reviews report no remaining high or medium findings.

Chrome verifies all **11 developer pages** at desktop/mobile widths, **55 TCE groups / 159 client-step bindings**, collapsed/full copy parity, and the four API model anchors. All **77 internal references/static anchors** resolve; Markdown exports contain no raw shortcodes or test markers. The latest rebase includes the upstream build fix and uses the standard Hugo configuration. Validation artifacts are in `/tmp/playbook-agent-integration-20261014/`.

Standard `resources/templates/list` and `resources/read` also pass on the Helm deployment; a returned URI reads bytes matching the uploaded template. Fresh preview builds pass the full-copy browser checks. Incremental Hugo rebuilds can omit the shared full-program templates, so restart the preview before repeating expanded-copy checks; this shared preview issue is not changed by the integration commit.
