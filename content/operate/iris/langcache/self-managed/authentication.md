---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure LangCache self-managed Control Plane authentication and Data Plane auth modes.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
---

Self-managed LangCache uses separate authentication models for the Control
Plane and the Data Plane, and the Data Plane auth model differs between
static and Control Plane managed caches.

## Control Plane admin token

Control Plane management endpoints require:

```http
Authorization: Bearer <admin-token>
```

Production deployments should read the token from a mounted Secret file:

```yaml
profile: prod

auth:
  type: admin-token
  admin_token:
    token_file: /etc/controlplane-onprem/admin/token
```

The Control Plane reads the token file on each request, so rotating the
Secret does not require a Control Plane redeploy.

## Data Plane auth modes

Choose the Data Plane auth mode based on the deployment mode and how callers
reach the Data Plane.

| Mode | Deployment mode | Config | Use when |
| --- | --- | --- | --- |
| Auth-disabled | Static caches | `auth.enabled: false` (default) | The Data Plane is reachable only by trusted internal components. |
| Legacy per-cache token | Static caches | `auth.enabled: true`, `auth.passphrase: <passphrase>` | You need per-cache API-key-style tokens without deploying the Control Plane or Identity Service. |
| Agent-key authentication | Control Plane managed caches | `auth.agent_keys.enabled: true` | LangCache should validate agent keys and enforce per-cache grants through the shared Identity Service. |

### Auth-disabled Data Plane (static caches)

```yaml
auth:
  enabled: false
```

{{< warning >}}
Do not expose an auth-disabled Data Plane to untrusted callers. Any caller
that can reach the API can read or write cached entries for every configured
cache.
{{< /warning >}}

### Legacy per-cache token (static caches)

Static caches also support the same symmetric, per-cache token scheme used by
LangCache on Redis Cloud. Enable it and set a passphrase:

```yaml
auth:
  enabled: true
  passphrase: "<passphrase, at least the minimum configured length>"
```

Generate a token for a cache with the `generate-auth-token` binary shipped in
the Data Plane image:

```bash
generate-auth-token \
  --config=/etc/langcache/dataplane.config.yaml \
  --username=<username> \
  --password=<password> \
  --resourceID=<cache-id>
```

The command prints a token. Send it as:

```http
Authorization: Bearer <token>
```

Treat the token as an opaque credential. There is no Control Plane endpoint
to mint, list, or revoke these tokens; manage the passphrase and any
generated tokens as part of your Secret material.

### Agent-key authentication (Control Plane managed caches)

Agent-key auth requires Control Plane managed caches and is served by the
on-prem-hardened Data Plane binary. That binary rejects static caches and
every other auth method, so `auth.agent_keys.enabled` is effectively the only
supported setting when you deploy this mode.

Unlike Redis Agent Memory's simpler shared-secret Data Plane auth, LangCache
agent keys are issued and validated by the **Identity Service**, a suite
component shared with RAM (RAM's chart installs it as
`redis-agent-memory-identity-service`; the published image is
`redislabs/iris-identity-service`). The LangCache `langcache` Helm chart does
not template the Identity Service yet, so deploy it the same way you deploy
the [Control Plane]({{< relref "/operate/iris/langcache/self-managed/deploy-control-plane" >}}):
as a plain Kubernetes Deployment using the published image, pointed at the
same Metadata Redis.

Data Plane config for agent-key auth:

```yaml
auth:
  agent_keys:
    enabled: true
    product: langcache
    introspection:
      base_url: https://iris-identity-service:9200
      product: langcache
      credential:
        token_file: /etc/langcache/introspection/token
```

- `introspection.base_url` is the Identity Service's base URL. It must be
  `https://` unless you explicitly allow insecure transport for a lab
  environment.
- `introspection.product` must be `langcache`; a different value fails
  Data Plane startup.
- `introspection.credential` is the shared credential the Data Plane presents
  to the Identity Service when introspecting a key.

Clients send agent keys as Bearer credentials:

```http
Authorization: Bearer <agent-key>
```

Treat agent keys as opaque credentials. Do not parse their contents.

## Cache authorization and grants

For agent-key requests, LangCache checks both identity and resource
authorization through the Identity Service:

1. The key exists and its secret validates.
2. The key has a grant for the requested cache resource, keyed as
   `lc-cache:<cache-id>`.
3. The grant includes the permission required by the operation.

Grant actions:

| Action | Meaning |
| --- | --- |
| `read` | Read and search cache entries. |
| `write` | Mutate cache entries. `write` implies `read`. |
| `full` | Full cache administration through the grant. `full` implies `write`. |

Mint and manage agent keys directly against the Identity Service (not the
LangCache Control Plane):

```bash
curl -sS -X POST "$IDENTITY_SERVICE_URL/v1/api-keys" \
  -H "Authorization: Bearer $IDENTITY_SERVICE_CONTROL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent-key",
    "grants": [
      {
        "product": "langcache",
        "resourceType": "lc-cache",
        "resourceId": "<cache-id>",
        "actions": ["read", "write"]
      }
    ]
  }'
```

{{< note >}}
The Identity Service is a shared, cross-product component, and deploying it
is more than running one extra container: it needs its own control-plane
credential (for the `/v1/api-keys` calls shown above), a separate runtime
introspection credential for each Data Plane that calls it, and its LangCache
product entry wired so grants resolve against real caches. A full
self-managed deployment and administration guide for it is out of scope for
this LangCache-specific documentation; see your Redis representative or the
self-managed Redis Agent Memory Helm chart for a working reference
deployment of `iris-identity-service` until dedicated Identity Service docs
are published.
{{< /note >}}

## Gateway and identity provider integration

Use a gateway when it owns external authentication and coarse policy. For
example, a gateway can authenticate callers through an identity provider
before it forwards requests to LangCache.

Gateway rules:

- The gateway owns external authentication and perimeter policy.
- LangCache owns cache-level authorization through the Identity Service.
- LangCache agent keys or legacy tokens are stored and forwarded by trusted
  infrastructure or trusted applications.
- Callers must not be able to bypass the gateway and reach the Data Plane
  directly unless they also present a valid LangCache credential.
