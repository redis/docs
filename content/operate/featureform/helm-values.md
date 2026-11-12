---
Title: Helm values reference
alwaysopen: false
categories:
- docs
- operate
- featureform
description: Look up Redis Feature Form Helm chart values, their defaults, and the rules that connect them.
linkTitle: Helm values
weight: 90
bannerText: Feature Form is currently in preview and subject to change. Feature Form Docker images are available on Docker Hub; contact your Redis account team for a license key to deploy.
bannerChildren: true
---

Look up the Redis Feature Form Helm chart values that operators set, grouped by area. Each table lists a key's default and the rules it must satisfy. For procedures that use these values, see [Deploy](/content/operate/featureform/deploy.md) and [Configure authentication and RBAC](/content/operate/featureform/configure-auth.md).

This page covers the supported subset. To print every value and default for a chart version, run:

```bash
helm show values oci://registry-1.docker.io/redisfeatureform/featureform \
  --version <featureform-version>
```

The chart validates values when it renders. An invalid value or a conflicting combination stops `helm template` and `helm upgrade` with an error that names the key.

## State

| Key | Default | Description |
| --- | --- | --- |
| `stateBackend` | `postgres` | Where Feature Form stores application state. Keep the default, `postgres`. |
| `postgres.secretName` | `""` | Name of an existing Secret that holds the PostgreSQL connection URL. |
| `postgres.secretKey` | `POSTGRES_URL` | Key in `postgres.secretName` that holds the connection URL. |
| `postgres.url` | `""` | PostgreSQL connection URL set directly in values. Use `postgres.secretName` instead in production. If you set it, leave `postgres.secretName` empty. |
## License

| Key | Default | Description |
| --- | --- | --- |
| `license.existingSecret` | `""` | Name of an existing Secret that holds the license key. |
| `license.secretKey` | `license.key` | Key in `license.existingSecret` that holds the license key. |
| `license.inlineKey` | `""` | License key set directly in values. Use `license.existingSecret` instead in production. |

Set exactly one of `license.existingSecret` and `license.inlineKey`.

## Images

| Key | Default | Description |
| --- | --- | --- |
| `imagePullSecrets` | `[]` | Image-pull Secrets, as a list of `name` entries, for registries that require authentication. |
| `server.image.tag` | `""` | Server image tag. Empty uses the chart's application version. |
| `dashboard.image.tag` | `""` | Dashboard image tag. Empty uses the chart's application version. |

Keep the server, dashboard, chart, and `ff` versions aligned.

## Authentication

### Deployment identity

| Key | Default | Description |
| --- | --- | --- |
| `auth.deploymentID` | `""` | Required. A stable identifier for this environment, such as `acme-featureform-prod-us-west-2`. Keep it the same across replicas and upgrades. Changing it requires CLI users to sign in again. |
| `auth.publicRestEndpoint` | `""` | Public REST URL advertised to clients through authentication discovery. |
| `auth.publicGrpcEndpoint` | `""` | Public gRPC address advertised to clients through authentication discovery, such as `grpc.example.com:443`. |

Enable at least one of `auth.interactive.enabled`, `auth.resourceServer.enabled`, and `auth.machineAuthEnabled`.

### Paired OIDC sign-in

| Key | Default | Description |
| --- | --- | --- |
| `auth.interactive.enabled` | `false` | Enables paired OpenID Connect (OIDC) sign-in for the CLI, Python SDK, and dashboard. |
| `auth.interactive.clientIDs` | `[]` | Identity provider client IDs whose ID tokens Feature Form accepts. Required when paired sign-in is enabled. |
| `auth.oidcIssuerURL` | `""` | Identity provider issuer. Must exactly equal the `issuer` in the provider's discovery document. Required when paired sign-in or resource-server authentication is enabled. |
| `auth.allowHTTP` | `false` | Accepts an `http://` issuer and introspection endpoint. Use it only in development and test environments. |
| `auth.interactive.groups.source` | Not set | Where to read group names: `id_token` or `userinfo`. Set it together with `auth.interactive.groups.claim`. |
| `auth.interactive.groups.claim` | Not set | Name of the top-level claim that holds an array of group names. |
| `auth.discoveryTimeoutSeconds` | `120` | How long a server pod retries reading the identity provider's discovery document at startup before it exits. |
| `auth.cacheTTLSeconds` | `60` | How long Feature Form caches a validated sign-in. The cache never outlives the ID token. |
| `auth.cacheMaxEntries` | `1024` | Maximum number of cached sign-ins. |

