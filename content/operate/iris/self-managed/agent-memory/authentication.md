---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure Redis Agent Memory self-managed Control Plane authentication, Data Plane auth modes, worker callbacks, and gateway integration.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/authentication/
- /operate/iris/agent-memory/self-managed/authentication/
---

Self-managed Redis Agent Memory uses separate authentication models for the Control
Plane and Data Plane.

The Control Plane uses an admin token for management endpoints by default. It also accepts operator tokens when OpenID Connect (OIDC) authentication is configured. The Data Plane checks each agent
key with the Identity Service, using the Data Plane service credential, and enforces store-level
grants.

## Credentials

| Credential | Who presents it to whom | Secret / key | Auto-generated? | What it unlocks |
| --- | --- | --- | --- | --- |
| Control Plane admin token | Operator → Control Plane (`:9100`) | `redis-agent-memory-controlplane-admin-token` / `token` | Yes (`controlplane.adminToken.autoGenerate`) | Store and extractor management through the `/iris/v1/agent-memory` admin API |
| Control Plane internal token | Identity Service → Control Plane | `memory-internal-token` / `token` in the walkthrough | You provision it for both releases | Checking that the store in a grant exists. Set `controlplane.internalToken.existingSecret` on Memory and `productValidation.products.memory.credential.existingSecret` on Identity Service. |
| Identity Service control token | Operator → Identity Service (`:9200`) | `ids-control-token` / `token` in the walkthrough | Supplied through `control.existingSecret` on Identity Service; that chart can also generate one | Creating, listing, updating, rotating and revoking agent keys |
| Data Plane service credential | Data Plane → Identity Service | `memory-dp-credential` / `token` in the walkthrough | You provision it for both releases | Checking agent keys for `memory`. Set `identityService.credential.existingSecret` on Memory and register it in `runtime.serviceCredentials[]` on Identity Service. |
| Agent key | Application → Data Plane (`:9000`) | None; returned once when minted or rotated | No | The Data Plane operations its grants allow |

