---
Title: Configuration and troubleshooting
alwaysopen: false
categories:
- docs
- operate
- iris
description: Review self-managed Context Gateway configuration files, troubleshooting guidance, and reference links.
linkTitle: Configuration and troubleshooting
weight: 100
hideListLinks: true
---

## Configuration reference

| File | Purpose |
| --- | --- |
| `gateway-values.yaml` | Helm values for both planes. See [step 3](/content/operate/iris/context-gateway/self-managed/deploy.md#3-create-gateway-valuesyaml). |
| `metadata.yaml` | Metadata Redis URLs. Both planes mount it. |
| `credential-redis.yaml` | Credential Redis URLs, with the encrypted Redis backend. |
| `databases.yaml` | URLs for each registered database. |
| `license` | Context Gateway license file provided by Redis. |

### External secret managers

Each file reference accepts a Kubernetes Secret or a Secrets Store Container Storage Interface (CSI) Driver file. Scope each CSI class to the files its plane may read, and keep the admin token, internal token, and Vault writer token out of every class the Data Plane mounts.

## Troubleshooting

{{< table-scrollable >}}
| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `/health/readiness` answers `503` | A token source cannot be read or is empty, or the license is not valid | Check the admin and internal token Secrets and the license. |
| Agent receives `401` | Key is missing, revoked, or expired, or sent in the wrong header | Send it as `Authorization: Bearer` or `X-Api-Key`, and check its status. |
| Agent receives `403` | The key has no `context-gateway` grant for this Gateway | Update the key's grants with the Identity Service control token. |
| Agent receives `404` | The Gateway does not exist, is being deleted, or belongs to another tenant | Check the Gateway ID and `tenantId`. |
| Minting an agent key fails for a grant | Unknown Gateway, a tenant mismatch, or the wrong product or resource type | Create the Gateway first. Use `product: "context-gateway"` and `resourceType: "gateway"`, and match the tenant. |
| A tool call returns `upstream_credentials_unavailable` | The Data Plane cannot read the Upstream's credential | Check the Data Plane's access to credential storage. |
| A tool call returns `upstream_rejected_credentials` | The Upstream refused the stored credential | Rotate the Upstream credential. |
| Cached results keep coming back after a secret rotation | The secret was rotated in place under the same reference | Refresh the Upstream's catalog. |
| Handles stop being created | The Gateway database is above 90 percent of `maxmemory`, refused a write, has another eviction policy than `noeviction`, or has no JSON support | Raise `maxmemory`, shorten the handle lifetime, set `noeviction`, or move handles to a dedicated database with JSON. |
| Large results suddenly come back as stubs | `result_handles.enabled` was turned on, which applies to every Gateway whose `compression` setting is `enabled` | Opt tools out with a `compression` policy of `capture: never`, or set the Gateway's `compression` to `disabled`. |
| Removing a Gateway's `databaseId` returns `400` | The Gateway's `cache` or `compression` setting is still `enabled` | Send both as `disabled` in the same update. |
| A `cache` tool policy returns `400` | The Gateway's `cache` setting is `disabled`, or the Gateway has no `databaseId` | Select a database and enable `cache` on the Gateway first. |
| Data Plane does not become ready | It cannot reach the Identity Service, or an `http://` Identity Service URL is used without `identityService.allowInsecureTransport: true` | Check `identityService.baseURL` and the network path. |
| Context Surface search tools return partial results | Redis is still indexing existing keys after a create, a data model change, or a refresh | Wait until `FT.INFO` on the Surface database shows `percent_indexed` at `1`. |
| Deleting a Context Surface keeps answering `503` | Its indexes cannot be dropped, often because the Control Plane's Redis user lacks `FT._LIST` or `FT.DROPINDEX` | Grant the commands, or repeat the delete with `ignoreIndexSweepFailure=true`. |
| A tool policy disappeared | Moving the Upstream to a new endpoint removed policies the new catalog refuses | Read `droppedToolPolicies` in the update response, then set the policies again. |
| A Context Surface was created without tools | `initialCatalogFailure` in the create response names the cause | Fix the database login or permissions, then refresh the Upstream. |
{{< /table-scrollable >}}

## References

| Need | Reference |
| --- | --- |
| Helm chart values | `values.yaml` in the chart package |
| Chart examples | `examples/` in the chart package, including Vault, AWS, CSI, and certificate overlays |
| Chart README | `README.md` in the chart package |
