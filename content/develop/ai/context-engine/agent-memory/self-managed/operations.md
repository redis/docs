---
Title: Operations
alwaysopen: false
categories:
- docs
- develop
- ai
description: Operate Redis Agent Memory with backups, secret rotation, updates, FIPS posture, and network policy.
linkTitle: Operations
weight: 90
hideListLinks: true
---

## Backups

- Back up metadata Redis. Losing metadata removes Control Plane store records
  and agent-key records.
- Back up Store Redis according to the customer's memory-retention policy.
- Back up Job Redis if background job replay or delayed-job preservation is
  required by the deployment's recovery policy.
- Back up any external secret manager material used to recreate Kubernetes
  Secrets.
- For Job Redis, use persistent storage where supported and a non-volatile /
  `noeviction` policy. OOM can still lose jobs or leave worker state invalid;
  capacity alerts and compatibility checks should make that caveat visible.
- For Metadata Redis, use persistent storage and an eviction policy that does
  not evict store or agent-key records under memory pressure.

## Secret rotation

Rotate Agent Memory agent keys through the Control Plane API:

```bash
curl -sS -X POST "$CP_URL/v1/api-keys/<key-id>/rotate" \
  -H "Authorization: Bearer $RAM_ADMIN_TOKEN"
```

The response contains the new credential. Store it immediately; credentials are
returned only when a key is minted or rotated.

Rotate the Control Plane admin token by updating `ram-controlplane-admin-token`.
The Control Plane reads the token on use, so changing the token value does not
require a Control Plane redeploy.

```bash
kubectl -n <namespace-name> create secret generic ram-controlplane-admin-token \
  --from-literal=token='<new-admin-token>' \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

Rotate the Agent Memory license by updating the license Secret and changing
`license.existingSecretChecksum` so Helm rolls the Data Plane and worker pods.
Agent Memory reads and validates the license file during process startup; updating only
the Secret data is not sufficient.

```bash
kubectl -n <namespace-name> create secret generic ram-license \
  --from-file=license=./license \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

Calculate the new SHA-256 checksum. This value is used by Helm values to roll
pods after the license Secret changes; it is not used to validate Secret
integrity.

{{< multitabs id="agent-memory-license-secret-checksum"
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

```yaml
license:
  existingSecret: ram-license
  existingSecretChecksum: "<new-license-checksum>"
```

Apply the updated values and verify both workloads rolled:

```bash
helm upgrade redis-agent-memory redis-ai/redis-agent-memory \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f ram-values.yaml

kubectl -n <namespace-name> rollout status deploy/redis-agent-memory
kubectl -n <namespace-name> rollout status deploy/redis-agent-memory-worker
```

For immutable license Secrets, create a new Secret name instead, then update
both `license.existingSecret` and `license.existingSecretChecksum`.

Rotate the shared Data Plane config by updating the config Secret and changing
`config.existingSecretChecksum`. Rotate the Control Plane config by updating the
config Secret and changing `controlplane.config.existingSecretChecksum`.

## Updates

For every update:

1. Update chart version and image tags.
2. Recalculate Secret checksums for changed files.
3. Run `helm upgrade`.
4. Verify pod rollout and health endpoints.

Example:

```bash
helm upgrade redis-agent-memory redis-ai/redis-agent-memory \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f ram-values.yaml
```

On small clusters, avoid `--atomic` unless the timeout and capacity are known to
be sufficient.

## Chart tests

The chart can render optional `helm test` resources when `tests.enabled=true`.

Enable and run the basic chart test:

```bash
helm upgrade --install redis-agent-memory redis-ai/redis-agent-memory \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f ram-values.yaml \
  --set tests.enabled=true

helm test redis-agent-memory --namespace <namespace-name>
```

To run the API smoke test, also provide a configured store ID:

```bash
helm upgrade --install redis-agent-memory redis-ai/redis-agent-memory \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f ram-values.yaml \
  --set tests.enabled=true \
  --set tests.smoke.enabled=true \
  --set tests.smoke.storeId=<store-id>

helm test redis-agent-memory --namespace <namespace-name> --logs
```

Use the smoke test only for auth-disabled Data Plane deployments or for
environments where the in-cluster test path is allowed.

## FIPS-oriented posture

The chart supports an opt-in FIPS-oriented posture for regulated environments:

```yaml
security:
  profile: fips
```

You can also apply the bundled FIPS values overlay with the normal values file:

```bash
helm upgrade --install redis-agent-memory redis-ai/redis-agent-memory \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f ram-values.yaml \
  -f deployment/redis-agent-memory/values-fips.yaml
```

When enabled, the chart sets `MEM_SECURITY_PROFILE=fips` on the Data Plane,
worker, and Control Plane pods and enables FIPS-oriented runtime checks.

This is not a formal FIPS 140 compliance or validation claim. Treat it as a
deployment posture and guardrail that must still be reviewed against the
customer's compliance boundary.

When the posture is active, the Data Plane and worker reject config that:

- enables `skip_verify` on outbound HTTP clients; or
- uses non-`rediss://` URLs for Redis connections covered by the posture.

The Control Plane runs under the same posture and rejects non-`rediss://`
`metadata.urls` or `store_db.urls`.

The Agent Memory API listener itself speaks HTTP inside the cluster. Edge TLS termination
is owned by the hosting environment, such as ingress, service mesh, or external
load balancer. Outbound TLS to Redis, embedding providers, LLM providers, and
worker callback endpoints is configured through Agent Memory config and is covered by the
posture checks.

Verify the runtime posture with:

```bash
kubectl -n <namespace-name> get deploy redis-agent-memory \
  -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="MEM_SECURITY_PROFILE")].value}'

kubectl -n <namespace-name> logs deploy/redis-agent-memory | grep -i 'FIPS security profile'
```

Use the chart-generated Deployment to enable the FIPS-oriented posture. Do not
override the container command to configure it.

## Network policy

For auth-disabled Data Plane deployments, restrict access to trusted callers.
For agent-key deployments behind a gateway, prevent direct bypass paths unless
the direct caller also has a valid Agent Memory credential.

The chart includes `deployment/redis-agent-memory/networkpolicy.reference.yaml`
as a reference manifest. It is not templated because allowed callers are
environment-specific.

Customize the placeholders before applying it:

- `<namespace>`: namespace where Agent Memory is installed.
- `redis-agent-memory`: Helm release name used in this guide. If you use a
  different release name, update release-derived service and deployment names.
  `nameOverride` and `fullnameOverride` change rendered resource names, but the
  `app.kubernetes.io/instance` selector remains the Helm release name.
- `<caller-namespace>` and caller pod labels: ingress controller, service mesh
  gateway, application pod, or approved internal caller allowed to call Agent Memory.

The reference policy default-denies ingress to Agent Memory chart pods, then allows TCP
traffic to server pods on port `9000` from approved callers and the worker
Deployment. It also includes a Control Plane stanza for port `9100` when
`controlplane.enabled=true`. Review the manifest against the customer's CNI,
ingress path, and service mesh behavior before production use.
