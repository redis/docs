---
Title: Configure self-managed Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Prepare Helm values and private storage and embedding configuration for Agent Playbooks.
linkTitle: Configuration
weight: 30
hideListLinks: true
---

These examples use chart `0.1.0-alpha.3`, release `playbook`, and `fullnameOverride: playbook`.

## Storage configuration

Save `playbook-storage.yaml` with the two Redis endpoints:

```yaml
storage:
  metadata:
    urls:
      - rediss://<metadata-user>:<metadata-password>@<metadata-host>:6379
  content:
    urls:
      - rediss://<content-user>:<content-password>@<content-host>:6379
```

Save `identity-service-metadata.yaml` for the Identity Service. Use the metadata deployment, with credentials for its own Redis user:

```yaml
metadata:
  urls:
    - rediss://<identity-user>:<identity-password>@<metadata-host>:6379
```

The [deploy procedure]({{< relref "/operate/iris/agent-playbook/self-managed/deploy#create-prerequisite-secrets" >}}) puts both files in one Secret under the chart's expected keys.

## Embedding configuration

Put endpoints and provider credentials in `inference.yaml`. Helm values contain only the model identity.

This example uses OpenAI `text-embedding-3-small` with 1,536 dimensions. Use the provider and model approved for your deployment, and keep the identity identical to `inference.models` in Helm values.

Save `inference.yaml`:

```yaml
inference:
  models:
    - provider: openai
      model: text-embedding-3-small
      dimensions: 1536
      client:
        endpoint:
          base_url: https://api.openai.com/v1
        credentials:
          type: static
          api_key: <embedding-provider-api-key>
```

This file format belongs to chart `0.1.0-alpha.3`. Review the configuration format when updating the chart and images.

<!-- TODO: Update the private embedding configuration for the launch release's connection format. Confirm supported provider configurations before adding more examples. -->

## Helm values

Save `playbook-values.yaml`, replacing `<tenant-id>` with the deployment's tenant identifier:

```yaml
fullnameOverride: playbook
tenantId: <tenant-id>

storage:
  existingSecret: playbook-storage

license:
  existingSecret: playbook-license

inference:
  existingSecret: playbook-inference
  models:
    - provider: openai
      model: text-embedding-3-small
      dimensions: 1536

tests:
  enabled: true
```

The chart supplies matching image versions and generates the service credentials. Set [existing credential Secrets]({{< relref "/operate/iris/agent-playbook/self-managed/authentication#supply-service-credentials" >}}) if you manage those credentials externally.

| Area | Values | Purpose |
| --- | --- | --- |
| Tenant | `tenantId` | Tenant shared by this deployment and its application grants. |
| Storage | `storage.existingSecret`, `storage.playbookKey`, `storage.identityServiceKey` | Secret containing the Playbook and Identity Service Redis configuration. |
| Storage rollout | `storage.existingSecretChecksum` | Roll consuming pods after the storage Secret changes. |
| License | `license.existingSecret`, `license.secretKey`, `license.existingSecretChecksum` | License Secret and rollout marker. The default key is `license`. |
| Embeddings | `inference.models`, `inference.existingSecret`, `inference.secretKey`, `inference.existingSecretChecksum` | Public model identities and private configuration. The default Secret key is `inference.yaml`. |
| Images | `controlplane.image.*`, `dataplane.image.*`, `identityService.image.*`, `imagePullSecrets` | Pin or mirror the release images. |
| Capacity | `controlplane.replicaCount`, `dataplane.replicaCount`, `identityService.replicaCount`, each component's `resources` | Service replicas and Kubernetes resource requests and limits. |
| Services | `controlplane.service.*`, `dataplane.service.*`, `identityService.service.*` | Service type and port. |
| Service connections | `dataplane.identityServiceBaseURL`, `identityService.playbookControlPlaneBaseURL` | Override the chart's in-cluster service endpoints. |
| Private certificate authority | `tls.caCertSecret`, `tls.caCertSecretChecksum` | Trust additional certificate authorities and roll pods when they change. |
| Chart checks | `tests.enabled` | Render the health and security-profile test resources used by `helm test`. |

Use `helm show values redis-ai/redis-agent-playbook --version 0.1.0-alpha.3` for the complete values file.

## Trust a private CA

If Redis or another dependency uses a private CA, save its CA certificate as `ca.crt` and create a Secret in the deployment namespace:

```bash
kubectl -n '<namespace-name>' create secret generic playbook-redis-ca \
  --from-file=ca.crt=./ca.crt
```

Add this to `playbook-values.yaml` before installing:

```yaml
tls:
  caCertSecret: playbook-redis-ca
```

The chart mounts the CA for all three services. Keep certificate verification enabled.

## Playbook settings

Select a configured embedding model when [creating a playbook]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples#create-a-playbook" >}}). Use the control plane to update retrieval settings and proposal review policy.

See the [control-plane API reference]({{< relref "/operate/iris/agent-playbook/self-managed/control-plane-api-reference" >}}) for fields and limits, and [Retrieval]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval" >}}) for how applications use these settings.
