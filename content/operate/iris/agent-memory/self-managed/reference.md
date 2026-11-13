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
| `iris-values.yaml` | The suite values. Agent Memory's go under `memory:`. See [Add the Agent Memory values](/content/operate/iris/agent-memory/self-managed/deploy.md#2-add-the-agent-memory-values). |
| `overlay.yaml` | Redis addresses and provider credentials. The Data Plane, the workers, and the Control Plane all mount it. |
| `ids-metadata.yaml` | Tells the Identity Service where Metadata Redis is. |
| `license` | The suite license file provided by Redis. |

### External secret managers

If you use an external secret manager, expose the license, config, admin-token,
Identity Service metadata, Identity Service control token, Data Plane service credential,
and Control Plane internal token material as Kubernetes Secrets in the release namespace, and name
them in `iris-values.yaml`. To supply the suite credentials yourself, see
[Credentials](/content/operate/iris/self-managed/_index.md#credentials).

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
| `helm search repo redis-ai/redis-iris --versions` returns no results | Helm repo not added/updated | Run `helm repo add redis-ai https://helm.redis.io/ai` and `helm repo update`. |
| Rendering fails and names a field under `memory:` | The suite derives that value: the tenant, license, Identity Service connection, worker identity, or OIDC settings | Remove the field. See [Add the Agent Memory values](/content/operate/iris/agent-memory/self-managed/deploy.md#2-add-the-agent-memory-values). |
| Rendering fails with `is chart-owned` for an introspection field | An endpoint, credential, or transport flag was hand-set under `memory.memory.auth` or `memory.shared.auth` | Remove it. The suite writes the introspection settings; cache settings remain configurable. |
| Rendering fails with `memory.auth.oidc.issuer and memory.auth.oidc.jwks_uri are required when memory.auth.oidc.enabled is true` | Data Plane OIDC is enabled, but `global.iris.auth.oidc` has no issuer or JWKS URL | Set `global.iris.auth.oidc.issuer` and `global.iris.auth.oidc.jwksURI`, or supply them in your own configuration with `memory.config.existingSecret`. |
| Rendering or startup refuses `auth.method: none` | Authentication is disabled outside the development profile | Use agent-key authentication. For isolated development only, set both `memory.memory.profile: dev` and `memory.memory.auth.method: none`; supplied configuration files use `profile: dev` and `auth.method: none`. |
| Docker pull fails for the configured image tag | Image tag is wrong or has not been published to the configured registry | Use the image tag listed for the release on Docker Hub or provided by Redis. |
| Server and worker pods `CrashLoopBackOff`; log: `license validation failed; refusing to start: invalid license format` | `memory.memory.license.license_path` is not set | See [CL-1](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-1). |
| Worker pods `CrashLoopBackOff`; log: `strategies.instruct.llm is required` | The `instruct.llm` block is missing | See [CL-2](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-2). |
| Pods `CrashLoopBackOff`; log: `provider "<name>" is not defined in inference_providers` | An `llm.provider` doesn't name an `inference_providers` entry | See [CL-3](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-3). |
| Worker callback cannot resolve the Data Plane host | With a bring-your-own configuration, `dataplane_client.base_url` is wrong | Use `http://redis-agent-memory:9000`. See [Data Plane configuration file](/content/operate/iris/agent-memory/self-managed/configuration.md#data-plane-configuration-file). |
| Pod is stuck in `ImagePullBackOff` or `ErrImagePull` | Cluster cannot pull the configured image, image tag is wrong, registry requires credentials, or `imagePullSecrets` is missing/wrong | Verify `memory.image.repository`, `memory.image.tag`, registry reachability, and `global.imagePullSecrets`; use the Redis Agent Memory release image tag. Set the Identity Service image under `identityService.image`. See [CL-5](/content/operate/iris/agent-memory/self-managed/deploy.md#cl-5). |
| Worker callbacks rejected with `401` | `auth.worker_identity` doesn't match the worker, or the Data Plane cannot fetch the cluster JWKS | See [Prepare worker identity for your platform](/content/operate/iris/agent-memory/self-managed/deploy.md#prepare-worker-identity-for-your-platform). |
| `helm install --atomic --wait` times out and rolls back | Cluster is small or image pull/startup takes longer than Helm's default timeout | Install without `--atomic --wait`, or set a longer `--timeout` and ensure enough cluster capacity. |
| Pods are pending during install or upgrade | CPU/memory capacity is insufficient for default replicas and rollout overlap | Add nodes/headroom or lower replicas for test deployments. |
| Data Plane health fails | Pod not ready, config invalid, Redis unavailable, or license invalid | Check pod logs and call `/health/liveness` and `/health/readiness`. |
| Data Plane fails with `agent_keys.introspection.base_url is required` | Bring-your-own (BYO) Data Plane config uses agent-key auth, the default when no auth method is set, without the `auth.agent_keys.introspection` block | Add the `auth.agent_keys.introspection` block. Only isolated development can use `auth.method: none` with `profile: dev`. See [Configuration](/content/operate/iris/agent-memory/self-managed/configuration.md#bring-your-own-byo-configuration). |
| Agent receives `401` | Key is missing, revoked, expired, or wrong | Check `Authorization` / `X-Api-Key` and key status. |
| Agent receives `503` | Identity Service is unreachable, or the Data Plane's miss budget for rejected keys is exhausted | Check that the Identity Service pod is Ready and reachable from the Data Plane. |
| Agent receives `403` | Key exists but lacks the required store grant or action | Update grants with `PATCH http://localhost:9200/v1/api-keys/{keyId}` and the Identity Service control token. |
| Store created by the Control Plane is not visible to the Data Plane | Control Plane and Data Plane point at different Metadata Redis URLs or namespaces | Make `metadata.urls` / `metadata.namespace` match on the Control Plane and the Data Plane. |
| Agent key is rejected by the Data Plane | Data Plane cannot reach the Identity Service, the key was rotated or revoked, or the key secret is wrong | Check Identity Service reachability and, with BYO configuration only, `auth.agent_keys.introspection`. After a rotate or revoke, pods can disagree for up to 5 minutes. Send the latest credential returned by mint or rotate. |
| Minting an agent key returns `400` for a grant | Unknown store ID, mismatched tenant, missing `product: "memory"`, or invalid grant shape | Create the store first. With BYO Control Plane config, set `auth.internal_token.token_file: /etc/controlplane-onprem/internal/token` and `auth.admin_tenant_id` to `global.iris.tenantId`. Use `product: "memory"`, `resourceType: "mem-store"`, and `actions: ["read"]`, `["write"]`, or both. |
| Worker jobs fail after agent-key auth is enabled | The worker's projected token is not trusted: the issuer or JWKS is wrong or unreachable, or a BYO configuration lacks `dataplane_client.auth` or `auth.worker_identity` | Run the [preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight) and see [Prepare worker identity for your platform](/content/operate/iris/agent-memory/self-managed/deploy.md#prepare-worker-identity-for-your-platform). |
| Gateway path succeeds but direct external path also works | Data Plane is reachable outside the intended gateway path | Add NetworkPolicy, ingress, service mesh, or load balancer controls. |
| NetworkPolicy blocks expected traffic | Placeholder namespace, release name, or caller selectors were not customized correctly | Check the release label `app.kubernetes.io/instance` (`iris`), caller namespace, and caller pod labels. |
{{< /table-scrollable >}}

## References

| Need | Reference |
| --- | --- |
| Suite chart values | `helm show values redis-ai/redis-iris --version 1.0.1` |
| Agent Memory chart values and README | `redis-iris/charts/redis-agent-memory/` in the suite package (`helm pull redis-ai/redis-iris --version 1.0.1 --untar`) |
| NetworkPolicy reference | [Network policy](/content/operate/iris/agent-memory/self-managed/operations.md#network-policy) |
| Redis Agent Memory API reference | [Redis Agent Memory API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}) |
| Control Plane API reference | [Control Plane API reference]({{< relref "/operate/iris/agent-memory/self-managed/control-plane-api-reference" >}}) |
| Redis Agent Memory Data Plane image tags | [Docker Hub: redislabs/agent-memory](https://hub.docker.com/r/redislabs/agent-memory/tags) |
| Redis Agent Memory Control Plane image tags | [Docker Hub: redislabs/agent-memory-control-plane](https://hub.docker.com/r/redislabs/agent-memory-control-plane/tags) |
| Identity Service image tags | [Docker Hub: redislabs/iris-identity-service](https://hub.docker.com/r/redislabs/iris-identity-service/tags) |
