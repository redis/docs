---
Title: Configure the Identity Service
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure the Identity Service metadata Redis, tenant, service registration, agent-key settings, and TLS.
linkTitle: Configuration
weight: 30
hideListLinks: true
---

You configure the Identity Service with the Helm values of its own release, in `values-ids.yaml`. No service chart reads these values or checks them against its own, so keep the Secret names, Service addresses, and tenant consistent across releases yourself.

The Identity Service reads its configuration only when it starts. A changed value rolls the pod at `helm upgrade`. A changed Secret that you own doesn't roll the pod unless you also change its checksum value. See [Rotate credentials](/content/operate/iris/identity-service/operations.md#rotate-credentials).

To see every value and its default, run:

```bash
helm show values redis-ai/iris-identity-service --version 1.2.0
```

## Metadata Redis

The metadata Redis holds the hashed agent keys, their grants, and subject grants. If you lose it, every agent loses access.

| Value | Default | Meaning |
| --- | --- | --- |
| `metadata.existingSecret` | `""` | Required. The Secret that holds the metadata Redis connection. |
| `metadata.secretKey` | `metadata.yaml` | The key in that Secret. |
| `metadata.existingSecretChecksum` | `""` | Optional. Change it to roll the pod after you edit the Secret. |

The Secret's key holds a configuration fragment:

```yaml
metadata:
  urls: ["rediss://<metadata-user>:<metadata-password>@<metadata-host>:<metadata-port>"]
```

- The Identity Service always uses database 0. It ignores a `/<db>` index in the URL.
- Don't change the host after the first install. The Identity Service then reads an empty database, and every key stops working. To move the data, follow [Move the metadata Redis](/content/operate/iris/identity-service/operations.md#move-the-metadata-redis).
- Turn on persistence (append-only file or RDB snapshots) and keep the data directory on durable storage. Without persistence, a Redis restart deletes every key.

## Control token

| Value | Default | Meaning |
| --- | --- | --- |
| `control.existingSecret` | `""` | Your own Secret with the control token. |
| `control.secretKey` | `token` | The key in that Secret. |
| `control.autoGenerate` | `true` | Generate `<release>-iris-identity-service-control-token` when `existingSecret` is empty. |
| `control.existingSecretChecksum` | `""` | Optional. Change it to roll the pod after you edit your Secret. |

