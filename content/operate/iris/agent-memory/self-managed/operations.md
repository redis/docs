---
Title: Operations
alwaysopen: false
categories:
- docs
- operate
- iris
description: Operate Redis Agent Memory with backups, secret rotation, updates, FIPS posture, and network policy.
linkTitle: Operations
weight: 90
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/operations/
---

## Backups

- Back up Metadata Redis. Losing it removes Control Plane store records.
- Back up the Identity Service Metadata Redis, which may be a separate
  database. Losing it removes agent-key records.
- Back up Store Redis according to the customer's memory-retention policy.
- Back up Job Redis if background job replay or delayed-job preservation is
  required by the deployment's recovery policy.
- Back up any external secret manager material used to recreate Kubernetes
  Secrets.
- For Job Redis, use persistent storage where supported and a non-volatile /
  `noeviction` policy. OOM can still lose jobs or leave worker state invalid;
  capacity alerts and compatibility checks should make that caveat visible.
- For Metadata Redis and the Identity Service Metadata Redis, use persistent
  storage and an eviction policy that does not evict store or agent-key records
  under memory pressure.

## Secret rotation

Use the [Identity Service port-forward and control token](/content/operate/iris/agent-memory/self-managed/deploy.md#7-mint-an-agent-key)
from the deployment procedure to rotate agent keys:

```bash
IDS_URL=http://localhost:9200
curl -sS -X POST "$IDS_URL/v1/api-keys/<key-id>/rotate?graceSeconds=3600" \
  -H "Authorization: Bearer $IDS_CONTROL_TOKEN"
```

The response contains the new token. Store it immediately; tokens are returned
only when a key is minted or rotated.

Rotation returns a new `keyId` with the new token. Use the new `keyId` for later
updates, rotations, and revocations. The old key stays valid for `graceSeconds`,
which defaults to 3600 and has a chart maximum of 604800
(`apiKeys.maxRotateGraceSeconds` on the Identity Service release). The response adds
`oldExpiresAt`, the time the old key stops working. Revoking the old `keyId`
ends its grace period early. For the full request and response, see
[API examples](/content/operate/iris/agent-memory/self-managed/api-examples.md#identity-service-api-examples).

Rotate the Control Plane admin token by updating `redis-agent-memory-controlplane-admin-token`.
The Control Plane reads the token on use, so changing the token value does not
require a Control Plane redeploy.

```bash
kubectl -n <namespace-name> create secret generic redis-agent-memory-controlplane-admin-token \
  --from-literal=token='<new-admin-token>' \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

The runtime credential and Control Plane internal token are shared by both releases.
When rotating either, keep the values equal in every namespace that mounts them, update the
corresponding checksums, and roll the affected workloads on both releases:

| Credential | Memory checksum value | Identity Service checksum value |
| --- | --- | --- |
| `memory-dp-credential` | `identityService.credential.existingSecretChecksum` | `existingSecretChecksum` on the matching `runtime.serviceCredentials[]` entry |
| `memory-internal-token` | `controlplane.internalToken.existingSecretChecksum` | `productValidation.products.memory.credential.existingSecretChecksum` |

For example, rotate `memory-dp-credential` in the walkthrough's namespace:

```bash
umask 077
openssl rand -hex 32 | tr -d '\n' > memory-dp-token
kubectl -n <namespace-name> create secret generic memory-dp-credential \
  --from-file=token=./memory-dp-token --save-config --dry-run=client -o yaml | kubectl apply -f -
RUNTIME_CREDENTIAL_CHECKSUM="$(shasum -a 256 ./memory-dp-token | awk '{print $1}')"

helm upgrade ids redis-ai/iris-identity-service \
  --version 0.10.2 \
  --namespace <namespace-name> \
  -f values-ids.yaml \
  --set-string "runtime.serviceCredentials[0].existingSecretChecksum=$RUNTIME_CREDENTIAL_CHECKSUM"
helm upgrade redis-agent-memory redis-ai/redis-agent-memory \
  --version 0.10.2 \
  --namespace <namespace-name> \
  -f ram-values.yaml \
  --set-string "identityService.credential.existingSecretChecksum=$RUNTIME_CREDENTIAL_CHECKSUM"
```

In the walkthrough, `memory-dp` is entry `0` in `runtime.serviceCredentials`. With another list,
update the matching entry. Persist the checksum in both values files for later upgrades, and
verify the affected Deployments are Ready. For the internal token, use the corresponding paths
in the table. For multiple namespaces, provision the new token value in each namespace.

Coordinate rotation: mismatched runtime credentials reject authentication, and mismatched
internal tokens prevent grant validation. Identity Service's operator control token is separate;
its checksum is `control.existingSecretChecksum` on that release.

Rotate the Redis Agent Memory license by updating the license Secret and changing
`license.existingSecretChecksum` so Helm rolls the Data Plane, worker, and
Control Plane pods.
Redis Agent Memory reads and validates the license file during process startup; updating only
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

Apply the updated values and verify the workloads rolled:

```bash
helm upgrade redis-agent-memory redis-ai/redis-agent-memory \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f ram-values.yaml

kubectl -n <namespace-name> rollout status deploy/redis-agent-memory
kubectl -n <namespace-name> rollout status deploy/redis-agent-memory-worker
kubectl -n <namespace-name> rollout status deploy/redis-agent-memory-controlplane
```

For immutable license Secrets, create a new Secret name instead, then update
both `license.existingSecret` and `license.existingSecretChecksum`.

Config that the chart renders from your values rolls the pods on its own when
you run `helm upgrade`. If you bring your own config Secrets, rotate the shared
Data Plane config by updating the config Secret and changing
`config.existingSecretChecksum`, and rotate the Control Plane config by updating
the config Secret and changing `controlplane.config.existingSecretChecksum`.

If you change an overlay Secret (`secrets.*`) in place, restart the
deployments, because the chart does not track the Secret contents:

```bash
kubectl -n <namespace-name> rollout restart deployment
```

## Updates

Memory and Identity Service have independent release versions. Upgrade each with its own
values file and verify their shared connection contract afterward. A Memory upgrade does not
upgrade Identity Service. The published pair documented here is Memory `0.10.2` and Identity
Service `0.10.2`.

For updates within a supported release path:

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

### Upgrade from a bundled Identity Service

Direct `helm upgrade` from an earlier chart with bundled Identity Service, including Memory
`0.7.0`, to `0.8.0` is unsupported. Use a fresh installation. The following manual migration
outline is untested guidance, not a supported upgrade procedure:

1. Back up store and agent-key metadata. Preserve the existing runtime credential, Control Plane
   internal token, metadata Redis addresses, and key namespaces.
2. Provision the shared Secrets with those existing values and configure a standalone Identity
   Service to use the same agent-key metadata. Do not let two independent releases manage one Secret.
3. Retain the tenant used by existing stores and keys. Earlier admin-token stores used tenant `1`;
   set `tenantId` and `runtime.apiKeyTenant.singleTenantID` accordingly, or migrate metadata first.
4. Plan the replacement of the old Memory release and removal of bundled resources with Redis.
   Keep backups and retained Secrets until the new installation and existing keys are verified.

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

Both releases support an opt-in Federal Information Processing Standards (FIPS) posture.
Set `security.profile: fips` or its fallback `global.security.profile: fips` on each release.
A value passed only to Memory does not configure Identity Service.

In `ram-values.yaml`:

```yaml
security:
  profile: fips
dataplane:
  identityServiceBaseURL: https://<identity-service-tls-endpoint>
tls:
  caCertSecret: ram-ca
```

In `values-ids.yaml`:

```yaml
security:
  profile: fips
productValidation:
  products:
    memory:
      baseURL: https://<control-plane-tls-endpoint>
      credential:
        existingSecret: memory-internal-token
tls:
  caCertSecret: ram-ca
```

The Memory chart refuses `identityService.allowInsecureTransport: true` under FIPS.
Identity Service refuses to start with a non-HTTPS product validator URL under FIPS.
Neither chart terminates Transport Layer Security (TLS). Your hosting environment supplies
both endpoints through a service mesh, ingress, or TLS proxy. Memory trusts its runtime
endpoint through its own `tls.caCertSecret`; Identity Service trusts the validator endpoint
through that release's `tls.caCertSecret`, each in addition to system certificate authorities.

Memory also ships a `values-fips.yaml` overlay. Apply it only to Memory, and configure the
Identity Service release's posture separately:

```bash
helm pull redis-ai/redis-agent-memory --version 0.10.2 --untar
helm upgrade redis-agent-memory redis-ai/redis-agent-memory \
  --version 0.10.2 \
  --namespace <namespace-name> \
  -f ram-values.yaml \
  -f redis-agent-memory/values-fips.yaml

helm upgrade ids redis-ai/iris-identity-service \
  --version 0.10.2 \
  --namespace <namespace-name> \
  -f values-ids.yaml
```

Both charts set `GODEBUG=fips140=on` on their application containers and enable
FIPS-oriented runtime checks.

This is not a formal FIPS 140 compliance or validation claim. Treat it as a
deployment posture and guardrail that must still be reviewed against the
customer's compliance boundary.

When the posture is active, the Data Plane and worker reject config that:

- enables `skip_verify` on outbound HTTP clients;
- sets `allow_insecure_transport` on any authentication block, even a disabled one; or
- uses non-`rediss://` URLs for Redis connections covered by the posture.

The Control Plane runs under the same posture and rejects non-`rediss://`
`metadata.urls` or `databases."1".urls`.

The Identity Service sends the Control Plane internal token on every grant validation. Under
the posture it refuses to start unless each product validator URL uses `https://`.
Configure that URL on the Identity Service release, not under Memory's `identityService`.

The Redis Agent Memory API listener itself speaks HTTP inside the cluster. Edge TLS termination
is owned by the hosting environment, such as ingress, service mesh, or external
load balancer. Outbound TLS to Redis, embedding providers, LLM providers, and
worker callback endpoints is configured through Redis Agent Memory config and is covered by the
posture checks.

Verify the runtime posture with:

```bash
kubectl -n <namespace-name> get deploy redis-agent-memory \
  -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="GODEBUG")].value}'

kubectl -n <namespace-name> logs deploy/redis-agent-memory | grep -i 'FIPS security profile'
```

Use the chart-generated Deployment to enable the FIPS-oriented posture. Do not
override the container command to configure it.

## Network policy

For auth-disabled Data Plane deployments, restrict access to trusted callers.
For agent-key deployments behind a gateway, prevent direct bypass paths unless
the direct caller also has a valid Redis Agent Memory credential.

The chart includes `networkpolicy.reference.yaml` at the chart root as a
reference manifest. Get it with
`helm pull redis-ai/redis-agent-memory --version 0.10.2 --untar`. It is not templated because allowed callers are
environment-specific.

Customize the placeholders before applying it:

- `<namespace>`: namespace where Redis Agent Memory is installed.
- `<release-name>`: Helm release name. This guide uses `redis-agent-memory`.
  `fullnameOverride` fixes Memory's default resource names to `redis-agent-memory`.
  Naming overrides change rendered resource names, but the
  `app.kubernetes.io/instance` selector remains the Helm release name.
- `<caller-namespace>` and caller pod labels: ingress controller, service mesh
  gateway, application pod, or approved internal caller allowed to call Redis Agent Memory.

The reference policy default-denies ingress to Redis Agent Memory chart pods, then allows TCP
traffic to server pods on port `9000` from approved callers and the worker
Deployment. It also includes a Control Plane stanza for port `9100`, which
always applies.

The reference includes Control Plane ingress from the separate Identity Service release.
Set `<identity-service-namespace>` and `<identity-service-release-name>` to its namespace and
release name (`ids` in the walkthrough). It does not manage ingress for Identity Service itself.
Under default-deny, allow Data Plane requests to that release on port `9200`, and Identity
Service requests to the Control Plane on port `9100`. If TLS proxies sit between them, allow
the proxy ports and actual source pods too. Add corresponding egress rules when egress is restricted.

Review the manifest against the customer's CNI,
ingress path, and service mesh behavior before production use.
