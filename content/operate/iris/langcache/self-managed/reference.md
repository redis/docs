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
| `langcache-values.yaml` | Helm values for images, replicas, services, security posture, Identity Service mode, and non-secret config structure. |
| `dp-overlay.yaml` | Data Plane's Metadata Redis URLs and (if static) embedding credential, deep-merged over the rendered config at startup. |
| `cp-overlay.yaml` | Control Plane's Metadata Redis URLs and Cache Redis database registry, deep-merged over the rendered config at startup. |
| `ids-metadata.yaml` | Bundled Identity Service's own Metadata Redis URLs. |
| `langcache.key` | LangCache license file provided by Redis. |

### External secret managers

If you use an external secret manager, expose the license, overlay, and
token material to the chart as Kubernetes Secrets and set the chart's
`existingSecret` values to those Secret names.

## Troubleshooting

{{< table-scrollable >}}
| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Docker pull fails for the configured image tag | Image tag is wrong or not published yet | Use the image tag listed for the release on Docker Hub or provided by Redis. |
| Pod is stuck in `ImagePullBackOff` or `ErrImagePull` | Cluster cannot pull the configured image, image tag is wrong, registry requires credentials, or `imagePullSecrets` is missing/wrong | Verify `dataplane.image.*`/`controlplane.image.*`/`identityService.bundled.image.*`, registry reachability, and `imagePullSecrets`. |
| `helm install --atomic --wait` times out and rolls back | Cluster is small or image pull/startup takes longer than Helm's default timeout | Install without `--atomic --wait`, or set a longer `--timeout` and ensure enough cluster capacity. |
| Chart fails to render with `identityService.mode: bundled` and `security.profile: fips` | The FIPS posture forbids the bundled Identity Service's unencrypted in-cluster address | Use `identityService.mode: external` with a TLS-fronted Identity Service. |
| Data Plane health fails | Pod not ready, overlay Secret missing/invalid, or Redis unavailable | Check pod logs and call `/health`, `/health/liveness`, and `/health/readiness`. |
| Cache search or set requests fail with an index error | The RediSearch vector index for the cache was never provisioned, or Cache Redis does not support RediSearch with vector search | Check Control Plane cache status (`GET /v1/caches/{cacheId}`) and Cache Redis modules. |
| Control Plane `CreateCache` returns `424` | Cache Redis for the resolved `databaseId` is unreachable or does not satisfy LangCache's Redis module requirements | Check the `databases.<id>.urls` connectivity and Redis modules in `cp-overlay.yaml`. |
| Control Plane `CreateCache` returns `400` for embedding fields | Request tried to select a different embedding provider/model/dimensions than the deployment's single configured contract, or supplied per-cache embedding credentials | On-prem cache creation uses the deployment-wide embedding contract; it does not accept per-cache overrides or credentials. |
| Agent receives `401` | Missing, malformed, revoked, expired, or invalid agent key, or the Data Plane cannot reach the Identity Service | Check the `Authorization` header, key status through the Identity Service, and Data Plane connectivity to the Identity Service (bundled Service or `identityService.external.baseURL`). |
| Agent receives `403` | Key exists but lacks the required `lc-cache:<cache-id>` grant or action | Update grants through the Identity Service's `/v1/api-keys/{keyId}` endpoint. |
| Cache created by the Control Plane is not visible to the Data Plane | Data Plane and Control Plane overlays point at different Metadata Redis URLs | Make `dp-overlay.yaml` and `cp-overlay.yaml` use the same `metadata.urls`. |
| `helm upgrade` doesn't roll a pod after rotating an overlay Secret | The matching `existingSecretChecksum` value wasn't bumped | Recalculate the SHA-256 checksum of the overlay file and set the corresponding `*.existingSecretChecksum` value. |
| External Identity Service rejects LangCache's introspection calls | The suite-level Identity Service's `product_validation.langcache` isn't configured against this release's Control Plane internal Service and `internalToken` | Ask the Identity Service owner to configure that product entry; see [Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication#external-identity-service" >}}). |
| NetworkPolicy blocks expected traffic | Placeholder namespace, release name, or caller selectors were not customized correctly | Check the Helm release label `app.kubernetes.io/instance`, caller namespace, and caller pod labels. |
{{< /table-scrollable >}}

## References

| Need | Reference |
| --- | --- |
| Helm chart values and README | `langcache/helm/` in the LangCache source repository |
| LangCache API reference (Data Plane) | [LangCache API]({{< relref "/develop/ai/context-engine/langcache/api-reference" >}}) |
| Control Plane API reference | [Control Plane API reference]({{< relref "/operate/iris/langcache/self-managed/control-plane-api-reference" >}}) |
| LangCache overview | [LangCache overview]({{< relref "/develop/ai/context-engine/langcache" >}}) |
| Container images and chart access | Contact your Redis representative or [contact sales](https://redis.io/contact/) |
