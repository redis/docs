# Redis Agent Playbooks operator documentation review

Tickets: [MOD-20121](https://redislabs.atlassian.net/browse/MOD-20121) and the original [MOD-19679](https://redislabs.atlassian.net/browse/MOD-19679) operator draft. The MOD-20121 follow-up is stacked on operator PR #4256 at `430c680a53e1a1060e26b8f46abb3ed6c7c6b753`; its current provenance, validation, and publication hold are recorded in the follow-up section.

## Prior reviewed inputs (October 17, 2026)

- Iris `main`: `304467e3e3acf5ff9e6800e03055f0a7806bc14d` on October 17, 2026.
- Public data-plane contract: identical between that Iris revision and the latest published SDKs.
- Published SDKs: `redis-agent-playbook==0.1.0a3` and `@redis-iris/agent-playbook@0.1.0-alpha.3`.
- Public on-prem control-plane contract: `out/smithy/public/playbook-cp/PlaybookControlPlaneService.openapi.json` from the reviewed Iris revision.
- Helm source: `playbook/helm` from the reviewed Iris revision.

The chart that matches this source has not been released. The public guides therefore use `<chart-version>` and image-tag placeholders. They do not use `Chart.yaml`'s development version or reuse the earlier alpha.3 chart with the newer configuration.

## Changes from the earlier operator draft

- Replaces legacy `inference.models[].client` configuration with `embedders_connection_details` in the private inference Secret.
- Adds explicit image placeholders because current chart validation requires each release tag.
- Documents the shared OIDC audience, control-plane and data-plane operator authentication, role boundaries, and optional Identity Service Control authentication.
- Lists the deployment's configured embedding models before creating a playbook.
- Adds optional Redis Agent Memory FAQ extraction setup, including workload trust, queue and model configuration, staged worker activation, binding activation, pause, cleanup, and monitoring.
- Adds administrative clear behavior and the optional FIPS-oriented and tracing settings.
- Regenerates the control-plane reference from the reviewed source. It now contains 13 operations: model listing; playbook create, list, get, update, delete, and clear; extraction store listing; and extraction binding create, list, get, update, and delete.
- Locks the control-plane artifact hash and expected operation inventory in the Playbooks reference tests.
- Replaces resolved TODO comments with links between developer and operator guidance.

## Prior local validation

- The complete developer suite passes against the published alpha.3 packages: **126 passed**.
- Operator reference and cross-link tests pass: **6 passed**.
- The current Iris chart's Go smoke and safety tests pass.
- Helm lint and template rendering pass with the ordinary source fixture and with a docs-shaped extraction fixture containing all four workloads.
- All **41 Bash** and **13 YAML** fences under the operator section parse.
- The control-plane reference is byte-identical to the reviewed Iris artifact and passes OpenAPI validation.
- `git diff --check` passes.
- Full Hugo 0.143 build passes: **19,928 pages**, 665 non-page files, 2,116 static files, and 1,245 aliases. Existing warnings are outside the Playbooks section.

The generic `task lint` and `task test` commands are unavailable because this repository has no Taskfile. Validation uses the scoped Playbooks suite and the repository's supported Hugo version.

## Remaining release and source issues

- Add the approved chart version, image tags, platform matrix, and release-specific upgrade notes when the matching chart is published.
- Production sizing, high availability, minimum Redis access-control-list permissions, and supported backup and restore guarantees still require qualification. The public pages retain actionable TODO comments for those items.
- The earlier generated contract had stale extraction descriptions. The MOD-20121 follow-up corrects the Smithy source and refreshes the byte-identical generated reference; its candidate and release qualification are recorded next.

The operator parent and MOD-20121 follow-up remain drafts. Merge in stack order only after the publication hold is satisfied, then retarget or rebase onto the intended documentation release branch and confirm the remaining diff.

## MOD-20121 follow-up qualification

This follow-up is isolated on `docs/MOD-20121-playbook-extraction-lifecycle`, stacked on operator PR [#4256](https://github.com/redis/docs/pull/4256) at `430c680a53e1a1060e26b8f46abb3ed6c7c6b753`. It does not modify that parent branch or PR. Backend [#2065](https://github.com/redislabsdev/iris/pull/2065) follows MOD-20115 and MOD-20116. Local qualification is complete for the production/API source at `af81d8655a5c2ff48003cc96fb7bce42daf1935f`; the final test/documentation-only child commit `2ed416db157ebd12c3f5081ca9eaaf26c8375f0d` still requires remote CI. Neither revision is a released-version claim.

The extraction guide now uses static RAM data-plane read trust, a separate tenant-confined RAM control-plane viewer, live discovery and exact-source validation, ready/off create, explicit enable/recovery checks, and source-independent pause/delete. It retains the independent ordinary agent-key and RAM promotion-worker identities. The role table distinguishes operator stop/policy access from administrator consent to source discovery and activation.

The same fresh-install walkthrough depended on obsolete bundled Identity Service values. The follow-up supplies separate Identity Service installation, metadata and shared credentials, ordinary product validation, and the current runtime cache and rotation paths. Existing product registrations and runtime operations must be merged rather than replaced.

### Contract provenance

The backend owner ran `task playbook:generate` after correcting the Smithy documentation. The public control-plane output was copied byte-for-byte from `out/smithy/public/playbook-cp/PlaybookControlPlaneService.openapi.json`, without editing the generated JSON. Its SHA256 is `b4e5ad6ff318dcd8e9f60bb75fb2d109058891d0e211e62f9781b24f221cf7f6`. The source lock records that hash and candidate revision together. The existing 13-operation inventory and hash validation remain enforced.

Before changing the service provenance, the candidate data-plane contract was compared through the repository's `wire_contract` normalization. Its digest remains `991a428a09c362b4b45e1f90bf32c5d9980c6933d2f31d12b2dd730d5a6f34b3`, identical to the locked published SDK contract, with no added or removed operations. The data-plane reference and SDK pins therefore remain unchanged.

### Publication hold

The backend stack is unmerged and unreleased. These docs remain draft until the final backend checks pass, the stack is merged and released, and matching chart/image versions and endpoint requirements are verified. The source lock retains locally qualified `af81d8655`: the generated control-plane artifact remains byte-identical at the test/documentation-only child commit. Reverify this provenance against the eventual release before publication; a later test/docs commit alone does not require regenerating an unchanged contract. Coordinate parent [docs #4256](https://github.com/redis/docs/pull/4256), public RAM [#4330](https://github.com/redis/docs/pull/4330), and this [#4331](https://github.com/redis/docs/pull/4331). The contributor CLA condition remains pending; no agreement was signed or asserted. No production or documentation merge is authorized by this local validation.

### Backend local qualification

The backend owner's [qualification record](https://github.com/redislabsdev/iris/blob/2ed416db157ebd12c3f5081ca9eaaf26c8375f0d/docs/reviews/MOD-20121-cp-owned-extraction-bindings.md) records commands, fixture boundaries and image digests. At `af81d8655`, all 99 reported CI checks and Bugbot passed before local qualification. Final child CI is not claimed as complete here.

- Packaged KinD `ci-auth`: all four cases passed in 873.105 seconds. Both projected probe tokens rotated and remained accepted, wrong audiences were rejected, strict worker-UID equality was retained, and RAM's own worker completed three promotion jobs. The content-free report has `complete: true`, exit 0 and no missing or unsuccessful scenarios. The 580.66-second rotation case does not inspect token files inside the distroless worker; per-request reload is covered separately by client tests.
- Authentication/fencing: 675 repeated boundary/transport executions and 18 real-HTTP method executions passed with the race detector. Real RAM/Playbook CPs and DPs, IdS, Redis and the shared worker cover cloud A/B plus late account C, source consent, foreign IDs, denied activation, stale versions and source-independent stop. External issuer, SM/AWS resolution and model responses are fixtures; this is not a deployed Neptune qualification.
- Shared-engine stress: four 4,096-producer admission bursts retain the exact 1,000/default and 64/custom per-queue bounds, drain and recover. Two runtimes complete 2,368 exact ledger/proposal-request pairs across 16 cloud accounts and 108 bindings, plus 520 pairs in four bindings under one on-prem tenant. The exact final stress source passed its runtime race rerun. Source/target HTTP peers and the model are substitutes; sampled runtime queue peaks and finite-workload progress establish neither fleet capacity nor sustained fairness.
- On-prem browser checks: reviewed cloud-ui [#3346](https://github.com/redislabsdev/cloud-ui/pull/3346) at `b38b4e18f47eec10ac13ce9bf8c9765178b08a57` and the installed `@redislabsdev/cloud-ui-irisultra@0.0.19` each passed live-source create/enable/pause/removal, stale-version recovery and late-source discovery against Helm-installed services. These are three source/destination cases in one configured tenant, not three on-prem accounts.
- App-qa console: the reviewed local MFE rendered and read-only/client-draft checks passed, but both serving backends report `044628e49096c2438ccc171b304933af98ff2cd9`. One authorized account and no eligible sources prevented current-candidate A/B/C or lifecycle mutations there. No extraction mutation or infrastructure provisioning was performed.

### Coordinated UI release

The installed `0.0.19` bundle preserves the tested happy path but does not contain #3346's blocked/off recovery and copy corrections. Release those changes through normal post-merge MFE publication, then explicitly update the actual Iris `package.json` and lockfile pin, rebuild/release the UI gateway, and run a packaged smoke without a local bundle override. There is no automatic cross-repository pin updater. Passing with the reviewed local bundle does not establish that a published UI image contains those fixes.

### Follow-up local validation

- Existing Playbooks suite: **138 passed** with the locked published SDKs; strict TypeScript compilation and `check_sdk_source.py` passed.
- All **14 YAML** and **46 Bash** fences under the operator section parse; all operator frontmatter is unchanged.
- Full Hugo **0.143.1** build passed: **19,928 pages**. No Playbook-page warnings.
- Complete documented Playbook and standalone Identity Service values, plus the current public RAM and standalone Identity Service values with the extraction overlays, pass Helm **3.20.2** strict lint and template rendering. No substitute base fixture was used.
- Rendered-config assertions confirm service and ServiceAccount names, all three projected audiences, static read/propose authority, the tenant-confined RAM CP viewer, ordinary introspection operations, shared credential mounts, and HTTPS product validators.
- Independent backend-owner review checked the complete diff. Its gate wording correction is applied: `extraction.enabled: false` blocks binding creation and activation; policy-only updates retain their existing behavior.
- `git diff --check` passed. The generated CP artifact is byte-identical to candidate output, and the DP reference and SDK pins remain unchanged.

These checks validate the documentation artifacts and configuration wiring. The completed backend local qualification is separate evidence; production model quality, fleet capacity, deployed Neptune reachability and published chart/image support remain unqualified by these local runs.

### Independent review corrections

- D001: removed the unsupported global `product_admin` OIDC role mapping from the standalone Identity Service example. Product-scoped `roleBindings` remain. The full documented IdS values plus OIDC overlay render the scoped binding and configured tenant; the binary's `validateControlOperatorJWT` rejects the old mapping. Existing Go `TestControlConfigValidatesOperatorJWTBlocks` passed, including rejection of global `product_admin` and acceptance of scoped role bindings.
- D002: corrected all three operator health checks to `/health/readiness`, matching the actual rendered deployment readiness probes.
- D003: provided explicit upgrade commands for installations with and without extraction. The configured case retains `playbook-extraction-values.yaml`; supplying only the base values resets extraction settings. This matches [Helm 3.20.2 upgrade behavior](https://github.com/helm/helm/blob/v3.20.2/pkg/action/upgrade.go#L504).
- D004: metadata prerequisites now require JSON commands when extraction is enabled, matching the binding repository's `JSON.SET`/`JSON.GET` operations.

These corrections affect documentation examples and prerequisites only. The existing SDK/reference suite remains applicable; the affected YAML/Bash and rendered documentation checks were repeated.
