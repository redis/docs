---
Title: Operate self-managed Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check health, rotate keys, maintain Secrets, back up storage, and upgrade Agent Playbooks.
linkTitle: Operations
weight: 90
hideListLinks: true
---

## Check service health

With the [local port-forwards]({{< relref "/operate/iris/agent-playbook/self-managed/deploy#connect-to-the-apis" >}}) running:

```bash
curl --fail-with-body --silent --show-error http://localhost:9200/v1/health/ready
curl --fail-with-body --silent --show-error http://localhost:9201/v1/health/ready
curl --fail-with-body --silent --show-error http://localhost:9202/v1/health/ready
```

Inspect pods and the affected service's logs when readiness fails:

```bash
kubectl -n "$PLAYBOOK_NAMESPACE" get pods -l app.kubernetes.io/instance=playbook
kubectl -n "$PLAYBOOK_NAMESPACE" describe pod <pod-name>
kubectl -n "$PLAYBOOK_NAMESPACE" logs deploy/<deployment-name>
```

Find deployment names in [Deploy]({{< relref "/operate/iris/agent-playbook/self-managed/deploy#install-the-chart" >}}). Redact credentials and content before sharing logs or configuration.

| Symptom | Check |
| --- | --- |
| `Pending` or `ImagePullBackOff` | Pod events, cluster capacity, release image tags, registry access, and `imagePullSecrets`. |
| Readiness fails | Service logs, Redis reachability, Secret keys, and license entitlement/expiry. For an unknown certificate authority, [configure the CA Secret]({{< relref "/operate/iris/agent-playbook/self-managed/configuration#trust-a-private-ca" >}}). |
| Application receives `401` | Send its current API-key token, not an administrative or service token. Check expiry, rotation, and revocation. |
| Application receives `403` | Check the key's tenant, playbook identifier, and action grants in [Authentication and access]({{< relref "/operate/iris/agent-playbook/self-managed/authentication#tenant-and-grant-scope" >}}). |
| Embedding requests fail | Check provider reachability, credentials, and matching model settings in [Configuration]({{< relref "/operate/iris/agent-playbook/self-managed/configuration#embedding-configuration" >}}). |

## Rotate or revoke application keys

Use the Identity Service control token and connection values from [API examples]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples" >}}).

Rotate a key with a one-hour grace period:

```bash
umask 077
curl --fail-with-body --silent --show-error \
  -X POST "$IDENTITY_URL/v1/api-keys/<key-id>/rotate?graceSeconds=3600" \
  -H "Authorization: Bearer $IDENTITY_CONTROL_TOKEN" > rotated-key.json
```

Store the returned token and update its consumers before the grace period ends.

Revoke a key:

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$IDENTITY_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IDENTITY_CONTROL_TOKEN"
```

Key validation is cached. The chart's `identityService.runtimeCache.hardTTLSeconds` defaults to 300 seconds. Allow for cached access decisions and verify that the old credential is denied before treating revocation as complete.

## Suspend or remove a playbook

Suspend a playbook to stop runtime access and retain its content and configuration:

```bash
curl --fail-with-body --silent --show-error \
  -X PATCH "$PLAYBOOK_CONTROL_URL/v1/playbooks/$PLAYBOOK_ID" \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"state":"suspended"}'
```

Resume by changing `state` to `ready`.

Deleting a playbook permanently removes its content and configuration. Back up what you need and revoke its application keys before deletion:

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_CONTROL_URL/v1/playbooks/$PLAYBOOK_ID" \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN"
```

## Update configuration and license Secrets

Update an existing Secret from its source files. For example, update storage configuration:

```bash
kubectl -n "$PLAYBOOK_NAMESPACE" create secret generic playbook-storage \
  --from-file=playbook-storage.yaml=./playbook-storage.yaml \
  --from-file=identity-service-metadata.yaml=./identity-service-metadata.yaml \
  --dry-run=client -o yaml | kubectl apply -f -
```

Calculate the updated Secret payload's checksum:

{{< multitabs id="playbook-storage-checksum" tab1="Linux" tab2="macOS" >}}

```bash
kubectl -n "$PLAYBOOK_NAMESPACE" get secret playbook-storage -o json \
  | jq -cS '.data' | sha256sum | awk '{print $1}'
```

-tab-sep-

```bash
kubectl -n "$PLAYBOOK_NAMESPACE" get secret playbook-storage -o json \
  | jq -cS '.data' | shasum -a 256 | awk '{print $1}'
```

{{< /multitabs >}}

Copy it into `storage.existingSecretChecksum` in `playbook-values.yaml` and [upgrade the chart]({{< relref "/operate/iris/agent-playbook/self-managed/operations#upgrade-the-chart" >}}) to roll its consumers. The checksum triggers rollout; it does not validate integrity. Use the same pattern for license and inference Secrets.

For service credentials, update the Secret and its `existingSecretChecksum` for affected services. For immutable Secrets, create a new name and update the reference.

## Back up the deployment

- Back up metadata Redis, including playbook configuration and Identity Service records.
- Back up content Redis, including playbook content and search indexes.
- Preserve the values, configuration, license material, and secret-manager records needed to recreate the services.

Coordinate metadata and content snapshots. A metadata-only restore cannot recover authored content. Validate restore procedures in an isolated environment before relying on them for recovery.

<!-- TODO: Add a qualified backup/restore procedure and supported recovery guarantees for the launch release. -->

## Upgrade the chart

Review the target release's configuration and compatibility requirements. Keep its packaged image versions together and recalculate checksums for changed Secrets.

```bash
helm upgrade playbook redis-ai/redis-agent-playbook \
  --version <chart-version> \
  --namespace "$PLAYBOOK_NAMESPACE" \
  -f playbook-values.yaml \
  --wait --timeout 10m
```

Check all service rollouts:

```bash
kubectl -n "$PLAYBOOK_NAMESPACE" rollout status deploy/playbook-controlplane
kubectl -n "$PLAYBOOK_NAMESPACE" rollout status deploy/playbook-dataplane
kubectl -n "$PLAYBOOK_NAMESPACE" rollout status deploy/playbook-identity-service
helm test playbook --namespace "$PLAYBOOK_NAMESPACE" --logs
```

Reconnect [local port-forwards]({{< relref "/operate/iris/agent-playbook/self-managed/deploy#connect-to-the-apis" >}}), then repeat [application-access checks]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples#verify-application-access" >}}). Review release compatibility before rollback; Helm does not restore Redis data.

<!-- TODO: Add administrative clearing and extraction operations after their launch API/configuration alignment is reviewed. Do not infer their availability from newer service source. -->
