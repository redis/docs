---
Title: Deploy the Identity Service
alwaysopen: false
categories:
- docs
- operate
- iris
description: Install the Identity Service with the redis-iris suite chart, check that it answers, and find the credentials the chart generates.
linkTitle: Deploy
weight: 50
hideListLinks: true
aliases:
- /operate/iris/identity-service/deploy/
---

The `redis-iris` suite chart installs the Identity Service, the Iris console, and the services you enable as one Helm release. It always installs the Identity Service, under the fixed name `iris-identity-service`, and the services find it by that name. These steps cover the Identity Service part of the [suite install](/content/operate/iris/self-managed/_index.md).

The examples use the release name `iris`. Before you begin, review the [prerequisites](/content/operate/iris/identity-service/self-managed/prerequisites.md).

## 1. Create the namespace

Use a namespace that holds only this release:

```bash
kubectl create namespace <namespace-name>
```

## 2. Create the metadata Secret

Create a Secret with the connection of your metadata Redis, under the key `metadata.yaml`. Use `rediss://` for TLS, and put the Redis user and password in the URL:

```bash
kubectl -n <namespace-name> create secret generic ids-metadata \
  --from-literal=metadata.yaml='metadata: {urls: ["rediss://<metadata-user>:<metadata-password>@<metadata-host>:<metadata-port>"]}'
```

Also create the shared Secrets that the [suite install](/content/operate/iris/self-managed/_index.md#2-create-the-shared-secrets) lists, and each enabled service's own Secrets.

## 3. Add the Identity Service values

Add these values to `iris-values.yaml`:

```yaml
global:
  iris:
    tenantId: default
identityService:
  metadata:
    existingSecret: ids-metadata
```

Choose the tenant ID before the first install. You can't change it later. See [Tenant](/content/operate/iris/identity-service/self-managed/configuration.md#tenant).

For a complete installation, start from the files in the chart's `examples/` directory: `memory-only.yaml`, `playbook.yaml`, `lens.yaml`, `context-gateway.yaml`, and `intent.yaml`. `single-product.yaml` shows one service with IdP sign-in in the console.

### What the chart sets for you

The suite chart derives these Identity Service settings. Don't set them under `identityService:`: a value that differs from the derived one fails the install and names the field.

- The name `iris-identity-service`, port `9200`, and a PodDisruptionBudget.
- The control token Secret, `iris-identity-service-control-token`.
- One runtime credential for each enabled data plane, for example `memory-dp`, with the `api-key-introspect` operation for its service only.
- One grant validator for each enabled control plane. See [Services](/content/operate/iris/identity-service/self-managed/configuration.md#services).
- The tenant, operator sign-in, and role bindings, from `global.iris`.
- The **API Keys** page of the Iris console, which calls the Identity Service.

The chart runs two Identity Service replicas by default. You can change `identityService.replicaCount`.

## 4. Run the preflight and install

Run the [suite preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight). Then pull the chart for its `examples/` directory, and install:

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm pull redis-ai/redis-iris --version <chart-version> --untar
helm install iris redis-ai/redis-iris \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f redis-iris/examples/memory-only.yaml \
  -f iris-values.yaml
```

Add an `-f redis-iris/examples/<service>.yaml` file for each other service you enable.

## 5. Check the installation

1. Port-forward the Identity Service in its own terminal, and leave it running:

   ```bash
   kubectl -n <namespace-name> port-forward svc/iris-identity-service 9200:9200
   ```

1. Check readiness. It checks the metadata Redis:

   ```bash
   curl -sS http://localhost:9200/health/readiness
   ```

   The response is `{"status":"ready"}`.

1. Read the control token. `helm status` also prints this command:

   ```bash
   export IRIS_IDENTITY_TOKEN=$(kubectl -n <namespace-name> get secret iris-identity-service-control-token \
     -o jsonpath='{.data.token}' | base64 -d)
   ```

1. List the services that have a grant validator:

   ```bash
   curl -sS -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" http://localhost:9200/v1/products
   ```

1. Run the suite test:

   ```bash
   helm test iris --namespace <namespace-name> --logs
   ```

   For each enabled service, the test creates a resource and a key, uses the key on the data plane, and then deletes them. For Lens, it uses the instance `default` and creates no resource. This proves grant validation and key checks.

   - The test creates its Agent Memory store in Memory database `1`. If your Memory `databases` registry uses another key, set `tests.suiteVerify.databaseId`.
   - The test pod uses a public Python image. Without access to Docker Hub, set `tests.suiteVerify.image` to your mirror.

## Credentials

By default, the chart generates every credential once, as Secrets that Helm keeps across upgrades, rollbacks, and uninstalls. Each component mounts only its own key.

| Secret | Key | Used by |
| --- | --- | --- |
| `iris-identity-service-control-token` | `token` | The Identity Service control API |
| `iris-<service>-dataplane-credential` | `<service>-dp` | The service's data plane and the Identity Service |
| `iris-<service>-internal-token` | `<service>` | The service's control plane and the Identity Service |
| `iris-<service>-admin-token` | `token` | The service's control plane admin API |
| `iris-ui-session-key` | `key` | The console's sign-in service, with IdP sign-in |

`<service>` is `memory`, `playbook`, `lens`, `context-gateway`, or `intent`.

For the runtime credentials and the internal tokens, the caller and the Identity Service mount the same Secret. The console doesn't mount the control token. With IdP sign-in, the console gateway sends the operator's access token. In admin token mode, the operator pastes the control token in the browser, and the gateway sends it to the Identity Service.

### Supply your own credentials

For GitOps tools such as Argo CD or Flux, create the Secrets yourself. Set `global.iris.renderMode: gitops` and `global.iris.secrets.generate: false`, then create these Secrets, with their keys, before the first sync:

| Secret | Value that names it | Keys |
| --- | --- | --- |
| Data plane credentials | `global.iris.secrets.dataplaneServiceCredentials.existingSecret` | `<service>-dp`, for each enabled service |
| Internal tokens | `global.iris.secrets.controlplaneInternalTokens.existingSecret` | `<service>`, for each enabled service |
| Identity Service control token | `identityService.control.existingSecret` | `token` |
| Service admin tokens | `<alias>.controlplane.adminToken.existingSecret` | `token` |
| Console session key | `ui.sso.session.existingSecret` | `key`. Required with `ui.sso.enabled`, the default. |

- `<alias>` is `memory`, `playbook`, `lens`, `contextGateway`, or `intent`.
- The two `global.iris.secrets.*` Secrets must have different names.
- An offline render can't read the Secrets. The suite preflight checks that each key is in the two `global.iris.secrets.*` Secrets. Run it before the first sync.

Start from `examples/byo-gitops.yaml` or `examples/full-suite-gitops.yaml` in the chart.

## Next steps

- [Give an agent access with an agent key](/content/operate/iris/identity-service/self-managed/operations.md#give-an-agent-access-with-an-agent-key).
- [Let operators sign in with your IdP](/content/operate/iris/identity-service/self-managed/authentication.md#operator-sign-in-with-your-identity-provider).
