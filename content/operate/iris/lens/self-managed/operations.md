---
Title: Operate self-managed Lens
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check health, watch the records database, change retention, connect the console, back up, upgrade, uninstall, and troubleshoot Lens.
linkTitle: Operations
weight: 90
hideListLinks: true
---

This page covers routine checks and maintenance for self-managed Lens after you [deploy it](/content/operate/iris/lens/self-managed/deploy.md). The examples port-forward the data plane to `localhost:9000` and the control plane to `localhost:9300`.

## Check service health

The data plane, worker, and control plane answer `/health/liveness` and `/health/readiness` without a credential:

```bash
curl -sS http://localhost:9000/health/readiness
curl -sS http://localhost:9300/health/readiness
```

The worker has no Service. Check it with `kubectl -n <namespace-name> get pods -l app.kubernetes.io/instance=lens`. With `tests.enabled=true`, `helm test lens -n <namespace-name>` runs the readiness checks.

## Watch the records database

Nothing trims the span streams yet, and the `streams` role must use `noeviction`. While ingest is on, the records database grows without bound. Watch its memory, and add memory before it fills. When it fills, writes fail rather than evicting data.

To stop growth, set `ingest.enabled=false` and run `helm upgrade`. Agents then get `503` and retry, and reads keep working.

## Change retention

Read the instance and its current retention with the admin token:

```bash
curl -sS http://localhost:9300/iris/v1beta1/lens/instance \
  -H "Authorization: Bearer $LENS_ADMIN_TOKEN"
```

Retention lives in two places, so change both together:

1. Set the new windows in `instance.retention` in `lens-values.yaml`, and run `helm upgrade`. The data plane stamps content expiry from `contentTTL` as rendered here.
1. Send the same windows, in seconds, to the control plane. A supplied `retention` replaces the stored one, so include all three fields:

    ```bash
    curl -sS -X PATCH http://localhost:9300/iris/v1beta1/lens/instance \
      -H "Authorization: Bearer $LENS_ADMIN_TOKEN" \
      -H 'Content-Type: application/json' \
      -d '{"retention":{"streamTrimSeconds":86400,"contentTtlSeconds":259200,"indexRetentionSeconds":1209600}}'
    ```

The windows must satisfy `streamTrimSeconds` < `contentTtlSeconds` ≤ `indexRetentionSeconds`. The control plane records `instance.retention` only when it creates the instance, so `helm upgrade` never changes what the instance record reports.

## Connect the console

The Iris console reads Lens through its gateway, which forwards to the data-plane Service root. Add a `lens` entry to the console gateway's `products`, with `instanceId` set to your `instance.id`:

```yaml
products:
  - key: lens
    label: Lens
    product: lens
    authScheme: bearer
    healthPath: /health/readiness
    instanceId: default
    upstream:
      host: lens-redis-lens-dataplane.<namespace-name>.svc.cluster.local
      port: 9000
      basePath: ""
      scheme: http
```

<!-- TODO: link the self-managed Iris console guide when it exists. -->

Without sign-in, the console asks each reader for a read key. With [operator sign-in](/content/operate/iris/lens/self-managed/authentication.md#operator-sign-in), it uses the operator's IdP token.

## Update Secrets

When you change a Secret's content, update its `existingSecretChecksum` in the values and run `helm upgrade`, so the pods roll and read it. This applies to the storage, license, CA bundle, and token Secrets. For the tokens both releases share, see [Rotate credentials](/content/operate/iris/lens/self-managed/authentication.md#rotate-credentials).

## Back up the deployment

Back up the metadata Redis, which holds the instance record, and the records and content databases, which hold your agents' turns. Back up the Identity Service's metadata too, so API keys survive a restore. Keep the Secrets and values files in your secret store and source control.

## Upgrade the chart

```bash
helm repo update redis-ai
helm upgrade lens redis-ai/redis-lens \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f lens-values.yaml \
  --wait --timeout 5m
```

The admin token and instance survive upgrades. Check readiness afterward. If you turned on operator sign-in, the upgrade notes repeat the audience that IdP tokens must carry.

## Uninstall the chart

```bash
helm uninstall lens --namespace <namespace-name>
```

Uninstalling doesn't delete the Redis databases, the Secrets you created, or the Identity Service release. The chart keeps the generated admin token Secret, so delete it yourself if you don't plan to reinstall. Revoke the Lens API keys on the Identity Service.

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Rendering fails with a named message | A required value is missing or invalid. See [Helm values that stop an install](/content/operate/iris/lens/self-managed/prerequisites.md#helm-values-that-stop-an-install). |
| A pod exits with `redis url list is empty` and a role name | The storage Secret omits that role. Add it to the named file and update `storage.existingSecretChecksum`. |
| Index creation fails with an error naming the records database | The records database is Redis Flex, or lacks Redis Search or Redis JSON. Use a RAM database with both modules. |
| A pod doesn't start, or readiness stays false | The license is missing, invalid, or in its grace period. Check the license Secret. |
| Pods report `ImagePullBackOff` | The image tag doesn't exist or the cluster can't reach the registry. Check the tags and `imagePullSecrets`. |
| Agents get `503` on ingest | `ingest.enabled` is `false`. |
| API keys fail with `401`, operator tokens work | The data plane can't reach the Identity Service, or its runtime credential doesn't match. Check `dataplane.identityServiceBaseURL`, the shared Secret, and the data-plane logs. |
| Creating a key fails grant validation | The Identity Service can't reach the control plane, or the internal token doesn't match. Check `productValidation.products.lens.baseURL` and the shared Secret. |
| An ingest key gets `403` on reads | Expected. Reads need a `read` or `full` key. |
| Operator tokens fail, API keys work | The data plane can't reach `jwksURI`, or the token's `iss` or `aud` doesn't match `issuer` or `auth.oidc.audience` (`401`). An unmapped role or another tenant gets `403`. |
| Operator tokens fail right after the IdP rotated its signing keys | The data plane refreshes keys at most once every 30 seconds. Wait and retry. |
| An operator token gets `403` on ingest | Expected. Ingest always needs an API key. |
