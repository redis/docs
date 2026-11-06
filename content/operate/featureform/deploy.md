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

Prerequisites: For production environments, use an external PostgreSQL database and keep credentials and the license key in Kubernetes Secrets.

To get started:

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
- An OIDC identity provider reachable over HTTPS at one issuer URL from browsers, CLI hosts, and the cluster, with a CLI client configured for device authorization. See [Prepare the identity provider]({{< relref "/operate/featureform/configure-auth#prepare-the-identity-provider" >}}).
- The identity provider subject (`sub`) of the user who becomes the first global admin. See [Provision the first global admin]({{< relref "/operate/featureform/configure-auth#provision-the-first-global-admin" >}}).
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

The Secret names and local file paths in these examples aren't required. If you choose different Secret names or keys, update the matching `postgres.*` and `license.*` settings in the values file. You can also choose a different values filename and pass it to Helm with `--values`.

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

Create `values-production.yaml` and set `auth.deploymentID` to a stable, lowercase ASCII identifier for this Feature Form environment, such as `acme-featureform-prod-us-west-2`. Keep the value the same across replicas and upgrades, and use a different value for each environment.

Feature Form accepts any value that isn't empty after trimming whitespace. Changing it requires CLI users to sign in again.

```yaml
stateBackend: postgres

auth:
  interactive:
    enabled: true
    clientIDs:
      - "featureform-cli"
  oidcIssuerURL: "https://idp.example.com/realms/featureform"
  oidcCLIClientID: "featureform-cli"
  oidcCLIScopes: "openid profile offline_access"
  oidcCLILoginMethods: "device_code"
  bootstrapGlobalAdmins:
    - principalType: user
      principalID: "<admin-subject>"
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

For every key, its default, and the rules that connect keys, see the [Helm values reference]({{< relref "/operate/featureform/helm-values" >}}).

In `values-production.yaml`, replace the ingress class and gRPC backend annotation placeholders with the values required by your maintained ingress controller. The controller must support gRPC backends and TLS termination.

`auth.publicRestEndpoint` and `auth.publicGrpcEndpoint` show the public endpoints through authentication discovery. Use addresses reachable by your CLI users. Feature Form pods must reach the identity provider at the same `auth.oidcIssuerURL` that users reach. For the authentication settings, see [Configure authentication and role-based access control]({{< relref "/operate/featureform/configure-auth" >}}).

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

Confirm that the `migrate` init container completed with exit code `0` for every server pod:

```bash
kubectl --namespace <namespace> get pods \
  --selector app.kubernetes.io/instance=featureform,app.kubernetes.io/component=server \
  --output jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .status.initContainerStatuses[?(@.name=="migrate")]}{.state.terminated.reason}{"\t"}{.state.terminated.exitCode}{"\n"}{end}{end}'
```

Each line must end with `Completed` and `0`. If the status fields are empty, wait for the init container to finish and run the command again.

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

The CLI trusts the certificate authorities in the operating system's trust store, for both Feature Form and the identity provider. If either uses a private certificate authority, add it to the operating system's trust store before you log in.

When you expose the gRPC endpoint publicly, connect the CLI through that endpoint. gRPC is the CLI default transport, and login saves it in the profile:

```bash
ff --server grpc.example.com:443 auth login --profile production
```

If you expose only REST, log in through that endpoint instead:

```bash
ff --server https://api.example.com --transport rest \
  auth login --profile production
```

If neither endpoint is public, forward the gRPC service from one terminal:

```bash
kubectl --namespace <namespace> port-forward \
  service/featureform-featureform-grpc 9090:9090
```

Then log in from another terminal:

```bash
ff --server localhost:9090 auth login --profile production
```

After login, verify the authenticated principal and the selected endpoint:

```bash
ff auth status
ff auth whoami
ff ping
```

Login creates or updates the `production` profile and makes it active for subsequent commands. `ff ping` returns a failure status when the selected endpoint is unavailable.

## Configure production state

Use external PostgreSQL so Feature Form state survives restarts and remains consistent across server replicas. Protect the database with your normal TLS, availability, monitoring, backup, and restore controls. Back up the database before upgrading Feature Form.

This database stores durable Feature Form application state. Register production data providers separately after deploying Feature Form.

Before starting the server, the chart runs an init container that applies all pending schema migrations. The database role must be able to create and alter the Feature Form schema. A migration failure keeps the server pod from becoming ready.

## Configure external access

All services default to `ClusterIP`. Choose one exposure model:

- Use `rest.ingress.*`, `grpc.ingress.*`, and `dashboard.ingress.*` for separate hosts.
- Use `ingress.*` for one host with chart-managed paths for the API and dashboard.
- Use the service `type=LoadBalancer` values when your platform terminates TLS at a load balancer.

Don't combine `ingress.*` with service-specific ingress settings. The chart rejects that configuration.

Terminate TLS at the ingress controller or load balancer. Use `grpc.ingress.*` only with a controller that supports gRPC backends. If ingress isn't suitable, use `grpc.service.type=LoadBalancer` and `rest.service.type=LoadBalancer`.

### Ingress controller examples

The REST service accepts HTTP/1.1 on port `8080`. The gRPC service accepts unencrypted HTTP/2 on port `9090`. The dashboard service accepts HTTP/1.1 on port `3000`. Your ingress controller terminates TLS and forwards traffic to these ports. Each example gives the REST API, gRPC API, and dashboard their own host and routes `/` on each one, so the REST host also serves the API explorer at `https://api.example.com/swagger/index.html`.

