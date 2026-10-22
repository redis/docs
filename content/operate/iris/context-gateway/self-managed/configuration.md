---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Prepare Helm values, file references, credential storage, the database registry, and optional features for Context Gateway.
linkTitle: Configuration
weight: 30
hideListLinks: true
---

The chart reads non-secret settings from Helm values and every credential from a mounted file. Prepare `gateway-values.yaml` and the Secrets it references before you [deploy](/content/operate/iris/context-gateway/self-managed/deploy.md).

## Helm values

| Value | Purpose |
| --- | --- |
| `tenantId` | The deployment's tenant. Must equal the Identity Service's single tenant ID. |
| `publicBaseURL` | The Data Plane's public origin, used in every Gateway's `mcpEndpoint`. |
| `identityService.baseURL` | The Identity Service runtime API that checks agent keys. |
| `profile` | `prod` (default) or `dev` logging. |
| `security` | The security profile, including the FIPS-oriented profile. |
| `imagePullSecrets` | Credentials for a private registry. |

*Complete example `gateway-values.yaml`, copied from the chart's `examples/kubernetes-secret.yaml` at release.*

## File references

Each credential has its own reference. Point it at a Kubernetes Secret key with `existingSecret` and `secretKey`, or at a Secrets Store CSI Driver file with `secretProviderClass` and `fileName`.

| Helm reference | File contents | Used by |
| --- | --- | --- |
| `metadataDB` | YAML with `metadata_db.urls`. | Both planes |
| `credentialStorage.redis.connection` | YAML with `credential_storage.redis.urls`. | Both planes |
| `credentialStorage.redis.keyring` | Directory of base64-encoded 32-byte AES keys. | Both planes |
| `databaseConnections[]` | YAML with `databases.<id>.urls`. | Both planes |
| `controlplane.adminToken` | The admin token operators send to the Control Plane. | Control Plane |
| `controlplane.internalToken` | The token Identity Service sends to the grant callback. | Control Plane |
| `dataplane.runtimeToken` | The token the Data Plane sends to Identity Service. | Data Plane |
| `license` | The license file as issued. | Both planes |
| `tls.caBundle` | A PEM CA bundle. | Both planes |

The admin, internal, and runtime tokens must be distinct.

## Credential storage

| `credentialStorage.provider` | Configuration |
| --- | --- |
| `redis` (default) | A credential Redis connection and a keyring shared by both planes. |
| `vault` | Separate writer and reader tokens for the Control Plane and Data Plane. |
| `aws` | Separate IAM roles for each plane through workload identity. |

<!-- TODO: Reconcile the chart's `credential_storage` keys with the `secrets` keys in the service README before publishing. -->

## Database registry

Register every database a Gateway uses under the same identifier on both planes. Put display names in `shared.config.databases` and connection URLs in a `databaseConnections` file.

```yaml
shared:
  config:
    databases:
      customer: {name: Customer database}
databaseConnections:
  - existingSecret: gateway-database-connections
    secretKey: config.yaml
```

## Result cache and result handles

Both features are off by default. Turn them on in the Data Plane configuration, then have Gateway administrators select a Gateway database with `databaseId`.

*Values for `result_cache` and `result_handles`, from the chart's commented defaults.*

## Agent sign-in with an identity provider

See [Identity provider sign-in](/content/operate/iris/context-gateway/self-managed/authentication.md#identity-provider-sign-in).

## Trust a private CA

Set `tls.caBundle` to a PEM bundle, or mount a single certificate under `/etc/ssl/certs` with the chart's `examples/certificates.yaml`. Restart both planes after you rotate a certificate.

## Configure telemetry

Both planes serve Prometheus metrics at `/metrics`. Set `shared.config.opentelemetry.enable_tracing: true` and an OTLP endpoint for traces.
