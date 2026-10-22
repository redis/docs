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
| `gateway-values.yaml` | Helm values for both planes. See [step 4](/content/operate/iris/context-gateway/self-managed/deploy.md#4-create-gateway-valuesyaml). |
| `metadata.yaml` | Metadata Redis URLs. Both planes mount it. |
| `credential-redis.yaml` | Credential Redis URLs, with the encrypted Redis backend. |
| `databases.yaml` | URLs for each registered database. |
| `license` | Context Gateway license file provided by Redis. |

### External secret managers

Each file reference accepts a Kubernetes Secret or a Secrets Store CSI Driver file. Scope each CSI class to the files its plane may read, and keep the admin token, internal token, and Vault writer token out of every class the Data Plane mounts.

## Troubleshooting

{{< table-scrollable >}}
| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `/v1/health/ready` answers `503` | A token source cannot be read or is empty, or the license is not valid | Check the admin and internal token Secrets and the license. |
| Agent receives `401` | Key is missing, revoked, or expired, or sent in the wrong header | Send it as `Authorization: Bearer` or `X-Api-Key`, and check its status. |
| Agent receives `403` | The key has no `context-gateway` grant for this Gateway | Update the key's grants with the Identity Service control token. |
| Agent receives `404` | The Gateway does not exist, is being deleted, or belongs to another tenant | Check the Gateway ID and `tenantId`. |
| Minting an agent key fails for a grant | Unknown Gateway, a tenant mismatch, or the wrong product or resource type | Create the Gateway first. Use `product: "context-gateway"` and `resourceType: "gateway"`, and match the tenant. |
| A tool call returns `upstream_credentials_unavailable` | The Data Plane cannot read the Upstream's credential | Check the Data Plane's access to credential storage. |
| A tool call returns `upstream_rejected_credentials` | The Upstream refused the stored credential | Rotate the Upstream credential. |
| Cached results keep coming back after a secret rotation | The secret was rotated in place under the same reference | Refresh the Upstream's catalog. |
| Handles stop being created | The Gateway database is above 90 percent of `maxmemory`, or refused a write | Raise `maxmemory`, shorten the handle lifetime, or move handles to a dedicated database. |
{{< /table-scrollable >}}

## References

| Need | Reference |
| --- | --- |
| Helm chart values | `values.yaml` at the chart root |
| Chart examples | `examples/` at the chart root, including Vault, AWS, CSI, and certificate overlays |
| Chart README | `README.md` at the chart root |
