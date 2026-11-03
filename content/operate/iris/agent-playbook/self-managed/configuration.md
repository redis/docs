---
Title: Configure self-managed Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Prepare Helm values, the storage and embedding Secrets, Identity Service connection settings, private CA trust, security, and tracing for Agent Playbooks.
linkTitle: Configuration
weight: 30
hideListLinks: true
---

The chart renders the control-plane and data-plane configuration from Helm values. Storage URLs, provider credentials, the license, and tokens stay in existing Secrets. These examples use release `playbook`, `fullnameOverride: playbook`, tenant `default`, and chart `1.0.0`.

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

The control plane and data plane both mount this file. The Identity Service's metadata Redis belongs to the Identity Service release. Save `ids-metadata.yaml` for it, with credentials for its own Redis user:

```yaml
metadata:
  urls:
    - rediss://<identity-user>:<identity-password>@<metadata-host>:6379
```

The [deploy steps](/content/operate/iris/agent-playbook/self-managed/deploy.md#2-create-secrets) put each file in its own Secret.

## Embedding configuration

Put provider endpoints and credentials in `inference.yaml`. Helm values contain only the model identity.

Each key under `embedders_connection_details` names a connection. A model's `provider` in `inference.models` selects the connection with the same name. This example names the connection `openai`, which also lets the [Iris command-line interface (CLI)](/content/operate/iris/agent-playbook/self-managed/api-examples.md#use-the-iris-cli) create playbooks with it. Use the provider and model approved for your deployment.

Save `inference.yaml`:

```yaml
embedders_connection_details:
  openai:
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

The endpoint and credential reach only the data plane. The control plane receives only the public model list. A connection accepts `protocol` (defaults to the connection name), `base_url`, `azure`, `credentials`, `http_client`, `embedding_input_max_chars`, `embedding_input_fast_truncate`, and `batching.embeddings`. Batching is off unless you enable it.

When you change a connection, keep the vector space it serves. A model or dimension change needs a new playbook.

## Helm values

Save `playbook-values.yaml`:

```yaml
fullnameOverride: playbook
tenantId: default

controlplane:
  image:
    tag: "1.0.0"
  internalToken:
    existingSecret: playbook-controlplane-internal

dataplane:
  image:
    tag: "1.0.0"
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
    - provider: openai
      model: <embedding-model-name>
      dimensions: <embedding-dimensions>

tls:
  caCertSecret: playbook-ca

tests:
  enabled: true
```

- `tenantId` must equal `runtime.apiKeyTenant.singleTenantID` on the Identity Service release. Neither chart can check that the two match.
- `dataplane.identityServiceBaseURL` is the Identity Service release's TLS endpoint. The data plane checks agent keys there.
- `identityService.credential` is the data plane's runtime credential. Register the same Secret on the Identity Service release.
- `controlplane.internalToken` is the token the Identity Service presents when it validates grants. Register the same Secret on the Identity Service release.
- The chart generates the admin token and keeps it across upgrades unless you set `controlplane.adminToken.existingSecret`. See [Credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#credentials).
- `tls.caCertSecret` names the CA bundle that the planes trust for the Identity Service endpoint and other private endpoints. See [Trust a private CA](#trust-a-private-ca).
- `tests.enabled` adds the pods that `helm test` runs.

With `fullnameOverride: playbook`, the chart creates the Services `playbook-controlplane` and `playbook-dataplane`. Without it, names start with `<release>-redis-agent-playbook`.

The install fails with a named message when a required value is missing: the image tags, `tenantId`, the storage and license Secrets, at least one model, the Identity Service URL and credential, and a generated or existing Secret for each control-plane token. It also fails when two credentials reference the same Secret key. Keep every credential value distinct, even in differently named Secrets.

For every value and its default, see the [configuration reference](/content/operate/iris/agent-playbook/self-managed/reference.md#configuration-reference), or run:

```bash
helm show values redis-ai/redis-agent-playbook --version 1.0.0
```

### Isolated lab without TLS

For a network-isolated lab without the Federal Information Processing Standards (FIPS) profile, you can point the data plane at the in-cluster Identity Service Service instead of a TLS endpoint:

```yaml
dataplane:
  identityServiceBaseURL: http://ids-iris-identity-service:9200
identityService:
  allowInsecureTransport: true
  credential:
    existingSecret: playbook-dp-credential
```

On the Identity Service release, set `productValidation.products.playbook.baseURL: http://playbook-controlplane:9200`. Tokens travel over plaintext HTTP on these two hops; use TLS for production. The FIPS profile refuses this configuration.

### Identity Service in another namespace

The tested layout puts both releases in one namespace. If the Identity Service runs in another namespace:

- Point `dataplane.identityServiceBaseURL` at its fully qualified Service or TLS endpoint, for example `http://ids-iris-identity-service.<identity-namespace>.svc:9200`.
- Set its `productValidation.products.playbook.baseURL` to `http://playbook-controlplane.<namespace-name>.svc:9200`, or to that endpoint's TLS frontend.
- Provision both shared Secrets with the same values in both namespaces. A pod mounts Secrets only from its own namespace.
- Allow the Identity Service to reach the control plane on port `9200`, and both planes to reach the Identity Service.

## Trust a private CA

If Redis, the Identity Service endpoint, or another dependency uses a private CA, save the CA certificates as `ca.crt` and create a Secret in the deployment namespace:

```bash
kubectl -n <namespace-name> create secret generic playbook-ca \
  --from-file=ca.crt=./ca.crt
```

Set `tls.caCertSecret: playbook-ca` in `playbook-values.yaml`. The chart mounts the CA at `/etc/ssl/custom` in every container, on top of the system CAs. Keep certificate verification enabled.

## Configure security and tracing

Set `security.profile: fips` only with images built for the FIPS profile and with all dependency transport ready:

```yaml
security:
  profile: fips
dataplane:
  identityServiceBaseURL: https://<identity-service-tls-endpoint>
tls:
  caCertSecret: playbook-ca
```

Under this profile:

- Storage URLs must use `rediss://`. Both planes check this at startup.
- `dataplane.identityServiceBaseURL` must be an `https://` endpoint, and the chart refuses `identityService.allowInsecureTransport`.
- On the Identity Service release, set its own `security.profile` and an `https://` validator URL for `productValidation.products.playbook.baseURL`.

The profile configures the processes. It does not provide TLS termination or establish compliance by itself; the workloads still listen on HTTP.

To export traces from the control plane, data plane, and extraction worker, configure a trusted OpenTelemetry Protocol (OTLP) collector:

```yaml
tracing:
  enabled: true
  otlpGRPCEndpoint: <collector-host>:4317
  capture: none
```

The exporter uses plaintext gRPC for the collector hop, so keep the collector on a trusted network. `tracing.capture: received` adds bounded query and returned content to data-plane serving spans; `tracing.capture` doesn't affect the control plane or worker.

## Playbook settings

Select a configured embedding model when you [create a playbook](/content/operate/iris/agent-playbook/self-managed/api-examples.md#create-a-playbook). Use the control plane to update discovery settings and the proposal review policy. When you omit them, a playbook uses FAQ and skill minimum scores of `0.7`, at most 10 results, a review window of 2,592,000 seconds (30 days), and at most 5,000 open proposals.

`storage.maxPlaybooksPerTenant` limits how many playbooks the tenant can hold. The default is `128`.

See the [control-plane API reference](/content/operate/iris/agent-playbook/self-managed/control-plane-api-reference.md) for fields and limits, and [Retrieval](/content/develop/ai/context-engine/agent-playbooks/retrieval.md) for how applications use these settings.
