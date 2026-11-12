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

Every value sits under `playbook:` in `iris-values.yaml`. The suite derives the tenant, license, Identity Service connection, credentials, and operator OpenID Connect (OIDC) settings from `global.iris`, and fixes the names, ports, rollout strategy, and PodDisruptionBudgets. A differing value fails the render. See [Install the Redis Iris suite](/content/operate/iris/self-managed/_index.md).

| Value | Default | Meaning |
| --- | --- | --- |
| `playbook.storage.existingSecret` | None | The Secret with `playbook-storage.yaml`. Required. |
| `playbook.storage.playbookKey` | `playbook-storage.yaml` | The key in the storage Secret. |
| `playbook.storage.keyPrefix` | `iris:playbook` | The Redis key prefix. |
| `playbook.storage.maxPlaybooksPerTenant` | `128` | Playbooks the tenant can hold. |
| `playbook.inference.models` | None | The embedding identities the deployment offers. Required. |
| `playbook.inference.existingSecret` | None | The Secret with `embedders_connection_details`. Required for a provider other than `noop`. |
| `playbook.inference.secretKey` | `inference.yaml` | The key in the inference Secret. |
| `playbook.controlplane.image.repository` | `redislabs/iris-agent-playbook-control` | The control-plane image. |
| `playbook.dataplane.image.repository` | `redislabs/iris-agent-playbook-data` | The data-plane and worker image. |
| `playbook.controlplane.image.tag`, `playbook.dataplane.image.tag` | `1.0.0` | The image tags. |
| `playbook.controlplane.replicaCount`, `playbook.dataplane.replicaCount`, `playbook.worker.replicaCount` | `1`, `2`, `1` | Replicas of each Deployment. |
| `playbook.controlplane.config.existingSecret` | None | Bring your own control-plane configuration instead of the chart's rendering. The suite refuses it with `global.iris.extraction.enabled`. |
| `playbook.tls.caCertSecret` | `global.tls.caCertSecret` | A Secret with extra CA certificates for every container. Must match `global.tls.caCertSecret` when both are set. |
| `playbook.tracing.enabled` | `false` | Send spans to an OpenTelemetry collector. |
| `playbook.tracing.capture` | `none` | Set `received` to capture bounded data-plane content in spans. |
| `playbook.worker.port` | `9203` | The worker's health and metrics port. |

Extraction turns on with `global.iris.extraction.enabled`. For the worker values, see [Extraction](/content/operate/iris/agent-playbook/self-managed/extraction.md) and [Tune the worker](/content/operate/iris/agent-playbook/self-managed/extraction.md#tune-the-worker).

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `helm install` fails with a named message | A required value is missing, such as `playbook.storage.existingSecret` or `playbook.inference.models`, or a value differs from the one the suite derives. | Set or remove the value named in the message. |
| `helm install` fails naming `playbook.worker.existingSecret` or `playbook.worker.region` | `global.iris.extraction.enabled` is on without the worker values. | Set both, or turn extraction off. |
| Pods are `Pending` or `ImagePullBackOff` | Cluster capacity, registry access, or `global.imagePullSecrets`. | Check pod events and the image values. |
| Readiness fails | Redis is unreachable, a Secret key is wrong, or the license is invalid or expired. | Check the service logs. For an unknown certificate authority, [trust the private CA](/content/operate/iris/agent-playbook/self-managed/configuration.md#trust-a-private-ca). |
| A new playbook stays `PROVISIONING` or becomes `FAILED` | A dependency failed during provisioning, such as a content Redis without JSON and Search. | Check service health and logs, and the [Redis requirements](/content/operate/iris/agent-playbook/self-managed/prerequisites.md#redis-databases). Use an embedding identity from `GET /iris/v1/agent-playbooks/models`. |
| Minting a key fails | The playbook doesn't exist in `global.iris.tenantId`, or the Identity Service can't reach `redis-agent-playbook-controlplane:9200`. | Check the playbook ID and the control-plane pods. |
| An application receives `401` | The key is wrong, expired, rotated, or revoked, or it sent an administrative token. | Send its current agent key. |
| An application receives `403` | The key has no grant on the playbook, or lacks the action. | Mint a key with the right grant. See [Agent-key grants](/content/operate/iris/agent-playbook/self-managed/authentication.md#agent-key-grants). |
| Every OIDC token is rejected | The tokens don't carry `global.iris.auth.oidc.audience`, `api://redis-iris` by default. | Issue tokens for that audience, or change it. See [Configure operator OIDC access](/content/operate/iris/agent-playbook/self-managed/authentication.md#configure-operator-oidc-access). |
| An MCP client can't connect | The ingress drops the path, headers, or body, or the client sends `GET`. | Route the full MCP path to the data plane and use `POST`. |
| Updating an extraction binding returns `412` | The `expectedRevision` is stale. | Read the binding again and resend with its current `revision`. |
| An extraction binding is `BLOCKED` | The source store is gone, or the control plane lost access to it. | Read `blockedReason`, fix the store or trust, and enable the binding again. |

## References

- [Data-plane API reference](/content/develop/ai/context-engine/agent-playbooks/api-reference.md)
- [Control-plane API reference](/content/operate/iris/agent-playbook/self-managed/control-plane-api-reference.md)
- [Service limits](/content/develop/ai/context-engine/agent-playbooks/limits.md)
