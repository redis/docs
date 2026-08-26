---
Title: Deploy
alwaysopen: false
categories:
- docs
- operate
- featureform
description: Deploy and operate Feature Form on Kubernetes.
linkTitle: Deploy
weight: 60
bannerText: Feature Form is currently in preview and subject to change. Feature Form Docker images are available on Docker Hub; contact your Redis account team for a license key to deploy.
bannerChildren: true
---

Install Redis Feature Form on Kubernetes with the Helm chart, durable PostgreSQL state, OpenID Connect (OIDC) authentication, and a license key.

## Install

For production, use an external PostgreSQL database and keep credentials and the license key in Kubernetes Secrets. After meeting the prerequisites:

1. Get the chart.
2. Create the namespace and Secrets.
3. Create a values file.
4. Render and install the release.
5. Verify the deployment.
6. Install and connect the `ff` command-line interface (CLI).

### Prerequisites

- Kubernetes 1.27+.
- Helm 3.14+.
- Network access to the chart and image repositories. Configure `imagePullSecrets` if your cluster requires registry credentials.
- An OIDC issuer URL and client ID. See [Configure authentication and role-based access control]({{< relref "/operate/featureform/configure-auth" >}}).
- An external PostgreSQL database for production state. Its role must be able to create and alter Feature Form tables during migrations.
- A Feature Form license key from your Redis account team.
- A public domain name and Transport Layer Security (TLS) certificate for each externally exposed endpoint.

### 1. Get the chart

The Feature Form Helm chart is published as an Open Container Initiative (OCI) artifact on Docker Hub:

```text
oci://registry-1.docker.io/redisfeatureform/featureform
```

Install the chart directly from this path. Always pin `--version` to the Feature Form version you intend to run.

### 2. Create the namespace and Secrets

Create the release namespace before creating referenced Secrets:

```bash
kubectl create namespace <namespace>
```

Use your normal secret-management process to create these Secrets in the same namespace as Feature Form:

- `featureform-postgres`, with a `POSTGRES_URL` key containing the PostgreSQL connection URL. Require TLS according to your database policy.
- `featureform-license`, with the license key stored in `license.key`.

For example, create the PostgreSQL Secret from a restricted environment file whose entry is `POSTGRES_URL=<postgres-connection-url>`:

```bash
kubectl --namespace <namespace> create secret generic featureform-postgres \
  --from-env-file=<path-to-postgres-secret-env-file>
```

Create the license Secret from a restricted key file:

```bash
kubectl --namespace <namespace> create secret generic featureform-license \
  --from-file=license.key=<path-to-license-key-file>
```

Create an image-pull Secret as well if your cluster requires registry authentication.

Add this entry when you create `values-production.yaml`:

```yaml
imagePullSecrets:
  - name: <registry-secret-name>
```

### 3. Create a values file

Create `values-production.yaml`. The deployment ID identifies this Feature Form installation to clients. Choose a unique, nonempty value once and keep it unchanged across upgrades.

```yaml
stateBackend: postgres

auth:
  enabled: true
  oidcIssuerURL: "https://idp.example.com/realms/featureform"
  oidcClientID: "featureform-api"
  deploymentID: "<stable-deployment-id>"
  publicRestEndpoint: "https://api.example.com"
  publicGrpcEndpoint: "grpc.example.com:443"

postgres:
  url: ""
  secretName: featureform-postgres
  secretKey: POSTGRES_URL

license:
  existingSecret: featureform-license
  secretKey: license.key

rest:
  ingress:
    enabled: true
    className: "<ingress-class-name>"
    hosts:
      - host: api.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: featureform-api-tls
        hosts:
          - api.example.com

grpc:
  ingress:
    enabled: true
    className: "<ingress-class-name>"
    annotations:
      "<grpc-backend-annotation>": "<grpc-backend-value>"
    hosts:
      - host: grpc.example.com
        paths:
          - path: /
            pathType: ImplementationSpecific
    tls:
      - secretName: featureform-grpc-tls
        hosts:
          - grpc.example.com
```

Use the ingress class and gRPC backend annotation required by your maintained ingress controller. The controller must support gRPC backends and TLS termination.