Merge an example into `values-production.yaml`, replacing the `rest.ingress`, `grpc.ingress`, and `dashboard.ingress` settings. Keep `auth.publicRestEndpoint: "https://api.example.com"` and `auth.publicGrpcEndpoint: "grpc.example.com:443"`. These examples cover exposure only. For the dashboard's OIDC client and secrets, see [Dashboard requirements](#dashboard-requirements).

#### AWS Load Balancer Controller

This example uses the AWS Load Balancer Controller to put all three hosts on one Application Load Balancer (ALB), with a certificate from AWS Certificate Manager (ACM):

```yaml
rest:
  ingress:
    enabled: true
    className: alb
    annotations:
      alb.ingress.kubernetes.io/scheme: internet-facing
      alb.ingress.kubernetes.io/target-type: ip
      alb.ingress.kubernetes.io/group.name: featureform
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
      alb.ingress.kubernetes.io/certificate-arn: "<acm-certificate-arn>"
      alb.ingress.kubernetes.io/healthcheck-path: /health/ready
    hosts:
      - host: api.example.com
        paths:
          - path: /
            pathType: Prefix

grpc:
  ingress:
    enabled: true
    className: alb
    annotations:
      alb.ingress.kubernetes.io/scheme: internet-facing
      alb.ingress.kubernetes.io/target-type: ip
      alb.ingress.kubernetes.io/group.name: featureform
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
      alb.ingress.kubernetes.io/certificate-arn: "<acm-certificate-arn>"
      alb.ingress.kubernetes.io/backend-protocol-version: GRPC
      alb.ingress.kubernetes.io/healthcheck-path: /grpc.health.v1.Health/Check
      alb.ingress.kubernetes.io/success-codes: "0"
    hosts:
      - host: grpc.example.com
        paths:
          - path: /
            pathType: Prefix

dashboard:
  enabled: true
  publicAPIURL: "https://api.example.com"
  auth:
    url: "https://dashboard.example.com"
  ingress:
    enabled: true
    className: alb
    annotations:
      alb.ingress.kubernetes.io/scheme: internet-facing
      alb.ingress.kubernetes.io/target-type: ip
      alb.ingress.kubernetes.io/group.name: featureform
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
      alb.ingress.kubernetes.io/certificate-arn: "<acm-certificate-arn>"
      alb.ingress.kubernetes.io/healthcheck-path: /api/health
    hosts:
      - host: dashboard.example.com
        paths:
          - path: /
            pathType: Prefix
```

- `target-type: ip` sends traffic directly to pod IPs. It's required because the Feature Form services are `ClusterIP`.
- The ALB serves gRPC only on an HTTPS listener. The gRPC health check calls the standard gRPC health service and expects gRPC status code `0`.
- The ACM certificate replaces the ingress `tls` entries, so these ingresses have none. Because the chart builds the dashboard's URLs from `tls` entries, set `dashboard.publicAPIURL` and `dashboard.auth.url` to their `https://` addresses explicitly.
- Keep `path: /` with `pathType: Prefix` on the gRPC host so the ALB forwards every gRPC method.
- Ingresses that share a `group.name` share one ALB. Use `scheme: internal` for a load balancer reachable only from your virtual private cloud (VPC).

#### Traefik

This example uses Traefik's Kubernetes Ingress provider with TLS certificates stored in Kubernetes Secrets:

```yaml
rest:
  ingress:
    enabled: true
    className: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls: "true"
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
  service:
    annotations:
      traefik.ingress.kubernetes.io/service.serversscheme: h2c
  ingress:
    enabled: true
    className: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls: "true"
    hosts:
      - host: grpc.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: featureform-grpc-tls
        hosts:
          - grpc.example.com

dashboard:
  enabled: true
  ingress:
    enabled: true
    className: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls: "true"
    hosts:
      - host: dashboard.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: featureform-dashboard-tls
        hosts:
          - dashboard.example.com
```

- The `h2c` annotation goes on the gRPC Service, not on the ingress. Without it, Traefik forwards HTTP/1.1 to the gRPC port and gRPC calls fail.
- `router.tls: "true"` enables TLS on each router. The `tls` entries only select the certificate Secret.
- Replace `traefik` with your IngressClass name and `websecure` with the name of your TLS entry point.
- Because each ingress has `tls` entries, the chart builds `https://` dashboard and API URLs from the hosts. You don't need to set `dashboard.publicAPIURL` or `dashboard.auth.url`.

