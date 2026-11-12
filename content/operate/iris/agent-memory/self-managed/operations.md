---
Title: Operations
alwaysopen: false
categories:
- docs
- operate
- iris
description: Operate Redis Agent Memory in the redis-iris suite with backups, secret rotation, updates, and network policy.
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

Use the [Identity Service port-forward and control token](/content/operate/iris/agent-memory/self-managed/deploy.md#6-mint-an-agent-key)
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
(`identityService.apiKeys.maxRotateGraceSeconds`). The response adds
`oldExpiresAt`, the time the old key stops working. Revoking the old `keyId`
ends its grace period early. For the full request and response, see
[API examples](/content/operate/iris/agent-memory/self-managed/api-examples.md#identity-service-api-examples).

The suite generates Memory's credentials as these Secrets:

| Secret | Key | Used by |
| --- | --- | --- |
| `iris-memory-admin-token` | `token` | The Control Plane admin API |
| `iris-memory-dataplane-credential` | `memory-dp` | The Data Plane and the Identity Service |
| `iris-memory-internal-token` | `memory` | The Control Plane and the Identity Service, for grant validation |

To rotate one, change its Secret in place. Memory and the Identity Service read the mounted file on
each request, so the old value stops working once the kubelet syncs the volume, in about a minute,
with no restart. For example, rotate the admin token:

```bash
kubectl -n <namespace-name> create secret generic iris-memory-admin-token \
  --from-literal=token='<new-admin-token>' \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

`helm upgrade` and `helm rollback` never restore an old value. See
[Credentials](/content/operate/iris/self-managed/_index.md#credentials).

Rotate the license by updating the suite license Secret, named by `global.iris.license.existingSecret` (default `iris-license`) with the key in `global.iris.license.secretKey` (default `license.key`).
Redis Agent Memory reads and validates the license file during process startup, so restart its
Deployments afterward:

```bash
kubectl -n <namespace-name> create secret generic iris-license \
  --from-file=license.key=./license \
  --dry-run=client \
  -o yaml | kubectl apply -f -

kubectl -n <namespace-name> rollout restart \
  deployment/redis-agent-memory deployment/redis-agent-memory-worker deployment/redis-agent-memory-controlplane
```

If you change the overlay Secret (`memory.secrets.secretName`) in place, restart the same
Deployments, because the chart does not track the Secret contents.

## Updates

Agent Memory upgrades with the rest of the suite. Follow
[Upgrade](/content/operate/iris/self-managed/operations.md#upgrade), then verify the Memory
Deployments:

```bash
kubectl -n <namespace-name> rollout status deployment/redis-agent-memory
kubectl -n <namespace-name> rollout status deployment/redis-agent-memory-worker
kubectl -n <namespace-name> rollout status deployment/redis-agent-memory-controlplane
```

To move from a standalone `redis-agent-memory` release or a preview chart, see
[Move from a preview or standalone install](/content/operate/iris/self-managed/_index.md#move-from-a-preview-or-standalone-install).

## Release tests

`helm test iris` creates a temporary store, mints a scoped agent key, calls the Data Plane with it,
and then removes what it created. See [Verify the deployment](/content/operate/iris/agent-memory/self-managed/deploy.md#4-verify-the-deployment).

## FIPS

The suite chart `1.0.0` doesn't support the Federal Information Processing Standards (FIPS)
profile. `global.security.profile: fips` fails the install. See
[Not supported in this release](/content/operate/iris/self-managed/_index.md#not-supported-in-this-release).

## Network policy

For auth-disabled Data Plane deployments, restrict access to trusted callers.
For agent-key deployments behind a gateway, prevent direct bypass paths unless
the direct caller also has a valid Redis Agent Memory credential.

The Agent Memory chart inside the suite package includes `networkpolicy.reference.yaml` as a
reference manifest. It is not templated, because allowed callers are environment-specific. Get it
from the suite package, at `redis-iris/charts/redis-agent-memory/networkpolicy.reference.yaml`:

```bash
helm pull redis-ai/redis-iris --version 1.0.0 --untar
```

Customize the placeholders before applying it:

- `<namespace>`, `<identity-service-namespace>`, and `<playbook-namespace>`: the suite's release namespace.
- `<release-name>`, `<identity-service-release-name>`, and `<playbook-release-name>`: the suite's release name, `iris`.
- Pod selectors: the suite labels the Identity Service pods `app.kubernetes.io/name: identityService`
  and the Agent Playbooks pods `app.kubernetes.io/name: playbook`. Change the file's
  `iris-identity-service` and `redis-agent-playbook` selectors to match. Agent Memory keeps `redis-agent-memory`.
- `<caller-namespace>` and caller pod labels: ingress controller, service mesh
  gateway, application pod, or approved internal caller allowed to call Redis Agent Memory.

The reference policy default-denies ingress to Redis Agent Memory pods, then allows TCP
traffic to server pods on port `9000` from approved callers and the worker
Deployment. Its Control Plane stanza for port `9100` allows the Identity Service's grant
validation and the Agent Playbooks control plane. It doesn't manage ingress for the Identity
Service itself. Under default-deny, also allow Data Plane requests to `iris-identity-service` on
port `9200`, and add egress rules when egress is restricted.

Review the manifest against the customer's CNI,
ingress path, and service mesh behavior before production use.
