# Agent Playbooks documentation status and review

Updated **2026-10-01**. This is the local handoff for the draft, its validation evidence, and the work needed before publication.

**Assessment:** ready for a product walkthrough; release qualification remains open. The remaining work is mostly proving installation and the agent experience against a supported release.

## Current local state

| Area | State |
|:-----|:------|
| Branch | `codex/agent-playbooks-docs`; draft base `711c1fed1`. |
| Git state | The local documentation checkpoint includes both parent navigation links, the Playbooks sections, maintenance tooling, workflow, and this handoff. Use `git log -1 --oneline` to identify the checkpoint. |
| Publication | No push, pull request, or publication has been performed for this docs draft. Sibling service and software development kit (SDK) repositories were inspected without editing them. |
| Public documentation | 11 pages: eight developer pages and three operator pages, reduced from the initial 16. Draft notices remain in place. |
| Downloadable material | Three Python walkthroughs, pinned requirements, two Helm configuration templates, and two public OpenAPI documents. |
| Maintenance | Source lock, example synchronization, 13 offline tests, and a scoped GitHub Actions workflow. The workflow is a local draft; it has not run in GitHub for these changes. |
| Preview | Port 1313 was not serving on this status check. Use the local restart command in [Resume locally](#resume-locally). |
| External evidence | Release and registry observations come from the previous audit. This handoff update made no external requests. Refresh that evidence before making release claims. |

The reader path is **deploy with Helm → create a playbook and keys → publish a skill → connect an agent**. A developer whose team already runs the service starts with publishing. Concepts stay in the overview; coding agents use the same contracts and examples as developers. Proposal review has a short entry point in the knowledge guide.

The complete change is in these locations:

- [Developer guides and examples](../content/develop/ai/context-engine/agent-playbooks/) and [operator guides and templates](../content/operate/iris/agent-playbooks/).
- Parent navigation: [context engine](../content/develop/ai/context-engine/_index.md) and [Iris operations](../content/operate/iris/_index.md).
- [Maintenance tools and tests](../build/agent_playbooks_docs/), [source lock](../build/agent_playbooks_docs/source-lock.json), and [proposed continuous integration (CI) workflow](../.github/workflows/check-playbook-docs.yml).

## Where DRI review adds the most value

The directly responsible individual (DRI) is Tyler. The recommendations are draft choices awaiting his review. MCP means Model Context Protocol.

| Decision | Recommendation in this draft | What would resolve it |
|:---------|:----------------------------|:----------------------|
| Who can start using this at launch? | Keep Helm as the entry point. Describe the actual access and support arrangement before calling this a self-service installation. | Launch stage, intended operator, artifact access, license acquisition, and the support route. |
| Is this the right first customer task? | Lead with a skill, retrieve its instructions and a reference file, then update the same entry. Keep FAQs secondary. | One representative skill and three real tasks: a match, a paraphrase, and a task that should return no relevant skill. The refund example demonstrates mechanics; it does not validate customer usefulness. |
| Which agent client should we demonstrate first? | Choose one client or framework that supports the required MCP transport and headers. Add its tested configuration inside the existing connection guide. | The priority client, supported version, where it runs, and the expected agent behavior. The current Python script verifies retrieval without a model. |
| Who owns accuracy after launch? | Assign an owner to update the docs, public schemas, client pin, and example checks with each release. | Named service/SDK and docs owners, with the docs check in the release process. Local CI checks a recorded contract; it does not watch upstream releases. |

For the walkthrough, review the [overview](http://localhost:1313/develop/ai/context-engine/agent-playbooks/) for the product promise, [deployment](http://localhost:1313/operate/iris/agent-playbooks/) for the access burden, and [connection](http://localhost:1313/develop/ai/context-engine/agent-playbooks/connect-agent/) for where the example stops. Your highest-value feedback is whether these are the right promise, audience, and first task.

## Remaining work, in order

Release tasks remain open; the local checkpoint is complete. Engineering and docs owners are proposed roles, not assignments to named people.

- [ ] **DRI — confirm the launch experience.** Resolve the audience, first skill/task, first agent client, and maintenance ownership in the review table. Keep the 11-page scope unless a decision requires a change.
- [ ] **Release engineering — supply a usable release entry point.** Confirm the chart/download URL; compatible chart, Playbooks, Identity Service, and SDK versions; supported Kubernetes and Redis versions; target architecture; provider configuration; and license acquisition. Explain how the operator obtains or chooses the tenant ID. The chart was absent from the public index at the last recorded check.
- [ ] **Engineering and docs — run the exact walkthrough on a clean deployment.** Install, create the resource and both keys, publish, discover, load instructions, fetch a file, update, and clean up. Verify reader-key denial of writes and behavior after republishing or withdrawing. Record actual outputs and useful recovery steps for failed provisioning and retrieval. Offline tests do not close this task.
- [ ] **Docs and the chosen client owner — demonstrate one agent integration.** Add its tested configuration inside the existing connection guide. Verify a real task, a paraphrase, and an irrelevant task without the sample pin. The current Python client proves protocol retrieval without a model; pinned discovery does not measure relevance.
- [ ] **Docs and release owners — qualify the final content.** Refresh the release evidence and source lock against approved artifacts, confirm public claims and support scope, synchronize examples, and rerun the relevant checks. Remove draft notices only when this release evidence and review are complete.
- [x] **Local handoff — review and checkpoint the draft.** The local commit includes the documentation, examples, configuration templates, schemas, checks, and this review record. Pushing, opening a pull request, and publishing are separate work outside this local handoff.

Available evidence includes local service/SDK sources, public schema inputs, installed packages, and the proposed release pipeline. Missing inputs are a qualified release bundle and support matrix, a configured test deployment with license/provider access, an agreed launch client, and representative customer tasks with expected results.

## Improvements that can follow the first release

- **Better API examples at the source:** the rendered reference works, but it shows generated values such as `"string"` and a generator-style authorization label. Add concrete public operation examples and clearer documentation metadata upstream, then regenerate. Keep the website tutorials as the runnable entry point.
- **One complete agent download:** per-page Markdown and JSON exports work. The global download configuration puts developer guides under “Develop with Redis” and deployment under “Redis Iris context engine.” A Playbooks bundle spanning both would make agent consumption easier. This needs a shared download-system change, outside these product pages.
- **A usability session:** have a developer unfamiliar with the product complete the path without help. Record where they pause, what fails, and whether they can replace the sample with their own skill. Do not claim a setup time until it has been observed.

## Implemented reader experience

The reader can skip deployment when a team already runs the service and reuse connection values across guides. The skill package appears before the upload code. Knowledge management follows the skill lifecycle before introducing FAQs, and the API reference lists skills first. Deployment leads with the supplied archive while repository publication is pending. The connection guide distinguishes local and hosted client reachability, and the sample preserves returned tool-error details instead of hiding them behind a generic message. Page count remains 11.

## Review the reader path

| Page | Purpose |
|:-----|:--------|
| [Overview](../content/develop/ai/context-engine/agent-playbooks/_index.md) | Explain reusable procedures and answers, publication, and the next task. |
| [Deploy with Helm](../content/operate/iris/agent-playbooks/_index.md) | Supply concrete values and Secret templates; install the chart and connect locally. |
| [Create a playbook and keys](../content/operate/iris/agent-playbooks/authentication.md) | Provision a ready resource, then issue author/publisher and reader credentials. |
| [Publish your first skill](../content/develop/ai/context-engine/agent-playbooks/quickstart.md) | Package and publish instructions plus a reference file. |
| [Connect an agent](../content/develop/ai/context-engine/agent-playbooks/connect-agent.md) | Verify discovery, exact-version loading, and file retrieval before adding a model. |
| [Manage knowledge](../content/develop/ai/context-engine/agent-playbooks/publish-knowledge.md) | Update, publish, withdraw, and delete skills; add FAQs. |
| [Control discovery](../content/develop/ai/context-engine/agent-playbooks/discovery.md) | Explain attributes, pins, similarity, and preview budgets. |
| [Client reference](../content/develop/ai/context-engine/agent-playbooks/reference/_index.md) | Clarify naming, pagination, MCP contracts, and error recovery. |
| [Examples](../content/develop/ai/context-engine/agent-playbooks/examples/index.md) | Download the three complete scripts and pinned dependencies. |
| Data-plane and control-plane references | Inspect generated public contracts with task-oriented operation groups. |

The developer section has eight pages; the operator section has three. The prose leads with what the reader can do, uses concrete verbs, and distinguishes service behavior from application responsibilities. Most limits remain in the API schema; the guides explain the limits that affect the main workflow.

## Google comparison

Google's [Agent Registry overview](https://docs.cloud.google.com/agent-registry/overview) leads with discovering and reusing capabilities. Its [skill registration guide](https://docs.cloud.google.com/agent-registry/register-skills) separates the skill package, prerequisites, and registration procedure. Its [skill management guide](https://docs.cloud.google.com/agent-registry/manage-skills) makes revisions and lifecycle actions explicit.

The useful pattern is a recognizable object and a short task sequence. This draft applies that pattern with Redis-specific behavior: skills and FAQs, explicit publication, semantic discovery, and loading instructions and files on demand. It does not adopt Google's terminology, size limits, lifecycle states, hosted-service claims, or promises about executing skills. Playbooks serves content; the application acts on it.

## Agent Memory example audit

The website's [Python](../content/develop/ai/context-engine/agent-memory/python-sdk-quickstart.md), [TypeScript](../content/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart.md), and [REST](../content/develop/ai/context-engine/agent-memory/rest-api-quickstart.md) quickstarts use inline code fences. Shared `embed-md` fragments supply Cloud prerequisites and provisioning steps. The scenario connects API calls to visible results, but incremental “add this code” instructions and rerunning earlier writes require care.

In `iris-sdks`, the public OpenAPI input, `.speakeasy/workflow.yaml`, and product overlays drive client generation and generated usage examples. Agent Memory's package-docs workflow checks package README preparation; it does not synchronize website quickstarts. No automatic website-example sync was found in the inspected docs/SDK workflows.

Playbook already has SDK-side tests in `playbook-python-sdk/tests/test_usage_docs.py` that check generated usage, workflow coverage, and method signatures. The website should build on that source ownership rather than maintain another API contract.

## Keep examples aligned

| Material | Authority | Check in this branch |
|:---------|:----------|:---------------------|
| Service behavior and public API | Iris service definitions and public release artifacts | Public schemas only; request/response validation. |
| Python client and generated API examples | Versioned `iris-sdks` public OpenAPI input, usage overlays, and published package | Source lock, upstream comparison, real SDK serialization and signature checks. |
| Complete website walkthroughs | Downloadable Python files in the docs example bundle | Generate the displayed code from those files; fail CI on divergence. |
| Helm configuration | Playbook chart and release pipeline in Iris | Values/Secret consistency tests and chart lint/render. |

The docs-specific walkthroughs are not imported from the SDK repo: the SDK currently supplies generated operation samples and broader README workflows, not these exact runnable tutorials. If shared tutorials move upstream, import them from a release-pinned SDK revision and stop editing the local copies. Avoid fetching a moving branch during a docs build.

The branch adds:

- `source-lock.json`: SDK revision, normalized public-contract hash, usage-overlay hash, package pin, and service/release evidence.
- `check_sdk_source.py`: offline comparison against that contract, plus an optional comparison with a local SDK checkout.
- `sync_examples.py`: copies the three complete scripts into their guide code blocks, or checks them without writing.
- A scoped GitHub Actions workflow: checks the lock and snippets, then executes the offline tests with the pinned published SDK.

Run the maintenance checks from the docs repository:

```sh
python -m pip install -r build/agent_playbooks_docs/requirements.txt
python build/agent_playbooks_docs/check_sdk_source.py --sdk-repo ../iris-sdks
python build/agent_playbooks_docs/sync_examples.py --check
python -m pytest build/agent_playbooks_docs -q
```

After editing a downloadable script, run `sync_examples.py` without `--check`, then review the rendered guide. For an SDK release, review its public contract and usage-overlay changes, update the dependency pin and source lock, regenerate the reference, and rerun the tests in the same docs change. The offline CI job checks the recorded release; it does not poll the private SDK repo or automatically adopt future releases.

Regenerate reference presentation from the SDK's public contract and the matching control-plane artifact:

```sh
python build/agent_playbooks_docs/prepare_reference.py \
  --data-plane ../iris-sdks/openapi-playbook.json \
  --control-plane '<release-artifact>/PlaybookControlPlaneService.openapi.json'
```

Only titles, summaries, tags, and ordering are added. Request/response definitions, security, paths, and operation IDs are preserved.

## Helm release evidence and remaining checks

Reviewed [Iris PR 1497](https://github.com/redislabsdev/iris/pull/1497) through `7e7618449253fd2c17fe81d0a78c965e1203dba8`. It was open at the last external check. That revision defines the Playbook release pipeline, separate Playbooks/Identity Service versions, planned image repositories, and a handoff to the shared Redis Helm repository. Merging that pipeline does not itself publish a chart. At the inspected revision, chart values and templates were unchanged from the recorded Helm lint/render run. Its present status has not been refreshed for this local handoff.

The public Helm index did not contain `redis-playbook` when checked on 2026-09-30. The guide therefore identifies repository installation as pending and provides a supplied-chart-archive path. The downloadable values use PR 1497's planned image names. Version placeholders must come from the actual release bundle. The OpenAI model configuration is illustrative, not a supported-provider matrix.

The retained technical claims were checked against the public schemas, the service's entry/retrieval/permission implementations, and the chart. No live cluster, provider, or service test has been run in this docs task. Offline SDK/MCP tests establish client compatibility, not server correctness or deployment readiness.

## Recorded validation

Before the local checkpoint on 2026-10-01, the locked-contract check, example synchronization check, all 13 offline tests, workflow lint, whitespace checks, and full Hugo build passed again. The build had existing warnings outside the Playbooks sections; no Playbooks build errors were found. Browser, Helm, export, and upstream SDK comparison results are from the earlier implementation review. No live installation was performed.

- All 13 offline tests pass with the pinned published SDK, including an MCP tool failure that retains its error detail and stops retrieval. The local SDK contract, usage overlay, and generator version match the source lock.
- The three displayed scripts match their downloadable sources. Both public OpenAPI documents validate.
- Helm 3.9.2 lints and renders the chart with the proposed values and PR 1497 image configuration. Rendered service names match the port-forward commands.
- The full Hugo site builds. Links, anchors, downloads, and Markdown/JSON exports pass checks across all 11 Playbooks pages.
- The guides and both interactive API references render in Chromium. Desktop and mobile checks find no horizontal page overflow. The existing site theme places navigation before article content on mobile; changing that shared layout is outside this revision.
- The scoped GitHub Actions workflow passes `actionlint`; `git diff --check` passes.

## Resume locally

Run commands from the docs repository. The existing local tools were present at this handoff; `/tmp` paths are temporary and are not part of the branch.

Restart the preview in a terminal and keep it running:

```sh
/tmp/redis-playbook-docs-tools/hugo server \
  --bind 127.0.0.1 --port 1313 \
  --disableFastRender --noHTTPCache \
  --destination /tmp/redis-playbook-docs-preview-v3
```

Open the [overview](http://localhost:1313/develop/ai/context-engine/agent-playbooks/), [deployment guide](http://localhost:1313/operate/iris/agent-playbooks/), and [connection guide](http://localhost:1313/develop/ai/context-engine/agent-playbooks/connect-agent/). The preview used Hugo extended 0.143.0. If the temporary executable is gone, restore a compatible local Hugo installation using the repository setup instructions.

Run the existing checks without installing or downloading packages:

```sh
/tmp/redis-playbook-docs-venv/bin/python build/agent_playbooks_docs/check_sdk_source.py --sdk-repo ../iris-sdks
/tmp/redis-playbook-docs-venv/bin/python build/agent_playbooks_docs/sync_examples.py --check
/tmp/redis-playbook-docs-venv/bin/python -m pytest build/agent_playbooks_docs -q
git diff --check
git status --short
```

The virtual environment uses Python 3.12.9. If the sibling SDK checkout has advanced, review any source-check failure before updating the lock. Do not regenerate against a moving checkout merely to make the check pass. The dependency manifests and regeneration procedure are in [Keep examples aligned](#keep-examples-aligned).

Prior review artifacts, if still present:

- `/tmp/redis-playbook-docs-commit-build.log`: full Hugo build before the local checkpoint.
- `/tmp/redis-playbook-docs-build-v3.log`: full Hugo build log.
- `/tmp/redis-playbook-docs-review-v3/`: browser screenshots.
- `/tmp/playbook-docs-helm-validation.log`: Helm lint evidence.
- `/tmp/playbook-docs-helm-rendered.yaml`: rendered chart used to verify service names.

These artifacts support the recorded checks; they are not release qualification or permanent evidence stored in Git.

## Add later when needed

Add a TypeScript walkthrough, framework-specific recipes, a full proposal-review tutorial, and qualified maintenance runbooks as their workflows and support requirements mature. Keep those additions separate from the first deploy–publish–retrieve path. The broader Iris navigation, Agent Lens, Context Retriever gateway docs, and global download-bundle coverage remain outside this revision.
