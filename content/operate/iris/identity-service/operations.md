---
Title: Operate the Identity Service
alwaysopen: false
categories:
- docs
- operate
- iris
description: Mint, list, rotate, and revoke agent keys, rotate credentials, audit changes, upgrade, back up, and troubleshoot the Identity Service.
linkTitle: Operations
weight: 90
hideListLinks: true
---

This page covers the daily work on an Identity Service release: managing agent keys for every product, rotating credentials, and finding who changed what. It also covers upgrades, backups of the metadata Redis, uninstalling, and troubleshooting.

The examples use release `ids` and a port-forward to its Service:

```bash
kubectl -n <namespace-name> port-forward svc/ids-iris-identity-service 9200:9200
```

```bash
export IRIS_IDENTITY_URL='http://localhost:9200'
export IRIS_IDENTITY_TOKEN='<control-token-or-operator-access-token>'
```

When operator sign-in is on, use your own access token instead of the control token, so the audit log names you. See [Operator sign-in](/content/operate/iris/identity-service/authentication.md#operator-sign-in-with-your-identity-provider).

## Check health

The health routes need no credential:

```bash
curl -sS "$IRIS_IDENTITY_URL/health/readiness"
```

Readiness returns `503` while the Identity Service can't reach the metadata Redis. `helm test ids -n <namespace-name>` runs the same check in the cluster.

## Manage agent keys

The control API manages the keys of every product. The `iris` command-line interface (CLI) reads `IRIS_IDENTITY_URL` and `IRIS_IDENTITY_TOKEN`. To set it up, see [Set up on a self-managed deployment](/content/develop/ai/context-engine/sdk-and-cli.md#set-up-on-a-self-managed-deployment).

### Mint an agent key

Find the resource ID in the product's control plane first, for example an Agent Memory store ID. Then mint the key:

```bash
curl -sS -X POST "$IRIS_IDENTITY_URL/v1/api-keys" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "support-agent",
    "grants": [{
      "tenant": "default",
      "product": "memory",
      "resourceType": "mem-store",
      "resourceId": "<store-id>",
      "actions": ["read", "write"]
    }]
  }'
```

The response returns `keyId` and `token`. The `token` is the agent key, and it's shown only once: give it to the agent through your secret store, and record only the `keyId`.

Optional fields:

- `expiresAt`: when the key stops working, in Unix seconds. Omitted or `0` means never.
- `userId`: the user that owns the key. It needs `apiKeys.userBinding.enabled: true`.

For the grant of each product, see [Agent keys and grants](/content/operate/iris/identity-service/authentication.md#agent-keys-and-grants). With the CLI, each product's own command mints its keys, because it knows the grant the product needs. For example, `iris intent-router service key` mints a key for a Router.

Before the Identity Service stores the key, it asks the product's control plane to validate the grant. A `400` means the resource doesn't exist in the tenant or an action isn't valid. A `424` means the Identity Service can't reach the control plane or its internal token is wrong.

### List and inspect keys

```bash
curl -sS -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  "$IRIS_IDENTITY_URL/v1/api-keys?product=memory&resourceId=<store-id>"
curl -sS -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>"
```

With the CLI:

```bash
iris identity keys list --product memory --resource-id <store-id>
iris identity keys show <key-id>
```

`iris identity keys list` also filters by `--resource-type`. Neither the API nor the CLI ever returns a key's token after it's minted.

The list is paginated. Over HTTP, pass `maxResults` and then each response's `nextToken`. The CLI takes `--limit`, and `--cursor` with the `nextCursor` value it prints; `--all` reads every page.

### Update, rotate, or revoke a key

```bash
# Change the grants, the name, or expiresAt. The token stays the same.
curl -sS -X PATCH "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"grants": [{"product": "memory", "resourceType": "mem-store", "resourceId": "<store-id>", "actions": ["read"]}]}'
```

```bash
# Rotate: get a new key; the old one keeps working for graceSeconds.
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
iris identity keys rotate <key-id> --grace 1h --write .env --env <variable-name>
iris identity keys revoke <key-id>
```

`rotate` writes the new key to the dotenv file with mode `0600` and never prints it. `revoke` asks for confirmation unless you pass `--yes`, and `--product <product>` refuses keys that grant another product.

| Operation | Use it when | What happens to the token | When the agent notices |
| --- | --- | --- | --- |
| Update | The agent needs other resources or actions, a new name, or a new expiry. | It doesn't change. | After the data plane's cache refreshes, within `runtime.cache.hardTtlSeconds` (300 seconds by default). |
| Rotate | Someone else might know the token, or your rotation schedule is due. | You get a new `keyId` and token with the same grants. The old token works for `graceSeconds` more (default 3600, at most `apiKeys.maxRotateGraceSeconds`), but never after its own `expiresAt`. The response's `oldExpiresAt` says when it stops. | The agent must switch to the new token before `oldExpiresAt`. |
| Revoke | Someone else has the token, or the agent no longer needs access. | The key is deleted. A second revoke returns `404`. | Within `runtime.cache.hardTtlSeconds`. |

## Rotate credentials

The Identity Service reads the control token, the runtime credentials, and the internal tokens from their mounted files on each request. A changed Secret takes effect after Kubernetes updates the mounted file, in about a minute, without a restart. While the files update, some calls can fail.

| Credential | How to rotate |
| --- | --- |
| Control token | Put a new value in your Secret. For a generated token, delete its Secret and run `helm upgrade`. |
| Runtime credential | Update the Secret that the Identity Service and the data plane share, then change `existingSecretChecksum` on both releases and run `helm upgrade` on both. To avoid failed calls, follow [Rotate a runtime credential without failed calls](#rotate-a-runtime-credential-without-failed-calls). |
| Internal token | Update the Secret that the Identity Service and the control plane share, then change `productValidation.products.<product>.credential.existingSecretChecksum` and the product's matching checksum, and run `helm upgrade` on both. |
| Policy overlays | The Identity Service reads them only at startup. Change `secrets.checksum` and run `helm upgrade`. |
| Metadata Redis credential | Follow [Rotate the metadata Redis credential](#rotate-the-metadata-redis-credential). |
| Agent key | [Rotate it](#update-rotate-or-revoke-a-key) through the control API. |

Make every new value unique. The Identity Service doesn't start when two credentials have the same value.

### Rotate a runtime credential without failed calls

The Identity Service accepts more than one entry for the same `subject`, so it can accept the old and the new value for a while. This example rotates the Agent Memory credential:

1. Create a Secret with a new value:

   ```bash
   kubectl -n <namespace-name> create secret generic memory-dp-credential-v2 \
     --from-literal=token="$(openssl rand -hex 32)"
   ```

1. Add a second entry with the same `subject` and a new `name`, and keep the old entry:

   ```yaml
   runtime:
     serviceCredentials:
       - name: memory-dp
         subject: memory-dp
         allowedOperations: [api-key-introspect]
         allowedProducts: [memory]
         existingSecret: memory-dp-credential
       - name: memory-dp-v2
         subject: memory-dp
         allowedOperations: [api-key-introspect]
         allowedProducts: [memory]
         existingSecret: memory-dp-credential-v2
   ```

1. Run `helm upgrade` for the Identity Service release.
1. Point the data plane at the new Secret. For Agent Memory, set `identityService.credential.existingSecret: memory-dp-credential-v2` and run `helm upgrade` for Agent Memory.
1. Wait until every data-plane pod uses the new Secret, and check that agent calls work.
1. Remove the old entry from `values-ids.yaml` and run `helm upgrade` for the Identity Service release.
1. Delete the `memory-dp-credential` Secret.

## Find who did what

The Identity Service writes one log line with the message `audit event` for each control operation. It has no audit database, so collect the pod logs with your log system. To search the logs Kubernetes still keeps:

```bash
kubectl -n <namespace-name> logs -l app.kubernetes.io/instance=ids --tail=-1 \
  | grep '"audit event"' | grep '<key-id>'
```

| Field | Meaning |
| --- | --- |
| `action` | The operation, for example `api_key.create`, `api_key.revoke`, or `subject_grant.patch`. |
| `result` | `allowed`, `denied`, or `failed`. |
| `subject`, `user_id`, `issuer` | The caller. |
| `auth_type` | `admin_token` for the control token. |
| `authorized_by` | The role that allowed the operation, for example `suite_admin`. |
| `key_id`, `target_subject` | The key or subject that the operation changed. |

The log never contains tokens. A request rejected before it reaches the service, such as one with a malformed body, has no audit line.

## Upgrade

1. Read the release notes for the chart version.
1. Upgrade each product's control plane first. A newer Identity Service can send grant fields that an older control plane doesn't know.
1. Upgrade the Identity Service release with the same values file:

   ```bash
   helm upgrade ids redis-ai/iris-identity-service \
     --version <chart-version> \
     --namespace <namespace-name> \
     -f values-ids.yaml
   ```

1. Run `helm test ids -n <namespace-name>`, then mint and revoke a test key for each product.

`helm rollback` restores the workload and its values. It doesn't change generated Secrets or the keys and grants in the metadata Redis.

<!-- TODO: lands with iris#2368 (M6); confirm before GA. Document the supported upgrade paths (within a minor version, or from the last patch of the previous minor) once they apply to the standalone chart. -->

## Back up and restore

The metadata Redis holds every agent key, grant, and subject grant. Back up database 0 of that Redis on a schedule, with persistence turned on. Also export the Secrets you created for the release, such as the control token, the runtime credentials, and the internal tokens, and store the export as you store database passwords.

A restore brings back the keys and grants as they were at backup time:

- Keys minted after the backup don't work. Mint them again and give them to their agents.
- Keys revoked after the backup work again. Revoke them again.

### Move the metadata Redis

Stop the Identity Service during the move. If it keeps running after the copy, it changes only the old Redis.

1. Set `replicaCount` to `0` and run `helm upgrade`.
1. Copy the data to the new Redis.
1. Put the new host in `metadata.urls` in the metadata Secret.
1. Set `replicaCount` to its earlier value and run `helm upgrade`.

### Rotate the metadata Redis credential

The Identity Service reads the metadata Redis connection only at startup.

1. In Redis, add the new user or password, and keep the old one valid.
1. Update the metadata Secret, and every product Secret that uses the same Redis.
1. Restart the Identity Service, and wait until it's ready:

   ```bash
   kubectl -n <namespace-name> rollout restart deployment/ids-iris-identity-service
   kubectl -n <namespace-name> rollout status deployment/ids-iris-identity-service
   ```

1. Restart the product control planes, then their data planes and workers, if they use the same Redis.
1. Run `helm test ids -n <namespace-name>`.
1. Remove the old credential from Redis.

### Planned outage of the metadata Redis

While the metadata Redis is down, the Identity Service turns unready, and no agent key can be checked, minted, or changed. Kubernetes doesn't restart the pod. When Redis returns, readiness recovers without a restart.

## Uninstall

```bash
helm uninstall ids --namespace <namespace-name>
```

Uninstalling keeps the Secrets that the chart generated, such as the control token, and keeps every key in the metadata Redis. Products can't check agent keys while the Identity Service is gone. To remove everything, delete the generated Secrets, the Secrets you created, and the metadata Redis data.

## Troubleshooting

The Identity Service returns errors as RFC 7807 problem documents. The `type` field names the error.

{{< table-scrollable >}}
| Symptom | Possible cause | What to do |
| --- | --- | --- |
| Readiness returns `503` | The Identity Service can't reach the metadata Redis. | Check the URL, user, password, and Transport Layer Security (TLS) settings in the metadata Secret. |
| The pod doesn't start | Two credentials share a value, or a value isn't valid. | Read the first error line in the pod log. It names the field. |
| `401` on the control API | Wrong control token, or the operator token has the wrong issuer, audience, or signature, or expired. | Compare the token's `iss` and `aud` claims with `controlAuth.oidc`. |
| `403` on the control API | The caller has no role for this operation or product. | Check `controlAuth.roleBindings` and the groups in the token. |
| `503` on the control API | The Identity Service can't read its token file or reach the JSON Web Key Set (JWKS) URI. | Check the Secret mount and the network path to your identity provider (IdP). |
| `404` for a key that exists | The key is in another tenant. | Check the caller's tenant. |
| `400` that names the tenant | The grant names a tenant other than `singleTenantID`. | Omit `tenant`, or set it to `singleTenantID`. |
| `400` from grant validation | The resource doesn't exist in the tenant, or an action isn't valid. | Check the resource ID in the product's control plane, and that the product's `tenantId` equals `singleTenantID`. |
| `424` when minting | The Identity Service can't call the validator: the control plane is down, the address is wrong, or the internal token doesn't match. | Check `productValidation.products.<product>` and the control-plane logs. |
| Agents get `403` with a valid key | The key's tenant isn't the product's tenant, or the key has no grant for the resource or action. | Compare `singleTenantID` with the product's `tenantId`, and check the key's grants. |
| Agents get `503`, and the data-plane log shows `service-credential-rejected` | The data plane's runtime credential doesn't match the Identity Service entry. | Compare the data plane's Secret with the Identity Service entry's Secret. |
| Agents get `503`, and the data-plane log shows `service-credential-insufficient-permissions` | The runtime credential lacks the operation or product. | Add it to the entry's `allowedOperations` or `allowedProducts`. |
| A user with a subject grant gets `403` | The issuer or subject differs from the token, or the shape isn't in `subjectGrants.allowed`. | Compare the token's `iss` and `sub` claims with the grant. |
| A revoked key still works | The data plane's key cache. | Wait up to `runtime.cache.hardTtlSeconds`. |
{{< /table-scrollable >}}
