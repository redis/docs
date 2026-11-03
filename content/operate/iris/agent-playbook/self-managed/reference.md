---
Title: Configuration and troubleshooting
alwaysopen: false
categories:
- docs
- operate
- iris
description: Look up Helm values and resolve common Agent Playbooks deployment problems.
linkTitle: Configuration and troubleshooting
weight: 100
hideListLinks: true
---

This page is a lookup reference for self-managed Agent Playbooks. It lists the main Helm values with their defaults, and a troubleshooting table that matches common symptoms to their causes and fixes. For how to choose and set these values, see [Configuration](/content/operate/iris/agent-playbook/self-managed/configuration.md).

## Configuration reference

| Value | Default | Meaning |
| --- | --- | --- |
| `tenantId` | None | The one tenant the installation serves. Required. |
| `auth.oidc.audience` | `api://redis-iris` | The audience both planes accept in operator access tokens. |
| `security.profile` | `""` | Set `fips` for the Federal Information Processing Standards (FIPS) profile. |
| `storage.existingSecret` | None | The Secret with `playbook-storage.yaml`. Required. |
| `storage.playbookKey` | `playbook-storage.yaml` | The key in the storage Secret. |
| `storage.keyPrefix` | `iris:playbook` | The Redis key prefix. |
| `storage.maxPlaybooksPerTenant` | `128` | Playbooks the tenant can hold. |
| `license.existingSecret` | None | The Secret with the license. Required. |
| `license.secretKey` | `license` | The key in the license Secret. |
| `inference.models` | None | The embedding identities the deployment offers. Required. |
| `inference.existingSecret` | None | The Secret with `embedders_connection_details`. Required for a provider other than `noop`. |
| `inference.secretKey` | `inference.yaml` | The key in the inference Secret. |
| `controlplane.image.repository` | `redislabs/iris-agent-playbook-control` | The control-plane image. |
| `dataplane.image.repository` | `redislabs/iris-agent-playbook-data` | The data-plane and worker image. |
| `controlplane.image.tag`, `dataplane.image.tag` | None | The image tags. Required. |
| `controlplane.service.port` | `9200` | The control-plane Service port. |
| `dataplane.service.port` | `9201` | The data-plane Service port, for REST and MCP. |
| `controlplane.adminToken.autoGenerate` | `true` | Generate the admin token when `existingSecret` is empty. |
| `controlplane.internalToken.existingSecret` | None | The internal token shared with the Identity Service. |
| `controlplane.config.existingSecret` | None | Bring your own control-plane configuration instead of the chart's rendering. |
| `dataplane.identityServiceBaseURL` | None | The Identity Service endpoint. Required. |
| `identityService.allowInsecureTransport` | `false` | Accept an `http://` Identity Service URL. Refused under FIPS. |
| `identityService.credential.existingSecret` | None | The data-plane runtime credential. Required. |
| `dataplane.oidc.enabled`, `controlplane.oidc.enabled` | `false` | Accept operator OpenID Connect (OIDC) tokens. |
| `tls.caCertSecret` | None | A Secret with extra CA certificates for every container. |
| `tracing.enabled` | `false` | Send spans to an OpenTelemetry collector. |
| `tracing.capture` | `none` | Set `received` to capture bounded data-plane content in spans. |
| `extraction.enabled`, `extraction.connection.enabled` | `false` | Allow extraction bindings and the Redis Agent Memory connection. |
| `worker.enabled` | `false` | Run the extraction worker. |
| `worker.port` | `9203` | The worker's health and metrics port. |
| `tests.enabled` | `false` | Add `helm test` pods. |

`imagePullSecrets`, `security.profile`, and `tls.caCertSecret` fall back to `global.imagePullSecrets`, `global.security.profile`, and `global.tls.caCertSecret` when empty. For worker tuning values, see [Tune the worker](/content/operate/iris/agent-playbook/self-managed/extraction.md#tune-the-worker).

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `helm install` fails with a named message | A required value is missing, or two credentials share a Secret key. | Set the value named in the message, or use distinct Secrets. |
| `helm install` fails naming `extraction.connection.workerSubjects` | The extraction connection is enabled without the worker. | Enable the worker, or disable the connection. |
| Pods are `Pending` or `ImagePullBackOff` | Cluster capacity, image tags, registry access, or `imagePullSecrets`. | Check pod events and the image values. |
| Readiness fails | Redis is unreachable, a Secret key is wrong, or the license is invalid or expired. | Check the service logs. For an unknown certificate authority, [trust the private CA](/content/operate/iris/agent-playbook/self-managed/configuration.md#trust-a-private-ca). |
| A new playbook stays `PROVISIONING` or becomes `FAILED` | A dependency failed during provisioning, such as a content Redis without JSON and Search. | Check service health and logs, and the [Redis requirements](/content/operate/iris/agent-playbook/self-managed/prerequisites.md#redis-databases). Use an embedding identity from `GET /iris/v1/agent-playbooks/models`. |
| Minting a key fails | `tenantId` differs from the Identity Service's tenant, the playbook doesn't exist, or the Identity Service can't reach the control plane. | Set both tenants to the same value, check the playbook ID, and check `productValidation.products.playbook`. |
| An application receives `401` | The key is wrong, expired, rotated, or revoked, or it sent an administrative token. | Send its current agent key. |
| An application receives `403` | The key has no grant on the playbook, or lacks the action. | Mint a key with the right grant. See [Agent-key grants](/content/operate/iris/agent-playbook/self-managed/authentication.md#agent-key-grants). |
| Every OIDC token is rejected after an upgrade | The tokens carry the old `api://playbook-dp` audience. | Set `auth.oidc.audience` to match. See [Upgrade with OIDC enabled](/content/operate/iris/agent-playbook/self-managed/authentication.md#upgrade-with-oidc-enabled). |
| An MCP client can't connect | The ingress drops the path, headers, or body, or the client sends `GET`. | Route the full MCP path to the data plane and use `POST`. |
| Updating an extraction binding returns `412` | The `expectedRevision` is stale. | Read the binding again and resend with its current `revision`. |
| An extraction binding is `BLOCKED` | The source store is gone, or the control plane lost access to it. | Read `blockedReason`, fix the store or trust, and enable the binding again. |

## References

- [Data-plane API reference](/content/develop/ai/context-engine/agent-playbooks/api-reference.md)
- [Control-plane API reference](/content/operate/iris/agent-playbook/self-managed/control-plane-api-reference.md)
- [Service limits](/content/develop/ai/context-engine/agent-playbooks/limits.md)
