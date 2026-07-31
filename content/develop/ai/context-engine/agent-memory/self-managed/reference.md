---
Title: Configuration and troubleshooting
alwaysopen: false
categories:
- docs
- develop
- ai
description: Review self-managed Redis Agent Memory configuration, troubleshooting guidance, and reference links.
linkTitle: Configuration and troubleshooting
weight: 100
hideListLinks: true
---

## Configuration reference

Use these files to configure a self-managed deployment:

| File | Purpose |
| --- | --- |
| `ram-values.yaml` | Helm values for images, replicas, services, Secret names, and optional Control Plane settings. |
| `memory-dataplane.config.yaml` | Data Plane stores, Redis URLs, auth mode, embedding provider, and worker callback settings. |
| `controlplane-onprem.config.yaml` | Control Plane metadata Redis, store Redis, admin-token auth, and embedding settings. |
| `license` | Agent Memory license file provided by Redis. |

### External secret managers

If you use an external secret manager, expose the license, config, and
admin-token material to the chart as Kubernetes Secrets and set the chart's
`existingSecret` values to those Secret names.

Direct CSI file mounts that bypass Kubernetes Secrets are not supported for the
Agent Memory license, Data Plane config, Control Plane config, or Control Plane
admin-token paths.

For Secrets Store CSI Driver, use sync-to-Kubernetes-Secret
(`SecretProviderClass.secretObjects`). If the Control Plane consumes
CSI-synced Secrets, make sure a Control Plane pod also mounts the corresponding
`SecretProviderClass` volume so the synced Secret exists while the pod runs.

## Troubleshooting

{{< table-scrollable >}}
| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `helm search repo redis-ai/redis-agent-memory --versions` returns no results | Helm repo not added/updated, or the chart version has not been published to the repo yet | Run `helm repo add`, `helm repo update`, or install from the chart package provided by Redis. |
| Docker pull fails for the configured image tag | Image tag is wrong or has not been published to the configured registry | Use the image tag listed for the release on Docker Hub or provided by Redis. |
| Pod is stuck in `ImagePullBackOff` or `ErrImagePull` | Cluster cannot pull the configured image, image tag is wrong, registry requires credentials, or `imagePullSecrets` is missing/wrong | Verify `image.repository`, `image.tag`, registry reachability, and `imagePullSecrets`; use the Agent Memory release image tag. |
| `helm install --atomic --wait` times out and rolls back | Cluster is small or image pull/startup takes longer than Helm's default timeout | Install without `--atomic --wait`, or set a longer `--timeout` and ensure enough cluster capacity. |
| Pods are pending during install or upgrade | CPU/memory capacity is insufficient for default replicas and rollout overlap | Add nodes/headroom or lower replicas for test deployments. |
| Data Plane health fails | Pod not ready, config invalid, Redis unavailable, or license invalid | Check pod logs and call `/health`, `/health/liveness`, and `/health/readiness`. |
| Data Plane fails with `auth.agent_keys.enabled requires metadata.source=live` | Agent-key auth enabled with static stores, for example through `auth.method: agent_key` | Use Control Plane managed stores with `metadata.source: live`, or set `auth.method: none`. |
| Pod fails to start in FIPS posture | A Redis URL is not `rediss://` or an outbound HTTP client uses `skip_verify: true` | Update Redis URLs and HTTP client config to satisfy the posture checks. |
| Agent receives `401` | Missing, malformed, revoked, expired, or invalid key | Check `Authorization` / `X-Api-Key`, key status, and metadata Redis connectivity. |
| Agent receives `403` | Key exists but lacks the required store grant or action | Update grants through `/v1/api-keys/{keyId}`. |
| Store created by the Control Plane is not visible to the Data Plane | CP and DP point at different Metadata Redis URLs or namespaces | Make CP `metadata.urls` / `metadata.namespace` match DP `metadata.live.urls` / `metadata.live.namespace`. |
| Agent key minted by the Control Plane is rejected by the Data Plane | Data Plane cannot read the same Metadata Redis records, the key was rotated/revoked, or the key secret is wrong | Check `metadata.source: live`, Metadata Redis connectivity, and send the latest credential returned by mint or rotate. |
| Minting an agent key returns `400` for a grant | Unknown store ID or invalid grant shape | Create the store first; use `resourceType: "mem-store"` and `actions: ["read"]`, `["write"]`, or both. |
| Worker jobs fail after agent-key auth is enabled | Worker callback request has no accepted credential, the projected token is not mounted, or `auth.worker_identity` does not trust the worker subject/audience/issuer | Enable `workerAuth`, set `dataplane_client.auth.type=service_account_token`, and configure `auth.worker_identity.subjects` with the worker ServiceAccount subject and required store grants. |
| Gateway path succeeds but direct external path also works | Data Plane is reachable outside the intended gateway path | Add NetworkPolicy, ingress, service mesh, or load balancer controls. |
| NetworkPolicy blocks expected traffic | Placeholder namespace, release name, or caller selectors were not customized correctly | Check the Helm release label `app.kubernetes.io/instance`, caller namespace, and caller pod labels. |
{{< /table-scrollable >}}

## References

| Need | Reference |
| --- | --- |
| Helm chart values | `deployment/redis-agent-memory/values.yaml` |
| FIPS values overlay | `deployment/redis-agent-memory/values-fips.yaml` |
| NetworkPolicy reference | `deployment/redis-agent-memory/networkpolicy.reference.yaml` |
| Redis Agent Memory API reference | [Redis Agent Memory API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}) |
| Control Plane API reference | [Control Plane API reference]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/control-plane-api-reference" >}}) |
| Agent Memory Data Plane image tags | [Docker Hub: redislabs/agent-memory](https://hub.docker.com/r/redislabs/agent-memory/tags) |
| Agent Memory Control Plane image tags | [Docker Hub: redislabs/agent-memory-control-plane](https://hub.docker.com/r/redislabs/agent-memory-control-plane/tags) |
