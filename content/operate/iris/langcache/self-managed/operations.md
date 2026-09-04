---
Title: Operations
alwaysopen: false
categories:
- docs
- operate
- iris
description: Operate self-managed LangCache with backups, secret rotation, updates, and FIPS posture.
linkTitle: Operations
weight: 90
hideListLinks: true
---

## Backups

- Back up Cache Redis according to the customer's cache-retention policy.
  LangCache can rebuild the RediSearch index from existing entries, but losing
  the underlying hashes loses cached responses.
- Back up Metadata Redis for Control Plane managed caches. Losing metadata
  removes Control Plane cache records.
- Back up any external secret manager material used to recreate Kubernetes
  Secrets, including the license, Data Plane config, Control Plane config,
  and admin-token Secrets.
- For Metadata Redis, use persistent storage and an eviction policy that does
  not evict cache records under memory pressure.

## Secret rotation

Rotate the Control Plane admin token by updating
`langcache-controlplane-admin-token`. The Control Plane reads the token on
use, so changing the token value does not require a Control Plane redeploy.

```bash
kubectl -n <namespace-name> create secret generic langcache-controlplane-admin-token \
  --from-literal=token='<new-admin-token>' \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

Rotate the LangCache license by updating the license Secret and changing
`config.existingSecretChecksum` (or the equivalent value for your chart
version) so Helm rolls the Data Plane pods.

```bash
kubectl -n <namespace-name> create secret generic langcache-license \
  --from-file=license=./license \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

Calculate the new SHA-256 checksum. This value is used by Helm values to roll
pods after the license Secret changes; it is not used to validate Secret
integrity.

{{< multitabs id="langcache-license-secret-checksum"
tab1="Linux"
tab2="macOS" >}}

```bash
LICENSE_CHECKSUM="$(sha256sum ./license | awk '{print $1}')"
```

-tab-sep-

```bash
LICENSE_CHECKSUM="$(shasum -a 256 ./license | awk '{print $1}')"
```

{{< /multitabs >}}

Apply the updated values and verify the workload rolled:

```bash
helm upgrade langcache ./langcache \
  --namespace <namespace-name> \
  -f langcache-values.yaml

kubectl -n <namespace-name> rollout status deploy/langcache
```

Rotate agent keys minted for Control Plane managed caches through the
Identity Service, as described in
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}}).

Rotate the legacy static-cache token by regenerating it with
`generate-auth-token` and redistributing it to callers; there is no server
side revocation for this token type, so also consider rotating
`auth.passphrase` if a token may have leaked.

## Updates

For every update:

1. Update chart version and image tags.
2. Recalculate Secret checksums for changed files.
3. Run `helm upgrade`.
4. Verify pod rollout and health endpoints.

```bash
helm upgrade langcache ./langcache \
  --namespace <namespace-name> \
  -f langcache-values.yaml
```

On small clusters, avoid `--atomic` unless the timeout and capacity are known
to be sufficient. If you deployed the Control Plane as a plain manifest,
update its image tag and re-apply the manifest, then verify its rollout the
same way.

## FIPS-oriented posture

The on-prem-hardened Control Plane and Data Plane binaries (used for Control
Plane managed caches) are built with a FIPS-capable Go toolchain (`GOFIPS140`),
but the shipped images run with that runtime FIPS mode turned **off** by
default (`GODEBUG=fips140=off`). The stricter posture checks only activate
when you turn Go's FIPS 140 runtime mode on for the container; they are not
automatic just because you're running the on-prem-hardened image.

When Go's FIPS mode is enabled, the on-prem-hardened binaries reject
configuration that:

- uses non-`rediss://` URLs for `metadata.urls`, `databases.<id>.urls`, or
  the Control Plane's `metadata.urls`; or
- otherwise fails the shared FIPS Redis-URL posture check used across the
  Redis AI Services products.

This is not a formal FIPS 140 compliance or validation claim. Treat it as an
opt-in deployment posture and guardrail that must still be reviewed against
the customer's compliance boundary, and confirm with your Redis
representative how to turn the runtime FIPS mode on for your deployment.

The static-caches Data Plane image (used by the published `langcache` chart
today) does not build with the FIPS-capable toolchain at all; it is the same
image used for LangCache on Redis Cloud.

The LangCache API listener itself speaks HTTP inside the cluster. Edge TLS
termination is owned by the hosting environment, such as ingress, service
mesh, or external load balancer. Outbound TLS to Redis and the embedding
provider is configured through LangCache config and is covered by the
posture checks for Control Plane managed caches.

## Network policy

For auth-disabled Data Plane deployments, restrict access to trusted callers.
For agent-key deployments behind a gateway, prevent direct bypass paths
unless the direct caller also has a valid LangCache credential.

There is no bundled NetworkPolicy reference manifest for LangCache yet
(unlike the self-managed Redis Agent Memory chart's
`networkpolicy.reference.yaml`). Write a NetworkPolicy for your cluster's CNI
that default-denies ingress to the LangCache Data Plane and Control Plane
pods, then allows TCP traffic on the Data Plane port (`8080` for static
caches, `9000` for Control Plane managed caches) and the Control Plane port
(`9100`) from approved callers only.
