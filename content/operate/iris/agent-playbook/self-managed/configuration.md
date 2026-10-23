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

These examples use release `playbook` and `fullnameOverride: playbook`. Set the unreleased chart and image versions from the approved release manifest.

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

The [deploy procedure]({{< relref "/operate/iris/agent-playbook/self-managed/deploy#create-prerequisite-secrets" >}}) creates separate Secrets for Playbook storage and the standalone Identity Service metadata.

## Embedding configuration

Put endpoints and provider credentials in `inference.yaml`. Helm values contain only the model identity.

This example uses an OpenAI-compatible connection named `private-embeddings`. Use the provider and model approved for your deployment. The connection name must match `provider` in `inference.models`.

Save `inference.yaml`:

```yaml
embedders_connection_details:
  private-embeddings:
    protocol: openai
    base_url: https://<embedding-provider-host>/v1
    credentials:
      type: static
      api_key: <embedding-provider-api-key>
    http_client:
      timeout: 30s
      max_retry_attempts: 3
    batching:
      embeddings:
        enabled: true
```

The private endpoint and credential reach only the data plane. Preserve the provider, model, and dimension identity when changing connection settings. A vector-space change requires a new playbook.

## Helm values

Save `playbook-values.yaml`, replacing `<tenant-id>` with the deployment's tenant identifier:

```yaml
fullnameOverride: playbook
tenantId: <tenant-id>

controlplane:
  image:
    tag: <playbook-control-plane-image-tag>
  internalToken:
    existingSecret: playbook-controlplane-internal

dataplane:
  image:
    tag: <playbook-data-plane-image-tag>
  identityServiceBaseURL: https://<identity-service-tls-endpoint>

identityService:
  credential:
    existingSecret: playbook-dp-credential

storage:
  existingSecret: playbook-storage

license:
  existingSecret: playbook-license

inference:
  existingSecret: playbook-inference
  models:
    - provider: private-embeddings
      model: <embedding-model-name>
      dimensions: <embedding-dimensions>

tests:
  enabled: true
```

Use image tags from the approved release manifest. The shared internal and runtime credentials must match the standalone Identity Service values. See [service credentials]({{< relref "/operate/iris/agent-playbook/self-managed/authentication#supply-service-credentials" >}}).

Save `identity-values.yaml` for the separate Identity Service release, using the same tenant as Playbook:

```yaml
fullnameOverride: playbook-identity-service
image:
  tag: <identity-service-image-tag>
metadata:
  existingSecret: playbook-identity-metadata
runtime:
  apiKeyTenant:
    singleTenantID: <tenant-id>
  serviceCredentials:
    - name: playbook-dp
      subject: playbook-dp
      allowedOperations: [api-key-introspect]
      allowedProducts: [playbook]
      existingSecret: playbook-dp-credential
      secretKey: token
productValidation:
  products:
    playbook:
      baseURL: https://<playbook-control-plane-tls-endpoint>
      credential:
        existingSecret: playbook-controlplane-internal
        secretKey: token
```

Provide certificate-verified routes to both configured TLS endpoints; the charts do not create TLS termination. Identity Service validates playbook grants through the control-plane endpoint. Configure it before installing, then wait for both releases and their routes before minting application keys.

An existing Identity Service release can also serve Playbook. Merge the `playbook-dp` runtime credential and `playbook` validator into its existing lists and maps instead of replacing other products' configuration. Set `dataplane.identityServiceBaseURL` to that release's endpoint. Its single-tenant policy must match Playbook's `tenantId`.

| Area | Values | Purpose |
| --- | --- | --- |
| Tenant | `tenantId` | Tenant shared by this deployment and its application grants. |
| Storage | `storage.existingSecret`, `storage.playbookKey`, `storage.keyPrefix`, `storage.maxPlaybooksPerTenant` | Storage Secret, key namespace, and tenant inventory limit. The default maximum is 128 playbooks. |
| Storage rollout | `storage.existingSecretChecksum` | Roll consuming pods after the storage Secret changes. |
| License | `license.existingSecret`, `license.secretKey`, `license.existingSecretChecksum` | License Secret and rollout marker. The default key is `license`. |
| Embeddings | `inference.models`, `inference.existingSecret`, `inference.secretKey`, `inference.existingSecretChecksum` | Public model identities and private configuration. The default Secret key is `inference.yaml`. |
| Images | `controlplane.image.*`, `dataplane.image.*`, `imagePullSecrets` | Pin or mirror the release images. |
| Capacity | `controlplane.replicaCount`, `dataplane.replicaCount`, each component's `resources` | Service replicas and Kubernetes resource requests and limits. |
| Services | `controlplane.service.*`, `dataplane.service.*`, standalone Identity Service `service.*` | Service type and port. |
| Service connections | `dataplane.identityServiceBaseURL`, standalone `productValidation.products.playbook.baseURL` | Connect the data plane to Identity Service and Identity Service to the control-plane validator. |
| Private certificate authority | `tls.caCertSecret`, `tls.caCertSecretChecksum` | Trust additional certificate authorities and roll pods when they change. |
| Operator OpenID Connect (OIDC) | `auth.oidc.audience`, `dataplane.oidc`, `controlplane.oidc`, standalone `controlAuth` | Validate operator identity provider tokens. |
| Security | `serviceAccount`, `security.profile`, pod security contexts | Configure workload identity and the optional FIPS-oriented profile. |
| Tracing | `tracing.enabled`, `tracing.otlpGRPCEndpoint`, `tracing.capture` | Send OpenTelemetry spans to a deployment-owned collector. |
| Extraction | `extraction`, `worker` | Connect Redis Agent Memory and run optional background FAQ extraction. |
| Chart checks | `tests.enabled` | Render the health and security-profile test resources used by `helm test`. |

After the matching chart is published, use `helm show values redis-ai/redis-agent-playbook --version "$PLAYBOOK_CHART_VERSION"` for the complete values file.

## Trust a private CA

If Redis or another dependency uses a private CA, save its CA certificate as `ca.crt` and create a Secret in the deployment namespace:

```bash
kubectl -n '<namespace-name>' create secret generic playbook-redis-ca \
  --from-file=ca.crt=./ca.crt
```

Add this to both `playbook-values.yaml` and `identity-values.yaml` before installing:

```yaml
tls:
  caCertSecret: playbook-redis-ca
```

The chart mounts the CA for all enabled workloads. Keep certificate verification enabled.

## Configure security and tracing

Set `security.profile: fips` only with images built for the Federal Information Processing Standards (FIPS) profile. Storage URLs must use `rediss://`. Set explicit HTTPS values for `dataplane.identityServiceBaseURL` and standalone `productValidation.products.playbook.baseURL`. The profile configures the processes but does not provide Transport Layer Security (TLS) termination or establish compliance by itself.

To export traces, configure a trusted local OpenTelemetry Protocol (OTLP) collector:

```yaml
tracing:
  enabled: true
  otlpGRPCEndpoint: <collector-host>:4317
  capture: none
```

The exporter uses plaintext gRPC for the collector hop. Keep the collector on a trusted network. `tracing.capture` affects data-plane serving traces only.

## Playbook settings

Select a configured embedding model when [creating a playbook]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples#create-a-playbook" >}}). Use the control plane to update retrieval settings and proposal review policy.

See the [control-plane API reference]({{< relref "/operate/iris/agent-playbook/self-managed/control-plane-api-reference" >}}) for fields and limits, and [Retrieval]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval" >}}) for how applications use these settings.
