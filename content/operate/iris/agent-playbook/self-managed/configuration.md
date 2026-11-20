---
Title: Configure self-managed Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Prepare the storage and embedding Secrets, the playbook values, private CA trust, and tracing for Agent Playbooks in a redis-iris suite release.
linkTitle: Configuration
weight: 30
hideListLinks: true
---

The `redis-iris` chart `1.0.0` renders the Agent Playbooks control-plane and data-plane configuration from the `playbook:` values in `iris-values.yaml`. Storage URLs and provider credentials stay in Secrets you create. The suite supplies the tenant, the license, and the Identity Service connection and credentials, as [Add the Agent Playbooks values](/content/operate/iris/agent-playbook/self-managed/deploy.md#2-add-the-agent-playbooks-values) lists.

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

The control plane and data plane both mount this file. The metadata and content Redis must be two different Redis deployments. The Identity Service's metadata Redis is one of the suite's shared Secrets: see [Service Secrets and Redis databases](/content/operate/iris/self-managed/_index.md#service-secrets-and-redis-databases).

The [deploy steps](/content/operate/iris/agent-playbook/self-managed/deploy.md#1-create-the-agent-playbooks-secrets) put each file in its own Secret.

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

Add the Agent Playbooks values to `iris-values.yaml`:

```yaml
playbook:
  storage:
    existingSecret: playbook-storage
  inference:
    existingSecret: playbook-inference
    models:
      - provider: openai
        model: <embedding-model-name>
        dimensions: <embedding-dimensions>
```

- `storage.existingSecret` names the Secret that holds `playbook-storage.yaml`.
- `inference.models` lists each embedding model the deployment offers. `inference.existingSecret` holds `inference.yaml`, and isn't needed when every model is `noop`.
- The suite generates the admin token as the Secret `iris-playbook-admin-token`. See [Credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#credentials).

The suite fixes the Service names to `redis-agent-playbook-controlplane` (port `9200`) and `redis-agent-playbook-dataplane` (port `9201`).

The install fails with a named message when a required value is missing: `playbook.storage.existingSecret`, `playbook.inference.models`, and `playbook.inference.existingSecret` when a model's provider isn't `noop`. It also fails when you set a value the suite derives. Keep every credential value distinct, even in differently named Secrets.

For every value and its default, see the [configuration reference](/content/operate/iris/agent-playbook/self-managed/reference.md#configuration-reference), or run:

```bash
helm show values redis-ai/redis-iris --version 1.0.0
```

## Trust a private CA

If Redis or another dependency uses a private CA, save the CA certificates as `ca.crt` and create a Secret in the deployment namespace:

```bash
kubectl -n <namespace-name> create secret generic playbook-ca \
  --from-file=ca.crt=./ca.crt
```

Set `global.tls.caCertSecret: playbook-ca` for every service, or `playbook.tls.caCertSecret: playbook-ca` for Agent Playbooks only. If you set both, they must name the same Secret, or the render fails. The chart mounts the CA at `/etc/ssl/custom` in every container, on top of the system CAs. Keep certificate verification enabled.

## Configure tracing

The Federal Information Processing Standards (FIPS) profile isn't supported in `redis-iris` `1.0.0`. See [Not supported in this release](/content/operate/iris/self-managed/_index.md#not-supported-in-this-release).

To export traces from the control plane, data plane, and extraction worker, configure a trusted OpenTelemetry Protocol (OTLP) collector:

```yaml
playbook:
  tracing:
    enabled: true
    otlpGRPCEndpoint: <collector-host>:4317
    capture: none
```

The exporter uses plaintext gRPC for the collector hop, so keep the collector on a trusted network. `tracing.capture: received` adds bounded query and returned content to data-plane serving spans; `tracing.capture` doesn't affect the control plane or worker.

## Playbook settings

Select a configured embedding model when you [create a playbook](/content/operate/iris/agent-playbook/self-managed/api-examples.md#create-a-playbook). Use the control plane to update discovery settings and the proposal review policy. When you omit them, a playbook uses FAQ and skill minimum scores of `0.7`, at most 10 results, a review window of 2,592,000 seconds (30 days), and at most 5,000 open proposals.

`playbook.storage.maxPlaybooksPerTenant` limits how many playbooks the tenant can hold. The default is `128`.

See the [control-plane API reference](/content/operate/iris/agent-playbook/self-managed/control-plane-api-reference.md) for fields and limits, and [Retrieval](/content/develop/ai/context-engine/agent-playbooks/retrieval.md) for how applications use these settings.
