---
Title: Configuration and troubleshooting
alwaysopen: false
categories:
- docs
- operate
- iris
description: Review self-managed LangCache configuration, troubleshooting guidance, and reference links.
linkTitle: Configuration and troubleshooting
weight: 100
hideListLinks: true
---

## Configuration reference

Use these files to configure a self-managed deployment:

| File | Purpose |
| --- | --- |
| `langcache-values.yaml` | Helm values for the Data Plane image, replicas, services, and inline `dataplane.config.yaml` content. Treat this file as sensitive. |
| `dataplane.config.yaml` | Data Plane caches, Redis URLs, auth mode, and embedding settings; provided inline under the chart's `config` value. |
| `controlplane-onprem.config.yaml` | Control Plane metadata Redis, database registry, admin-token auth, and embedding contract. |
| `license` | LangCache license file provided by Redis, required by the on-prem-hardened Control Plane and Data Plane binaries. |

### External secret managers

The license, Control Plane config, Control Plane admin-token, and Identity
Service introspection-token material in this guide are all real Kubernetes
Secrets. If you use an external secret manager, expose that material as
Kubernetes Secrets and reference those Secret names in the Control Plane
manifest's `secretName` fields or the Data Plane chart's generic
`volumes`/`volumeMounts` values.

The Data Plane's `dataplane.config.yaml` content itself is a Helm value
(`config`), not a Secret, in the current chart; see
[Data Plane configuration]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration#config-storage" >}})
for a Secret-backed alternative if your security policy requires one.

## Troubleshooting

{{< table-scrollable >}}
| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Docker pull fails for the configured image tag | Image tag is wrong, or the image has not been mirrored into a registry your cluster can reach | Use the image reference provided by your Redis representative and mirror it into your registry if needed. |
| Pod is stuck in `ImagePullBackOff` or `ErrImagePull` | Cluster cannot pull the configured image, image tag is wrong, registry requires credentials, or `imagePullSecrets` is missing/wrong | Verify `image.repository`, `image.tag`, registry reachability, and `imagePullSecrets`. |
| `helm install --atomic --wait` times out and rolls back | Cluster is small or image pull/startup takes longer than Helm's default timeout | Install without `--atomic --wait`, or set a longer `--timeout` and ensure enough cluster capacity. |
| Data Plane health fails | Pod not ready, config invalid, or Redis unavailable | Check pod logs and call `/health`, `/health/liveness`, and `/health/readiness`. |
| Data Plane fails to start with an on-prem-hardened image against static config | The on-prem-hardened Data Plane binary (`cmd/onprem`) only supports Control Plane managed caches with agent-key auth; it rejects static `metadata.caches` and other auth methods | Use the static-caches Data Plane image for static caches, or switch to Control Plane managed caches. |
| Cache search or set requests fail with an index error | The RediSearch vector index for the cache was never provisioned, or Cache Redis does not support RediSearch with vector search | Run `provision-cache-index` against the cache's config, or verify Cache Redis modules. |
| Control Plane `CreateCache` returns `424` | Cache Redis for the resolved `databaseId` is unreachable or does not satisfy LangCache's Redis module requirements | Check `databases.<id>.urls` connectivity and Redis modules. |
| Control Plane `CreateCache` returns `400` for embedding fields | Request tried to select a different embedding provider/model/dimensions than the deployment's single configured contract, or supplied per-cache embedding credentials | On-prem cache creation uses the deployment-wide embedding contract; it does not accept per-cache overrides or credentials. |
| Agent receives `401` on a Control Plane managed cache | Missing, malformed, revoked, expired, or invalid agent key, or the Data Plane cannot reach the Identity Service | Check the `Authorization` header, key status through the Identity Service, and Data Plane connectivity to `auth.agent_keys.introspection.base_url`. |
| Agent receives `403` on a Control Plane managed cache | Key exists but lacks the required `lc-cache:<cache-id>` grant or action | Update grants through the Identity Service's `/v1/api-keys/{keyId}` endpoint. |
| Cache created by the Control Plane is not visible to the Data Plane | CP and DP point at different Metadata Redis URLs, or the Data Plane is still running the static-caches binary | Make CP `metadata.urls` match DP `metadata.urls`, and confirm the Data Plane is running the on-prem-hardened (`cmd/onprem`) binary. |
| Legacy static-cache token is rejected | Token was generated with a different passphrase or resource ID than the running config | Regenerate the token with `generate-auth-token` against the exact `dataplane.config.yaml` in use. |
| NetworkPolicy blocks expected traffic | Placeholder namespace, release name, or caller selectors were not customized correctly | Check the Helm release label `app.kubernetes.io/instance`, caller namespace, and caller pod labels. |
{{< /table-scrollable >}}

## References

| Need | Reference |
| --- | --- |
| Helm chart values | `langcache/helm/values.yaml` in the LangCache source repository |
| LangCache API reference (Data Plane) | [LangCache API]({{< relref "/develop/ai/context-engine/langcache/api-reference" >}}) |
| Control Plane API reference | [Control Plane API reference]({{< relref "/operate/iris/langcache/self-managed/control-plane-api-reference" >}}) |
| LangCache overview | [LangCache overview]({{< relref "/develop/ai/context-engine/langcache" >}}) |
| Container images and chart access | Contact your Redis representative or [contact sales](https://redis.io/contact/) |
