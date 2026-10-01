---
title: Deploy Redis Agent Playbooks with Helm
description: Install Agent Playbooks on Kubernetes, connect to the services, and prepare an application connection.
linkTitle: Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
weight: 25
hideListLinks: true
bannerText: Documentation review draft. The Helm chart release and supported deployment versions require confirmation.
bannerChildren: true
---

Deploy Agent Playbooks on Kubernetes with Helm, then create a playbook and keys for your application. The chart runs the control plane, data plane, and Identity Service. You provide Redis, an embedding provider, and a license.

{{< note >}}
Chart publication is pending. For now, use the chart archive and matching images supplied with your release bundle. The repository installation commands apply after `redis-ai/redis-playbook` is published.
{{< /note >}}

## Prepare the dependencies

You need Helm 3, `kubectl` access to a Kubernetes cluster, and:

| Dependency | Requirement |
|:-----------|:------------|
| Metadata Redis | Core Redis with Lua support. |
| Content Redis | A physically separate Redis deployment with JSON and vector search support. Separate logical databases on one deployment are insufficient. |
| Embeddings | A configured provider, model, dimensions, and provider credentials. There is no default model. |
| Release artifacts | Compatible versions of the chart, Playbooks images, and Identity Service image, plus a valid license. |

Use authenticated, certificate-verified Transport Layer Security (TLS) for production connections. The chart does not create Redis, ingress, certificates, or a license. The local access steps in this guide use Kubernetes port-forwarding.

## Prepare the configuration

1. Create a namespace, or use an existing `redis-ai` namespace:

   ```sh
   kubectl create namespace redis-ai
   ```

1. Download [prerequisites.yaml]({{< relref "/operate/iris/agent-playbooks/" >}}prerequisites.yaml). Replace every placeholder with your Redis connections, license, provider key, and four distinct service credentials.

   The template uses separate users for Playbooks metadata and Identity Service metadata. It illustrates OpenAI `text-embedding-3-small` with 1,536 dimensions; confirm that provider and model with your service release, or replace the model and its client configuration together. Mount an additional trusted certificate authority through `tls.caCertSecret` if your connections require one.

1. Create the Secrets:

   ```sh
   kubectl --namespace redis-ai apply -f prerequisites.yaml
   ```

   Keep the populated file out of source control. For production, manage these values through your secret-management system.

1. Download [deployment-values.yaml]({{< relref "/operate/iris/agent-playbooks/" >}}deployment-values.yaml). Replace the tenant and image-version placeholders with values from your release. Keep its model identity identical to the inference Secret. Playbooks and Identity Service have separate version numbers.

The four service credentials are the control-plane administrator token, control-plane internal token, Identity Service control token, and Identity Service runtime token. Application keys are issued after installation. Do not reuse a value between credential roles.

## Install the chart

For a supplied release bundle, use its dependency-complete chart archive:

```sh
export PLAYBOOK_CHART='<path-to-release-chart.tgz>'
helm upgrade --install playbook "$PLAYBOOK_CHART" \
  --namespace redis-ai \
  --values deployment-values.yaml --wait
```

Verify the bundle's checksums first. Use its image repositories and versions if they differ from the planned public repositories in the values file.

After chart publication, you can install from the repository instead:

1. Add the Redis chart repository:

   ```sh
   helm repo add redis-ai https://helm.redis.io/ai
   ```

1. Refresh the index:

   ```sh
   helm repo update
   ```

1. Select a version listed by `helm search repo redis-ai/redis-playbook --versions --devel`:

   ```sh
   export PLAYBOOK_CHART_VERSION='<published-chart-version>'
   ```

1. Install the selected version:

   ```sh
   helm upgrade --install playbook redis-ai/redis-playbook \
     --version "$PLAYBOOK_CHART_VERSION" \
     --namespace redis-ai \
     --values deployment-values.yaml --wait
   ```

Run the chart's checks:

```sh
helm test playbook --namespace redis-ai
```

Continue when `helm test` succeeds; publishing and retrieval verify the application path next.

## Connect locally

The supplied values set `fullnameOverride: playbook`, which gives these services stable names. Keep each port-forward running in a separate terminal:

```sh
kubectl --namespace redis-ai port-forward service/playbook-controlplane 9200:9200
```

```sh
kubectl --namespace redis-ai port-forward service/playbook-dataplane 9201:9201
```

```sh
kubectl --namespace redis-ai port-forward service/playbook-identity-service 9202:9200
```

In your working shell, set the endpoints:

```sh
export PLAYBOOK_CONTROL_URL='http://127.0.0.1:9200'
export PLAYBOOK_URL='http://127.0.0.1:9201'
export PLAYBOOK_IDENTITY_URL='http://127.0.0.1:9202'
```

These addresses work while the port-forwards are running. For remote clients, configure an HTTPS endpoint for the data plane and keep administrative endpoints private.

## Create an application connection

Continue with [Create a playbook and keys]({{< relref "/operate/iris/agent-playbooks/authentication" >}}), then [publish your first skill]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart" >}}). The [control-plane API reference]({{< relref "/operate/iris/agent-playbooks/control-plane-api-reference" >}}) defines provisioning and policy requests.

<!-- TODO: Replace the chart-availability note after publication; confirm the release/version matrix, image references, license acquisition, provider support, and the complete installation against release artifacts. -->