`auth.publicRestEndpoint` and `auth.publicGrpcEndpoint` advertise the public endpoints through authentication discovery. Use addresses reachable by your CLI users. If internal services reach the identity provider through a different URL, configure the internal and public OIDC URLs as described in [Configure authentication and role-based access control]({{< relref "/operate/featureform/configure-auth" >}}).

### 4. Render and install the release

Render the chart before changing the cluster:

```bash
helm template featureform \
  oci://registry-1.docker.io/redisfeatureform/featureform \
  --version <featureform-version> \
  --namespace <namespace> \
  --values values-production.yaml \
  > /tmp/featureform-rendered.yaml
```

Install the release and wait for its workloads to become ready:

```bash
helm upgrade --install featureform \
  oci://registry-1.docker.io/redisfeatureform/featureform \
  --version <featureform-version> \
  --namespace <namespace> \
  --values values-production.yaml \
  --wait \
  --timeout 10m
```

### 5. Verify the deployment

Confirm the server rollout, services, and PostgreSQL migration init container:

```bash
kubectl --namespace <namespace> rollout status \
  deployment/featureform-featureform-server
kubectl --namespace <namespace> get pods
kubectl --namespace <namespace> get services
```

If migration fails, inspect its logs before restarting the pod:

```bash
kubectl --namespace <namespace> logs <server-pod> --container migrate
```

Verify the mounted license. Inspect the printed `Status:` value rather than relying only on the command's exit status:

```bash
kubectl --namespace <namespace> exec \
  deployment/featureform-featureform-server \
  -- featureformctl license status
```

Then verify REST readiness through the public endpoint:

```bash
curl --fail --silent --show-error https://api.example.com/health/ready
```

The readiness endpoint checks the server and registered scheduler dependencies. It doesn't prove that every external provider is healthy.

### 6. Install and connect the `ff` CLI

The Feature Form CLI ships as the `redis-featureform` package on PyPI. **Don't run `pip install featureform`** — that installs an unrelated upstream project. Install it in a virtual environment and pin it to the deployment version:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install redis-featureform==<featureform-version>
ff version --client-only
```

Log in through the public gRPC endpoint, verify the authenticated principal, and test gRPC health:

```bash
ff --server grpc.example.com:443 --transport grpc \
  auth login --profile production
ff auth status
ff auth whoami
ff ping
```

Login creates or updates the `production` profile and makes it active for subsequent commands. `ff ping` returns a failure status when the selected endpoint is unavailable.

## Configure production state

Use external PostgreSQL so Feature Form state survives restarts and remains consistent across server replicas. Protect the database with your normal TLS, availability, monitoring, backup, and restore controls. Back up the database before upgrading Feature Form.

This database stores durable Feature Form application state. Register production data providers separately after deploying Feature Form.

The chart runs pending schema migrations in an init container before starting the server. The database role must be able to create and alter the Feature Form schema. A migration failure keeps the server pod from becoming ready.

## Configure external access

All services default to `ClusterIP`. Choose one exposure model:

- Use `rest.ingress.*`, `grpc.ingress.*`, and `dashboard.ingress.*` for separate hosts.
- Use `ingress.*` for one host with chart-managed paths for the API and dashboard.
- Use the service `type=LoadBalancer` values when your platform terminates TLS at a load balancer.

Don't combine `ingress.*` with service-specific ingress settings. The chart rejects that configuration.

Terminate TLS at the ingress controller or load balancer. Use `grpc.ingress.*` only with a controller that supports gRPC backends. If ingress isn't suitable, use `grpc.service.type=LoadBalancer` and `rest.service.type=LoadBalancer`.

### Dashboard requirements

Enabling the dashboard requires:

- `dashboard.enabled=true`.
- `dashboard.publicAPIURL`, a REST ingress host, or unified `ingress.*` configuration.
- A resolvable dashboard authentication URL.
- An OIDC client secret and dashboard session secret. Use `dashboard.auth.existingSecret` for production.

The dashboard Secret keys default to `FEATUREFORM_OIDC_CLIENT_SECRET` and `FEATUREFORM_DASHBOARD_AUTH_SECRET`.

## Configure availability and capacity

The chart defaults to one server replica. For multiple replicas, use PostgreSQL state and configure resource requests before enabling horizontal autoscaling. Each server replica also runs scheduler workers, so adding replicas increases both API and job-processing capacity.

This example sets resource boundaries, two or more replicas, and a PodDisruptionBudget:

```yaml
server:
  resources:
    requests:
      cpu: <server-cpu-request>
      memory: <server-memory-request>
    limits:
      cpu: <server-cpu-limit>
      memory: <server-memory-limit>
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: <maximum-server-replicas>
    targetCPUUtilizationPercentage: 80

podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

Horizontal Pod Autoscaling requires the Kubernetes resource metrics API. Use `server.nodeSelector`, `server.tolerations`, `server.affinity`, or `server.topologySpreadConstraints` when your cluster requires workload placement controls.

By default, each server process starts two effective scheduler workers. Use `scheduler.workerCount` and `scheduler.workerMaxInflight` to bound per-replica job concurrency. Tune these values with server replica count and downstream provider capacity; increasing API replicas also increases the number of workers that can claim jobs.

## Configure Kubernetes Secret access

The chart doesn't mount a Kubernetes service-account token by default. No token is needed to consume Secrets already referenced by pod environment variables or volumes.

If you register a Kubernetes secret provider for server-side secret resolution, enable the token mount and grant the Feature Form service account `get` access to the required Secret objects. For Secrets in the release namespace:

```yaml
serviceAccount:
  automountServiceAccountToken: true

rbac:
  create: true
  rules:
    - apiGroups: [""]
      resources: ["secrets"]
      resourceNames: ["<provider-secret-name>"]
      verbs: ["get"]
```

These `rbac.*` values configure Kubernetes permissions. Feature Form application roles are configured separately in [Configure authentication and role-based access control]({{< relref "/operate/featureform/configure-auth" >}}).

## Configure observability

The server exports metrics and traces through OpenTelemetry Protocol (OTLP). Setting only the endpoint isn't sufficient because the Helm chart disables both signals by default. Configure an external collector with an authority that doesn't include a URL scheme:

```yaml
observability:
  otlpEndpoint: "otel-collector.telemetry.svc.cluster.local:4317"
  tracingEnabled: true
  metricsEnabled: true
  serviceName: featureform
  serviceVersion: "<featureform-version>"
  environment: production
  logLevel: info
  traceSampleRate: 0.1
```

Feature Form writes server logs to standard output and standard error. Collect them with your Kubernetes logging system.

## Upgrade and roll back

Before upgrading:

1. Back up the Feature Form PostgreSQL database.
2. Confirm the license key is valid for the target release.
3. Render the target chart version with the current values file.
4. Upgrade with an explicit `--version`, `--wait`, and `--timeout`.
5. Verify the migration init container, server rollout, license status, REST readiness, and `ff ping`.

Keep the server, dashboard, chart, and `ff` versions aligned. Replacing an external license Secret doesn't restart the server; roll out the server deployment after updating the key.

Helm rollback restores chart-managed resources, but it doesn't reverse PostgreSQL migrations or restore externally managed Secrets. Preserve the database backup, previous license key, image version, and Helm revision until the rollback window closes.

## Troubleshoot installation

- **Helm reports missing authentication values.** Set `auth.enabled=true`, `auth.oidcIssuerURL`, `auth.oidcClientID`, and a stable `auth.deploymentID`.
- **A pod shows `ImagePullBackOff`.** Confirm registry network access and configure `imagePullSecrets` when credentials are required.
- **The migration init container fails.** Check PostgreSQL reachability, TLS settings, credentials, and the database role's schema permissions.
- **The server reports a missing or invalid license.** Check the Secret name and `license.key` entry, then inspect `featureformctl license status` without printing the key.
- **OIDC discovery or login fails.** Verify the internal and public issuer URLs, client IDs, redirect URIs, and endpoint reachability.
- **The dashboard fails chart validation.** Supply its public API URL, authentication URL, OIDC client secret, and session secret.
- **Ingress values conflict.** Configure either unified `ingress.*` or service-specific ingress settings, not both.

## Next steps

- [Configure authentication and role-based access control]({{< relref "/operate/featureform/configure-auth" >}}) — set up OIDC and grant roles.
- [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) — create your first workspace.
- [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}) — connect production data infrastructure.
- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}) — verify the install end to end.