Generated token Secrets are retained across upgrades and uninstalls (`helm.sh/resource-policy: keep`).
Use existing Secrets for shared credentials and for reproducible deployment automation.
Secret names and keys must agree between releases. See
[Secret rotation](/content/operate/iris/self-managed/agent-memory/operations.md#secret-rotation).

## Control Plane admin token

With the default configuration, Control Plane management endpoints require:

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

The Control Plane reads the token file on each request, so rotating the Secret
does not require a Control Plane redeploy.

## Data Plane auth modes

The Data Plane defaults to agent-key authentication whenever no auth method is set.

### Agent-key authentication

The [`deploy` walkthrough](/content/operate/iris/self-managed/agent-memory/deploy.md) uses agent-key
authentication from the start. In the chart-rendered configuration, the chart writes the agent-key
introspection settings from `dataplane.identityServiceBaseURL` and `identityService.credential`.
These must point to the standalone release and its registered `memory-dp` credential.

A bring-your-own (BYO) Data Plane configuration needs the `auth.agent_keys.introspection` block,
including a BYO configuration without `auth`. See
[Bring-your-own (BYO) configuration](/content/operate/iris/self-managed/agent-memory/configuration.md#bring-your-own-byo-configuration).
The `MEM_AUTH_METHOD` environment variable overrides the method.

Clients send agent keys as Bearer credentials:

```http
Authorization: Bearer <agent-key>
```

Treat agent keys as opaque credentials. Do not parse their contents.

### Auth-disabled Data Plane

Use auth-disabled mode for development and testing only:

```yaml
profile: dev
ownership:
  enabled: false
auth:
  method: none
```

These are application configuration fields; put them under `memory` in Helm values.
The Data Plane refuses `auth.method: none` unless `profile` is exactly `dev`.
Chart-rendered configuration fails to render otherwise. With a supplied configuration Secret,
the same rule is enforced at process startup.

> [!WARNING]
> Do not expose an auth-disabled Data Plane to untrusted callers. In auth-disabled
> mode, Redis Agent Memory does not authenticate or authorize Data Plane requests; any
> caller that can reach the API can read or write memory for configured stores.

## Store authorization and grants

For agent-key requests, Redis Agent Memory checks both identity and resource
authorization:

1. The Data Plane asks the Identity Service whether the key is valid, and caches the answer per pod.
2. The key has a grant for the requested store resource.
3. The grant includes the permission required by the operation.

Because of the cache, a revoked key stops working within up to 5 minutes (180 seconds soft, 300
seconds hard). If the Identity Service can't be reached, keys that aren't cached get `503`.

A grant names the tenant, product, store, and actions:

```json
{
  "tenant": "<your-tenant-id>",
  "product": "memory",
  "resourceType": "mem-store",
  "resourceId": "<store-id>",
  "actions": ["read", "write"]
}
```

Use the installation's tenant on every grant, for example `default`. Set Memory's `tenantId`
and Identity Service's `runtime.apiKeyTenant.singleTenantID` to that same value. With a rendered
Control Plane configuration, `tenantId` sets `auth.admin_tenant_id`, so admin-token stores belong
to that tenant too. With a supplied Control Plane configuration Secret, set `auth.admin_tenant_id`
yourself. Neither release checks the other release's tenant setting.

Grant actions:

| Action | Meaning |
| --- | --- |
| `read` | Read and search memory data. |
| `write` | Mutate memory data. `write` implies `read`. |
| `full` | `full` implies `write`. |

Operation mapping:

{{< table-scrollable >}}
| Required permission | Data Plane operations |
| --- | --- |
| `read` | List sessions, get session memory, get session event, get session property, search long-term memory, get long-term memory. |
| `write` | Add/delete session events, delete session memory, set session summary, set session property, create/update/delete long-term memory. |
{{< /table-scrollable >}}

## Server-side ownership enforcement

Store grants authorize access to a store. Ownership enforcement adds a check within that store: ordinary callers can access their own personal records and shared records.

This section applies to on-prem deployments. Release 0.10.2 enables ownership enforcement by default in the on-prem server, worker, and chart.

| Setting | Personal access | Shared access |
| --- | --- | --- |
| `ownership.enabled: false` | Your trusted backend must authorize every read and write, including direct-ID requests. Owner fields and filters do not authenticate the user. | Your backend checks which shared namespaces the user may access. |
| `ownership.enabled: true` | The server compares the stored owner with the authenticated user ID. Search and list restrictions apply in addition to client filters. | Callers with the required store permission can access shared records. Shared scope does not enforce team membership. |

Keep application-specific checks in your backend in both modes. Use separate stores and grants if teams need separate server-enforced access. Worker credentials are for background services; do not give them to applications.

### Match stored owners to authenticated users

Use the same stable user ID in stored records and the verified user token. Matching is exact, including case. IDs must meet the format in the [API reference](/content/develop/ai/context-engine/agent-memory/api-reference.md); an email address or an identity-provider subject containing punctuation may need a separate compatible claim. Changing a claim mapping does not rewrite stored owners.

The first session event's `actorId` becomes the session owner. Later events in an accessible session can use an assistant's actor ID without changing ownership. Directly created memories and personal namespace roots use the `ownerId` supplied by your application. Session extraction inherits the session owner. See [Identify users and conversations](/content/develop/ai/context-engine/agent-memory/developer-guide.md#identify-users-and-conversations) for client and server fields.

With enforcement on:

- A new personal owner, or an owner update, must match the authenticated user ID. A mismatch returns `403 Forbidden`, including when the record would enter a shared namespace.
- Another user's personal record is hidden from direct-ID reads and mutations with `404 Not Found`. Search and list filters cannot expand access.
- A personal namespace child inherits its root's owner.
- A caller without a user ID can access shared records within its grants, but cannot claim a named personal owner. Ownerless private records are hidden.

Ordinary agent keys created by `POST /v1/api-keys` do not contain a user binding. The API does not accept one or copy the key creator's identity. Use delegation for personal access. Configuring an OpenID Connect (OIDC) claim alone does not bind a key.

An unbound key can pass store health checks and access allowed shared data while personal creation returns `403`. A successful health check does not establish a user identity.

### Delegate a user with an agent key

Delegation lets an application use its agent key for store permissions and a user's access token for personal identity. This path is supported in on-prem release 0.10.2. It does not add the user's store grants to the key.

1. Configure your identity provider to issue signed access tokens with an issuer, a compatible user ID claim, and the intended audience. Obtain the user's token through your application's login process.
1. Configure the Data Plane to trust that issuer and its JSON Web Key Set (JWKS). Use the same tenant as the agent key and store.
1. Enable delegation and choose an audience distinct from direct OIDC sign-in.
1. Send both credentials on each request for that user.

For chart-rendered configuration, merge this fragment into your existing Helm values. Replace the issuer, JWKS URL, and audience values with those configured by your identity provider:

```yaml
tenantId: default
auth:
  oidc:
    audience: api://memory-direct
memory:
  ownership:
    enabled: true
  auth:
    oidc:
      enabled: true
      issuer: https://<identity-provider-host>/<issuer-path>
      jwks_uri: https://<identity-provider-host>/<jwks-path>
      user_id_claim: sub
      allow_azp_fallback: false
    delegation:
      enabled: true
      audience:
        - api://memory-delegation
```

The chart supplies the static tenant from `tenantId`. For a bring-your-own configuration file, place `ownership` and `auth` at the root, set `auth.oidc.static_tenant_id` to that same tenant, and set `auth.oidc.audience` to the direct-sign-in audience as a list. Do not also configure `tenant_id_claim` for a single-tenant deployment.

The server verifies the token's signature, issuer, audience, expiry, tenant, and user claim. JWKS verification does not decrypt a token or exchange it for another credential. An application-issued signed JSON Web Token (JWT) works only when the deployment trusts its issuer and verification keys.

Delegation defaults to off and requires OIDC to be enabled. Its audience must not overlap the direct OIDC audience; keep `allow_azp_fallback` off with a separate delegation audience. Without a separate audience, the same user token can also be presented as a direct sign-in.

Direct OIDC sign-in remains a preview in this release: it validates the token but does not resolve the subject's store grants. A valid token alone receives `403` for store operations. Use the agent key and delegated token together for personal access.

Set `USER_TOKEN` to the access token for the current request's user, and `OWNER_ID` to that token's verified user ID. Use the connection values from the [quickstart](/content/develop/ai/context-engine/agent-memory/quickstart.md). These examples list that user's session metadata:

{{< multitabs id="delegated-user" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
import asyncio
import os

import httpx
from redis_agent_memory import AgentMemory


async def main():
    async with httpx.AsyncClient(
        headers={"X-Iris-User-Token": os.environ["USER_TOKEN"]},
    ) as transport:
        async with AgentMemory(
            server_url=os.environ["AGENT_MEMORY_URL"],
            store_id=os.environ["STORE_ID"],
            api_key=os.environ["API_KEY"],
            async_client=transport,
        ) as memory:
            page = await memory.list_session_summaries_async(
                filter_owner_id=os.environ["OWNER_ID"], limit=20,
            )
            print(page.model_dump_json(by_alias=True))


asyncio.run(main())
```

-tab-sep-

```typescript
import { AgentMemory } from "@redis-iris/agent-memory";
import { HTTPClient } from "@redis-iris/agent-memory/lib/http";

async function main() {
  const { AGENT_MEMORY_URL, STORE_ID, API_KEY, USER_TOKEN, OWNER_ID } = process.env;
  if (!AGENT_MEMORY_URL || !STORE_ID || !API_KEY || !USER_TOKEN || !OWNER_ID) {
    throw new Error("Set the connection values, USER_TOKEN, and OWNER_ID.");
  }
  const httpClient = new HTTPClient();
  httpClient.addHook("beforeRequest", (request) => {
    request.headers.set("X-Iris-User-Token", USER_TOKEN);
    return request;
  });
  const memory = new AgentMemory({
    serverURL: AGENT_MEMORY_URL, storeId: STORE_ID, apiKey: API_KEY, httpClient,
  });
  console.dir(await memory.listSessionSummaries(20, undefined, OWNER_ID), { depth: null });
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Request failed"); process.exitCode = 1; });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error --get \
  --header "Authorization: Bearer $API_KEY" \
  --header "X-Iris-User-Token: $USER_TOKEN" \
  --data-urlencode "ownerId=$OWNER_ID" \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/sessions" | jq
```

{{< /multitabs >}}

Create a separate request-scoped client or transport for each user's token. Do not change a shared client's user header while it handles concurrent requests.

A missing or invalid primary credential, an invalid or expired user token, or a missing user identity returns `401`. A token from another tenant, or a delegation header used with a credential other than an agent key, returns `403`. A valid delegated user still needs the key's store grant.

### Enable or change ownership enforcement

For a new deployment, configure the user-identity path before writing personal data. If your application does not use a trusted identity provider, explicitly disable enforcement and apply [backend authorization](/content/develop/ai/context-engine/agent-memory/developer-guide.md#authorize-every-memory-request).

Before upgrading an existing deployment:

1. Keep `memory.ownership.enabled: false` explicitly set while preparing the transition.
1. Compare stored personal owners with the verified user IDs your application will send. Resolve owner mismatches before enabling enforcement; the setting does not rewrite owners.
1. Configure delegation, then set `memory.ownership.enabled: true` in chart-rendered values. For a bring-your-own file, use `ownership.enabled: true` at the root.
1. Apply the setting to both Data Plane servers and workers, then roll out those processes. `MEM_OWNERSHIP_ENABLED` overrides the file value; check both for conflicting settings.
1. Replace existing Summary Views when changing this setting. A view retains the source-access policy from its creation.
1. Test two users: each can access their own personal records, neither can retrieve or search for the other's records, and both can access shared records allowed by their store grants.
1. Test an agent key without a user token: it must not retrieve personal records or create a session for a named owner.

For the two-user read check, use an ordinary agent key with store read access, without operator privileges. Set `USER_TOKEN` to the first user's valid token. Set `OWN_SESSION_ID`, `OTHER_SESSION_ID`, and `SHARED_SESSION_ID` to existing sessions owned by that user, owned by the other user, and placed in a shared namespace, respectively:

```sh
for session_id in "$OWN_SESSION_ID" "$OTHER_SESSION_ID" "$SHARED_SESSION_ID"; do
  curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
    --header "Authorization: Bearer $API_KEY" \
    --header "X-Iris-User-Token: $USER_TOKEN" \
    "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/sessions/$session_id"
done
```

Expect `200`, `404`, and `200`, in that order. Repeat with the second user's token and swap `OWN_SESSION_ID` with `OTHER_SESSION_ID`. A `401` indicates a token configuration problem; it does not prove ownership enforcement works.

Disabling enforcement restores store-wide access within the credential's grants. Keep backend authorization in place before disabling it. It does not remove stored owner fields, reassign records, or remove the need for store authentication.

## Worker callbacks

Redis Agent Memory workers consume background jobs and call the Data Plane to read
session events and write extracted long-term memories.

The [`deploy` values](/content/operate/iris/self-managed/agent-memory/deploy.md#3-create-ram-valuesyaml)
already enable worker callbacks. Each platform also needs the setup in
[Prepare worker identity for your platform](/content/operate/iris/self-managed/agent-memory/deploy.md#prepare-worker-identity-for-your-platform).

For deployments where Redis Agent Memory Data Plane auth is enabled, workers should
authenticate with Kubernetes projected service-account tokens. The Helm
`workerAuth.enabled` preset creates or uses a worker ServiceAccount and mounts a
projected token into the worker pod. The Data Plane must also be configured to
validate and authorize that token through `auth.worker_identity`.

Minimal worker-auth values:

```yaml
workerAuth:
  enabled: true

# Optional customization when the default worker ServiceAccount is not suitable.
worker:
  serviceAccount:
    name: ""        # set to use an existing ServiceAccount
    create: false   # set true to create a dedicated ServiceAccount without the preset
    annotations: {}
    token:
      audience: redis-agent-memory
      expirationSeconds: 3600
      mountPath: /var/run/secrets/redis-agent-memory-worker
      fileName: token
```

Matching Data Plane config:

```yaml
dataplane_client:
  base_url: http://redis-agent-memory:9000
  auth:
    disabled: false
    type: service_account_token
    token_file: /var/run/secrets/redis-agent-memory-worker/token

auth:
  method: agent_key
  worker_identity:
    enabled: true
    issuer: <service-account-issuer>
    jwks_uri: "https://kubernetes.default.svc/openid/v1/jwks"
    audience:
      - redis-agent-memory
    subjects:
      - subject: "system:serviceaccount:<namespace>:redis-agent-memory-worker"
        user_id: "redis-agent-memory-worker"
        roles:
          - operator
        resources:
          "mem-store:*":
            permissions:
              - write
```

Worker identity access is controlled by `auth.worker_identity.subjects`.
Configure worker identity to:

- Trust one or more exact Kubernetes service-account subjects.
- Validate worker tokens by issuer, JWKS URI, audience, and signing algorithm.
- Map each trusted subject to a Redis Agent Memory `Principal` with roles, scopes,
  and resource grants.
- Grant store access with resource keys such as `mem-store:<store-id>`.
- Use `mem-store:*` for a shared worker identity, or use narrower store grants
  and separate worker ServiceAccounts for stronger isolation.
- Grant `read`, `write`, or `full`; `write` implies `read`, and `full` implies
  `write`.

The Helm ServiceAccount/token settings only provide the Kubernetes credential.
Redis Agent Memory authorization still comes from the server-side
`auth.worker_identity` subject grants. With agent-key authentication, you must configure worker
identity.

## Gateway and identity provider integration

Use a gateway when it owns external authentication and coarse policy. For
example, a gateway can authenticate callers through an identity provider before
it forwards requests to Redis Agent Memory.

If the gateway also owns the standard `Authorization` header, forward the Agent
Memory key in `X-Api-Key`:

```http
Authorization: Bearer <gateway-token>
X-Api-Key: <ram-agent-key>
```

Redis Agent Memory uses `X-Api-Key` as the Redis Agent Memory credential when present. The
gateway token is still available to the gateway, but Redis Agent Memory authorizes the
request from the server-side grants attached to the Redis Agent Memory key.

Gateway rules:

- The gateway owns external authentication and perimeter policy.
- Redis Agent Memory owns store-level authorization.
- Redis Agent Memory keys are stored and forwarded by trusted infrastructure or
  trusted applications.
- Callers must not be able to bypass the gateway and reach the Data Plane
  directly unless they also present a valid Redis Agent Memory credential.
