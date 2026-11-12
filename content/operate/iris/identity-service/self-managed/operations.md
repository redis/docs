---
Title: Operate the Identity Service
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create, rotate, and revoke agent keys, add services, rotate credentials, audit changes, upgrade, back up, and troubleshoot the Identity Service.
linkTitle: Operations
weight: 90
hideListLinks: true
aliases:
- /operate/iris/identity-service/operations/
---

This page covers the daily work on the Identity Service of a `redis-iris` release: managing agent keys, adding services, rotating credentials, and finding who changed what. It also covers upgrades, backups, and troubleshooting.

The examples use a port-forward to the Identity Service:

```bash
kubectl -n <namespace-name> port-forward svc/iris-identity-service 9200:9200
```

```bash
export IRIS_IDENTITY_URL='http://localhost:9200'
export IRIS_IDENTITY_TOKEN='<control-token-or-operator-access-token>'
```

When operator sign-in is on, use your own access token instead of the control token, so the audit log names you. Each call that changes a grant goes to the service's control plane first. If a call fails with `424`, check that control plane.

The `iris` command-line interface (CLI) reads `IRIS_IDENTITY_URL` and `IRIS_IDENTITY_TOKEN`. To set it up, see [Set up on a self-managed deployment](/content/develop/ai/context-engine/sdk-and-cli.md#set-up-on-a-self-managed-deployment).

## Give an agent access with an agent key

This example gives an agent read and write access to one Agent Memory store.

1. Find the store ID in the Agent Memory control plane.
1. Create the key:

   ```bash
   curl -sS -X POST "$IRIS_IDENTITY_URL/v1/api-keys" \
     -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{
       "name": "support-agent",
       "grants": [{
         "product": "memory",
         "resourceType": "mem-store",
         "resourceId": "<store-id>",
         "actions": ["read", "write"]
       }]
     }'
   ```

   The response has `keyId` and `token`. The `token` is the agent key, and it's shown only once. Give it to the agent through your secret store, and record only the `keyId`.

1. The agent sends the key to the Agent Memory data plane in the `Authorization: Bearer` header, or in `X-Api-Key`.

Optional fields:

- `expiresAt`: when the key stops working, in Unix seconds. Without it, the key doesn't expire.
- `userId`: the user that owns the key. It needs `identityService.apiKeys.userBinding.enabled: true`.

For the other services, change the grant:

| Service | Grant |
| --- | --- |
| Agent Playbooks | `{"product": "playbook", "resourceType": "playbook", "resourceId": "<playbook-id>", "actions": ["read"]}` |
| Lens, send turns | `{"product": "lens", "resourceType": "lens-instance", "resourceId": "default", "actions": ["ingest"]}` |
| Lens, read turns | The same, with `"actions": ["read"]` |
| Context Gateway | `{"product": "context-gateway", "resourceType": "gateway", "resourceId": "<gateway-id>", "actions": ["use"]}` |
| Intent Router | `{"product": "intent", "resourceType": "intent-router", "resourceId": "<router-id>", "actions": ["read"]}` |

With the CLI, each service's own command creates its keys, because it knows the grant the service needs. For example, `iris intent-router service key` creates a key for a Router.

### Create keys in the Iris console

The Iris console has an **API Keys** page at `/api-keys`. It calls the Identity Service through the console gateway.

- With IdP sign-in (`ui.sso.enabled: true`, the default), the page uses the operator's access token. Only a `suite_admin`, or a `product_admin` of the key's services, can manage the key.
- In admin token mode (`ui.sso.enabled: false`), the page asks for the control token. Use this mode for recovery only.

On the page, you can create, list, and delete keys. The page shows the token once, when you create the key. It's shown only to users with access to Agent Memory, Agent Playbooks, Context Gateway, or Intent Router. A Lens administrator uses the control API.

## Change, rotate, and revoke a key

```bash
# List every key, or the keys of one resource
curl -sS -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  "$IRIS_IDENTITY_URL/v1/api-keys?product=memory&resourceId=<store-id>"
```

```bash
# Show one key, without its token
curl -sS -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>"
```

```bash
# Change the name, the grants, or expiresAt. The token stays the same.
curl -sS -X PATCH "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"grants": [{"product": "memory", "resourceType": "mem-store", "resourceId": "<store-id>", "actions": ["read"]}]}'
```

```bash
# Rotate: get a new token. The old token works for graceSeconds more.
curl -sS -X POST "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>/rotate?graceSeconds=3600" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN"
```

```bash
# Revoke: delete the key.
curl -sS -X DELETE "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN"
```

With the CLI:

```bash
iris identity keys list --product memory --resource-id <store-id>
iris identity keys show <key-id>
iris identity keys rotate <key-id> --grace 1h --write .env --env <variable-name>
iris identity keys revoke <key-id>
```

`rotate` writes the new key to the dotenv file with mode `0600` and never prints it. `revoke` asks for confirmation unless you pass `--yes`.

The list returns every key in one response, without pages.

| Operation | Use it when | What happens to the token | What the agent sees |
| --- | --- | --- | --- |
| Update | The agent needs other resources or actions, a new name, or a new expiry. | It doesn't change. | The new grants, after the data plane's cache refreshes, within `runtime.cache.hardTtlSeconds` (300 seconds by default). |
| Rotate | Someone else might know the token, or your rotation schedule is due. | You get a new key with a new `keyId`, a new token, and the same grants. The old token works for `graceSeconds` more (default 3600), but never after its own `expiresAt`. The response's `oldExpiresAt` says when it stops. | It must switch to the new token before `oldExpiresAt`. |
| Revoke | Someone else has the token, or the agent no longer needs access. | The key is deleted. A second revoke returns `404`. | It loses access within `runtime.cache.hardTtlSeconds`. |
| Set `expiresAt` | The access is for a limited time. | It stops at that time. | It loses access at that time. |

## Add or remove a service

`<alias>` is `memory`, `playbook`, `lens`, `contextGateway`, or `intent`.

- **Add a service.** Set `global.iris.products.<alias>.enabled: true`, add the service's values, and run `helm upgrade`. The chart creates the service's credentials and its Identity Service entries. Check that `GET /v1/products` lists the new service.
- **Turn a service off.** Set `global.iris.products.<alias>.enabled: false` and run `helm upgrade`. The chart removes the service's Identity Service entries, and keeps its credentials and data, so the service continues where it stopped when you turn it on again.
- **Remove a service permanently.** Turn it off, then delete its Secrets and its data.

The agent keys of a service that's off stay in the Identity Service. Revoke them if you don't need them.

## Rotate credentials

The Identity Service reads the control token, the runtime credentials, and the internal tokens from their mounted files on each request. When you change one of these Secrets in place, the new value works after Kubernetes updates the mounted file, in about a minute, without a restart. Some calls can fail while the files update.

| Credential | How to rotate |
| --- | --- |
| Control token | Change the Secret. For a generated token, delete the Secret, then run `helm upgrade`. |
| Runtime credential | Change the Secret that the Identity Service and the data plane share. |
| Internal token | Change the Secret that the Identity Service and the control plane share. |
| Agent key | [Rotate it](#change-rotate-and-revoke-a-key) through the control API. |
| Policy overlays | The Identity Service reads them only at startup. Change `identityService.secrets.checksum`, or restart the pods. |
| Console session key | Change the Secret, then restart the console's sign-in service with `kubectl -n <namespace-name> rollout restart deployment/iris-ui-auth`. Every user must sign in again. |
| Metadata Redis credential | Follow [Rotate the metadata Redis credential](#rotate-the-metadata-redis-credential). |

Make every new value unique. The Identity Service checks for duplicate values only when it starts, so a duplicate you set in place stops the next pod from starting. `helm upgrade` and `helm rollback` keep the rotated values.

### Rotate the metadata Redis credential

The Identity Service and the services read the metadata Redis connection only when they start.

1. In Redis, add a new user, and keep the old user.
1. Update each Secret that holds the connection.
1. Restart the Identity Service, then the service control planes, then the data planes and the workers, then the console gateway and the console's sign-in service. If you use the Agent Memory queue monitor, restart it too.
1. Run `helm test iris --namespace <namespace-name> --logs`.
1. Keep the old user. Each Agent Memory store keeps the database credential it was created with, so deleting the old user breaks the old stores.

## Find who did what

The Identity Service writes one log line with the message `audit event` for each control operation. It has no audit database, so collect the pod logs with your log system. To search the logs Kubernetes still keeps, across every Identity Service pod:

```bash
kubectl -n <namespace-name> logs -l app.kubernetes.io/name=identityService --tail=-1 \
  | grep '"audit event"' | grep '<key-id>'
```

| Field | Meaning |
| --- | --- |
| `action` | The operation, for example `api_key.create` or `api_key.revoke`. |
| `result` | `allowed`, `denied`, or `failed`. |
| `subject`, `user_id`, `issuer` | The caller. |
| `auth_type` | `admin_token` for the control token. |
| `authorized_by` | The role that allowed the operation, for example `suite_admin`. |
| `key_id` | The key that the operation changed. |

The log never contains tokens. A request refused before it reaches the service, such as one with a malformed body, has no audit line.

## Upgrade and roll back

- **Upgrade.** Pin the chart version, upgrade the one release, and then run `helm test`. Helm upgrades every component at the same time. Upgrade within one minor version, or from the last patch of the previous minor version to the new minor version. Don't skip a minor version. Read the release notes of each version first.
- **Roll back.** `helm rollback` restores the workloads and the values. It doesn't change the generated Secrets, or the keys and grants in the metadata Redis. The same version rules apply. Keep the chart of each version you install, with `helm pull redis-ai/redis-iris --version <chart-version>`.

## Back up and restore

The metadata Redis holds every agent key and grant. Back up database 0 of that Redis on a schedule, with persistence turned on. Also export the Secrets of the release namespace, and store the export as you store database passwords.

A restore brings back the keys and grants as they were at backup time:

- Keys created after the backup don't work. Create them again and give them to their agents.
- Keys revoked after the backup work again. Revoke them again.

If you lose the release namespace, restore the exported Secrets before you reinstall the release with the same values. Existing agent keys keep working after the restore.

### Move the metadata Redis

Moving the metadata Redis causes an outage, so plan a maintenance window. While the Identity Service is stopped, agents lose access after at most `runtime.cache.hardTtlSeconds`, and you can't manage keys. If the services use the same Redis, plan for them too.

1. Set `identityService.replicaCount` to `0` and run `helm upgrade`.
1. Copy the data to the new Redis.
1. Put the new host in `metadata.urls` in the metadata Secret.
1. Set `identityService.replicaCount` to its earlier value and run `helm upgrade`.

Don't let the Identity Service run after the copy. If it does, keys you revoke after the copy work again, and the new Redis lacks the keys you create after the copy.

### Planned outage of the metadata Redis

While the metadata Redis is down, the Identity Service turns unready, and no agent key can be checked, created, or changed. Kubernetes doesn't restart the pods. When Redis returns, readiness recovers without a restart.

## Troubleshooting

The Identity Service returns errors as RFC 7807 problem documents. The `type` field names the error.

{{< table-scrollable >}}
| Symptom | Possible cause | What to do |
| --- | --- | --- |
| The install stops and names a field | A value differs from `global.iris`, or a required value is missing. | Remove or set the field the message names. |
| Readiness returns `503` | The Identity Service can't reach the metadata Redis. | Check the URL, user, password, and Transport Layer Security (TLS) settings in the metadata Secret. |
| The pod doesn't start | Two credentials share a value, or a value isn't valid. | Read the first error line in the pod log. It names the field. |
| `401` on the control API | Wrong control token, or the operator token has the wrong issuer, audience, or signature, or expired. | Compare the token's `iss` and `aud` claims with `global.iris.auth.oidc`. |
| `503` on the control API | The Identity Service can't read its token file or reach the JSON Web Key Set (JWKS) URI. | Check the Secret mount and the network path to your identity provider (IdP). |
| `403` on the control API | The caller has no `suite_admin` or `product_admin` role for this service. | Check `global.iris.auth.roleBindings` and the groups in the token. |
| `404` for a key that exists | The key is in another tenant. | Check the caller's tenant. |
| `400` "must be the caller's tenant" or "tenant is not accepted by this installation" | The grant names another tenant. | Remove `tenant` from the grant. |
| `400` from grant validation | The resource doesn't exist, or an action isn't valid. | Check the resource ID in the service's control plane. |
| `424` | The Identity Service can't use the grant validator: the control plane is down, or the internal token is wrong. | Check the control-plane pods and logs. |
| Agents get `503` "Identity Service Unavailable", and the data-plane log shows `service-credential-rejected` | The data plane's runtime credential is wrong. | Compare the data plane's credential Secret with the Secret the Identity Service mounts. |
| A revoked key still works | The data plane's key cache. | Wait up to `runtime.cache.hardTtlSeconds`. |
{{< /table-scrollable >}}

## Limits

- **One tenant for each release.** For more than one tenant, install one release for each tenant.
- **One IdP for each release.** Every operator signs in through the IdP in `global.iris.auth.oidc`. A tenant can't bring its own IdP.
- **Subject grants have no effect** in a `redis-iris` installation.
- **No FIPS.** The suite chart doesn't support the Federal Information Processing Standards (FIPS) profile.
- **The key list has no pages.** It returns every key.
- **No NetworkPolicy.** You must supply it.