Rules:

- `auth.oidcIssuerURL` must be an absolute `https://` URL without credentials, a query, or a fragment, unless `auth.allowHTTP` is `true`.
- `auth.interactive.clientIDs` must include `auth.oidcCLIClientID`. When the dashboard is enabled, it must also include `dashboard.auth.oidcClientID`.
- Browsers, CLI hosts, and server pods must all reach the identity provider at `auth.oidcIssuerURL`.

See [Configure paired OIDC sign-in](/content/operate/featureform/configure-auth.md#configure-paired-oidc-sign-in) and [Map IdP groups](/content/operate/featureform/configure-auth.md#map-idp-groups).

### Resource-server authentication

| Key | Default | Description |
| --- | --- | --- |
| `auth.resourceServer.enabled` | `false` | Enables resource-server authentication: Feature Form accepts access tokens and validates them through the identity provider's token introspection endpoint. |
| `auth.resourceServer.audience` | `""` | Required when enabled. The audience access tokens must carry. Don't use an OAuth client ID. |
| `auth.resourceServer.validation` | `""` | Required when enabled. Set it to `introspection`. |
| `auth.resourceServer.introspection.clientID` | `""` | Required. Client that Feature Form authenticates to the introspection endpoint as. Use a client dedicated to introspection. |
| `auth.resourceServer.introspection.existingSecret` | `""` | Name of an existing Secret that holds the introspection client's secret. Use it in production. |
| `auth.resourceServer.introspection.secretKey` | `client-secret` | Key in `auth.resourceServer.introspection.existingSecret` that holds the client secret. |
| `auth.resourceServer.introspection.clientSecret` | `""` | Client secret set directly in values. Use `auth.resourceServer.introspection.existingSecret` instead in production. |
| `auth.resourceServer.introspection.authMethod` | `""` | Required. How Feature Form authenticates to the introspection endpoint: `client_secret_basic` or `client_secret_post`. |
| `auth.resourceServer.introspection.endpoint` | `""` | HTTPS introspection endpoint. Empty uses the `introspection_endpoint` from the identity provider's discovery document. |
| `auth.resourceServer.introspection.cacheTTLSeconds` | `0` | How long Feature Form caches a successful introspection result, from `0` to `60`. `0` turns off caching. |
| `auth.resourceServer.principalTypeClaim` | `""` | Top-level claim that classifies a token as a user or service account. Set it together with `auth.resourceServer.principalTypeMapping`. |
| `auth.resourceServer.principalTypeMapping` | `{}` | Map from claim values to `user` or `service_account`. |
| `auth.resourceServer.serviceAccountIDClaim` | `""` | Claim whose value becomes a service account's principal ID. Required when any mapping value is `service_account`. |
| `auth.resourceServer.groups.source` | Not set | Set it to `introspection` to read group names from the introspection response. Set it together with `auth.resourceServer.groups.claim`. |
| `auth.resourceServer.groups.claim` | Not set | Name of the top-level claim that holds an array of group names. |

Rules:

- Set exactly one of `auth.resourceServer.introspection.existingSecret` and `auth.resourceServer.introspection.clientSecret`.
- Without classification, every accepted token authenticates as a user whose principal ID is the token's `sub`.

See [Configure resource-server authentication](/content/operate/featureform/configure-auth.md#configure-resource-server-authentication).

### CLI sign-in

| Key | Default | Description |
| --- | --- | --- |
| `auth.oidcCLIClientID` | `featureform-cli` | Identity provider client the CLI and Python SDK sign in through. |
| `auth.oidcCLIScopes` | `openid profile offline_access` | Space-separated scopes the CLI requests. Must include `openid` for paired sign-in. |
| `auth.oidcCLILoginMethods` | `""` | Login methods advertised to the CLI, in order of preference: `device_code`, `authorization_code_pkce`, or both, separated by commas. Empty advertises `device_code`. |
| `auth.oidcCLIRedirectURI` | `""` | Redirect URI for `authorization_code_pkce`. Must exactly match a redirect URI registered for the CLI client. |

See [Register a CLI client](/content/operate/featureform/configure-auth.md#register-a-cli-client).

### Machine credentials

| Key | Default | Description |
| --- | --- | --- |
| `auth.machineAuthEnabled` | `false` | Enables authentication with Feature Form machine credentials. |
| `auth.machineAudience` | `featureform-api` | Audience that every machine assertion must carry. Can't be empty. |

See [Service accounts and machine credentials](/content/operate/featureform/configure-auth.md#service-accounts-and-machine-credentials).

### Bootstrap administrators and credentials

| Key | Default | Description |
| --- | --- | --- |
| `auth.bootstrapGlobalAdmins` | `[]` | Principals granted global `global_admin` at startup. Each entry has `principalType` (`user`, `group`, or `service_account`) and an exact `principalID`. |
| `auth.bootstrapMachineCredentials` | `[]` | Global machine credentials registered at startup. Each entry has `id`, `name`, `principalID`, and one public key source. |

Each `auth.bootstrapMachineCredentials` entry has these fields:

| Field | Description |
| --- | --- |
| `id` | Required. A lowercase, hyphenated version 4 UUID. It becomes the assertion's `kid`. |
| `name` | Required. Unique within the list. |
| `principalID` | Required. The service account the credential authenticates. |
| `publicKey` | Inline PEM public key. Set this or `publicKeyFrom`, not both. |
| `publicKeyFrom.secretKeyRef` | `name` and `key` of a Secret in the release namespace that holds the PEM public key. |
| `publicKeyFrom.configMapKeyRef` | `name` and `key` of a ConfigMap in the release namespace that holds the PEM public key. |
| `algorithm` | Optional. Must be `Ed25519`. |

Rules:

- Principal IDs can't be empty or contain surrounding whitespace, and entries can't repeat a principal.
- `group` entries require [group mapping](/content/operate/featureform/configure-auth.md#map-idp-groups).
- `service_account` entries and any `auth.bootstrapMachineCredentials` entry require `auth.machineAuthEnabled: true`.
- Bootstrap only adds grants and credentials. Removing an entry doesn't revoke what it created.

See [Provision the first global admin](/content/operate/featureform/configure-auth.md#provision-the-first-global-admin) and [Bootstrap a machine administrator](/content/operate/featureform/configure-auth.md#bootstrap-a-machine-administrator).

## Dashboard

| Key | Default | Description |
| --- | --- | --- |
| `dashboard.enabled` | `false` | Deploys the dashboard. |
| `dashboard.auth.oidcClientID` | `""` | Identity provider client the dashboard signs users in through. With paired sign-in, it must also be listed in `auth.interactive.clientIDs`. |
| `dashboard.auth.oidcIssuerURL` | `""` | Leave empty to use `auth.oidcIssuerURL`. If set, it must equal `auth.oidcIssuerURL`. |
| `dashboard.auth.oidcScopes` | `""` | Space-separated scopes the dashboard requests. Empty requests `openid profile email`. Must include `openid` for paired sign-in. |
| `dashboard.auth.url` | `""` | Public URL of the dashboard, such as `https://<dashboard-host>`. Empty uses `ingress.externalURL`, `ingress.host`, or the first `dashboard.ingress.hosts` entry. |
| `dashboard.auth.existingSecret` | `""` | Name of an existing Secret that holds the OIDC client secret and the session secret. Use it in production. |
| `dashboard.auth.oidcClientSecretKey` | `FEATUREFORM_OIDC_CLIENT_SECRET` | Key in `dashboard.auth.existingSecret` that holds the OIDC client secret. |
| `dashboard.auth.authSecretKey` | `FEATUREFORM_DASHBOARD_AUTH_SECRET` | Key in `dashboard.auth.existingSecret` that holds the session secret. |
| `dashboard.auth.oidcClientSecret` and `dashboard.auth.authSecret` | `""` | Secrets set directly in values. Use `dashboard.auth.existingSecret` instead in production. |
| `dashboard.publicAPIURL` | `""` | REST API URL that browsers use. Empty derives it from unified ingress or the first `rest.ingress.hosts` entry. |
| `dashboard.internalAPIURL` | `""` | REST API URL that the dashboard server uses. Empty uses the in-cluster REST service. |

When `dashboard.enabled` is `true`, the chart requires:

- an OIDC client ID, a client secret, and a session secret;
- a browser-facing API URL from `dashboard.publicAPIURL`, unified ingress, or a REST ingress host; and
- a dashboard URL from `dashboard.auth.url`, `ingress.externalURL`, `ingress.host`, or `dashboard.ingress.hosts`.

See [Dashboard requirements](/content/operate/featureform/deploy.md#dashboard-requirements).

## Exposure

Choose one exposure model: [unified ingress](#unified-ingress), [per-service ingress or services](#per-service-ingress-and-services), or both kinds of services as `LoadBalancer`. See [Configure external access](/content/operate/featureform/deploy.md#configure-external-access).

### Unified ingress

One host with chart-managed paths for the REST API and the dashboard. Unified ingress doesn't route gRPC; expose gRPC with `grpc.service.type`.

| Key | Default | Description |
| --- | --- | --- |
| `ingress.enabled` | `false` | Creates one ingress for the REST API and the dashboard. |
| `ingress.className` | `""` | Ingress class. |
| `ingress.annotations` | `{}` | Annotations for the ingress. |
| `ingress.host` | `""` | Host name. Required when `ingress.enabled` is `true`. |
| `ingress.externalURL` | `""` | Public base URL of the host, used to derive dashboard and API URLs. |
| `ingress.apiPath` | `/api/v1` | Path routed to the REST API. |
| `ingress.dashboardPath` | `/` | Path routed to the dashboard. |
| `ingress.tls` | `[]` | Ingress TLS entries. |

`ingress.enabled` can't be combined with `rest.ingress.enabled`, `grpc.ingress.enabled`, or `dashboard.ingress.enabled`.

### Per-service ingress and services

The same keys exist under `rest`, `grpc`, and `dashboard`.

| Key | Default | Description |
| --- | --- | --- |
| `<service>.service.type` | `ClusterIP` | `ClusterIP`, `LoadBalancer`, or `NodePort`. |
| `<service>.service.port` | `8080` (REST), `9090` (gRPC), `3000` (dashboard) | Service port. |
| `<service>.service.annotations` | `{}` | Annotations for the service, such as load balancer settings. |
| `<service>.service.loadBalancerSourceRanges` | `[]` | Client address ranges allowed to reach a `LoadBalancer` service. |
| `<service>.ingress.enabled` | `false` | Creates an ingress for the service. Requires at least one `hosts` entry. |
| `<service>.ingress.className` | `""` | Ingress class. |
| `<service>.ingress.annotations` | `{}` | Annotations for the ingress. A gRPC ingress usually needs a controller-specific annotation that selects a gRPC backend. |
| `<service>.ingress.hosts` | `[]` | Hosts, each with `host` and a list of `paths` entries that have `path` and `pathType`. |
| `<service>.ingress.tls` | `[]` | Ingress TLS entries, each with `secretName` and `hosts`. |

`dashboard.ingress.enabled` requires `dashboard.enabled: true`.

## Availability and capacity

| Key | Default | Description |
| --- | --- | --- |
| `server.replicaCount` | `1` | Server replicas when autoscaling is disabled. |
| `server.resources` | Requests `cpu: 100m`, `memory: 256Mi`; no limits | Server container resources. |
| `server.autoscaling.enabled` | `false` | Creates a HorizontalPodAutoscaler for the server. Requires `server.resources.requests.cpu`. |
| `server.autoscaling.minReplicas` | `1` | Minimum replicas. |
| `server.autoscaling.maxReplicas` | `3` | Maximum replicas. |
| `server.autoscaling.targetCPUUtilizationPercentage` | `80` | CPU utilization target. |
| `server.autoscaling.targetMemoryUtilizationPercentage` | `null` | Memory utilization target. Requires `server.resources.requests.memory`. |
| `podDisruptionBudget.enabled` | `false` | Creates a PodDisruptionBudget for the server. |
| `podDisruptionBudget.minAvailable` | `1` | Server pods that must stay available during voluntary disruptions. |
| `server.nodeSelector`, `server.tolerations`, `server.affinity`, `server.topologySpreadConstraints` | Empty | Standard Kubernetes placement controls for server pods. |
| `server.startupAllowanceSeconds` | `60` | Startup time allowed beyond `auth.discoveryTimeoutSeconds`. Increase it if migrations or storage initialization take longer. |
| `scheduler.workerCount` | `0` | Scheduler workers in each server process. `0` starts two. |
| `scheduler.workerMaxInflight` | `0` | Maximum jobs a server process works on at once. `0` uses the effective worker count. |

Each server replica also runs scheduler workers, so adding replicas increases both API and job-processing capacity. See [Configure availability and capacity](/content/operate/featureform/deploy.md#configure-availability-and-capacity).

## Observability

| Key | Default | Description |
| --- | --- | --- |
| `observability.otlpEndpoint` | `""` | OpenTelemetry Protocol (OTLP) collector address, without a URL scheme, such as `otel-collector.telemetry.svc.cluster.local:4317`. |
| `observability.tracingEnabled` | `false` | Exports traces. |
| `observability.metricsEnabled` | `false` | Exports metrics. |
| `observability.serviceName` | `featureform` | Service name reported with telemetry. |
| `observability.serviceVersion` | `""` | Service version reported with telemetry. |
| `observability.environment` | `production` | Environment name reported with telemetry. |
| `observability.logLevel` | `info` | `debug`, `info`, `warn`, or `error`. |
| `observability.traceSampleRate` | `1.0` | Fraction of traces sampled, from `0` to `1`. |

See [Configure observability](/content/operate/featureform/deploy.md#configure-observability).

## Kubernetes service account and RBAC

These values configure Kubernetes permissions for the Feature Form pods. Feature Form application roles are separate; see [Configure authentication and RBAC](/content/operate/featureform/configure-auth.md).

| Key | Default | Description |
| --- | --- | --- |
| `serviceAccount.create` | `true` | Creates a service account for the release. |
| `serviceAccount.name` | `""` | Service account name. Empty generates one from the release name. |
| `serviceAccount.annotations` | `{}` | Annotations for the service account. |
| `serviceAccount.automountServiceAccountToken` | `true` | Mounts the service account token in the server pod. |
| `rbac.create` | `true` | Creates a namespaced Role and RoleBinding for the service account. Requires `serviceAccount.create: true` or `serviceAccount.name`. |
| `rbac.rules` | Read-only rules | Rules for the Role. The default rules allow listing pods, services, events, ConfigMaps, endpoints, workloads, HorizontalPodAutoscalers, PodDisruptionBudgets, and OpenShift Routes, and reading pod logs, in the release namespace. They don't grant access to Secrets. |

Setting `rbac.rules` replaces the whole default list. To add a rule, such as `get` access to a Secret, copy the default rules from `helm show values` and append yours.
