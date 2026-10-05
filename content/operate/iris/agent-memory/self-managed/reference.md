---
Title: Configuration and troubleshooting
alwaysopen: false
categories:
- docs
- operate
- iris
description: Review self-managed Redis Agent Memory configuration, troubleshooting guidance, and reference links.
linkTitle: Configuration and troubleshooting
weight: 100
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/reference/
---

## Configuration reference

Use these files to configure a self-managed deployment:

| File | Purpose |
| --- | --- |
| `ram-values.yaml` | Helm values, including the chart-rendered Data Plane, Control Plane, and Identity Service configuration. See [step 3](/content/operate/iris/agent-memory/self-managed/deploy.md#3-create-ram-valuesyaml). |
| `overlay.yaml` | Redis addresses and provider credentials. The Data Plane, the workers, and the Control Plane all mount it. |
| `ids-metadata.yaml` | Tells the Identity Service where Metadata Redis is. |
| `license` | Redis Agent Memory license file provided by Redis. |

### External secret managers

If you use an external secret manager, expose the license, config, admin-token,
Identity Service metadata, Identity Service control token, Data Plane service credential,
and Control Plane internal token material to the chart as Kubernetes Secrets and set the chart's
`existingSecret` values to those Secret names.

Direct CSI file mounts that bypass Kubernetes Secrets are not supported for the
Redis Agent Memory license, Data Plane config, Control Plane config, or Control Plane
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
| Server and worker pods `CrashLoopBackOff`; log: `license validation failed; refusing to start: invalid license format` | `memory.license.license_path` is not set | See [CL-1](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-1). |
| Worker pods `CrashLoopBackOff`; log: `strategies.instruct.llm is required` | The `instruct.llm` block is missing | See [CL-2](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-2). |
| Pods `CrashLoopBackOff`; log: `provider "<name>" is not defined in inference_providers` | An `llm.provider` doesn't name an `inference_providers` entry | See [CL-3](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-3). |
| Worker callback cannot resolve the Data Plane host | `memory.dataplane_client.base_url` is wrong | See [CL-4](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-4). |
| Pod is stuck in `ImagePullBackOff` or `ErrImagePull` | Cluster cannot pull the configured image, image tag is wrong, registry requires credentials, or `imagePullSecrets` is missing/wrong | Verify `image.repository`, `image.tag`, registry reachability, and `imagePullSecrets`; use the Redis Agent Memory release image tag. See [CL-5](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-5). |
| Worker callbacks rejected with `401` | `auth.worker_identity` doesn't match the worker, or the Data Plane cannot fetch the cluster JWKS | See [CL-6](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-6). |
| `helm install --atomic --wait` times out and rolls back | Cluster is small or image pull/startup takes longer than Helm's default timeout | Install without `--atomic --wait`, or set a longer `--timeout` and ensure enough cluster capacity. |
| Pods are pending during install or upgrade | CPU/memory capacity is insufficient for default replicas and rollout overlap | Add nodes/headroom or lower replicas for test deployments. |
| Data Plane health fails | Pod not ready, config invalid, Redis unavailable, or license invalid | Check pod logs and call `/health`, `/health/liveness`, and `/health/readiness`. |
| Data Plane fails with `agent_keys.introspection.base_url is required` | Bring-your-own (BYO) Data Plane config uses agent-key auth, the default when no auth method is set, without the `auth.agent_keys.introspection` block | Add the `auth.agent_keys.introspection` block, or set `auth.method: none`. See [Configuration](/content/operate/iris/agent-memory/self-managed/configuration.md#bring-your-own-byo-configuration). |
| Data Plane fails with `removed metadata configuration keys: …` | Config uses metadata keys that version 0.7.0 removed, such as `metadata.source` or `metadata.live` | Configure `metadata.urls`, `metadata.namespace`, and `databases`, then create stores through the Control Plane. |
| Pod fails to start in FIPS posture | A Redis URL is not `rediss://` or an outbound HTTP client uses `skip_verify: true` | Update Redis URLs and HTTP client config to satisfy the posture checks. |
| Agent receives `401` | Key is missing, revoked, expired, or wrong | Check `Authorization` / `X-Api-Key` and key status. |
| Agent receives `503` | Identity Service is unreachable, or the Data Plane's miss budget for rejected keys is exhausted | Check that the Identity Service pod is Ready and reachable from the Data Plane. |
| Agent receives `403` | Key exists but lacks the required store grant or action | Update grants with `PATCH http://localhost:9200/v1/api-keys/{keyId}` and the Identity Service control token. |
| Store created by the Control Plane is not visible to the Data Plane | Control Plane and Data Plane point at different Metadata Redis URLs or namespaces | Make `metadata.urls` / `metadata.namespace` match on the Control Plane and the Data Plane. |
| Agent key is rejected by the Data Plane | Data Plane cannot reach the Identity Service, the key was rotated or revoked, or the key secret is wrong | Check Identity Service reachability and, with BYO configuration only, `auth.agent_keys.introspection`. After a rotate or revoke, pods can disagree for up to 5 minutes. Send the latest credential returned by mint or rotate. |
| Minting an agent key returns `400` for a grant | Unknown store ID, grant lacks `product: "memory"`, or invalid grant shape | Create the store first, because unknown stores fail the Control Plane check. With BYO Control Plane config, also set `auth.internal_token.token_file: /etc/controlplane-onprem/internal/token`. Use `product: "memory"`, `resourceType: "mem-store"`, and `actions: ["read"]`, `["write"]`, or both. |
| Worker jobs fail after agent-key auth is enabled | Worker callback request has no accepted credential, the projected token is not mounted, or `auth.worker_identity` does not trust the worker subject/audience/issuer | Enable `workerAuth`, set `dataplane_client.auth.type=service_account_token`, and configure `auth.worker_identity.subjects` with the worker ServiceAccount subject and required store grants. |
| Gateway path succeeds but direct external path also works | Data Plane is reachable outside the intended gateway path | Add NetworkPolicy, ingress, service mesh, or load balancer controls. |
| NetworkPolicy blocks expected traffic | Placeholder namespace, release name, or caller selectors were not customized correctly | Check the Helm release label `app.kubernetes.io/instance`, caller namespace, and caller pod labels. |
{{< /table-scrollable >}}

## References

| Need | Reference |
| --- | --- |
| Helm chart values | `values.yaml` at the chart root (`helm pull redis-ai/redis-agent-memory --version 0.7.0 --untar`) |
| FIPS values overlay | `values-fips.yaml` at the chart root |
| NetworkPolicy reference | `networkpolicy.reference.yaml` at the chart root |
| Chart README | `README.md` at the chart root |
| Redis Agent Memory API reference | [Redis Agent Memory API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}) |
| Control Plane API reference | [Control Plane API reference]({{< relref "/operate/iris/agent-memory/self-managed/control-plane-api-reference" >}}) |
| Redis Agent Memory Data Plane image tags | [Docker Hub: redislabs/agent-memory](https://hub.docker.com/r/redislabs/agent-memory/tags) |
| Redis Agent Memory Control Plane image tags | [Docker Hub: redislabs/agent-memory-control-plane](https://hub.docker.com/r/redislabs/agent-memory-control-plane/tags) |
| Identity Service image tags | [Docker Hub: redislabs/iris-identity-service](https://hub.docker.com/r/redislabs/iris-identity-service/tags) |
