---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure LangCache self-managed Control Plane authentication and Data Plane agent-key authentication through the Identity Service.
linkTitle: Authentication and authorization
weight: 40
hideListLinks: true
---

Self-managed LangCache uses three separate credentials:

- an **admin token** for the Control Plane's cache-management API;
- an **internal token** the Identity Service uses to validate that a
  cache-grant reference is real, by calling back into the Control Plane;
- **agent keys**, issued by the Identity Service, that applications use to
  call the Data Plane.

The Data Plane always authenticates by introspecting agent keys against an
Identity Service. There is no auth-disabled or static-token mode for
self-managed LangCache.

## Control Plane admin token

Control Plane management endpoints require:

```http
Authorization: Bearer <admin-token>
```

By default, `controlplane.adminToken.autoGenerate: true` mints this token
into a chart-managed Secret on first install (stable across upgrades).
Retrieve it:

```bash
kubectl -n <namespace-name> get secret langcache-controlplane-admin-token \
  -o jsonpath="{.data.token}" | base64 -d
```

To bring your own token instead:

```bash
kubectl -n <namespace-name> create secret generic langcache-controlplane-admin-token \
  --from-literal=token='<admin-token>'
```

```yaml
controlplane:
  adminToken:
    existingSecret: langcache-controlplane-admin-token
    autoGenerate: false
```

## Control Plane internal token

The internal token authenticates calls to the Control Plane's internal
grant-validation endpoint (`/internal/v1/grants/validate`). The Identity
Service calls this endpoint to confirm that a grant naming a LangCache cache
resource is valid before it lets an agent key carry that grant.

Like the admin token, it defaults to `controlplane.internalToken.autoGenerate: true`
and is retrievable the same way:

```bash
kubectl -n <namespace-name> get secret langcache-controlplane-internal-token \
  -o jsonpath="{.data.token}" | base64 -d
```

In bundled Identity Service mode, the chart wires this token to the
Identity Service's `product_validation.langcache.credential` automatically.
In external mode, you must give this token to the Identity Service's owner
(see [External Identity Service](#external-identity-service)).

The admin token and internal token must always be different values; the
Control Plane rejects config where they match.

## Identity Service modes

Choose exactly one mode at install time — there is no default that applies
without choosing.

### Bundled

`identityService.mode: bundled` (the default) renders the Identity Service
Deployment and Service, auto-generates its control token and the Data
Plane's own runtime introspection credential, and wires everything together
automatically:

```yaml
identityService:
  mode: bundled
  bundled:
    image:
      repository: redislabs/iris-identity-service
      tag: "<langcache-version>"
    metadata:
      existingSecret: ids-metadata
```

Retrieve the auto-generated Identity Service Control admin token (used for
`/v1/api-keys` calls, not the Data Plane's own runtime credential):

```bash
kubectl -n <namespace-name> get secret langcache-identity-service-control-token \
  -o jsonpath="{.data.token}" | base64 -d
```

### External Identity Service

`identityService.mode: external` renders no Identity Service workload at
all — use this when your suite already runs one, for example alongside
self-managed Redis Agent Memory:

```yaml
identityService:
  mode: external
  external:
    baseURL: https://suite-identity-service.example.com
    credential:
      existingSecret: langcache-dp-ids-credential
      secretKey: token
```

`langcache-dp-ids-credential` is minted out of band by the suite-level
Identity Service owner, scoped to `api-key-introspect` on product
`langcache`. You must also ask that owner to configure the external
Identity Service's own `product_validation.langcache` against this
release's Control Plane internal Service
(`langcache-controlplane:9100`) and this release's `controlplane.internalToken`
Secret — this chart has no way to reach into an Identity Service it doesn't
own.

## Minting and managing agent keys

Mint, list, update, revoke, and rotate agent keys directly against the
Identity Service (not the LangCache Control Plane):

```bash
IDS_URL="http://localhost:9200"
IDS_CONTROL_TOKEN="<identity-service-control-token>"

curl -sS -X POST "$IDS_URL/v1/api-keys" \
  -H "Authorization: Bearer $IDS_CONTROL_TOKEN" \
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

The response contains the new credential. Store it immediately; credentials
are returned only when a key is minted or rotated.

Grant actions:

| Action | Meaning |
| --- | --- |
| `read` | Read and search cache entries. |
| `write` | Mutate cache entries. `write` implies `read`. |
| `full` | Full cache access through the grant. `full` implies `write`. This is a resource permission, not a substitute for the Control Plane admin token; it doesn't grant access to Control Plane administration APIs. |

Clients send agent keys as Bearer credentials to the Data Plane:

```http
Authorization: Bearer <agent-key>
```

Treat agent keys as opaque credentials. Do not parse their contents.

## Cache authorization

For agent-key requests, the Data Plane checks both identity and resource
authorization through the Identity Service:

1. The key exists and its secret validates.
2. The key has a grant for the requested cache resource, keyed as
   `lc-cache:<cache-id>`.
3. The grant includes the permission required by the operation.

## Gateway and identity provider integration

Use a gateway when it owns external authentication and coarse policy. For
example, a gateway can authenticate callers through an identity provider
before it forwards requests to LangCache.

Gateway rules:

- The gateway owns external authentication and perimeter policy.
- LangCache owns cache-level authorization through the Identity Service.
- LangCache agent keys are stored and forwarded by trusted infrastructure or
  trusted applications.
- Callers must not be able to bypass the gateway and reach the Data Plane
  directly unless they also present a valid LangCache agent key.
