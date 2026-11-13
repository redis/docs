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
| `iris-values.yaml` | Suite values, with both planes under `contextGateway:`. See [Add the Context Gateway values](/content/operate/iris/context-gateway/self-managed/deploy.md#2-add-the-context-gateway-values). |
| `metadata.yaml` | Metadata Redis URLs. Both planes mount it. |
| `credential-redis.yaml` | Credential Redis URLs, with the encrypted Redis backend. |
| `config.yaml` | URLs for each registered database. |

### External secret managers

Each file reference accepts a Kubernetes Secret or a Secrets Store Container Storage Interface (CSI) Driver file. Scope each CSI class to the files its plane may read, and keep the admin token, internal token, and Vault writer token out of every class the Data Plane mounts.

## Troubleshooting

{{< table-scrollable >}}
| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Control Plane `/health/readiness` answers `503` | The admin or internal token cannot be read or is empty, or the license is not valid. The Data Plane's readiness does not check its token or the license, and an invalid license stops either plane at startup. | Check the admin and internal token Secrets and the license. |
| Agent receives `401` | Key is missing, revoked, or expired, or sent in the wrong header | Send it as `Authorization: Bearer` or `X-Api-Key`, and check its status. |
| Agent receives `403` | The key has no `context-gateway` grant for this Gateway | Update the key's grants with the Identity Service control token. |
| Agent receives `404` | The Gateway does not exist, is being deleted, or belongs to another tenant | Check the Gateway ID and `global.iris.tenantId`. |
| Minting an agent key fails for a grant | Unknown Gateway, a tenant mismatch, or the wrong product or resource type | Create the Gateway first. Use `product: "context-gateway"` and `resourceType: "gateway"`, and match the tenant. |
| A tool call returns `upstream_credentials_unavailable` | The Data Plane cannot read the Upstream's credential | Check the Data Plane's access to credential storage. |
| A tool call returns `upstream_rejected_credentials` | The Upstream refused the stored credential | Rotate the Upstream credential. |
| Cached results keep coming back after a secret rotation | The secret was rotated in place under the same reference | Refresh the Upstream's catalog. |
| Handles stop being created | The handle memory share or the database-wide 90% guard is reached, the database refused a write, has another eviction policy than `noeviction`, or has no JSON support | Raise `maxmemory`, shorten the handle lifetime, set `noeviction`, or move handles to a dedicated database with JSON. |
| Large results suddenly come back as stubs | `compression.enabled` was turned on, which applies to every Gateway whose `compression` setting is `ENABLED` | Opt tools out with a `compression` policy of `capture: NEVER`, or set the Gateway's `compression` to `DISABLED`. |
| Data Plane refuses to start with a default database error | `compression.enabled` is on and the default Gateway database does not use `noeviction` or has no JSON module, or a default names an entry that is not in `databases` | Set `maxmemory-policy noeviction` and load JSON, or fix `defaultDatabases`. See [Default databases](/content/operate/iris/context-gateway/self-managed/configuration.md#default-databases). |
| Turning compression on returns `400` with an `errors[]` entry for `/compression` | The Gateway database does not use `noeviction` or has no JSON module | Fix the database, then repeat the update. A `503` means the database could not be reached. |
| A new Gateway has `compression` set to `DISABLED` | The create omitted `compression`, and the default Gateway database cannot hold handles or could not be reached | Fix the database, then enable `compression` with an update. |
| An update or delete returns `412` with `/errors/revision-conflict` | Another change landed after you read the resource | Read it again, then use the new `revision` as `expectedRevision`. |
| A request returns `413` with `/errors/payload-too-large` | The request exceeds the service size limit | Reduce the request body before retrying. |
| A Context Surface create returns `400` on `contextSurface.databaseId` | The ID was empty or `null`, or it was omitted and no `defaultDatabases.surfaceDb` is set | Send a registered ID, or set `defaultDatabases.surfaceDb`. |
| Removing a Gateway's `databaseId` returns `400` | The Gateway's `cache` or `compression` setting is still `ENABLED` | Send both as `DISABLED` in the same update. |
| A `cache` tool policy returns `400` | The Gateway's `cache` setting is `DISABLED`, or the Gateway has no `databaseId` | Select a database and enable `cache` on the Gateway first. |
| Agent calls fail authentication | The Data Plane cannot reach the Identity Service | Check the `iris-identity-service` Service on port `9200` and the network path. |
| Context Surface search tools return partial results | Redis is still indexing existing keys after a create, a data model change, or a refresh | Wait until `FT.INFO` on the Surface database shows `percent_indexed` at `1`. |
| Deleting a Context Surface keeps answering `503` | Its indexes cannot be dropped, often because the Control Plane's Redis user lacks `FT._LIST` or `FT.DROPINDEX` | Grant the commands, or repeat the delete with `ignoreIndexSweepFailure=true`. |
| A tool policy disappeared | Moving the Upstream to a new endpoint removed policies the new catalog refuses | Read `droppedToolPolicies` in the update response, then set the policies again. |
| A Context Surface was created without tools | `initialCatalogFailure` in the create response names the cause | Fix the database login or permissions, then refresh the Upstream. |
{{< /table-scrollable >}}

## References

| Need | Reference |
| --- | --- |
| Helm chart values | `helm show values redis-ai/redis-iris --version 1.0.1`, with Context Gateway under `contextGateway:` |
| Chart examples | `examples/context-gateway.yaml` in the `redis-iris` chart package |
| Chart README | `helm show readme redis-ai/redis-iris --version 1.0.1` |
