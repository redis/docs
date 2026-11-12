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

This page is a lookup reference for self-managed Intent Router. It lists the main Helm values with their defaults, and a troubleshooting table that matches common symptoms to their causes and fixes. For how to choose and set these values, see [Configuration](/content/operate/iris/intent-router/self-managed/configuration.md).

## Configuration reference

Every value sits under `intent:` in `iris-values.yaml`. The suite derives the tenant, license, Identity Service connection, credentials, and OpenID Connect (OIDC) settings from `global.iris`, and fixes the names, ports, rollout strategy, and PodDisruptionBudgets. A differing value fails the render. See [Install the Redis Iris suite](/content/operate/iris/self-managed/_index.md).

| Value | Default | Meaning |
| --- | --- | --- |
| `intent.storage.existingSecret` | None | The Secret with the Redis overlays. Required. |
| `intent.storage.keyPrefix` | `iris:intent` | The Redis key prefix both planes derive their keys from. |
| `intent.storage.maxRoutersPerTenant` | `128` | Routers the tenant can hold. |
| `intent.controlplane.reconcile.provisioningDeadline` | `10m` | How long a Router can stay `PROVISIONING` before it fails. |
| `intent.inference.models` | None | The deployment's one embedding model. Required. |
| `intent.inference.existingSecret` | None | The Secret with `embedders_connection_details` under the key `inference.yaml`. Required for a provider other than `noop`. |
| `intent.inference.allowLocalModels` | `false` | Allow the development-only `noop` provider. |
| `intent.controlplane.requireDatabase` | `false` | Require every Router to name a customer database. |
| `intent.controlplane.image.tag`, `intent.dataplane.image.tag` | `1.0.0` | The image tags. |
| `intent.dataplane.startupBudget` | `20s` | How long the data plane's first convergence pass can run. At most `40s`. |
| `intent.tracing.enabled` | `false` | Send spans to an OpenTelemetry collector. |

See [Configuration](/content/operate/iris/intent-router/self-managed/configuration.md) for the limits and match settings.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `helm install` fails with a named message | A required value is missing, `intent.inference.models` doesn't list exactly one model, or a value differs from the one the suite derives. | Set or remove the value named in the message. |
| A new Router is `FAILED` and `failureReason` mentions vector search | The data-plane Redis has no Search. | Use a Redis 8 build that includes Search, or load the Search and Query engine. |
| A new Router stays `PROVISIONING` | The data plane can't reach the mailbox, its Redis, or the embedding provider. | Check `runtime.redis.urls` and the data-plane logs. |
| Data requests return `409` | The Router isn't `READY` yet, or has failed. | Read the Router's state and `failureReason`. |
| Data requests return `404` for a Router you created | The Router is being deleted, or the ID is wrong. | Read the Router's state from the control plane. |
| Data requests return `423` | The Router is suspended. | Set the Router's state to `READY`. |
| Data requests return `503` with `Retry-After` | The Router's index is rebuilding, or its database is unreachable. | Wait for the interval, then check the database. |
| Data requests return `401` | The key is wrong, expired, or revoked. | Mint or rotate the key. |
| Data requests return `403` | The key has no grant on the Router, or lacks the action, such as `write`. | Mint a key with the right grant. |
| Creating a Router returns `409` | The tenant has reached `intent.storage.maxRoutersPerTenant`. | Delete unused Routers or raise the limit. |
| Updating a Router returns `409` | The Router isn't `READY` or `SUSPENDED`. | Wait for provisioning to finish, or delete a failed Router. |
| Minting a key fails | The Router doesn't exist in `global.iris.tenantId`. | Check the Router ID. |
| Creating a Router fails with `400` | The `vectorSpace` isn't one the deployment offers. | List the models and use one of them. |

## References

- [Data-plane API reference](/content/develop/ai/context-engine/intent-router/api-reference.md)
- [Control-plane API reference](/content/operate/iris/intent-router/self-managed/control-plane-api-reference.md)
- [Service limits and errors](/content/develop/ai/context-engine/intent-router/limits.md)
