# Agent Playbooks operator documentation review

Ticket: [MOD-19679](https://redislabs.atlassian.net/browse/MOD-19679). Local branch: `MOD-19679-playbook-operator-docs`, based on `MOD-19391-playbook-developer-docs` at `d7293c339`. The developer PR remains [redis/docs#4249](https://github.com/redis/docs/pull/4249). The operator draft PR targets the developer branch so its diff contains only the operator pages and their integration links.

## Structure and scope

The operator root is `/operate/iris/agent-playbook/`, matching the singular developer URL and the earlier handoff. It contains a self-managed overview, prerequisites, deployment planning, deployment procedure, configuration, authentication/access, operations, API examples, and a generated control-plane reference. The Iris operator index links the landing page. Developer overview, quickstart, concepts, and retrieval link to the relevant operator pages; operator setup returns readers to the existing developer quickstart.

Agent Memory provides the page/frontmatter and depth pattern. The sidebar follows its plan → prerequisites → configuration → deployment → authentication → API examples → API reference → operations sequence. Playbooks has one documented baseline installation rather than Memory's static/control-plane split. Identity Service owns API-key lifecycle; key administration does not appear in the Playbook control-plane reference. Cloud onboarding is deferred; the shared Iris landing links Cloud setup only for the other three products. No Cloud placeholder pages or publication gate are added.

## Source and release boundary

- Published chart: `redis-agent-playbook` `0.1.0-alpha.3` from `https://helm.redis.io/ai`. The downloaded archive matches the repository index digest.
- Public release manifest: `RedisLabs/redis-enterprise-helm`, `ai/releases/redis-agent-playbook/0.1.0-alpha.3.json`. Its source revision is `fd9d2eeae5affb9ae7e50b88e77c5278b2205ca9`.
- Packaged images: `redislabs/iris-agent-playbook-control:0.1.0-alpha.3`, `redislabs/iris-agent-playbook-data:0.1.0-alpha.3`, and `redislabs/iris-identity-service:0.9.0`. The release manifest records Linux/amd64 images.
- The operator reference is the release's generated **public** `PlaybookControlPlaneService.openapi.json`, copied without contract changes. It has five operations: create/list/get/update/delete. Generate it with `smithy build -c smithy-build.playbook.json` from the pinned release source, then copy `out/smithy/public/playbook-cp/PlaybookControlPlaneService.openapi.json` to the reference resource.
- The public chart's private embedding overlay uses `inference.models[].client.endpoint` and `client.credentials`. Current source uses `embedders_connection_details`; do not combine those configurations with old images.
- Current source also changes control-plane identity-provider authentication and adds clearing/extraction APIs and worker settings. Those changes are not inferred to be available in the published chart. The developer SDK pins/reference are unchanged.

## Validation

On October 13, 2026, the published chart was installed with Helm **3.22.0** on the existing Kind **1.35** cluster `mod18196-readiness`, in namespace `playbook-docs-smoke`. Its three published service images run with the production profile and an existing, entitled Iris suite license. Metadata and content Redis run separately with persistent volumes and verified TLS; the Identity Service uses a separate metadata Redis user. Installation completed in about 21 seconds. The ARM64 Docker Desktop host runs the published AMD64 images through emulation; this does not qualify native ARM support.

Current artifacts and private runtime files are under `/tmp/playbook-helm-docs-smoke-20261013/` on the author's machine. Credentials and license material stay outside the repository in that private directory. Earlier native release-source checks remain under `/tmp/playbook-operator-docs-validation/`; the sibling Iris checkout was not edited.

- All four published Helm tests pass: health and the three service security-profile checks. These checks are not a FIPS compliance qualification.
- Ten application smoke checks pass: documented bootstrap credentials; provisioning, tenant-scoped keys, health and settings; FAQ author/publish/search/revise/republish; reader access and denied authoring; rejected foreign-tenant grants; skill package/publish/discover/load/resource; key rotation and grace period; suspension/resumption; uncached-key revocation; and deletion. Embedding requests use the real OpenAI provider.
- Reapplying the same chart/values preserves all four generated service credentials and does not roll pods. Updating storage configuration and its checksum rolls all three services without losing the playbook or its reader key. Both Linux and macOS checksum snippets produce the same marker. The final rollout uses that documented marker and reruns the chart tests.
- Replacing the selected control-plane pod makes its original port-forward unusable. Rerunning the documented commands restores access. Deployment and upgrade instructions now explain this.
- The displayed CA Secret command works, and rendering the CA values mounts it in all three services. The guide now includes this setup rather than only naming the chart field. Context and Helm-version checks are explicit, and the license requirement includes entitled Iris suite licenses.
- All 33 remaining shell and six YAML snippets parse. The published chart, Secret references, ports, and separately supplied service credentials have also been linted/rendered. The OpenAPI resource remains byte-identical to the pinned release's generated public contract.
- A full Hugo 0.143.0 build, 136 cross-reference/anchor checks across 21 developer/operator pages, developer source/TCE checks, and existing reference tests pass. Chrome checks all ten operator pages at desktop and mobile widths; the generated reference renders its schema index, introduction, and download link.

Only this Playbook stack remains running. Nine older Playbook service deployments across the three older clusters were scaled to zero, preserving their data and Secrets. The two Playbook-only Kind nodes and an orphaned 12-day-old native Playbook test server were stopped; unrelated services in `iris-demo` remain running. Local forwards expose the control plane at `http://localhost:9200`, the data plane at `http://localhost:9201`, and Identity Service at `http://localhost:9202`. The seeded playbook and publisher/reader credentials remain available in the private runtime files. The full Hugo build has existing warnings in unrelated sections and no Playbook link warnings. Hugo’s incremental preview can serve malformed shortcodes after batch edits, even with fast rendering disabled. Clean builds pass; restarting the preview repairs it. This site-tooling issue is separate from the guide content. The local documentation preview is `http://localhost:1313/operate/iris/agent-playbook/self-managed/`.

This verifies the basic licensed Helm installation, verified dependency TLS, administrative/application access, and same-version maintenance. It does not qualify production sizing, high availability, ingress TLS, NetworkPolicy, minimum Redis ACL privileges, the platform support matrix, cross-version upgrades, or backup/restore guarantees.

## Editorial review readiness

The earlier editorial pass removes 143 words across six pages without changing frontmatter, executable snippets, or the generated contract. It removes duplicate developer handoffs, repeated grant-field descriptions, an advanced configuration-override row without supporting guidance, and repeated planning detail. Required storage separation, credential boundaries, certificate verification, cache/revocation behavior, and destructive-operation warnings remain explicit. Every edited public page is shorter.

The current alpha baseline is ready for docs-team and product/engineering human review. The following launch and production qualifications remain open; editorial readiness does not resolve them. Earlier editorial artifacts are under `/tmp/playbook-operator-editorial-pass/`; the follow-up review is recorded next.

## Developer-feedback follow-up

The operator branch is current with the developer branch at `d7293c339`. The follow-up removes another **115 words across five public pages**. Every edited page is shorter. The start sequence now includes loading administrative credentials before provisioning. The API walkthrough covers provisioning, publisher/reader keys, and application health; retrieval settings link to Configuration and the control-plane reference. Publisher connections lead to the developer quickstart, while reader connections lead to the separate agent-integration guide. Detailed endpoint configuration stays in Configuration rather than deployment planning.

Helm and administration procedures retain standard Bash/YAML fences. Developer programs remain canonical TCE sources; no copied SDK programs, generated downloads, or custom rendering system are added to the operator layer. The one removed executable block is the retrieval-settings example outside the onboarding task. All remaining snippets and frontmatter are unchanged, and the generated public contract is byte-identical to the pinned release.

Fresh validation uses the existing licensed Helm deployment: displayed bootstrap/provisioning/key/health requests, the canonical TCE publisher quickstart, reader retrieval with denied authoring, and the canonical TCE reader MCP client all pass. The disposable playbook and keys are removed afterward. The 33 Bash and six YAML snippets parse; the five reference/source checks pass. The standard Hugo build and all **136 internal links/static anchors across 21 pages** pass. Chrome checks all ten operator pages at desktop/mobile widths, including the generated reference's model, introduction, and download link. Artifacts are under `/tmp/playbook-operator-feedback-20261014/`.

## Remaining review items

- Approve the launch chart/images, then update the embedding connection format and regenerate the control-plane reference together. Resolve clearing, extraction, and identity-provider setup against that approved release.
- Qualify the Kubernetes/platform matrix, production sizing/availability, ingress/TLS, and backup/restore procedure before making support claims. No versions or HA guarantees are copied from Agent Memory.
- Add source/extraction setup only after availability and the supported connection, identity, worker, and queue configuration are confirmed. The developer proposals handoff remains unresolved intentionally.
- Keep unresolved TODO comments actionable. No operator page links to a nonexistent setup route.

The operator PR is stacked on the developer PR. Merge the developer PR first, then retarget the operator PR to `main` and confirm that only operator changes remain. Both PRs remain draft/WIP; no publication gate is added.
