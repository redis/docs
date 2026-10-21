# Redis Agent Playbooks operator documentation review

Ticket: [MOD-19679](https://redislabs.atlassian.net/browse/MOD-19679). Branch: `MOD-19679-playbook-operator-docs`, stacked on developer branch `MOD-19391-playbook-developer-docs` at `1009f9015`. The operator pull request targets the developer branch so its diff contains only operator scope and operator handoffs.

## Reviewed inputs

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

## Local validation

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
- The current generated control-plane contract contains stale extraction descriptions that say the release has no worker and that workers arrive later. Current Iris `main` includes the worker and its Helm deployment. The docs preserve the generated contract byte-for-byte; the Smithy descriptions should be corrected at the source and the reference regenerated.

Both pull requests remain draft. Merge the developer pull request first, then retarget or rebase the operator pull request onto `main` and confirm its remaining diff.
