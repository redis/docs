---
Title: Configuration and troubleshooting
alwaysopen: false
categories:
- docs
- operate
- iris
description: Look up Helm values and resolve common Intent Router deployment problems.
linkTitle: Configuration and troubleshooting
weight: 100
hideListLinks: true
---

## Configuration reference

| Value | Default | Meaning |
| --- | --- | --- |
| `tenantId` | None | The one tenant the installation serves. Required. |
| `security.profile` | `""` | Set `fips` for the Federal Information Processing Standards (FIPS) runtime. |
| `storage.existingSecret` | None | The Secret with the Redis overlays. Required. |
| `storage.keyPrefix` | `iris:intent` | The Redis key prefix both planes derive their keys from. |
| `storage.maxRoutersPerTenant` | `128` | Routers the tenant can hold. |
| `controlplane.reconcile.provisioningDeadline` | `10m` | How long a Router can stay `PROVISIONING` before it fails. |
| `identityService.runtimeCache.hardTTLSeconds` | `300` | The longest a revoked agent key keeps working. |
| `license.existingSecret` | None | The Secret with the license. Required. |
| `inference.models` | None | The deployment's embedding model. Required. |
| `inference.existingSecret` | None | The Secret with `embedders_connection_details` under the key `inference.yaml`. |
| `inference.allowLocalModels` | `false` | Allow the development-only `noop` provider. |
| `identityService.enabled` | `true` | Deploy the bundled Identity Service. |
| `controlplane.requireDatabase` | `false` | Require every Router to name a customer database. |
| `dataplane.allowInsecureIdentityService` | `false` | Accept an `http://` Identity Service URL. |
| `dataplane.identityServiceBaseURL` | None | An `https://` Identity Service endpoint. |
| `tests.enabled` | `false` | Add `helm test` pods. |
| `tracing.enabled` | `false` | Send spans to an OpenTelemetry collector. |

See [Configuration](/content/operate/iris/intent-router/self-managed/configuration.md) for the limits and match settings.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `helm install` fails with a named message | A required value is missing, or two tokens share a Secret key. | Set the value named in the message. |
| A new Router is `FAILED` and `failureReason` mentions vector search | The data-plane Redis has no Search. | Use a Redis 8 build that includes Search, or load the Search and Query engine. |
| A new Router stays `PROVISIONING` | The data plane can't reach the mailbox, its Redis, or the embedding provider. | Check `runtime.redis.urls` and the data-plane logs. |
| Data requests return `409` | The Router isn't `READY` yet, or has failed. | Read the Router's state and `failureReason`. |
| Data requests return `404` for a Router you created | The Router is being deleted, or the ID is wrong. | Read the Router's state from the control plane. |
| Data requests return `423` | The Router is suspended. | Set the Router's state to `READY`. |
| Data requests return `503` with `Retry-After` | The Router's index is rebuilding, or its database is unreachable. | Wait for the interval, then check the database. |
| Data requests return `401` | The key is wrong, expired, or revoked. | Mint or rotate the key. |
| Data requests return `403` | The key has no grant on the Router, or lacks the action, such as `write`. | Mint a key with the right grant. |
| Creating a Router returns `409` | The tenant has reached `storage.maxRoutersPerTenant`. | Delete unused Routers or raise the limit. |
| Updating a Router returns `409` | The Router isn't `READY` or `SUSPENDED`. | Wait for provisioning to finish, or delete a failed Router. |
| Minting a key fails | `tenantId` differs from the Identity Service's tenant, or the Router doesn't exist. | Set both to the same tenant, and check the Router ID. |
| Creating a Router fails with `400` | The `vectorSpace` isn't one the deployment offers. | List the models and use one of them. |

## References

- [Data-plane API reference](/content/develop/ai/context-engine/intent-router/api-reference.md)
- [Control-plane API reference](/content/operate/iris/intent-router/self-managed/control-plane-api-reference.md)
- [Service limits and errors](/content/develop/ai/context-engine/intent-router/limits.md)
