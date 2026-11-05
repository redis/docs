---
Title: Configure the Identity Service
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure the Identity Service metadata Redis, control token, tenant, services, agent-key settings, overlays, and TLS with the redis-iris suite chart.
linkTitle: Configuration
weight: 30
hideListLinks: true
aliases:
- /operate/iris/identity-service/configuration/
---

Put the Identity Service values under `identityService:` in `iris-values.yaml`, and the values the services share under `global.iris`. The suite chart derives the rest.

The Identity Service reads its configuration only when it starts. A changed value rolls the pods at `helm upgrade`. A changed Secret that you own doesn't roll the pods. See [Rotate credentials](/content/operate/iris/identity-service/self-managed/operations.md#rotate-credentials).

## Metadata Redis

| Value | Default | Meaning |
| --- | --- | --- |
| `identityService.metadata.existingSecret` | None | Required. The Secret with the metadata Redis connection. |
| `identityService.metadata.secretKey` | `metadata.yaml` | The key in that Secret. |

The key holds a configuration fragment:

```yaml
metadata:
  urls: ["rediss://<metadata-user>:<metadata-password>@<metadata-host>:<metadata-port>"]
```

For persistence, backups, and access control, see [Metadata Redis](/content/operate/iris/identity-service/self-managed/prerequisites.md#metadata-redis). Don't only change the host after the first install: the Identity Service then reads an empty database, and every key stops working. To move the data, see [Move the metadata Redis](/content/operate/iris/identity-service/self-managed/operations.md#move-the-metadata-redis).

## Control token

| Value | Default | Meaning |
| --- | --- | --- |
| `identityService.control.existingSecret` | `iris-identity-service-control-token` | The Secret with the token. The chart generates it. To use your own token, create this Secret before the install, or name another Secret. |
| `identityService.control.secretKey` | `token` | The key in that Secret. |

The control token always works, even when operator sign-in is on. Give only a small group access to its Secret.

## Tenant

| Value | Default | Meaning |
| --- | --- | --- |
| `global.iris.tenantId` | `default` | The release's one tenant, in the Identity Service and in each service. |

Don't set a tenant in a service or under `identityService`. A service value that differs stops the install and names the field. For what a tenant is and how grants get one, see [Tenants](/content/operate/iris/identity-service/self-managed/authentication.md#tenants).

A tenant ID follows these rules:

- 1 to 64 characters, without `|` and without control characters.
- No space at the start or the end.
- Matching is exact and case-sensitive.
- For a numeric ID, such as `91324`, use `--set-string` in Helm, so Helm keeps it as a string.

## Services

The Identity Service needs two entries for each service:

- A runtime credential for the data plane, with the `api-key-introspect` operation.
- A grant validator for the control plane.

The chart creates both entries for each service enabled in `global.iris.products.<alias>.enabled`. You don't write them. The Identity Service calls these validators:

| Service | Grant validator |
| --- | --- |
| Agent Memory | `http://redis-agent-memory-controlplane.<namespace-name>.svc.<cluster-domain>:9100` |
| Agent Playbooks | `http://redis-agent-playbook-controlplane.<namespace-name>.svc.<cluster-domain>:9200` |
| Lens | `http://redis-lens-controlplane.<namespace-name>.svc.<cluster-domain>:9300` |
| Context Gateway | `http://redis-context-gateway-controlplane.<namespace-name>.svc.<cluster-domain>:9100` |
| Intent Router | `http://redis-intent-router-controlplane.<namespace-name>.svc.<cluster-domain>:9400` |

`<cluster-domain>` is `global.iris.clusterDomain`, `cluster.local` by default. Each call uses the control plane's internal token, with a 5-second timeout, and doesn't follow redirects.

## Operator sign-in

Set your IdP and the role bindings once, under `global.iris.auth`. The chart passes them to the console, the service control planes, and the Identity Service. See [Operator sign-in with your identity provider](/content/operate/iris/identity-service/self-managed/authentication.md#operator-sign-in-with-your-identity-provider).

| Value | Default | Meaning |
| --- | --- | --- |
| `global.iris.auth.oidc.issuer` | None | The issuer of the IdP discovery document. |
| `global.iris.auth.oidc.accessTokenIssuer` | `issuer` | The `iss` claim of the access tokens, when it differs from `issuer`, for example on Active Directory Federation Services (AD FS). |
| `global.iris.auth.oidc.jwksURI` | None | The JWKS URI. Must use `https://`. |
| `global.iris.auth.oidc.audience` | `api://redis-iris` | The audience in operator access tokens. |
| `global.iris.auth.oidc.roleClaims` | `[groups]` | The token claims that carry IdP groups. |
| `global.iris.auth.roleBindings` | `[]` | IdP group to Iris role. |

## Agent keys and the key cache

| Value | Default | Meaning |
| --- | --- | --- |
| `identityService.apiKeys.maxRotateGraceSeconds` | `604800` (7 days) | The longest time an old key stays valid after a rotation. |
| `identityService.apiKeys.userBinding.enabled` | `false` | Lets a key name the user that owns it, with `userId`. Agent Memory uses it for owner isolation. |
| `identityService.runtime.cache.softTtlSeconds` | `180` | When a data plane refreshes a cached key check. |
| `identityService.runtime.cache.hardTtlSeconds` | `300` | The longest time a data plane uses a cached key check. A revoked key can keep working for up to this time. |

## Configuration overlays

- **`identityService.configData`** adds Identity Service settings that have no Helm value. The chart refuses credential and service keys in `configData`. A key that has a Helm value, such as `runtime.cache`, gets the Helm value, so use the Helm value instead.
- **Policy overlays** are Secrets with more configuration, named by `identityService.secrets.secretName` and `identityService.secrets.additionalSecrets`. The Identity Service reads them in order. Change `identityService.secrets.checksum` to roll the pods after you edit one.

The Identity Service reads its configuration in this order, and a later layer wins over an earlier one:

1. The rendered configuration: `configData`, then the Helm values.
1. The metadata Secret.
1. The policy overlays, in order.
1. The credentials and validators that the chart wires in.

The chart applies the credentials and validators last, so an overlay can't change the control token, the runtime credentials, or the grant validators.

## TLS, FIPS, and network

- **Private certificate authority (CA).** Put your CA bundle in a Secret, under the key `ca.crt`, and set `global.tls.caCertSecret`. The Identity Service and the services then trust it for the IdP, the JWKS URI, the control planes, and the Redis databases. The chart has no option to skip certificate verification.
- **Federal Information Processing Standards (FIPS).** The suite chart doesn't support FIPS. An install with `global.security.profile: fips` fails.
- **Network.** The chart deploys no NetworkPolicy and no Ingress for the Identity Service. Let only the services, the console, and your operators reach port `9200`.

## Availability

| Value | Default | Meaning |
| --- | --- | --- |
| `identityService.replicaCount` | `2` | Identity Service replicas. The Identity Service keeps its state in the metadata Redis. |

The chart adds a PodDisruptionBudget. Readiness checks the metadata Redis, and liveness doesn't. When the metadata Redis is unreachable, the pods turn unready and stop receiving traffic, but Kubernetes doesn't restart them.
