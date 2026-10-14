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

The Data Plane always authenticates by introspecting agent keys against an
Identity Service. There is no auth-disabled or static-token mode for
self-managed LangCache.

## Credentials

| Credential | Who presents it to whom | Secret / key | Auto-generated? | What it unlocks |
| --- | --- | --- | --- | --- |
| Control Plane admin token | Operator → Control Plane (`:9100`) | `langcache-controlplane-admin-token` / `token` | Yes (`controlplane.adminToken.autoGenerate`) | Cache management: `/v1/caches` |
| Control Plane internal token | Identity Service → Control Plane | `langcache-controlplane-internal-token` / `token` | Yes (`controlplane.internalToken.autoGenerate`) | Checking that the cache in a grant exists. Chart-managed; you handle it only with bring-your-own (BYO) configuration or an external Identity Service |
| Identity Service control token | Operator → Identity Service (`:9200`) | `langcache-identity-service-control-token` / `token` | Yes (`identityService.bundled.controlToken.autoGenerate`) | Creating, listing, updating, rotating and revoking agent keys |
| Data Plane service credential | Data Plane → Identity Service | `langcache-identity-service-dp-credential` / `token` | Yes (`identityService.bundled.runtime.dataplaneCredential.autoGenerate`) | Checking agent keys for `langcache`. Chart-managed; you handle it only with bring-your-own (BYO) configuration or an external Identity Service |
| Agent key | Application → Data Plane (`:9000`) | None; returned once when minted or rotated | No | The cache operations its grants allow |

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

The admin token and internal token must be different. The chart refuses the
same Secret and key, but doesn't detect identical values in different Secrets.

## Identity Service modes

You must choose either Bundled Identity Service or External Identity Service at install time.

### Bundled Identity Service

`identityService.mode: bundled` renders the Identity Service
Deployment and Service, auto-generates its control token and the Data
Plane's own runtime introspection credential, and wires everything together
automatically:

```yaml
identityService:
  mode: bundled
  bundled:
    metadata:
      existingSecret: ids-metadata
```

Retrieve the auto-generated Identity Service Control admin token (used for
`/v1/api-keys` calls, not the Data Plane's own runtime credential):

```bash
kubectl -n <namespace-name> get secret langcache-identity-service-control-token \
  -o jsonpath="{.data.token}" | base64 -d
```

The chart also auto-generates a separate credential the Data Plane itself
uses to call the Identity Service's introspection endpoint (scoped to
`api-key-introspect` on product `langcache` only):

```bash
kubectl -n <namespace-name> get secret langcache-identity-service-dp-credential \
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

The `langcache-dp-ids-credential` is minted out of band by the suite-level
Identity Service owner, scoped to `api-key-introspect` on product
`langcache`. You must also ask that owner to configure the external
Identity Service's own `product_validation.langcache` against this
release's Control Plane internal Service
(`http://langcache-controlplane.<namespace-name>.svc.cluster.local:9100`) and
this release's `controlplane.internalToken` Secret. The owner needs a copy of
`langcache-controlplane-internal-token` in the Identity Service's namespace;
this chart has no way to reach into an Identity Service it doesn't own.

## Minting and managing agent keys

Mint, list, update, revoke, and rotate agent keys directly against the
Identity Service (not the LangCache Control Plane). In bundled mode, first
port-forward the Identity Service and read its control token, as in
[Verify the deployment](/content/operate/iris/langcache/self-managed/deploy.md#verify-the-deployment).

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
        "tenant": "<your-tenant-id>",
        "product": "langcache",
        "resourceType": "lc-cache",
        "resourceId": "<cache-id>",
        "actions": ["read", "write"]
      }
    ]
  }'
```

Use the same tenant on every grant of a key. Any string is accepted. Use `1` if you manage caches with the Control Plane admin token.

The response contains the new credential. Store it immediately; credentials
are returned only when a key is minted or rotated.

The Data Plane caches each key check, so a revoked key stops working within
up to 5 minutes (180 seconds soft, 300 seconds hard,
`identityService.bundled.runtime.cache.*`). For rotation, see
[Operations](/content/operate/iris/langcache/self-managed/operations.md).

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

## Next steps

With an admin token, internal token, and agent key in hand, see
[API examples]({{< relref "/operate/iris/langcache/self-managed/api-examples" >}})
to create a cache and start calling the Data Plane, or
[Operations]({{< relref "/operate/iris/langcache/self-managed/operations" >}})
to rotate these credentials going forward.
