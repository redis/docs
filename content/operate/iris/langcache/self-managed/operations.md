---
Title: Operations
alwaysopen: false
categories:
- docs
- operate
- iris
description: Operate self-managed LangCache with backups, secret rotation, updates, FIPS posture, and support bundles.
linkTitle: Operations
weight: 90
hideListLinks: true
---

## Backups

- Back up Cache Redis according to your cache-retention policy. LangCache
  can rebuild the RediSearch index from existing entries, but losing the
  underlying hashes loses cached responses.
- Back up Metadata Redis. Losing metadata removes Control Plane cache
  records — including the `databaseUrls` the Data Plane depends on to reach
  Cache Redis.
- Back up the Identity Service's own metadata Redis (bundled mode). Losing
  it removes agent-key and grant records.
- Back up any external secret manager material used to recreate the config
  overlay, license, and token Secrets.

## Secret rotation

The chart cannot see the contents of Secrets you bring yourself
(`existingSecret` values), so it can't roll pods automatically when you
update one. Every rotatable Secret has a matching `existingSecretChecksum`
value: update the Secret, then bump the checksum and run `helm upgrade` to
force a rollout.

Rotate the config overlay Secrets (Redis URLs, database registry, embedding
credential):

```bash
kubectl -n <namespace-name> create secret generic dp-overlay \
  --from-file=overlay.yaml=./dp-overlay.yaml \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n <namespace-name> create secret generic cp-overlay \
  --from-file=overlay.yaml=./cp-overlay.yaml \
  --dry-run=client -o yaml | kubectl apply -f -
```

```yaml
dataplane:
  secrets:
    secretName: dp-overlay
    existingSecretChecksum: "<new-dp-overlay-checksum>"
controlplane:
  secrets:
    secretName: cp-overlay
    existingSecretChecksum: "<new-cp-overlay-checksum>"
```

Rotate the license the same way, using `dataplane.license.existingSecretChecksum`.

{{< multitabs id="langcache-secret-checksum"
tab1="Linux"
tab2="macOS" >}}

```bash
sha256sum ./dp-overlay.yaml | awk '{print $1}'
```

-tab-sep-

```bash
shasum -a 256 ./dp-overlay.yaml | awk '{print $1}'
```

{{< /multitabs >}}

Apply the updated values and verify the workloads rolled:

```bash
helm upgrade langcache . \
  --namespace <namespace-name> \
  -f langcache-values.yaml

kubectl -n <namespace-name> rollout status deployment/langcache
kubectl -n <namespace-name> rollout status deployment/langcache-controlplane
```

Rotating an auto-generated token (admin token, internal token, Identity
Service control token, or the Data Plane's Identity Service runtime
credential) is different: those Secrets are Helm-managed, not
`existingSecret`, so there is no checksum to bump. Set `autoGenerate: false`
temporarily and supply a new `existingSecret`, or delete the underlying
Secret and let the next `helm upgrade` regenerate it — confirm which
behavior your chart version implements before relying on it in production.

Rotate agent keys minted for LangCache caches through the Identity Service;
see [API examples]({{< relref "/operate/iris/langcache/self-managed/api-examples#identity-service-api-examples" >}}).

## Updates

For every update:

1. Update chart version and image tags.
2. Recalculate `existingSecretChecksum` values for any changed overlay or
   license Secrets.
3. Run `helm upgrade`.
4. Verify pod rollout and health endpoints.

```bash
helm upgrade langcache . \
  --namespace <namespace-name> \
  -f langcache-values.yaml \
  --atomic --wait
```

On small clusters, avoid `--atomic` unless the timeout and capacity are
known to be sufficient.

## Helm tests

The chart can render `helm test` resources when `tests.enabled: true`. This
renders the shared security-profile check and the minimal RBAC it needs:

```bash
helm upgrade --install langcache . \
  --namespace <namespace-name> \
  -f langcache-values.yaml \
  --set tests.enabled=true

helm test langcache --logs
```

`tests.smoke.enabled: true` independently gates an additional smoke test
that proves authenticated set/search/delete of one uniquely generated cache
entry. It expects a `READY` cache and a valid agent key to already
exist — create the cache through the Control Plane and mint the key
through the Identity Service first, then store the key's plaintext token
in a Secret and reference it:

```yaml
tests:
  enabled: true
  smoke:
    enabled: true
    cacheID: <the cache ID you created>
    apiKey:
      existingSecret: langcache-smoke-key
```

## FIPS-oriented posture

`security.profile: fips` sets `GODEBUG=fips140=on` on every container this
release renders (Data Plane, Control Plane, and, in bundled mode, the
Identity Service):

```yaml
security:
  profile: fips
```

Under this posture, the chart:

- refuses to render with `identityService.mode: bundled` — the bundled
  Identity Service's in-cluster Service has no TLS termination of its own,
  so its address is always `http://`, which the profile forbids. Use
  `identityService.mode: external` with a TLS-fronted Identity Service
  instead.
- refuses `identityService.external.baseURL` unless it is `https://`.
  `identityService.external.allowInsecureTransport: true` is a real opt-out
  outside `fips`, but is not honored under `fips`.

This is not a formal FIPS 140 compliance or validation claim. Treat it as an
opt-in deployment posture and guardrail that must still be reviewed against
your compliance boundary.

## Support bundles and preflight

`supportPackage.enabled: true` (the default) ships a namespace-scoped
[Troubleshoot](https://troubleshoot.sh) spec as a ConfigMap. Collect a
bundle with:

```bash
kubectl support-bundle --namespace <namespace-name> --load-cluster-specs \
  -l troubleshoot.sh/kind=support-bundle
```

The bundle excludes Secret contents, license data, Redis URLs,
admin/internal/runtime credentials, API-key material, prompts, responses,
vectors, and cache records — see the redactor spec shipped in the same
namespace (`langcache-support-redactors`) for the exact rules.

`preflight.enabled: true` (the default) ships a cluster preflight check as
both a ConfigMap and a standalone file (`support/langcache-preflight.yaml`
in the chart source) for `kubectl preflight` before you install:

```bash
kubectl preflight support/langcache-preflight.yaml
```

## Network policy

For every Identity Service mode, prevent callers from bypassing your
intended access path (gateway, ingress, or trusted-internal-only) and
reaching the Data Plane, Control Plane, or bundled Identity Service Service
directly. Write a NetworkPolicy for your cluster's CNI that default-denies
ingress to the `langcache`, `langcache-controlplane`, and (bundled mode)
`langcache-identity-service` Services, then allow TCP traffic on their
respective ports (`9000`, `9100`, `9200`) from approved callers only.
