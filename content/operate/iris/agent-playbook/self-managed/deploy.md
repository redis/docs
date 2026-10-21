---
Title: Deploy self-managed Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Install the Agent Playbooks Helm chart and verify its services.
linkTitle: Deploy
weight: 40
hideListLinks: true
---

Install the control plane, data plane, and Identity Service with the `redis-agent-playbook` Helm chart.

Prepare the files in [Configuration]({{< relref "/operate/iris/agent-playbook/self-managed/configuration" >}}) and save your [license]({{< relref "/operate/iris/agent-playbook/self-managed/prerequisites#required-software-and-access" >}}) as `license`.

## Create the namespace

Confirm the target Kubernetes context:

```bash
kubectl config current-context
```

Create the namespace in that cluster:

```bash
export PLAYBOOK_NAMESPACE='<namespace-name>'
kubectl create namespace "$PLAYBOOK_NAMESPACE"
```

## Create prerequisite Secrets

1. Create the storage Secret from the two configuration files:

   ```bash
   kubectl -n "$PLAYBOOK_NAMESPACE" create secret generic playbook-storage \
     --from-file=playbook-storage.yaml=./playbook-storage.yaml \
     --from-file=identity-service-metadata.yaml=./identity-service-metadata.yaml
   ```

2. Create the license Secret:

   ```bash
   kubectl -n "$PLAYBOOK_NAMESPACE" create secret generic playbook-license \
     --from-file=license=./license
   ```

3. Create the embedding configuration Secret:

   ```bash
   kubectl -n "$PLAYBOOK_NAMESPACE" create secret generic playbook-inference \
     --from-file=inference.yaml=./inference.yaml
   ```

If your dependencies use a private certificate authority, also [create its CA Secret]({{< relref "/operate/iris/agent-playbook/self-managed/configuration#trust-a-private-ca" >}}).

## Install the chart

1. Add the Redis AI Helm repository:

   ```bash
   helm repo add redis-ai https://helm.redis.io/ai
   ```

2. Refresh the chart index:

   ```bash
   helm repo update redis-ai
   ```

3. Set the chart version from the approved release manifest:

   ```bash
   export PLAYBOOK_CHART_VERSION='<chart-version>'
   ```

   The matching chart is not published yet. Do not substitute the development version from the source chart.

4. Install the pinned chart with the prepared values:

   ```bash
   helm install playbook redis-ai/redis-agent-playbook \
     --version "$PLAYBOOK_CHART_VERSION" \
     --namespace "$PLAYBOOK_NAMESPACE" \
     -f playbook-values.yaml \
     --wait --timeout 10m
   ```

   This creates `playbook-controlplane`, `playbook-dataplane`, and `playbook-identity-service` because the values set `fullnameOverride: playbook`.

## Verify the deployment

1. Check service pods:

   ```bash
   kubectl -n "$PLAYBOOK_NAMESPACE" get pods \
     -l app.kubernetes.io/instance=playbook
   ```

2. Run the chart's checks:

   ```bash
   helm test playbook --namespace "$PLAYBOOK_NAMESPACE" --logs
   ```

   These checks verify service readiness and the configured security profile. Complete the [API examples]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples" >}}) to verify provisioning and application access.

## Connect to the APIs

For local verification, replace `<namespace-name>` in each command. Run each command in a separate terminal and leave it running:

```bash
kubectl -n '<namespace-name>' port-forward svc/playbook-controlplane 9200:9200
```

```bash
kubectl -n '<namespace-name>' port-forward svc/playbook-dataplane 9201:9201
```

```bash
kubectl -n '<namespace-name>' port-forward svc/playbook-identity-service 9202:9200
```

Read the [administrative credentials]({{< relref "/operate/iris/agent-playbook/self-managed/authentication#read-the-bootstrap-credentials" >}}), then [create a playbook and keys]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples" >}}).

Rerun the port-forward after its selected pod is replaced. See [kubectl port-forward](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_port-forward/) for session behavior.