### Dashboard requirements

Enabling the dashboard requires:

- `dashboard.enabled=true`.
- `dashboard.publicAPIURL`, a REST ingress host, or unified `ingress.*` configuration.
- A resolvable dashboard authentication URL.
- An OIDC client secret and dashboard session secret. Use `dashboard.auth.existingSecret` for production.
- The dashboard's OIDC client ID, `dashboard.auth.oidcClientID`. With paired sign-in, also list it in `auth.interactive.clientIDs`.
- `dashboard.auth.oidcIssuerURL` left empty or set to the same value as `auth.oidcIssuerURL`.

The dashboard Secret keys default to `FEATUREFORM_OIDC_CLIENT_SECRET` and `FEATUREFORM_DASHBOARD_AUTH_SECRET`.

## Configure availability and capacity

The chart defaults to one server replica. For multiple replicas, use PostgreSQL state. Configure resource requests before enabling horizontal autoscaling. Each server replica also runs scheduler workers, so adding replicas increases both API and job-processing capacity.

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

By default, each server process starts two effective scheduler workers. To bound per-replica job concurrency, use `scheduler.workerCount` and `scheduler.workerMaxInflight`. Tune these values with server replica count and downstream provider capacity; increasing API replicas also increases the number of workers that can claim jobs.

### Plan for identity provider availability

A server pod doesn't accept requests until it reads the identity provider's discovery document. It retries temporary failures for up to `auth.discoveryTimeoutSeconds` (default `120`) and exits if it still can't read it. Configuration and certificate errors stop the pod immediately. The startup probe allows that time plus `server.startupAllowanceSeconds` (default `60`); increase the allowance if migrations or storage initialization take longer.

Rolling updates start one new server pod before stopping an old one. Reserve cluster capacity for one additional server pod, including its resource requests. If the identity provider is unreachable during a rollout, the new pod doesn't become ready and the existing pods keep serving. Fix the identity provider configuration or connectivity, or roll back the release. Don't delete healthy pods while the identity provider is unavailable: a pod that restarts during an outage can't start until the identity provider recovers.

After startup, an identity provider outage makes sign-in requests fail with HTTP `503` or gRPC `Unavailable`, but doesn't restart pods. Machine credentials keep working.

## Configure Kubernetes Secret access

No token is needed to consume Secrets already referenced by pod environment variables or volumes. The chart doesn't mount a Kubernetes service-account token by default.

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

> [!NOTE]
> These `rbac.*` values configure Kubernetes permissions. Feature Form application roles are configured separately in [Configure authentication and role-based access control]({{< relref "/operate/featureform/configure-auth" >}}).

## Configure observability

The server exports metrics and traces through OpenTelemetry Protocol (OTLP). Because the Helm chart disables both signals by default, set the endpoint and enable the signals you want. Configure an external collector using an authority without a URL scheme:

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

- **Helm reports missing authentication values.** Set a stable `auth.deploymentID`, and enable paired OIDC sign-in with `auth.interactive.enabled`, `auth.interactive.clientIDs`, and `auth.oidcIssuerURL`, resource-server authentication with `auth.resourceServer.*` and `auth.oidcIssuerURL`, or machine credentials with `auth.machineAuthEnabled`.
- **A pod shows `ImagePullBackOff`.** Confirm registry network access and configure `imagePullSecrets` when credentials are required.
- **The migration init container fails.** Check PostgreSQL reachability, TLS settings, credentials, and the database role's schema permissions.
- **The server reports a missing or invalid license.** Check the Secret name and `license.key` entry, then inspect `featureformctl license status` without printing the key.
- **The server pod never becomes ready.** Check that the pod can reach `auth.oidcIssuerURL` and that the identity provider's certificate is trusted. See [Plan for identity provider availability](#plan-for-identity-provider-availability).
- **OIDC discovery or login fails.** Verify the issuer URL, client IDs, redirect URIs, and endpoint reachability.
- **The dashboard fails chart validation.** Supply its public API URL, authentication URL, OIDC client ID, OIDC client secret, and session secret. With paired sign-in, list its client ID in `auth.interactive.clientIDs`.
- **Ingress values conflict.** Configure either unified `ingress.*` or service-specific ingress settings, not both.

## Next steps

- [Configure authentication and role-based access control]({{< relref "/operate/featureform/configure-auth" >}}) — set up OIDC and grant roles.
- [Configure Okta]({{< relref "/operate/featureform/configure-okta" >}}) — set up Okta for paired sign-in or resource-server authentication.
- [Helm values reference]({{< relref "/operate/featureform/helm-values" >}}) — look up chart values, defaults, and validation rules.
- [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) — create your first workspace.
- [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}) — connect production data infrastructure.
- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}) — verify the install end to end.
