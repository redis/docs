---
Title: Operate self-managed Context Gateway
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check health, rotate credentials and encryption keys, monitor the cache and the Gateway database, back up, upgrade, and uninstall Context Gateway.
linkTitle: Operations
weight: 90
hideListLinks: true
---

## Check service health

Both planes serve `/health/liveness` and `/health/readiness` without a credential. Readiness answers `503` while a token source cannot be read or is empty, or the license is not valid. The response does not name the failed check, so read the plane's logs.

With the ports forwarded as in [Deploy](/content/operate/iris/context-gateway/self-managed/deploy.md#5-verify-pods-and-health):

```bash
curl -sS http://localhost:9100/health/readiness
curl -sS http://localhost:8083/health/readiness
```

`iris context-gateway health` probes both planes, and `iris context-gateway service diagnose <gateway-id>` reports a Gateway's setup, including Upstreams with empty catalogs.

## Rotate credentials

| Credential | How to rotate |
| --- | --- |
| Upstream credential | Update the Upstream with a new value through the Control Plane. After an in-place rotation in Vault or AWS Secrets Manager, refresh the Upstream's catalog so cached results stop being served. |
| Agent key | Rotate or revoke it through the Identity Service. See [Rotate or revoke agent keys](/content/operate/iris/context-gateway/self-managed/api-examples.md#rotate-or-revoke-agent-keys). A revoked key stops working within 300 seconds by default. |
| Admin token, internal token | Replace the Secret. The Control Plane rereads the file, so no restart is needed. Coordinate an internal token change with the Identity Service release. |
| Runtime token | Replace the Secret and update the matching Identity Service credential. The Data Plane rereads it on its next key check. |
| Metadata, credential, and registered database URLs, Vault tokens | Replace the Secret, then restart the planes that read it. |

Set a file reference's `checksum`, then run `helm upgrade`, to roll out the planes predictably after any file change.

### Rotate the encryption keyring

The keyring is loaded at startup, so each step needs a rollout of both planes:

1. Add `k2` to the keyring and to `credentialStorage.redis.keyFiles`, and keep `k1` active. Change `credentialStorage.redis.keyring.checksum` and upgrade. Both planes can now read either key.
1. Set `credentialStorage.redis.activeKeyId: k2` and upgrade. New credential writes use `k2`, and existing credentials still open with `k1`.
1. Rewrite the remaining credentials through the Control Plane. Keep `k1` until you can prove nothing uses it, including rollbacks and retained backups.

## Monitor the cache

A cache hit carries `cache` in the call's invocation metadata. Every other outcome shows only in metrics and traces. `context_gateway_cache_lookups_total` counts lookups by `outcome` (`hit`, `miss`, `bypass`, `error`) and `reason`:

| Bypass `reason` | What to check |
| --- | --- |
| `not_opted_in` | The tool has no cache policy. |
| `disabled` | The Gateway's `cache` setting is `disabled`. |
| `no_database` | The Gateway has no `databaseId`. |
| `unknown_database` | The Gateway's database is not registered on the Data Plane. Declare it on both planes. |
| `vetoed_by_annotation` | The tool's definition says it is not read-only, or that it is destructive. |
| `caller_credentials` | The Upstream's credential could depend on the caller. |
| `uncanonical_arguments` | The arguments repeat a member, are not valid UTF-8, or nest too deep. |
| `unreadable_policy` | The Data Plane is older than the release that wrote the policy. Upgrade it. |

| Error `reason` | What to check |
| --- | --- |
| `lookup_timeout` | The Gateway database answered slower than `cache.lookup_timeout`. Check its latency and load. |
| `lookup_failed` | The Gateway database is down, unreachable, or refuses the Data Plane's user. |
| `unusable_entry` | The entry was written by a newer release. The call's own write replaces it. |

A call whose lookup fails is served from the Upstream.

## Watch the Gateway database

When compression is on, alert on `context_gateway_compression_creates_total{outcome="out_of_memory"}`. It means the Gateway database refused a handle write and the agent received the whole result. Raise `maxmemory`, shorten the handle lifetime, or move handles to a dedicated database.

Above 90 percent of `maxmemory`, the Data Plane pauses handle creation and counts `skipped_low_memory`. Creation resumes when the database has room. The Data Plane also stops holding handles when the database's eviction policy is not `noeviction` or JSON is unavailable.

## Update configuration and license Secrets

Replace the Secret, then roll out both planes. Set `checksum` on a file reference to trigger the rollout automatically.

## Back up the deployment

Back up Metadata Redis and credential storage together. A Gateway record without its credentials cannot call its Upstreams. Keep every encryption key that a backed-up credential needs.

<!-- TODO: Confirm supported backup and restore guarantees. -->

## Upgrade the chart

Upgrade both planes together and roll forward, not back. An older Data Plane cannot read tool policy members that a newer Control Plane wrote, and serves those tools uncached.

The `result_cache` and `result_handles` settings, the `RESULT_CACHE` and `RESULT_HANDLES` environment variables, and the `context_gateway_result_cache_*` and `context_gateway_result_handles_*` metrics are now `cache`, `compression`, `CACHE`, `COMPRESSION`, `context_gateway_cache_*`, and `context_gateway_compression_*`. Rename them in your values files, dashboards, and alerts.

After an upgrade, refresh an Upstream's catalog when the release notes ask for it.

Gateways stored before the per-Gateway `cache` and `compression` settings read as `enabled` when they have a `databaseId` and `disabled` otherwise, so their behavior does not change. Scripts that remove or add a Gateway's `databaseId`, or set `cache` tool policies, may need the changes in [Turn the cache and compression on or off](/content/develop/ai/context-engine/context-gateway/manage-gateways.md#turn-the-cache-and-compression-on-or-off).

```bash
helm upgrade gateway redis-ai/redis-context-gateway \
  --version <new-chart-version> \
  --namespace <namespace-name> \
  -f gateway-values.yaml \
  --wait --timeout 5m
```

## Uninstall the chart

```bash
helm uninstall gateway --namespace <namespace-name>
```

Uninstall removes the planes only. Redis databases, Secrets, Container Storage Interface (CSI) provider classes, Upstream credentials, and Gateway records stay. To remove Gateways and their credentials, delete them through the Control Plane before you uninstall.