The control token always works, also when operator sign-in is on. Give only a small group access to its Secret. For what it can do, see [Credentials](/content/operate/iris/identity-service/authentication.md#credentials).

For GitOps tools such as Argo CD or Flux, supply the control token with `control.existingSecret`. These tools render the chart without cluster access, so a generated token changes on every render.

## Tenant

| Value | Default | Meaning |
| --- | --- | --- |
| `runtime.apiKeyTenant.singleTenantID` | `""` | The one tenant of the installation, for example `default`. |

Set `singleTenantID` to the same value as the `tenantId` of every service release. The Identity Service adds this tenant to each grant that names no tenant, and rejects a grant that names another tenant with `400`.

A tenant ID is 1 to 256 characters, without `|` or control characters. Matching is exact and case-sensitive. For a numeric ID, quote it in YAML or set it with `--set-string`, so Helm keeps it as a string. You can't change the tenant after you mint keys: keys, grants, and service data keep the old ID.

<!-- TODO: an empty singleTenantID puts the Identity Service in multi-tenant mode, which only Agent Memory supports, as a preview. Decide whether to document it before GA. -->

## Register services

Each service needs two entries on the Identity Service release:

- A runtime credential in `runtime.serviceCredentials`, so the service's data plane can check agent keys.
- A grant validator in `productValidation.products.<product>`, so the Identity Service can check the service's resources before it stores a grant.

This table lists the entries for each service, with the release names and Secret names used in the associated deployment guide:

{{< table-scrollable >}}
| Service | `serviceCredentials` `name` and `subject` | `allowedProducts` | Validator key | Validator `baseURL` | Runtime credential Secret | Internal token Secret |
| --- | --- | --- | --- | --- | --- | --- |
| Agent Memory | `memory-dp` | `[memory]` | `memory` | `http://redis-agent-memory-controlplane:9100` | `memory-dp-credential` | `memory-internal-token` |
| Agent Playbooks | `playbook-dp` | `[playbook]` | `playbook` | `http://playbook-controlplane:9200` | `playbook-dp-credential` | `playbook-controlplane-internal` |
| Context Gateway | `context-gateway-dp`, subject `context-gateway-dataplane` | `[context-gateway]` | `context-gateway` | `http://gateway-redis-context-gateway-controlplane:9100` | `gateway-runtime` | `gateway-grant-validation` |
| Intent Router | `intent-dp` | `[intent]` | `intent` | `http://intent-redis-intent-router-controlplane:9400` | `intent-dp-credential` | `intent-controlplane-internal` |
| Lens | `lens-dataplane` | `[lens]` | `lens` | `http://lens-redis-lens-controlplane:9300` | `lens-dp-credential` | `lens-internal-token` |
{{< /table-scrollable >}}

The runtime credential Secret is the same Secret that the service's data plane mounts, and the internal token Secret is the same Secret that its control plane mounts. If you install a service under another release name or `fullnameOverride`, change the validator address to match. For the service-side values, see each service's deploy guide.

### Serve several services from one release

One release serves every service. Write all entries in one values file. Helm replaces lists instead of merging them, so each `helm upgrade` must restate every `serviceCredentials` entry, not only the new one.

This example serves Agent Memory and Intent Router:

```yaml
runtime:
  unscopedGrantsProduct: memory
  apiKeyTenant:
    singleTenantID: default
  serviceCredentials:
    - name: memory-dp
      subject: memory-dp
      allowedOperations: [api-key-introspect]
      allowedProducts: [memory]
      existingSecret: memory-dp-credential
      secretKey: token
    - name: intent-dp
      subject: intent-dp
      allowedOperations: [api-key-introspect]
      allowedProducts: [intent]
      existingSecret: intent-dp-credential
      secretKey: token
productValidation:
  products:
    memory:
      baseURL: http://redis-agent-memory-controlplane:9100
      credential:
        existingSecret: memory-internal-token
        secretKey: token
    intent:
      enabled: true
      baseURL: http://intent-redis-intent-router-controlplane:9400
      credential:
        existingSecret: intent-controlplane-internal
        secretKey: token
```

To add a service to a running release:

1. Install the service, or note its control-plane Service and Secret names.
1. Add the service's runtime credential and validator to `values-ids.yaml`, next to the existing entries.
1. Run `helm upgrade ids redis-ai/iris-identity-service --version 1.2.0 -n <namespace-name> -f values-ids.yaml`.
1. Check that `GET /v1/products` lists the new service.

Every service on one release uses the same tenant.

### Runtime credential fields

| Field | Meaning |
| --- | --- |
| `name` | Required. Unique, 1 to 44 lowercase letters, digits, and dashes, with no trailing dash. It also names the mount directory. |
| `subject` | Required. The identity the data plane authenticates as. |
| `allowedOperations` | Required. One or more of the operations in the next table. |
| `allowedProducts` | Required. The services whose keys this credential may check. |
| `existingSecret`, `secretKey` | The shared Secret and its key (default `token`). |
| `existingSecretChecksum` | Optional. Change it to roll the pod after you edit the Secret. |
| `autoGenerate`, `generatedSecretName` | For development only. The chart generates the token instead of reading your Secret. |

| Operation | Use |
| --- | --- |
| `api-key-introspect` | Check an agent key. Every data plane needs it. |
| `subject-grant-lookup` | Read subject grants. Context Gateway needs it when IdP sign-in for agents is on. See [Subject grants](/content/operate/iris/identity-service/authentication.md#subject-grants). |
| `auth-me` | Let the caller check its own credential. |
| `auth-introspect` | An earlier delegated token check. Don't use it for new installations. |

### Grant validator fields

| Field | Meaning |
| --- | --- |
| `enabled` | Default `true`. A disabled entry renders nothing. |
| `baseURL` | Required. An absolute `http://` or `https://` URL of the service's control plane, with no user information, query, or fragment. |
| `credential.existingSecret`, `credential.secretKey` | Required. The control plane's internal token Secret and its key (default `token`). |
| `credential.existingSecretChecksum` | Optional. Change it to roll the pod after you edit the Secret. |

The Identity Service calls the validator with a 5-second timeout and doesn't follow redirects. If the control plane doesn't answer, minting fails with `424`.

`runtime.unscopedGrantsProduct` names the service that owns grants stored before grants carried a service. Set it to `memory` when the release serves Agent Memory. When set, it must name an enabled validator.

## Agent keys and the key cache

| Value | Default | Meaning |
| --- | --- | --- |
| `apiKeys.maxRotateGraceSeconds` | `604800` (7 days) | The longest time an old key can stay valid after a rotation. |
| `apiKeys.userBinding.enabled` | `false` | Lets a mint bind a key to a user with `userId`. Agent Memory uses it for owner isolation. |
| `runtime.cache.softTtlSeconds` | `180` | When a data plane refreshes a cached key check. Must not exceed `hardTtlSeconds`. |
| `runtime.cache.hardTtlSeconds` | `300` | The longest time a data plane uses a cached key check. A revoked key can keep working for up to this time. |

## Operator sign-in and subject grants

| Value | Default | Meaning |
| --- | --- | --- |
| `controlAuth.oidc` | Not set | Operator sign-in to the control API with access tokens from your identity provider (IdP). |
| `controlAuth.roleBindings` | Not set | Maps IdP group or role claims to Identity Service roles. Requires `controlAuth.oidc.enabled`. |
| `controlAuth.workloadIdentity` | `{}` | Lets a Kubernetes workload call the control API with its service account token. |
| `subjectGrants.allowed` | `[]` | The grant shapes that subject grants may have. Empty allows none. |

See [Authentication and authorization](/content/operate/iris/identity-service/authentication.md) for how to set them.

## TLS, FIPS, and network

- **Private certificate authority (CA).** To reach a `rediss://` metadata Redis, an `https://` validator, or an IdP signed by a private CA, put the PEM bundle in a Secret and set `tls.caCertSecret`. The key defaults to `ca.crt` (`tls.caCertKey`). The Identity Service trusts the bundle in addition to the system CAs. The chart has no option to skip certificate verification.

  ```bash
  kubectl -n <namespace-name> create secret generic ids-ca --from-file=ca.crt=./ca.crt
  ```

- **Federal Information Processing Standards (FIPS).** Set `security.profile: fips`. The Identity Service then refuses to start unless the metadata Redis URL is `rediss://` and every validator `baseURL` is `https://`.
- **Network.** The chart deploys no NetworkPolicy and no Ingress. Let only the service planes, your operators, and your automation reach port `9200`. The health routes need no credential, so don't expose them outside the cluster.
- **Another namespace.** If the Identity Service runs in another namespace than a service, use fully qualified Service names, such as `http://redis-agent-memory-controlplane.<product-namespace>.svc:9100`, and create each shared Secret in both namespaces with the same value.

## Availability and resources

| Value | Default | Meaning |
| --- | --- | --- |
| `replicaCount` | `1` | Identity Service replicas. The service keeps its state in the metadata Redis. |
| `resources` | Requests `100m` CPU and `128Mi` memory; limits `500m` CPU and `512Mi` memory | Container resources. |
| `nodeSelector`, `affinity`, `tolerations` | Empty | Pod scheduling. |
| `image.repository`, `image.tag` | `redislabs/iris-identity-service`, the chart version | Set them to pull from a private registry. |
| `imagePullSecrets` | `[]` | Pull Secrets for a private registry. |

<!-- TODO: lands with iris#2368 (M6); confirm before GA. Chart 1.3.0 adds podDisruptionBudget.enabled (default false), which creates a PodDisruptionBudget with maxUnavailable: 1 when replicaCount is above 1. Add it to this table once it ships in the chart version the guides pin. -->

Readiness checks the metadata Redis, and liveness doesn't. When the metadata Redis is unreachable, the pod turns unready and stops receiving traffic, but Kubernetes doesn't restart it. Readiness doesn't check the service control planes, so one service's outage doesn't take the Identity Service out of service.

## Configuration overlays

- **`configData`** adds Identity Service settings that have no Helm value. The chart owns the credential, service, tenant, cache, and key settings, and refuses credential wiring in `configData`. Set operator policy either in `controlAuth` or in `configData.auth`, never both.
- **Policy overlays** are Secrets that hold more configuration, such as role bindings, named by `secrets.secretName` and `secrets.additionalSecrets`. Each Secret holds the overlay under the key `overlay.yaml` (`secrets.overlayKey`). The Identity Service loads them in order, after the metadata Secret. An overlay can't change the control token, the runtime credentials, or the validators. Change `secrets.checksum` to roll the pod after you edit an overlay Secret.

Role bindings in overlays merge by issuer, claim value, scope, and service. A later binding replaces a matching one, and a binding with `role: none` removes it.
